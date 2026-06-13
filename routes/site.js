const express = require('express');
const SiteSetting = require('../models/SiteSetting');
const Testimonial = require('../models/Testimonial');
const FAQ = require('../models/FAQ');
const BlogPost = require('../models/BlogPost');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Visitor = require('../models/Visitor');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/settings', async (req, res) => {
  try {
    const rows = await SiteSetting.find().lean();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required.' });

    await SiteSetting.findOneAndUpdate(
      { key },
      { value, updated_at: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const settings = await SiteSetting.find().lean();
    const get = (key, def) => { const s = settings.find(r => r.key === key); return s ? s.value : def; };

    const useFake = get('use_fake_stats', 'false') === 'true';

    if (useFake) {
      res.json({
        totalDownloads: parseInt(get('fake_total_downloads', '1234')),
        totalProducts: parseInt(get('fake_total_products', '12')),
        totalFree: parseInt(get('fake_total_free', '8')),
        totalPaid: parseInt(get('fake_total_paid', '4')),
        onlineUsers: Math.min(parseInt(get('fake_live_users', '56')), 99),
        totalVisits: parseInt(get('fake_today_visits', '456')),
      });
      return;
    }

    const [totalDownloads, totalProducts, totalFree, totalPaid, totalVisits] = await Promise.all([
      Product.aggregate([{ $group: { _id: null, total: { $sum: '$download_count' } } }]),
      Product.countDocuments({ is_active: true }),
      Product.countDocuments({ type: 'free', is_active: true }),
      Product.countDocuments({ type: 'paid', is_active: true }),
      Visitor.countDocuments(),
    ]);

    res.json({
      totalDownloads: totalDownloads[0]?.total || 0,
      totalProducts,
      totalFree,
      totalPaid,
      onlineUsers: Math.floor(Math.random() * 20) + 25,
      totalVisits,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/visit', async (req, res) => {
  try {
    const { page } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    await Visitor.create({
      ip,
      user_agent: req.headers['user-agent'] || null,
      page: page || '/',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ is_active: true })
      .sort({ sort_order: 1, created_at: -1 }).lean();
    res.json(testimonials.map(t => ({ ...t, id: t._id })));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/testimonials', authenticateToken, async (req, res) => {
  try {
    const { name, role, avatar, content, rating, sort_order } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'Name and content are required.' });

    await Testimonial.create({
      name, role: role || null, avatar: avatar || null,
      content, rating: rating || 5, sort_order: sort_order || 0,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/testimonials/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await Testimonial.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Testimonial not found.' });

    const { name, role, avatar, content, rating, is_active, sort_order } = req.body;
    await Testimonial.findByIdAndUpdate(req.params.id, {
      name: name ?? existing.name,
      role: role ?? existing.role,
      avatar: avatar ?? existing.avatar,
      content: content ?? existing.content,
      rating: rating ?? existing.rating,
      is_active: is_active !== undefined ? !!is_active : existing.is_active,
      sort_order: sort_order ?? existing.sort_order,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/testimonials/:id', authenticateToken, async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/faqs', async (req, res) => {
  try {
    const faqs = await FAQ.find({ is_active: true })
      .sort({ sort_order: 1, created_at: -1 }).lean();
    res.json(faqs.map(f => ({ ...f, id: f._id })));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/faqs', authenticateToken, async (req, res) => {
  try {
    const { question, answer, category, sort_order } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required.' });

    await FAQ.create({
      question, answer, category: category || null, sort_order: sort_order || 0,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/faqs/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await FAQ.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'FAQ not found.' });

    const { question, answer, category, is_active, sort_order } = req.body;
    await FAQ.findByIdAndUpdate(req.params.id, {
      question: question ?? existing.question,
      answer: answer ?? existing.answer,
      category: category ?? existing.category,
      is_active: is_active !== undefined ? !!is_active : existing.is_active,
      sort_order: sort_order ?? existing.sort_order,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/faqs/:id', authenticateToken, async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/blog', async (req, res) => {
  try {
    const posts = await BlogPost.find({ is_published: true })
      .sort({ created_at: -1 }).lean();
    res.json(posts.map(p => ({ ...p, id: p._id })));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    post.id = post._id;
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/blog', authenticateToken, async (req, res) => {
  try {
    const { title, content, excerpt, author, image_url, is_published } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });

    const slug = title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') + '-' + Date.now().toString(36);

    const post = await BlogPost.create({
      title, slug, content,
      excerpt: excerpt || null,
      author: author || 'Admin',
      image_url: image_url || null,
      is_published: is_published !== undefined ? !!is_published : true,
    });
    res.status(201).json({ success: true, slug: post.slug });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/blog/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    const { title, content, excerpt, author, image_url, is_published } = req.body;
    await BlogPost.findByIdAndUpdate(req.params.id, {
      title: title ?? existing.title,
      content: content ?? existing.content,
      excerpt: excerpt ?? existing.excerpt,
      author: author ?? existing.author,
      image_url: image_url ?? existing.image_url,
      is_published: is_published !== undefined ? !!is_published : existing.is_published,
      updated_at: new Date(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/blog/:id', authenticateToken, async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category_id',
          as: 'products',
        },
      },
      {
        $addFields: {
          product_count: {
            $size: { $filter: { input: '$products', as: 'p', cond: '$$p.is_active' } },
          },
          id: '$_id',
        },
      },
      { $project: { products: 0 } },
      { $sort: { sort_order: 1 } },
    ]);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    await Category.create({
      name, slug,
      description: description || null,
      icon: icon || null,
      sort_order: sort_order || 0,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category already exists.' });
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await Category.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Category not found.' });

    const { name, description, icon, sort_order } = req.body;
    await Category.findByIdAndUpdate(req.params.id, {
      name: name ?? existing.name,
      description: description ?? existing.description,
      icon: icon ?? existing.icon,
      sort_order: sort_order ?? existing.sort_order,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
