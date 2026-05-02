export type Role = 'customer' | 'restaurant' | 'admin';

/** Full lifecycle: restaurant accepts → process → pack → ship → deliver */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'packing'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export interface ApiUserBase {
  role: Role;
  email?: string;
  id?: string; // used by /login payload
  _id?: string; // used by /me and DB docs
  name?: string;
  restaurantName?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export interface Restaurant extends ApiUserBase {
  role: 'restaurant';
  restaurantName: string;
  description?: string;
  cuisine?: string;
  imageUrl?: string;
  address?: string;
  /** City or area used for customer location search. */
  city?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'blocked' | 'rejected';
  /** From public list aggregation (optional) */
  avgRating?: number | null;
  reviewCount?: number;
}

export interface Customer extends ApiUserBase {
  role: 'customer';
  name: string;
  phone?: string;
  address?: string;
  status: 'active' | 'blocked';
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  available: boolean;
  createdAt?: string | Date;
}

export interface OrderItem {
  menuItemId: MenuItem | string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  customerId?: Customer | string;
  restaurantId?: Restaurant | string;
  items?: Array<OrderItem & { menuItemId: any }>;
  totalAmount: number;
  paymentMethod?: string;
  status: OrderStatus;
  deliveryAddress: string;
  customerPhone?: string;
  adminNotes?: string;
  disputeOpen?: boolean;
  disputeSummary?: string;
  createdAt?: string | Date;
}

export interface Review {
  _id?: string;
  customerId?: Customer | string;
  restaurantId: Restaurant | string;
  menuItemId?: MenuItem | string | null;
  orderId?: Order | string;
  rating: number;
  comment?: string;
  createdAt?: string | Date;
}

