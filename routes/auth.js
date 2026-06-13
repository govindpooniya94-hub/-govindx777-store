const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

const loginAttempts = new Map();

function sanitize(str) {
  return String(str || '').replace(/[<>"']/g, '').trim();
}

router.post('/login', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || { count: 0, first: now };

    if (attempts.count >= 5 && now - attempts.first < 15 * 60 * 1000) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again after 15 minutes.' });
    }

    if (now - attempts.first > 15 * 60 * 1000) {
      attempts.count = 0;
      attempts.first = now;
    }

    const username = sanitize(req.body.username);
    const password = req.body.password || '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (username.length > 50 || password.length > 100) {
      return res.status(400).json({ error: 'Invalid input.' });
    }

    let admin;
    try {
      admin = await Admin.findOne({ username });
    } catch (dbErr) {
      console.error('DB error during login:', dbErr.message);
      return res.status(503).json({ error: 'Database connection issue. Please try again.' });
    }

    if (!admin) {
      attempts.count++;
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      attempts.count++;
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    loginAttempts.delete(ip);
    const token = generateToken({ id: admin._id, username: admin.username });
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
