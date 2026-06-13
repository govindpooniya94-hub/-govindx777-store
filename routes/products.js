const express = require('express');
const Product = require('../models/Product');
const DownloadLink = require('../models/DownloadLink');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

router.get('/', async (req, res) => {
  try {
    const { category, type, featured } = req.query;
    const filter = { is_active: true };

    if (category) {
      const Category = require('../models/Category');
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category_id = cat._id;
    }
    if (type) filter.type = type;
    if (featured) filter.is_featured = true;

    const products = await Product.find(filter)
      .populate('category_id', 'name slug')
      .sort({ sort_order: 1, created_at: -1 })
      .lean();

    const enriched = products.map(p => ({
      ...p,
      id: p._id,
      category_name: p.category_id?.name || null,
      category_slug: p.category_id?.slug || null,
      category_id: p.category_id?._id || p.category_id,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, is_active: true })
      .populate('category_id', 'name slug')
      .lean();

    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const links = await DownloadLink.find({ product_id: product._id, is_active: true }).lean();

    product.download_links = links;
    product.id = product._id;
    product.category_name = product.category_id?.name || null;
    product.category_slug = product.category_id?.slug || null;
    product.category_id = product.category_id?._id || product.category_id;

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category_id, name, description, short_description, price, price_usd, original_price, type, badge, features, system_requirements, download_url, video_url, version, file_size, image_url, is_featured, sort_order } = req.body;
 
     if (!name || !type) return res.status(400).json({ error: 'Name and type are required.' });
 
     const slug = slugify(name) + '-' + Date.now().toString(36);
     const product = await Product.create({
       category_id: category_id || null,
       name, slug,
       description: description || '',
       short_description: short_description || '',
       price: price || 'Free',
       price_usd: price_usd || null,
       original_price: original_price || null,
       type, badge: badge || null,
       features: features || [],
       system_requirements: system_requirements || null,
       download_url: download_url || null,
       video_url: video_url || null,
      version: version || null,
      file_size: file_size || null,
      image_url: image_url || null,
      is_featured: !!is_featured,
      sort_order: sort_order || 0,
    });

    res.status(201).json({ id: product._id, slug });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const { category_id, name, description, short_description, price, price_usd, original_price, type, badge, features, system_requirements, download_url, video_url, version, file_size, image_url, is_featured, is_active, sort_order } = req.body;

    const slug = name ? slugify(name) + '-' + req.params.id : existing.slug;

    await Product.findByIdAndUpdate(req.params.id, {
      category_id: category_id ?? existing.category_id,
      name: name ?? existing.name,
      slug,
      description: description ?? existing.description,
      short_description: short_description ?? existing.short_description,
      price: price ?? existing.price,
      price_usd: price_usd ?? existing.price_usd,
      original_price: original_price ?? existing.original_price,
      type: type ?? existing.type,
      badge: badge !== undefined ? badge : existing.badge,
      features: features || existing.features,
      system_requirements: system_requirements !== undefined ? system_requirements : existing.system_requirements,
      download_url: download_url ?? existing.download_url,
      video_url: video_url ?? existing.video_url,
      version: version ?? existing.version,
      file_size: file_size ?? existing.file_size,
      image_url: image_url ?? existing.image_url,
      is_featured: is_featured !== undefined ? !!is_featured : existing.is_featured,
      is_active: is_active !== undefined ? !!is_active : existing.is_active,
      sort_order: sort_order ?? existing.sort_order,
      updated_at: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
