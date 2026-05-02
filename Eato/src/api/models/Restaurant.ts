import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },
  description: { type: String, default: '' },
  address: { type: String, default: '' },
  /** City or area for customer search/filter (structured location alongside full street address). */
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  cuisine: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  role: { type: String, default: 'restaurant' },
  status: { type: String, enum: ['pending', 'approved', 'blocked', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Restaurant', restaurantSchema);

