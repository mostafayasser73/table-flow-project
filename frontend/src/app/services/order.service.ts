import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import {
  ApiResponse,
  OrdersPage,
} from '../models/api-response.model';
import {
  NewOrder,
  OrderData,
  OrderStats,
  OrderStatus,
  OrdersData,
} from '../models/order.model';

export interface OrderFilters {
  status?: string;
  orderType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/orders`;

  // POST /api/v1/orders  (Place Order)
  createOrder(order: NewOrder): Observable<ApiResponse<OrderData>> {
    return this.http.post<ApiResponse<OrderData>>(this.url, order);
  }

  // GET /api/v1/orders/my-orders  (My Orders tab)
  getMyOrders(): Observable<ApiResponse<OrdersData>> {
    return this.http.get<ApiResponse<OrdersData>>(`${this.url}/my-orders`);
  }

  // GET /api/v1/orders  (Orders Dashboard)
  getAllOrders(
    filters: OrderFilters = {},
  ): Observable<OrdersPage<OrdersData>> {
    let params = new HttpParams();

    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    if (filters.orderType && filters.orderType !== 'all') {
      params = params.set('orderType', filters.orderType);
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    params = params.set('page', filters.page ?? 1);
    params = params.set('limit', filters.limit ?? 10);

    return this.http.get<OrdersPage<OrdersData>>(this.url, { params });
  }

  // GET /api/v1/orders/stats  (the four cards)
  getStats(): Observable<ApiResponse<OrderStats>> {
    return this.http.get<ApiResponse<OrderStats>>(`${this.url}/stats`);
  }

  // GET /api/v1/orders/kitchen  (Kitchen Display)
  getKitchenOrders(): Observable<ApiResponse<OrdersData>> {
    return this.http.get<ApiResponse<OrdersData>>(`${this.url}/kitchen`);
  }

  // PATCH /api/v1/orders/:id/status  (every action button)
  updateStatus(
    id: string,
    status: OrderStatus,
  ): Observable<ApiResponse<OrderData>> {
    return this.http.patch<ApiResponse<OrderData>>(`${this.url}/${id}/status`, {
      status,
    });
  }

  // DELETE /api/v1/orders/:id  (admin)
  deleteOrder(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}
