const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, unique: true, trim: true },
    bn: { type: String, default: '', trim: true }
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: '🛒',
  },
  color: {
    type: String,
    default: '#a8e063',
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
