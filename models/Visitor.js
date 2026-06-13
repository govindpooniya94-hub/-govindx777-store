const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: { type: String, default: null },
  user_agent: { type: String, default: null },
  page: { type: String, default: '/' },
  visited_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Visitor', visitorSchema);
