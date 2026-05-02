import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.ts';
import Restaurant from '../models/Restaurant.ts';
import Admin from '../models/Admin.ts';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authCustomer = async (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await Customer.findById(decoded.id);
    if (!user || user.status === 'blocked') return res.status(401).json({ error: 'Access denied' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authRestaurant = async (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const decodedId = decoded?.id ?? decoded?._id ?? decoded?.userId;
    let user = decodedId ? await Restaurant.findById(String(decodedId)) : null;
    // Backward-safe fallback in case older tokens were issued with email-only payloads.
    if (!user && decoded?.email) user = await Restaurant.findOne({ email: decoded.email });
    if (!user) {
      return res.status(401).json({ error: 'Access denied' });
    }
    if (user.status === 'blocked' || user.status === 'rejected') {
      return res.status(403).json({ error: 'Account suspended or registration rejected' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const user = await Admin.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Access denied' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

