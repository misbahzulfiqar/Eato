import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'COD' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'packing', 'shipping', 'delivered', 'cancelled'],
    default: 'pending',
  },
  deliveryAddress: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  /** Admin-only notes for support / disputes */
  adminNotes: { type: String, default: '' },
  disputeOpen: { type: Boolean, default: false },
  disputeSummary: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Order', orderSchema);

