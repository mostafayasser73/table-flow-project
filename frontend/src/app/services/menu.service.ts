import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import {
  ApiResponse,
  MenuItemsPage,
} from '../models/api-response.model';
import {
  CategoriesData,
  MenuItemsData,
  MenuItemData,
} from '../models/menu-item.model';

// The filters the Menu page can send. All of them are optional, which is what
// the "?" means (session 4).
export interface MenuFilters {
  category?: string;
  search?: string;
  available?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/menu-items`;

  // GET /api/v1/menu-items?category=pizza&search=burger&available=true
  getMenuItems(
    filters: MenuFilters = {},
  ): Observable<MenuItemsPage<MenuItemsData>> {
    let params = new HttpParams();

    if (filters.available !== undefined) {
      params = params.set('available', filters.available);
    }

    if (filters.category && filters.category !== 'all') {
      params = params.set('category', filters.category);
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    params = params.set('page', filters.page ?? 1);
    params = params.set('limit', filters.limit ?? 8);

    return this.http.get<MenuItemsPage<MenuItemsData>>(this.url, {
      params,
    });
  }

  // GET /api/v1/menu-items/popular  (Popular Items on the Home page)
  getPopular(): Observable<ApiResponse<MenuItemsData>> {
    return this.http.get<ApiResponse<MenuItemsData>>(`${this.url}/popular`);
  }

  // GET /api/v1/menu-items/categories  (the category pills)
  getCategories(): Observable<ApiResponse<CategoriesData>> {
    return this.http.get<ApiResponse<CategoriesData>>(`${this.url}/categories`);
  }

  // GET /api/v1/menu-items/:id  (Item Details page)
  getMenuItemById(id: string): Observable<ApiResponse<MenuItemData>> {
    return this.http.get<ApiResponse<MenuItemData>>(`${this.url}/${id}`);
  }

  // POST /api/v1/menu-items  (admin, manager)
  // FormData is used instead of JSON because a picture may be attached.
  createMenuItem(data: FormData): Observable<ApiResponse<MenuItemData>> {
    return this.http.post<ApiResponse<MenuItemData>>(this.url, data);
  }

  // PATCH /api/v1/menu-items/:id  (admin, manager)
  updateMenuItem(
    id: string,
    data: FormData,
  ): Observable<ApiResponse<MenuItemData>> {
    return this.http.patch<ApiResponse<MenuItemData>>(`${this.url}/${id}`, data);
  }

  // DELETE /api/v1/menu-items/:id  (admin, manager)
  deleteMenuItem(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}
