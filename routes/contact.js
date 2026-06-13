const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address.' });

    await ContactMessage.create({ name, email, subject: subject || null, message });
    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { read } = req.query;
    const filter = {};
    if (read !== undefined) filter.is_read = read === 'true';
    const messages = await ContactMessage.find(filter).sort({ created_at: -1 }).lean();
    res.json(messages.map(m => ({ ...m, id: m._id })));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await ContactMessage.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
