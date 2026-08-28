import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { ApiResponse } from '../models/api-response.model';
import { NewReview, Review, ReviewsData } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  // GET /api/v1/menu-items/:id/reviews  (Customer Reviews section)
  getReviews(menuItemId: string): Observable<ApiResponse<ReviewsData>> {
    return this.http.get<ApiResponse<ReviewsData>>(
      `${API_BASE_URL}/menu-items/${menuItemId}/reviews`,
    );
  }

  // POST /api/v1/menu-items/:id/reviews  (logged in customers)
  createReview(
    menuItemId: string,
    review: NewReview,
  ): Observable<ApiResponse<{ review: Review }>> {
    return this.http.post<ApiResponse<{ review: Review }>>(
      `${API_BASE_URL}/menu-items/${menuItemId}/reviews`,
      review,
    );
  }

  // DELETE /api/v1/reviews/:id  (the owner or an admin)
  deleteReview(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API_BASE_URL}/reviews/${id}`);
  }
}
