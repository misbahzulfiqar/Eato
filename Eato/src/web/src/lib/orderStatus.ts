import type { OrderStatus } from '../types/eato';

/** Stages after the restaurant accepts (excludes pending & cancelled). */
export const ORDER_PIPELINE: OrderStatus[] = ['pending', 'processing', 'packing', 'shipping', 'delivered'];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  packing: 'Packing',
  shipping: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function isOrderActive(status: OrderStatus): boolean {
  return status !== 'delivered' && status !== 'cancelled';
}

export function pipelineStepIndex(status: OrderStatus): number {
  return ORDER_PIPELINE.indexOf(status);
}

/** Next status restaurant should set (single advance), or null if terminal / pending needs accept. */
export function nextRestaurantStatus(current: OrderStatus): OrderStatus | null {
  if (current === 'cancelled' || current === 'delivered') return null;
  if (current === 'pending') return null;
  const idx = ORDER_PIPELINE.indexOf(current);
  if (idx < 0 || idx >= ORDER_PIPELINE.length - 1) return null;
  return ORDER_PIPELINE[idx + 1];
}
