const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Product = require('./models/Product');
const DownloadLink = require('./models/DownloadLink');
const Testimonial = require('./models/Testimonial');
const FAQ = require('./models/FAQ');
const ContactMessage = require('./models/ContactMessage');
const SiteSetting = require('./models/SiteSetting');
const BlogPost = require('./models/BlogPost');
const Visitor = require('./models/Visitor');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/govindx777_store';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function seed() {
  const adminUser = process.env.ADMIN_USERNAME || 'govind_x777';
  const adminPass = process.env.ADMIN_PASSWORD || 'G0v!ndX777@Secure!2024';

  const existingAdmin = await Admin.findOne({});
  if (existingAdmin) {
    if (existingAdmin.username !== adminUser) {
      existingAdmin.username = adminUser;
    }
    const hash = bcrypt.hashSync(adminPass, 10);
    if (!bcrypt.compareSync(adminPass, existingAdmin.password_hash)) {
      existingAdmin.password_hash = hash;
    }
    await existingAdmin.save();
  } else {
    const hash = bcrypt.hashSync(adminPass, 10);
    await Admin.create({ username: adminUser, password_hash: hash });
    console.log('Admin created');
  }

  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany([
      { name: 'Game Panels', slug: 'game-panels', description: 'Premium game hosting panels and tools', icon: 'server', sort_order: 1 },
      { name: 'Emulators', slug: 'emulators', description: 'Android emulators for PC', icon: 'monitor', sort_order: 2 },
      { name: 'Utilities', slug: 'utilities', description: 'Optimization and utility tools', icon: 'tool', sort_order: 3 },
      { name: 'APKs & Mods', slug: 'apks-mods', description: 'Modified APK files and game mods', icon: 'download', sort_order: 4 },
    ]);
    console.log('Categories seeded');
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const catMap = {};
    const cats = await Category.find();
    cats.forEach(c => { catMap[c.slug] = c._id; });

    const ts = () => Date.now().toString(36);

    await Product.insertMany([
      {
        category_id: catMap['game-panels'], name: 'Panel V4 Client',
        slug: 'panel-v4-client-' + ts(),
        description: 'The Panel V4 Client is a powerful, lightweight game server management panel. It allows you to manage your game servers directly from a web interface with real-time statistics and easy configuration.',
        short_description: 'Lightweight client panel for game server management', price: 'Free', type: 'free', badge: 'FREE',
        features: ['Real-time server monitoring', 'One-click restart', 'Web-based file manager', 'Console access', 'Backup management', 'Player list & stats'],
        system_requirements: { os: 'Windows 10/11', ram: '4GB', storage: '500MB', network: 'Stable internet' },
        version: '4.2.1', file_size: '45 MB', is_featured: true, sort_order: 1,
      },
      {
        category_id: catMap['game-panels'], name: 'Optimization Tool',
        slug: 'optimization-tool-' + ts(),
        description: 'Advanced optimization utility that tweaks your system for maximum gaming performance. Automatically configures settings for popular games.',
        short_description: 'Boost your game performance with one click', price: 'Free', type: 'free', badge: 'FREE',
        features: ['Auto game detection', 'RAM optimization', 'GPU tweaking', 'Network latency reduction', 'Startup manager', 'One-click restore'],
        version: '3.0.5', file_size: '28 MB', sort_order: 2,
      },
      {
        category_id: catMap['game-panels'], name: 'Error Fix Utility',
        slug: 'error-fix-utility-' + ts(),
        description: 'Diagnose and fix common game errors including DLL issues, runtime errors, and compatibility problems.',
        short_description: 'Fix common game errors automatically', price: 'Free', type: 'free', badge: 'FREE',
        features: ['DLL fixer', 'Runtime error repair', 'Compatibility mode', 'Auto-detection', 'Batch repair', 'Log analysis'],
        version: '2.1.0', file_size: '18 MB', sort_order: 3,
      },
      {
        category_id: catMap['game-panels'], name: 'Starter Panel',
        slug: 'starter-panel-' + ts(),
        description: 'Get started with premium game server management. Includes all essential features with priority support.',
        short_description: 'Essential panel features for beginners', price: '₹199', original_price: '₹499', type: 'paid', badge: 'POPULAR',
        features: ['✅ Up to 5 servers', '✅ Basic monitoring', '✅ File manager', '✅ Email support', '❌ Advanced analytics', '❌ Priority support', '❌ Custom branding'],
        version: '1.0.0', is_featured: false, sort_order: 4,
      },
      {
        category_id: catMap['game-panels'], name: 'Pro Panel',
        slug: 'pro-panel-' + ts(),
        description: 'Unlock the full potential of game server management with advanced analytics, priority support, and unlimited servers.',
        short_description: 'Advanced features for serious gamers', price: '₹499', original_price: '₹999', type: 'paid', badge: 'BEST SELLER',
        features: ['✅ Unlimited servers', '✅ Advanced monitoring', '✅ File manager', '✅ Priority support', '✅ Advanced analytics', '✅ API access', '❌ Custom branding'],
        version: '2.0.0', is_featured: true, sort_order: 5,
      },
      {
        category_id: catMap['game-panels'], name: 'Lifetime Panel',
        slug: 'lifetime-panel-' + ts(),
        description: 'One-time payment for lifetime access to all features including custom branding, white-label, and dedicated support.',
        short_description: 'Lifetime access with all features included', price: '₹1,999', original_price: '₹4,999', type: 'paid', badge: 'BEST VALUE',
        features: ['✅ Unlimited servers', '✅ Advanced monitoring', '✅ File manager', '✅ Priority support', '✅ Advanced analytics', '✅ API access', '✅ Custom branding', '✅ White-label', '✅ Lifetime updates'],
        version: '3.0.0', sort_order: 6,
      },
      {
        category_id: catMap['emulators'], name: 'Free Fire APK',
        slug: 'free-fire-apk-' + ts(),
        description: 'Specially optimized Free Fire APK for better performance, reduced lag, and enhanced graphics.',
        short_description: 'Optimized Free Fire APK with enhanced features', price: 'Free', type: 'free', badge: 'FREE',
        features: ['Anti-lag optimization', 'HD graphics support', 'Auto-headshot config', 'Reduced ping', 'Regular updates'],
        version: '2.8.5', file_size: '680 MB', sort_order: 1,
      },
      {
        category_id: catMap['emulators'], name: 'BlueStacks 5 Modded',
        slug: 'bluestacks-5-modded-' + ts(),
        description: 'BlueStacks 5 with custom performance tweaks for smoother gameplay and better resource management.',
        short_description: 'Modified BlueStacks 5 with performance tweaks', price: 'Free', type: 'free', badge: 'FREE',
        features: ['Pre-rooted', 'Performance optimized', 'Gamepad support', 'Macro recorder', 'Multi-instance'],
        version: '5.14.0', file_size: '520 MB', sort_order: 2,
      },
      {
        category_id: catMap['emulators'], name: 'MSI App Player 5',
        slug: 'msi-app-player-5-' + ts(),
        description: 'MSI App Player co-developed with BlueStacks for the ultimate mobile gaming experience on PC.',
        short_description: 'MSI App Player for high-end gaming', price: 'Free', type: 'free', badge: 'FREE',
        features: ['High FPS support', 'Resource efficient', 'Key mapping', 'High-res graphics', 'Stable performance'],
        version: '5.0.2', file_size: '480 MB', sort_order: 3,
      },
    ]);
    console.log('Products seeded');
  }

  const faqCount = await FAQ.countDocuments();
  if (faqCount === 0) {
    await FAQ.insertMany([
      { question: 'How do I download free panels?', answer: 'Simply click the download button on any free product card. You\'ll get the latest version instantly. No registration required.', category: 'general', sort_order: 1 },
      { question: 'How do I purchase a paid panel?', answer: 'Click "Buy Now" on your chosen plan, complete the payment, and you\'ll receive instant access with download links and activation instructions via email.', category: 'purchasing', sort_order: 2 },
      { question: 'Are these tools safe to use?', answer: 'Yes, all our tools are thoroughly tested for malware and viruses. We regularly update them to ensure safety and compatibility with the latest Windows versions.', category: 'safety', sort_order: 3 },
      { question: 'What is the archive password?', answer: 'The default archive password is: GovindX777@2024. It is also displayed on the product download page.', category: 'downloads', sort_order: 4 },
      { question: 'How do I get support?', answer: 'Join our Discord server for instant help from our community and staff. You can also email us at support@govindx777store.in.', category: 'support', sort_order: 5 },
      { question: 'Can I get a refund?', answer: 'We offer a 7-day money-back guarantee on all paid products. If you\'re not satisfied, contact our support team for a full refund.', category: 'purchasing', sort_order: 6 },
      { question: 'Do paid panels include lifetime updates?', answer: 'The Lifetime plan includes all future updates at no extra cost. Starter and Pro plans include updates for 1 year from purchase date.', category: 'purchasing', sort_order: 7 },
      { question: 'Can I use these on multiple PCs?', answer: 'Free tools can be used on any PC. Paid panel licenses are tied to your account but can be activated on up to 3 devices simultaneously.', category: 'general', sort_order: 8 },
    ]);
    console.log('FAQs seeded');
  }

  const testimonialCount = await Testimonial.countDocuments();
  if (testimonialCount === 0) {
    await Testimonial.insertMany([
      { name: 'Rajesh K.', role: 'Pro Gamer', content: 'The Pro Panel is absolutely insane! My ping dropped by 40ms and the admin panel is super smooth. Worth every rupee!', rating: 5, sort_order: 1 },
      { name: 'Sneha M.', role: 'Streamer', content: 'Been using the Lifetime Panel for 6 months now. The custom branding feature is a game-changer for my streaming setup.', rating: 5, sort_order: 2 },
      { name: 'Arun P.', role: 'Game Server Admin', content: 'Free panels are legit. The Optimization Tool saved my old laptop. Now I can run PUBG smoothly at 60fps!', rating: 5, sort_order: 3 },
      { name: 'Priya S.', role: 'Casual Gamer', content: 'BlueStacks 5 Modded works like a charm. No lag, no crashes. Best emulator I\'ve used so far.', rating: 4, sort_order: 4 },
      { name: 'Vikram R.', role: 'eSports Player', content: 'The Error Fix Utility saved me hours of troubleshooting. Fixed my DLL issues in one click. Highly recommended!', rating: 5, sort_order: 5 },
    ]);
    console.log('Testimonials seeded');
  }
}

async function fullSeed() {
  await seed();
  console.log('Database seeded successfully');
}

module.exports = { connectDB, seed, fullSeed, mongoose };
