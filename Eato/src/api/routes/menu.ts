import express from 'express';
import MenuItem from '../models/MenuItem.ts';
import FoodCategory from '../models/FoodCategory.ts';
import { authRestaurant } from '../middleware/auth.ts';

const router = express.Router();

// Public: canonical food categories (for menu item classification)
router.get('/categories', async (_req: any, res: any) => {
  try {
    const list = await FoodCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select('name slug description sortOrder');
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public: get menu for a restaurant
router.get('/restaurant/:restaurantId', async (req: any, res: any) => {
  try {
    const items = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: get own menu
router.get('/my', authRestaurant, async (req: any, res: any) => {
  try {
    const items = await MenuItem.find({ restaurantId: req.user._id });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: add item
router.post('/', authRestaurant, async (req: any, res: any) => {
  try {
    const { name, description, price, category, imageUrl, available } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'Name and price required' });
    const item = await MenuItem.create({
      restaurantId: req.user._id,
      name,
      description: description || '',
      price: Number(price),
      category: category || 'Main',
      imageUrl: imageUrl || '',
      available: typeof available === 'boolean' ? available : true,
    });
    res.status(201).json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: update item
router.put('/:id', authRestaurant, async (req: any, res: any) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.user._id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const { name, description, price, category, imageUrl, available } = req.body;
    if (name != null) item.name = name;
    if (description != null) item.description = description;
    if (price != null) item.price = Number(price);
    if (category != null) item.category = category;
    if (imageUrl != null) item.imageUrl = imageUrl;
    if (typeof available === 'boolean') item.available = available;
    await item.save();
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Restaurant: delete item
router.delete('/:id', authRestaurant, async (req: any, res: any) => {
  try {
    const result = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.user._id });
    if (!result) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

