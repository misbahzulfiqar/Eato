import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.ts';
import restaurantRoutes from './routes/restaurants.ts';
import menuRoutes from './routes/menu.ts';
import orderRoutes from './routes/orders.ts';
import adminRoutes from './routes/admin.ts';
import reviewsRoutes from './routes/reviews.ts';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Eato';
const FALLBACK_MONGODB_URI = process.env.MONGODB_URI_FALLBACK || 'mongodb://127.0.0.1:27017/Eato';

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
    });
    console.log('MongoDB connected');
    return;
  } catch (primaryErr: any) {
    const code = String(primaryErr?.code || '');
    const msg = String(primaryErr?.message || '');
    const canFallback =
      code === 'ETIMEOUT' ||
      /querySrv|ENOTFOUND|timed out|timeout|ECONNREFUSED/i.test(msg);

    if (!canFallback || MONGODB_URI === FALLBACK_MONGODB_URI) {
      throw primaryErr;
    }

    console.warn('Primary MongoDB URI failed, trying fallback URI...');
    await mongoose.connect(FALLBACK_MONGODB_URI, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
    });
    console.log('MongoDB connected (fallback)');
  }
}

connectMongo()
  .then(() => {
    app.listen(PORT, () => console.log(`Eato API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

