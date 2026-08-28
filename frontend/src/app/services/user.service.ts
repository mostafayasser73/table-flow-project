import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import {
  ApiResponse,
  UsersPage,
} from '../models/api-response.model';
import { User } from '../models/user.model';

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsersData {
  users: User[];
}

export interface UserData {
  user: User;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/users`;

  // GET /api/v1/users  (Users Management)
  getAllUsers(
    filters: UserFilters = {},
  ): Observable<UsersPage<UsersData>> {
    let params = new HttpParams();

    if (filters.role && filters.role !== 'all') {
      params = params.set('role', filters.role);
    }

    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    params = params.set('page', filters.page ?? 1);
    params = params.set('limit', filters.limit ?? 10);

    return this.http.get<UsersPage<UsersData>>(this.url, { params });
  }

  // POST /api/v1/users  (+ Add User) — FormData, a picture may be attached
  createUser(data: FormData): Observable<ApiResponse<UserData>> {
    return this.http.post<ApiResponse<UserData>>(this.url, data);
  }

  // PATCH /api/v1/users/:id  (Edit)
  updateUser(id: string, data: FormData): Observable<ApiResponse<UserData>> {
    return this.http.patch<ApiResponse<UserData>>(`${this.url}/${id}`, data);
  }

  // DELETE /api/v1/users/:id  (admin only)
  deleteUser(id: string): Observable<ApiResponse<UserData>> {
    return this.http.delete<ApiResponse<UserData>>(`${this.url}/${id}`);
  }
}
