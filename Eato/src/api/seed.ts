import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.ts';
import FoodCategory from './models/FoodCategory.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Eato';

const DEFAULT_CATEGORIES = [
  { name: 'Main', slug: 'main', sortOrder: 0 },
  { name: 'Appetizers', slug: 'appetizers', sortOrder: 1 },
  { name: 'Sides', slug: 'sides', sortOrder: 2 },
  { name: 'Beverages', slug: 'beverages', sortOrder: 3 },
  { name: 'Desserts', slug: 'desserts', sortOrder: 4 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to database: Eato');

  // 1. admins
  const adminHash = await bcrypt.hash('misbah.123', 10);
  await Admin.findOneAndUpdate(
    { email: 'misbah123@gmail.com' },
    { name: 'Admin', email: 'misbah123@gmail.com', password: adminHash, role: 'admin' },
    { upsert: true, new: true }
  );
  console.log('  admins: misbah123@gmail.com / misbah.123');

  for (const c of DEFAULT_CATEGORIES) {
    await FoodCategory.findOneAndUpdate({ slug: c.slug }, { $setOnInsert: { ...c, description: '', active: true } }, { upsert: true });
  }
  console.log('  foodcategories: defaults ensured');

  await mongoose.disconnect();
  console.log('Seed done.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

