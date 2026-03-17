require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin created: username=admin, password=admin123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Seed sample categories
    const categories = [
      { name: 'Biscuits', icon: '🍪', color: '#f4a261' },
      { name: 'Noodles', icon: '🍜', color: '#e76f51' },
      { name: 'Beverages', icon: '🧃', color: '#2a9d8f' },
      { name: 'Snacks', icon: '🍿', color: '#e9c46a' },
      { name: 'Dairy', icon: '🥛', color: '#a8dadc' },
      { name: 'Spices', icon: '🌶️', color: '#e63946' },
      { name: 'Grains', icon: '🌾', color: '#8d6e63' },
      { name: 'Vegetables', icon: '🥦', color: '#52b788' },
    ];

    for (const cat of categories) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        await Category.create(cat);
        console.log(`✅ Category created: ${cat.name}`);
      }
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();