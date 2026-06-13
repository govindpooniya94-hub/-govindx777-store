const express = require('express');
const VideoNotification = require('../models/VideoNotification');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notifs = await VideoNotification.find({ is_active: true })
      .sort({ created_at: -1 }).limit(1).lean();
    if (notifs.length) {
      notifs[0].id = notifs[0]._id;
      res.json(notifs[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const notifs = await VideoNotification.find()
      .sort({ created_at: -1 }).lean();
    res.json(notifs.map(n => ({ ...n, id: n._id })));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, video_url, thumbnail_url } = req.body;
    if (!title || !video_url) return res.status(400).json({ error: 'Title and video URL are required.' });

    const notif = await VideoNotification.create({
      title, video_url,
      thumbnail_url: thumbnail_url || null,
    });
    res.status(201).json({ success: true, id: notif._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await VideoNotification.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Notification not found.' });

    const { title, video_url, thumbnail_url, is_active } = req.body;
    await VideoNotification.findByIdAndUpdate(req.params.id, {
      title: title ?? existing.title,
      video_url: video_url ?? existing.video_url,
      thumbnail_url: thumbnail_url ?? existing.thumbnail_url,
      is_active: is_active !== undefined ? !!is_active : existing.is_active,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await VideoNotification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
