import { Order } from './order.model';

// GET /dashboard/stats — the four cards and the Recent Orders table.
export interface DashboardStats {
  totalOrders: number;
  revenue: number;
  activeUsers: number;
  totalReservations: number;
  recentOrders: Order[];
}
