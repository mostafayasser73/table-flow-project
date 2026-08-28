import { MenuItem } from './menu-item.model';
import { User } from './user.model';

// How the customer wants to receive the order.
export enum OrderType {
  Delivery = 'delivery',
  DineIn = 'dine-in',
  Pickup = 'pickup',
}

// The path an order walks through, from the moment it is placed.
export enum OrderStatus {
  Pending = 'pending',
  Preparing = 'preparing',
  Ready = 'ready',
  Served = 'served',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

// One line inside an order: the dish, its price at the time, and how many.
export interface OrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderNumber: number;

  // the backend sends the id on its own, or the whole user when it populates
  user: User | string;

  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  orderType: OrderType;
  deliveryAddress?: string;
  tableNumber?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// What POST /orders expects: only the dish id and the quantity, because the
// backend looks up the real price itself.
export interface NewOrder {
  items: { menuItem: string; quantity: number }[];
  orderType: OrderType;
  deliveryAddress?: string;
  tableNumber?: number;
}

export interface OrdersData {
  orders: Order[];
}

export interface OrderData {
  order: Order;
}

// The four cards above the Orders Dashboard (GET /orders/stats).
export interface OrderStats {
  pending: number;
  preparing: number;
  ready: number;
  todayTotal: number;
}

// One line in the cart, kept only in the browser until the order is placed.
export interface CartLine {
  item: MenuItem;
  quantity: number;
}
