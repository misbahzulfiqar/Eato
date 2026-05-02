import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.ts';
import Restaurant from '../models/Restaurant.ts';
import Admin from '../models/Admin.ts';
import { authCustomer } from '../middleware/auth.ts';

const router = express.Router();

// Customer register
router.post('/register/customer', async (req: any, res: any) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const exists = await Customer.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ name, email, password: hashed, phone: phone || '', address: address || '' });
    const token = jwt.sign({ id: customer._id, role: 'customer' }, process.env.JWT_SECRET as string);
    res.status(201).json({ user: { id: customer._id, name, email, role: 'customer' }, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

function normalizeEmail(email: string): string {
  return String(email).trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Restaurant register
router.post('/register/restaurant', async (req: any, res: any) => {
  try {
    const { name, email, password, restaurantName, description, address, city, phone, cuisine, imageUrl } = req.body;
    if (!name || !email || !password || !restaurantName)
      return res.status(400).json({ error: 'Name, email, password and restaurant name required' });
    const exists = await Restaurant.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const restaurant = await Restaurant.create({
      name,
      email,
      password: hashed,
      restaurantName,
      description: description || '',
      address: address || '',
      city: typeof city === 'string' ? city.trim() : '',
      phone: phone || '',
      cuisine: cuisine || '',
      imageUrl: imageUrl || '',
      // New restaurants require admin approval first.
      status: 'pending',
    });
    const token = jwt.sign({ id: restaurant._id, role: 'restaurant' }, process.env.JWT_SECRET as string);
    res.status(201).json({
      user: {
        id: restaurant._id,
        _id: restaurant._id,
        name,
        email,
        restaurantName,
        role: 'restaurant',
        imageUrl: restaurant.imageUrl || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        city: restaurant.city || '',
        phone: restaurant.phone || '',
        cuisine: restaurant.cuisine || '',
        status: restaurant.status,
      },
      token,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Login (customer, restaurant, admin)
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    let user: any = null;
    if (role === 'admin') user = await Admin.findOne({ email });
    else if (role === 'restaurant') {
      user = await Restaurant.findOne({ email });
      if (user && (user.status === 'blocked' || user.status === 'rejected')) {
        return res.status(403).json({ error: 'Account suspended or registration rejected' });
      }
    } else {
      user = await Customer.findOne({ email });
      if (user && user.status === 'blocked') return res.status(403).json({ error: 'Account blocked' });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const r = user.role || (role === 'admin' ? 'admin' : role === 'restaurant' ? 'restaurant' : 'customer');
    const token = jwt.sign({ id: user._id, role: r }, process.env.JWT_SECRET as string);
    const payload: any = { id: user._id, _id: user._id, email: user.email, role: r };
    if (user.name) payload.name = user.name;
    if (user.restaurantName) payload.restaurantName = user.restaurantName;
    if (r === 'restaurant') {
      payload.imageUrl = user.imageUrl || '';
      payload.description = user.description || '';
      payload.address = user.address || '';
      payload.city = user.city || '';
      payload.phone = user.phone || '';
      payload.cuisine = user.cuisine || '';
      if (user.status) payload.status = user.status;
    }
    res.json({ user: payload, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user
router.get('/me', async (req: any, res: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    let user: any = null;
    if (decoded.role === 'admin') user = await Admin.findById(decoded.id).select('-password');
    else if (decoded.role === 'restaurant') user = await Restaurant.findById(decoded.id).select('-password');
    else user = await Customer.findById(decoded.id).select('-password');

    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Customer: update profile
router.put('/profile', authCustomer, async (req: any, res: any) => {
  try {
    const { name, phone, address, email } = req.body;
    const update: any = {};
    if (typeof name === 'string') update.name = name;
    if (typeof phone === 'string') update.phone = phone;
    if (typeof address === 'string') update.address = address;

    if (email !== undefined && email !== null) {
      const next = normalizeEmail(String(email));
      if (!next) return res.status(400).json({ error: 'Email required' });
      if (!isValidEmail(next)) return res.status(400).json({ error: 'Invalid email' });
      const taken = await Customer.findOne({ email: next, _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ error: 'Email already in use' });
      update.email = next;
    }

    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });

    const updated = await Customer.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

