const mongoose = require('mongoose');

const downloadLinkSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  label: { type: String, required: true },
  url: { type: String, required: true },
  password: { type: String, default: null },
  file_size: { type: String, default: null },
  download_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DownloadLink', downloadLinkSchema);
