const express = require('express');
const DownloadLink = require('../models/DownloadLink');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:productId', async (req, res) => {
  try {
    const links = await DownloadLink.find({ product_id: req.params.productId, is_active: true }).lean();
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, label, url, password, file_size } = req.body;
    if (!product_id || !label || !url) return res.status(400).json({ error: 'Product ID, label, and URL are required.' });

    const link = await DownloadLink.create({
      product_id, label, url,
      password: password || null,
      file_size: file_size || null,
    });
    res.status(201).json({ id: link._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await DownloadLink.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Download link not found.' });

    const { label, url, password, file_size, is_active } = req.body;
    await DownloadLink.findByIdAndUpdate(req.params.id, {
      label: label ?? existing.label,
      url: url ?? existing.url,
      password: password !== undefined ? password : existing.password,
      file_size: file_size ?? existing.file_size,
      is_active: is_active !== undefined ? !!is_active : existing.is_active,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await DownloadLink.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/track/:id', async (req, res) => {
  try {
    const link = await DownloadLink.findById(req.params.id);
    if (!link) return res.status(404).json({ error: 'Link not found.' });

    await DownloadLink.findByIdAndUpdate(req.params.id, { $inc: { download_count: 1 } });
    await Product.findByIdAndUpdate(link.product_id, { $inc: { download_count: 1 } });

    res.json({ url: link.url, password: link.password });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
