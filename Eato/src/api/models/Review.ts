import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  // If null: restaurant review. If set: food item review (menu item).
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate submissions per customer/order/type
reviewSchema.index({ orderId: 1, customerId: 1, menuItemId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);

