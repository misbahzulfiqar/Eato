import express from 'express';
import Customer from '../models/Customer.ts';
import Restaurant from '../models/Restaurant.ts';
import Order from '../models/Order.ts';
import Review from '../models/Review.ts';
import MenuItem from '../models/MenuItem.ts';
import FoodCategory from '../models/FoodCategory.ts';
import { authAdmin } from '../middleware/auth.ts';

const router = express.Router();
router.use(authAdmin);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'category';
}

// --- Customers ---
router.get('/customers', async (_req: any, res: any) => {
  try {
    const customers = await Customer.find().select('-password').sort({ createdAt: -1 }).lean();
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          lastOrderAt: { $max: '$createdAt' },
          totalSpent: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$totalAmount'] },
          },
        },
      },
    ]);
    const byId: Record<string, { orderCount: number; lastOrderAt: Date | null; totalSpent: number }> = {};
    for (const row of stats) {
      byId[String(row._id)] = {
        orderCount: row.orderCount,
        lastOrderAt: row.lastOrderAt || null,
        totalSpent: row.totalSpent || 0,
      };
    }
    const withActivity = customers.map((c: any) => ({
      ...c,
      activity: byId[String(c._id)] || { orderCount: 0, lastOrderAt: null, totalSpent: 0 },
    }));
    res.json(withActivity);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/customers/:id', async (req: any, res: any) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const c = await Customer.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json(c);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/customers/:id', async (req: any, res: any) => {
  try {
    const c = await Customer.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Restaurants ---
router.get('/restaurants', async (_req: any, res: any) => {
  try {
    const restaurants = await Restaurant.find().select('-password').sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/restaurants/:id', async (req: any, res: any) => {
  try {
    const body = req.body || {};
    const update: Record<string, unknown> = {};

    if (body.status != null) {
      if (!['pending', 'approved', 'blocked', 'rejected'].includes(body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      update.status = body.status;
    }
    const stringFields = ['restaurantName', 'description', 'address', 'city', 'phone', 'cuisine', 'imageUrl', 'name'] as const;
    for (const k of stringFields) {
      if (body[k] !== undefined && body[k] !== null) update[k] = String(body[k]);
    }

    if (body.email !== undefined && body.email !== null) {
      const next = String(body.email).trim().toLowerCase();
      if (!next) return res.status(400).json({ error: 'Email required' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) return res.status(400).json({ error: 'Invalid email' });
      const taken = await Restaurant.findOne({ email: next, _id: { $ne: req.params.id } });
      if (taken) return res.status(400).json({ error: 'Email already in use' });
      update.email = next;
    }

    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });

    const r = await Restaurant.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-password');
    if (!r) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/restaurants/:id', async (req: any, res: any) => {
  try {
    const id = req.params.id;
    const r = await Restaurant.findById(id);
    if (!r) return res.status(404).json({ error: 'Restaurant not found' });
    await MenuItem.deleteMany({ restaurantId: id });
    await Review.deleteMany({ restaurantId: id });
    await Restaurant.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Orders (platform-wide) ---
router.get('/orders', async (req: any, res: any) => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status && typeof status === 'string') filter.status = status;
    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'restaurantName email phone imageUrl')
      .populate('items.menuItemId', 'name imageUrl category')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(orders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/orders/:id', async (req: any, res: any) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate('restaurantId', 'restaurantName email phone address')
      .populate('items.menuItemId', 'name imageUrl category price');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/orders/:id', async (req: any, res: any) => {
  try {
    const { adminNotes, disputeOpen, disputeSummary } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (typeof adminNotes === 'string') order.adminNotes = adminNotes;
    if (typeof disputeSummary === 'string') order.disputeSummary = disputeSummary;
    if (typeof disputeOpen === 'boolean') order.disputeOpen = disputeOpen;

    await order.save();
    const populated = await Order.findById(order._id)
      .populate('customerId', 'name email phone')
      .populate('restaurantId', 'restaurantName email imageUrl')
      .populate('items.menuItemId', 'name imageUrl category');
    res.json(populated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Dashboard metrics ---
router.get('/metrics', async (_req: any, res: any) => {
  try {
    const [
      customersActive,
      customersTotal,
      customersBlocked,
      restaurantsApproved,
      restaurantsPending,
      restaurantsBlocked,
      restaurantsRejected,
      totalOrders,
      activeOrders,
    ] = await Promise.all([
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({}),
      Customer.countDocuments({ status: 'blocked' }),
      Restaurant.countDocuments({ status: 'approved' }),
      Restaurant.countDocuments({ status: 'pending' }),
      Restaurant.countDocuments({ status: 'blocked' }),
      Restaurant.countDocuments({ status: 'rejected' }),
      Order.countDocuments({}),
      Order.countDocuments({
        status: { $in: ['pending', 'processing', 'packing', 'shipping'] },
      }),
    ]);
    res.json({
      customersActive,
      customersTotal,
      customersBlocked,
      restaurantsApproved,
      restaurantsPending,
      restaurantsBlocked,
      restaurantsRejected,
      totalOrders,
      activeOrders,
      /** @deprecated aliases for older frontends */
      customersCount: customersActive,
      restaurantsCount: restaurantsApproved,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** Dashboard charts + recent activity (all data from DB — nothing static). */
router.get('/overview-charts', async (_req: any, res: any) => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

    const [dailyActivity, orderStatusBreakdown, restaurantShare, recentOrdersRaw] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            revenue: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$totalAmount'] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            orders: 1,
            delivered: 1,
            cancelled: 1,
            revenue: 1,
          },
        },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$restaurantId', orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { orderCount: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'restaurants',
            localField: '_id',
            foreignField: '_id',
            as: 'r',
          },
        },
        { $unwind: { path: '$r', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            restaurantId: '$_id',
            name: { $ifNull: ['$r.restaurantName', 'Unknown restaurant'] },
            orderCount: 1,
            revenue: 1,
          },
        },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(18)
        .populate('restaurantId', 'restaurantName imageUrl')
        .populate({ path: 'items.menuItemId', select: 'imageUrl name' })
        .select('status totalAmount createdAt restaurantId items')
        .lean(),
    ]);

    const recentOrders = (recentOrdersRaw as any[]).map((o) => {
      let previewImageUrl = '';
      for (const line of o.items || []) {
        const mi = line?.menuItemId;
        if (mi && typeof mi === 'object' && mi.imageUrl) {
          previewImageUrl = mi.imageUrl;
          break;
        }
      }
      const rest = o.restaurantId as any;
      if (!previewImageUrl && rest && typeof rest === 'object' && rest.imageUrl) {
        previewImageUrl = rest.imageUrl;
      }
      return {
        id: String(o._id),
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        restaurantName: rest?.restaurantName || 'Unknown restaurant',
        previewImageUrl,
      };
    });

    res.json({
      windowDays: 14,
      dailyActivity,
      orderStatusBreakdown,
      restaurantShare,
      recentOrders,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/top-items', async (_req: any, res: any) => {
  try {
    const topItems = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.menuItemId': { $ne: null }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$items.menuItemId',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          _id: 0,
          menuItemId: '$_id',
          name: '$menuItem.name',
          imageUrl: '$menuItem.imageUrl',
          category: '$menuItem.category',
          quantitySold: 1,
          revenue: 1,
        },
      },
    ]);
    res.json({ topItems });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Reports (day / week / month windows) ---
router.get('/reports', async (req: any, res: any) => {
  try {
    const period = ['day', 'week', 'month'].includes(String(req.query.period)) ? String(req.query.period) : 'week';
    const ms = period === 'day' ? 86400000 : period === 'week' ? 7 * 86400000 : 30 * 86400000;
    const start = new Date(Date.now() - ms);
    const match: Record<string, unknown> = { createdAt: { $gte: start } };

    const summaryAgg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$totalAmount'] },
          },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]);

    const trend = await Order.aggregate([
      { $match: { ...match, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const restaurants = await Order.aggregate([
      { $match: { ...match, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$restaurantId', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'r',
        },
      },
      { $unwind: { path: '$r', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          restaurantName: '$r.restaurantName',
          orders: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({
      period,
      windowStart: start.toISOString(),
      summary: summaryAgg[0] || { orders: 0, revenue: 0, delivered: 0, cancelled: 0 },
      trend,
      restaurants,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Food categories ---
router.get('/categories', async (_req: any, res: any) => {
  try {
    const list = await FoodCategory.find().sort({ sortOrder: 1, name: 1 });
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/categories', async (req: any, res: any) => {
  try {
    const { name, description, sortOrder, active } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name required' });
    const slug = typeof req.body.slug === 'string' && req.body.slug.trim() ? slugify(req.body.slug) : slugify(name);
    const cat = await FoodCategory.create({
      name: name.trim(),
      slug,
      description: typeof description === 'string' ? description : '',
      sortOrder: typeof sortOrder === 'number' ? sortOrder : Number(sortOrder) || 0,
      active: typeof active === 'boolean' ? active : true,
    });
    res.status(201).json(cat);
  } catch (e: any) {
    if (e.code === 11000) return res.status(400).json({ error: 'Category name or slug already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/categories/:id', async (req: any, res: any) => {
  try {
    const body = req.body || {};
    const update: Record<string, unknown> = {};
    if (body.name != null) update.name = String(body.name).trim();
    if (body.slug != null) update.slug = slugify(String(body.slug));
    if (body.description != null) update.description = String(body.description);
    if (body.sortOrder != null) update.sortOrder = Number(body.sortOrder) || 0;
    if (typeof body.active === 'boolean') update.active = body.active;

    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });

    const cat = await FoodCategory.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json(cat);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/categories/:id', async (req: any, res: any) => {
  try {
    const cat = await FoodCategory.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Reviews moderation ---
router.get('/reviews', async (_req: any, res: any) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('customerId', 'name email')
      .populate('restaurantId', 'restaurantName imageUrl')
      .populate('menuItemId', 'name imageUrl')
      .populate('orderId', 'status createdAt totalAmount');
    res.json(reviews);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/reviews/:id', async (req: any, res: any) => {
  try {
    const r = await Review.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Removed' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
