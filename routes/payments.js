const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DownloadLink = require('../models/DownloadLink');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function generateAccessToken() {
  return crypto.randomBytes(24).toString('hex');
}

router.post('/submit-request', async (req, res) => {
  try {
    const { product_id, customer_name, customer_email, customer_phone, transaction_id, utr_number, notes } = req.body;

    if (!product_id || !customer_name || !customer_email) {
      return res.status(400).json({ error: 'Product ID, name, and email are required.' });
    }

    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.type !== 'paid') return res.status(400).json({ error: 'This product is free.' });

    const amountStr = product.price.replace(/[^0-9]/g, '');
    const amount = parseInt(amountStr, 10) || 0;

    const order = await Order.create({
      product_id,
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      amount,
      transaction_id: transaction_id || '',
      utr_number: utr_number || '',
      notes: notes || '',
      status: 'pending',
    });

    res.json({
      success: true,
      order_id: order._id,
      message: 'Your purchase request has been submitted. Admin will verify your payment and you will receive access shortly.',
    });
  } catch (err) {
    console.error('Submit request error:', err);
    res.status(500).json({ error: 'Failed to submit request.' });
  }
});

router.post('/approve/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status === 'approved') return res.json({ success: true, access_token: order.access_token });

    order.status = 'approved';
    order.paid_at = new Date();
    order.access_token = generateAccessToken();
    await order.save();

    await Product.findByIdAndUpdate(order.product_id, { $inc: { download_count: 1 } });

    res.json({ success: true, access_token: order.access_token });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Failed to approve.' });
  }
});

router.post('/reject/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    order.status = 'rejected';
    await order.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject.' });
  }
});

router.get('/access/:token', async (req, res) => {
  try {
    const order = await Order.findOne({ access_token: req.params.token, status: 'approved' }).lean();
    if (!order) return res.status(404).json({ error: 'Invalid or expired access token.' });

    const product = await Product.findById(order.product_id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const links = await DownloadLink.find({ product_id: product._id, is_active: true }).lean();

    res.json({
      order: { id: order._id, paid_at: order.paid_at },
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        version: product.version,
        file_size: product.file_size,
        product_keys: product.product_keys || [],
        delivery_notes: product.delivery_notes || '',
        download_links: links.map(l => ({
          id: l._id,
          label: l.label,
          url: l.url,
          password: l.password,
          file_size: l.file_size,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/check-status/:token', async (req, res) => {
  try {
    const order = await Order.findOne({ access_token: req.params.token }).lean();
    if (!order) return res.json({ status: 'invalid' });
    res.json({ status: order.status, order_id: order._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/admin/orders', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('product_id', 'name price')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders: orders.map(o => ({ ...o, id: o._id })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
