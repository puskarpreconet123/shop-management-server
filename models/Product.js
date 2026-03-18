const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    bn: { type: String, default: '', trim: true }
  },
  description: {
    en: { type: String, default: '', trim: true },
    bn: { type: String, default: '', trim: true }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  priceType: {
    type: String,
    enum: ['per_kg', 'per_pcs'],
    required: [true, 'Price type is required'],
  },
  // Full Cloudinary secure URL — used directly in <img src>
  imageUrl: {
    type: String,
    default: null,
  },
  // Cloudinary public_id — needed to delete or update the image
  imagePublicId: {
    type: String,
    default: null,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);