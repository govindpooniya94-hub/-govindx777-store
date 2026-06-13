const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  short_description: { type: String, default: '' },
  price: { type: String, default: 'Free' },
  price_usd: { type: String, default: null },
  original_price: { type: String, default: null },
  type: { type: String, enum: ['free', 'paid'], required: true },
  badge: { type: String, default: null },
  features: { type: [String], default: [] },
  system_requirements: { type: mongoose.Schema.Types.Mixed, default: null },
  download_url: { type: String, default: null },
  video_url: { type: String, default: null },
  download_count: { type: Number, default: 0 },
  version: { type: String, default: null },
  file_size: { type: String, default: null },
  image_url: { type: String, default: null },
  is_featured: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  product_keys: { type: [String], default: [] },
  delivery_notes: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

productSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Product', productSchema);
