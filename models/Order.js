const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer_name: { type: String, required: true },
  customer_email: { type: String, required: true },
  customer_phone: { type: String, default: '' },
  amount: { type: Number, required: true },
  transaction_id: { type: String, default: '' },
  payment_method: { type: String, default: 'UPI' },
  utr_number: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  access_token: { type: String, unique: true, sparse: true, default: null },
  paid_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
