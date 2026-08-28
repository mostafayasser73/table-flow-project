// Every endpoint in the backend answers with the same shape:
//
//   { "status": "success", "message": "...", "data": { ... } }
//
// The only part that changes is what is inside "data", so this is a good place
// to use a generic type (session 7): T is a placeholder for that part.
export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

// The list endpoints add the paging information next to "data".
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  count: number;
  totalPages: number;
  currentPage: number;
}

// Each list endpoint names its own total after what it counts
// (totalItems, totalOrders, totalUsers, totalReservations), so the exact
// name is added on top of the shared shape.
export interface MenuItemsPage<T> extends PaginatedApiResponse<T> {
  totalItems: number;
}

export interface OrdersPage<T> extends PaginatedApiResponse<T> {
  totalOrders: number;
}

export interface UsersPage<T> extends PaginatedApiResponse<T> {
  totalUsers: number;
}

export interface ReservationsPage<T> extends PaginatedApiResponse<T> {
  totalReservations: number;
}

// The shape the backend uses when something goes wrong.
export interface ApiError {
  status: string;
  message: string;
}
