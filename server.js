require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://challenges.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://img.youtube.com", "https://i.ytimg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://challenges.cloudflare.com"],
      connectSrc: ["'self'", "https://challenges.cloudflare.com"],
      mediaSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
}));
app.use(cors({ origin: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again after 15 minutes.' },
  skipSuccessfulRequests: true,
});

app.use(express.static(path.join(__dirname, 'public')));

// Bot protection challenge middleware
const CHALLENGE_SECRET = crypto.randomBytes(32).toString('hex');
const CHALLENGE_EXPIRY = 60 * 60 * 1000; // 1 hour

function verifyChallenge(req, res, next) {
  const cookies = (req.headers.cookie || '').split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    if (k) acc[k.trim()] = (v || '').trim();
    return acc;
  }, {});

  const bypassPaths = ['/api/', '/css/', '/js/', '/video/', '/favicon', '/challenge', '/admin', '/checkout', '/order-success'];
  if (bypassPaths.some(p => req.path.startsWith(p))) return next();

  const challenge = cookies['_vrfy'];
  if (challenge) {
    try {
      const dec = JSON.parse(Buffer.from(challenge, 'base64').toString());
      if (dec.s === crypto.createHash('sha256').update(dec.t + CHALLENGE_SECRET).digest('hex').slice(0, 16) &&
          Date.now() - dec.t < CHALLENGE_EXPIRY) {
        return next();
      }
    } catch (e) {}
  }

  // Show challenge page
  const ts = Date.now();
  const token = crypto.createHash('sha256').update(ts + CHALLENGE_SECRET).digest('hex').slice(0, 16);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Just a moment...</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#06060e;color:#e8e8f0;font-family:-apple-system,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;text-align:center;padding:20px}
.loader{width:48px;height:48px;border:3px solid rgba(255,106,51,.15);border-top-color:#ff6a33;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
h1{font-size:18px;font-weight:600;color:#8888aa;letter-spacing:.5px}
p{font-size:12px;color:#555577;max-width:360px;line-height:1.5}
.progress{width:200px;height:3px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;margin-top:4px}
.progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff6a33,#ff9933);border-radius:4px;animation:fill 2.5s ease-in-out forwards}
@keyframes fill{to{width:100%}}
.badge{font-size:10px;padding:3px 10px;border-radius:4px;background:rgba(255,106,51,.08);color:#ff6a33;font-weight:600;letter-spacing:.5px}
</style></head><body><div class="badge">SECURITY CHECK</div><div class="loader"></div><h1>Checking your browser</h1><p>Please wait while we verify your browser is secure. This may take a few seconds.</p><div class="progress"><span></span></div><script>
(function(){var t=${ts};var s='${token}';setTimeout(function(){var d=new Date(Date.now()+3600000);var v=btoa(JSON.stringify({t:t,s:s}));document.cookie='_vrfy='+v+';path=/;expires='+d.toUTCString()+';SameSite=Lax';window.location.reload()},2500)})()
</script></body></html>`);
}

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const downloadRoutes = require('./routes/downloads');
const contactRoutes = require('./routes/contact');
const siteRoutes = require('./routes/site');
const videonotifRoutes = require('./routes/videonotif');

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/videonotif', videonotifRoutes);

const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/challenge', (req, res) => {
  const ts = Date.now();
  const token = crypto.createHash('sha256').update(ts + CHALLENGE_SECRET).digest('hex').slice(0, 16);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Just a moment...</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#06060e;color:#e8e8f0;font-family:-apple-system,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;text-align:center;padding:20px}
.loader{width:48px;height:48px;border:3px solid rgba(255,106,51,.15);border-top-color:#ff6a33;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
h1{font-size:18px;font-weight:600;color:#8888aa;letter-spacing:.5px}
p{font-size:12px;color:#555577;max-width:360px;line-height:1.5}
.progress{width:200px;height:3px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;margin-top:4px}
.progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff6a33,#ff9933);border-radius:4px;animation:fill 2.5s ease-in-out forwards}
@keyframes fill{to{width:100%}}
.badge{font-size:10px;padding:3px 10px;border-radius:4px;background:rgba(255,106,51,.08);color:#ff6a33;font-weight:600;letter-spacing:.5px}
</style></head><body><div class="badge">SECURITY CHECK</div><div class="loader"></div><h1>Checking your browser</h1><p>Please wait while we verify your browser is secure. This may take a few seconds.</p><div class="progress"><span></span></div><script>
(function(){var t=${ts};var s='${token}';setTimeout(function(){var d=new Date(Date.now()+3600000);var v=btoa(JSON.stringify({t:t,s:s}));document.cookie='_vrfy='+v+';path=/;expires='+d.toUTCString()+';SameSite=Lax';window.location.reload()},2500)})()
</script></body></html>`);
});

app.use(verifyChallenge);

app.get('/admin*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

const { connectDB, seed } = require('./database');

connectDB()
  .then(() => seed())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Strike Hub Store server running on http://localhost:${PORT}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
