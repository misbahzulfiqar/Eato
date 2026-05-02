import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  role: { type: String, default: 'customer' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Customer', customerSchema);

