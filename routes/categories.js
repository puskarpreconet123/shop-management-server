const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/categories - Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/categories/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/categories - Admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name || (!name.en && !name.bn)) {
      return res.status(400).json({ message: 'Category name (English or Bengali) is required' });
    }

    const category = await Category.create({ name, description, icon, color });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/categories/:id - Admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name: name ? { ...name } : undefined, // Replace if provided
        description, icon, color 
      },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/categories/:id - Admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Remove category reference from products
    await Product.updateMany({ category: req.params.id }, { category: null });

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
