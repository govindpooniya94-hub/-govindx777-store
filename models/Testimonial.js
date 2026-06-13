const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: null },
  avatar: { type: String, default: null },
  content: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
