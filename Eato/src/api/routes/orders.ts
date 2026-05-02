import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.ts';
import MenuItem from '../models/MenuItem.ts';
import { authCustomer, authRestaurant } from '../middleware/auth.ts';

const router = express.Router();

// Customer: place order (COD)
router.post('/', authCustomer, async (req: any, res: any) => {
  try {
    const { restaurantId, items, deliveryAddress, customerPhone } = req.body;
    if (!restaurantId || !items?.length || !deliveryAddress) {
      return res.status(400).json({ error: 'Restaurant, items and delivery address required' });
    }

    const built: any[] = [];
    let total = 0;

    for (const { menuItemId, quantity } of items) {
      const menuItem: any = await MenuItem.findById(menuItemId);
      if (!menuItem || menuItem.restaurantId.toString() !== restaurantId) return res.status(400).json({ error: 'Invalid menu item' });
      const qty = Math.max(1, Number(quantity) || 1);
      built.push({ menuItemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: qty });
      total += menuItem.price * qty;
    }

    const order: any = await Order.create({
      customerId: req.user._id,
      restaurantId,
      items: built,
      totalAmount: total,
      paymentMethod: 'COD',
      deliveryAddress,
      customerPhone: customerPhone || req.user.phone || '',
    });

    const populated = await Order.findById(order._id).populate('restaurantId', 'restaurantName');
    res.status(201).json(populated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: my orders
router.get('/my', authCustomer, async (req: any, res: any) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('restaurantId', 'restaurantName imageUrl')
      .populate('items.menuItemId', 'name imageUrl')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: incoming orders
router.get('/restaurant', authRestaurant, async (req: any, res: any) => {
  try {
    const rid = String(req.user._id);
    const ridObjectId = mongoose.Types.ObjectId.isValid(rid) ? new mongoose.Types.ObjectId(rid) : null;
    const orders = await Order.find({
      $or: [{ restaurantId: rid }, ...(ridObjectId ? [{ restaurantId: ridObjectId }] : [])],
    })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: cancel order (only if restaurant hasn't accepted yet)
router.patch('/:id/cancel', authCustomer, async (req: any, res: any) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: sales reports (daily / weekly / monthly)
router.get('/reports', authRestaurant, async (req: any, res: any) => {
  try {
    const { period } = req.query;
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    let rangeStart = new Date(now.getTime() - 6 * dayMs); // default daily-like
    let groupFormat = '%Y-%m-%d';

    if (period === 'weekly') {
      rangeStart = new Date(now.getTime() - 8 * 7 * dayMs);
      groupFormat = '%G-%V'; // ISO week
    } else if (period === 'monthly') {
      rangeStart = new Date(now.getTime() - 12 * 30 * dayMs); // approx
      groupFormat = '%Y-%m';
    } else if (period && period !== 'daily') {
      return res.status(400).json({ error: 'Invalid period' });
    }

    const totals = await Order.aggregate([
      {
        $match: {
          restaurantId: req.user._id,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: rangeStart },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const timeline = await Order.aggregate([
      {
        $match: {
          restaurantId: req.user._id,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: rangeStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$createdAt',
            },
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topItems = await Order.aggregate([
      {
        $match: {
          restaurantId: req.user._id,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: rangeStart },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 8 },
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
          quantitySold: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({
      period: period || 'daily',
      rangeStart,
      totals: totals[0] || { totalSales: 0, orderCount: 0 },
      timeline,
      topItems,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const ORDER_FLOW = ['pending', 'processing', 'packing', 'shipping', 'delivered'] as const;
const ALL_STATUSES = [...ORDER_FLOW, 'cancelled'] as const;

/** Restaurant accepts (pending→processing), rejects (pending→cancelled), or advances one step along the flow */
router.patch('/:id/status', authRestaurant, async (req: any, res: any) => {
  try {
    const { status } = req.body;
    if (!ALL_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const rid = String(req.user._id);
    const ridObjectId = mongoose.Types.ObjectId.isValid(rid) ? new mongoose.Types.ObjectId(rid) : null;
    const order: any = await Order.findOne({
      _id: req.params.id,
      $or: [{ restaurantId: rid }, ...(ridObjectId ? [{ restaurantId: ridObjectId }] : [])],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const current = order.status as string;
    if (status === current) {
      return res.json(order);
    }

    if (current === 'delivered' || current === 'cancelled') {
      return res.status(400).json({ error: 'Order is already final' });
    }

    if (status === 'cancelled') {
      if (current !== 'pending') {
        return res.status(400).json({ error: 'Only pending orders can be rejected' });
      }
      order.status = 'cancelled';
      await order.save();
      return res.json(order);
    }

    if (current === 'pending') {
      if (status !== 'processing') {
        return res.status(400).json({ error: 'Accept order by setting status to processing' });
      }
      order.status = 'processing';
      await order.save();
      return res.json(order);
    }

    const curIdx = ORDER_FLOW.indexOf(current as (typeof ORDER_FLOW)[number]);
    const nextIdx = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
    if (curIdx < 0 || nextIdx < 0) {
      return res.status(400).json({ error: 'Invalid current or target status' });
    }
    if (nextIdx !== curIdx + 1) {
      return res.status(400).json({ error: 'Invalid state transition — advance one stage at a time' });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

