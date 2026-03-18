const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, uploadBase64, deleteFromCloudinary } = require('../config/cloudinary');

// ─── GET /api/products  (Public) ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, inStock } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.bn': { $regex: search, $options: 'i' } }
      ];
    }
    if (inStock === 'true') filter.inStock = true;

    const products = await Product.find(filter)
      .populate('category', 'name icon color')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/products/:id  (Public) ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name icon color');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/products  (Admin) ─────────────────────────────────────────────
// Accepts either:
//   - multipart/form-data with field "image"  → file upload via Multer→Cloudinary
//   - JSON body with field "imageBase64"       → data URI from camera capture
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, priceType, category, inStock, imageBase64 } = req.body;

    if (!name || (!name.en && !name.bn) || !price || !priceType) {
      return res.status(400).json({ message: 'Name (English or Bengali), price, and price type are required' });
    }

    let imageUrl    = null;
    let imagePublicId = null;

    if (req.file) {
      // CloudinaryStorage (multer-storage-cloudinary) provides these
      imageUrl      = req.file.path;          // secure_url
      imagePublicId = req.file.filename;      // public_id
    } else if (imageBase64) {
      const result  = await uploadBase64(imageBase64);
      imageUrl      = result.url;
      imagePublicId = result.publicId;
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      priceType,
      imageUrl,
      imagePublicId,
      category: category || null,
      inStock: inStock !== 'false',
    });

    const populated = await product.populate('category', 'name icon color');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/products/:id  (Admin) ──────────────────────────────────────────
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const {
      name, description, price, priceType,
      category, inStock, imageBase64, removeImage,
    } = req.body;

    let imageUrl      = product.imageUrl;
    let imagePublicId = product.imagePublicId;

    if (removeImage === 'true') {
      // Admin explicitly removed the image
      await deleteFromCloudinary(product.imagePublicId);
      imageUrl      = null;
      imagePublicId = null;

    } else if (req.file) {
      // New file uploaded via Multer/CloudinaryStorage
      await deleteFromCloudinary(product.imagePublicId);
      imageUrl      = req.file.path;
      imagePublicId = req.file.filename;

    } else if (imageBase64) {
      // New camera capture — delete old from Cloudinary first
      await deleteFromCloudinary(product.imagePublicId);
      const result  = await uploadBase64(imageBase64);
      imageUrl      = result.url;
      imagePublicId = result.publicId;
    }
    // else: no image change — keep existing imageUrl/imagePublicId

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name:        name        ? { ...product.name, ...name } : product.name,
        description: description ? { ...product.description, ...description } : product.description,
        price:       price       ? parseFloat(price) : product.price,
        priceType:   priceType   || product.priceType,
        imageUrl,
        imagePublicId,
        category:    category !== undefined ? (category || null) : product.category,
        inStock:     inStock  !== undefined ? inStock !== 'false' : product.inStock,
      },
      { new: true, runValidators: true }
    ).populate('category', 'name icon color');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/products/:id  (Admin) ───────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Remove image from Cloudinary before removing DB record
    await deleteFromCloudinary(product.imagePublicId);
    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;