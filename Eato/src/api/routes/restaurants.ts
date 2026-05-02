import express from 'express';
import Restaurant from '../models/Restaurant.ts';
import { authRestaurant } from '../middleware/auth.ts';

const router = express.Router();

// Public: list restaurants for customers (with optional filters + review summary)
router.get('/', async (req: any, res: any) => {
  try {
    const { q, location } = req.query;

    const filter: any = { status: 'approved' };
    if (q && typeof q === 'string') {
      filter.restaurantName = { $regex: q, $options: 'i' };
    }
    if (location && typeof location === 'string') {
      const locEsc = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { address: { $regex: locEsc, $options: 'i' } },
        { city: { $regex: locEsc, $options: 'i' } },
      ];
    }

    const restaurants = await Restaurant.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'reviews',
          let: { rid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$restaurantId', '$$rid'] } } },
            { $match: { $or: [{ menuItemId: null }, { menuItemId: { $exists: false } }] } },
          ],
          as: '_restReviews',
        },
      },
      {
        $addFields: {
          reviewCount: { $size: '$_restReviews' },
          avgRating: {
            $cond: [
              { $gt: [{ $size: '$_restReviews' }, 0] },
              { $round: [{ $avg: '$_restReviews.rating' }, 1] },
              null,
            ],
          },
        },
      },
      { $project: { password: 0, _restReviews: 0 } },
    ]);

    res.json(restaurants);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public: get single restaurant
router.get('/:id', async (req: any, res: any) => {
  try {
    const r = await Restaurant.findById(req.params.id).select('-password');
    if (!r) return res.status(404).json({ error: 'Restaurant not found' });
    if (r.status !== 'approved') return res.status(404).json({ error: 'Restaurant not found' });
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: update own profile
router.put('/profile', authRestaurant, async (req: any, res: any) => {
  try {
    const body = req.body || {};
    const update: Record<string, string> = {};
    const keys = ['name', 'restaurantName', 'description', 'address', 'city', 'phone', 'cuisine', 'imageUrl'] as const;
    for (const k of keys) {
      if (body[k] !== undefined && body[k] !== null) update[k] = String(body[k]);
    }

    if (body.email !== undefined && body.email !== null) {
      const next = String(body.email).trim().toLowerCase();
      if (!next) return res.status(400).json({ error: 'Email required' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) return res.status(400).json({ error: 'Invalid email' });
      const taken = await Restaurant.findOne({ email: next, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ error: 'Email already in use' });
      update.email = next;
    }

    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });
    const r = await Restaurant.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

