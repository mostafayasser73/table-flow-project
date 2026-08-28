import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { ApiResponse } from '../models/api-response.model';
import {
  MyTablesData,
  RestaurantTable,
  TablesData,
} from '../models/table.model';

// GET /tables/my-tables adds two counts of its own next to "data".
export interface MyTablesResponse extends ApiResponse<MyTablesData> {
  count: number;
  activeOrders: number;
  readyToServe: number;
}

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/tables`;

  // GET /api/v1/tables  (admin, manager, waiter)
  getAllTables(): Observable<ApiResponse<TablesData>> {
    return this.http.get<ApiResponse<TablesData>>(this.url);
  }

  // GET /api/v1/tables/my-tables  (Waiter Dashboard)
  getMyTables(): Observable<MyTablesResponse> {
    return this.http.get<MyTablesResponse>(`${this.url}/my-tables`);
  }

  // PATCH /api/v1/tables/:id  (status and guest count)
  updateTable(
    id: string,
    changes: Partial<RestaurantTable>,
  ): Observable<ApiResponse<{ table: RestaurantTable }>> {
    return this.http.patch<ApiResponse<{ table: RestaurantTable }>>(
      `${this.url}/${id}`,
      changes,
    );
  }
}
