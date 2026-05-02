import express from 'express';
import Review from '../models/Review.ts';
import Order from '../models/Order.ts';
import { authCustomer } from '../middleware/auth.ts';

const router = express.Router();

// Customer: create or update a rating for an order (restaurant-level or food-item level)
router.post('/', authCustomer, async (req: any, res: any) => {
  try {
    const { orderId, restaurantId, menuItemId, rating, comment } = req.body;

    if (!orderId || !restaurantId) return res.status(400).json({ error: 'orderId and restaurantId required' });
    if (rating == null) return res.status(400).json({ error: 'rating required' });

    const order: any = await Order.findOne({ _id: orderId, customerId: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'delivered') return res.status(400).json({ error: 'You can only review delivered orders' });
    if (order.restaurantId.toString() !== restaurantId) return res.status(400).json({ error: 'Restaurant mismatch' });

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const menuItemIdFinal = menuItemId ? menuItemId : null;
    if (menuItemIdFinal) {
      const matchesItem = order.items?.some((i: any) => i.menuItemId?.toString() === menuItemIdFinal);
      if (!matchesItem) return res.status(400).json({ error: 'menuItemId not found in this order' });
    }

    const updated = await Review.findOneAndUpdate(
      { orderId, customerId: req.user._id, menuItemId: menuItemIdFinal },
      {
        $set: {
          restaurantId,
          rating: parsedRating,
          comment: typeof comment === 'string' ? comment : '',
        },
      },
      { new: true, upsert: true }
    )
      .populate('restaurantId', 'restaurantName')
      .populate('menuItemId', 'name')
      .populate('orderId', 'status createdAt');

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: get my reviews
router.get('/my', authCustomer, async (req: any, res: any) => {
  try {
    const reviews = await Review.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'restaurantName')
      .populate('menuItemId', 'name')
      .populate('orderId', 'status createdAt');

    res.json(reviews);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public: rating summary for restaurant or a specific food item
router.get('/restaurant/:restaurantId/summary', async (req: any, res: any) => {
  try {
    const { restaurantId } = req.params;
    const { menuItemId } = req.query;

    const match: any = { restaurantId };
    if (menuItemId) match.menuItemId = menuItemId;
    else match.menuItemId = null;

    const result = await Review.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const row: any = result[0];
    res.json({
      avgRating: row ? Number(row.avgRating) : null,
      count: row ? row.count : 0,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

