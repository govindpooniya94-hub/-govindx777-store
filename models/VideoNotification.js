const mongoose = require('mongoose');

const videoNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  video_url: { type: String, required: true },
  thumbnail_url: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VideoNotification', videoNotificationSchema);
