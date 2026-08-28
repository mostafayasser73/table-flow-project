import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { ApiResponse } from '../models/api-response.model';
import {
  NewReservation,
  ReservationData,
  ReservationStatus,
  ReservationsData,
} from '../models/reservation.model';

export interface ReservationFilters {
  status?: string;
  filter?: string; // today | tomorrow | week
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/reservations`;

  // POST /api/v1/reservations  (Confirm Reservation)
  createReservation(
    reservation: NewReservation,
  ): Observable<ApiResponse<ReservationData>> {
    return this.http.post<ApiResponse<ReservationData>>(this.url, reservation);
  }

  // GET /api/v1/reservations/my-reservations  (My Reservations tab)
  getMyReservations(): Observable<ApiResponse<ReservationsData>> {
    return this.http.get<ApiResponse<ReservationsData>>(
      `${this.url}/my-reservations`,
    );
  }

  // GET /api/v1/reservations  (Reservations Management)
  getAllReservations(
    filters: ReservationFilters = {},
  ): Observable<ApiResponse<ReservationsData>> {
    let params = new HttpParams();

    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    if (filters.filter && filters.filter !== 'all') {
      params = params.set('filter', filters.filter);
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<ApiResponse<ReservationsData>>(this.url, { params });
  }

  // PATCH /api/v1/reservations/:id/status  (Confirm / Reject / Cancel)
  updateStatus(
    id: string,
    status: ReservationStatus,
    tableNumber?: number,
  ): Observable<ApiResponse<ReservationData>> {
    return this.http.patch<ApiResponse<ReservationData>>(
      `${this.url}/${id}/status`,
      { status, tableNumber },
    );
  }

  // DELETE /api/v1/reservations/:id  (admin, manager)
  deleteReservation(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}
