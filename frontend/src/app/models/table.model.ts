import { Order } from './order.model';
import { User } from './user.model';

export enum TableStatus {
  Available = 'available',
  Occupied = 'occupied',
  Reserved = 'reserved',
}

// "Table" on its own would clash with the DOM type, so the name is longer.
export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  currentGuests: number;
  status: TableStatus;
  assignedWaiter?: User | string;
}

export interface TablesData {
  tables: RestaurantTable[];
}

// GET /tables/my-tables sends the waiter's tables together with the orders
// that still have to be served, plus two counts next to "data".
export interface MyTablesData {
  tables: RestaurantTable[];
  orders: Order[];
}
