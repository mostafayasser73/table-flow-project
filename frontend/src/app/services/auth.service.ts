import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthData,
  LoginData,
  SignupData,
  User,
  UserRole,
} from '../models/user.model';

// The keys used in local storage. HTTP is stateless, so the token has to be
// kept somewhere on the client and sent again with every request.
const TOKEN_KEY = 'tableflow_token';
const USER_KEY = 'tableflow_user';

// What the user has to change their own password.
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/auth`;

  // The logged in user. The pages read this to decide what to show in the
  // navigation bar. It starts from local storage so a refresh does not log out.
  readonly currentUser = signal<User | null>(this.readStoredUser());

  // the roles that can open the management screens
  readonly isStaff = computed(() => {
    const role = this.currentUser()?.role;
    return role !== undefined && role !== UserRole.Customer;
  });

  readonly isAdminOrManager = computed(() => {
    const role = this.currentUser()?.role;
    return role === UserRole.Admin || role === UserRole.Manager;
  });

  // POST /api/v1/auth/signup
  signup(data: SignupData): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<AuthData>>(`${this.url}/signup`, data)
      .pipe(tap((response) => this.saveSession(response.data)));
  }

  // POST /api/v1/auth/login
  login(data: LoginData): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<AuthData>>(`${this.url}/login`, data)
      .pipe(tap((response) => this.saveSession(response.data)));
  }

  // GET /api/v1/auth/me
  getMe(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.url}/me`);
  }

  // PATCH /api/v1/auth/me  (Edit Profile) — FormData, a picture may be attached
  updateMe(data: FormData): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.url}/me`, data)
      .pipe(tap((response) => this.saveUser(response.data.user)));
  }

  // PATCH /api/v1/auth/change-password  (Settings tab)
  changePassword(data: PasswordChange): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      `${this.url}/change-password`,
      data,
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  // Keeps the token and the user after a successful signup or login.
  private saveSession(data: AuthData): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    this.saveUser(data.user);
  }

  private saveUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(): User | null {
    const stored = localStorage.getItem(USER_KEY);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as User;
    } catch {
      // the stored value is broken, so it is safer to start logged out
      return null;
    }
  }
}
