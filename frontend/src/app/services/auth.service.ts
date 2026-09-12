import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { ApiResponse } from '../models/api-response.model';
import { AuthData, LoginData, User, UserRole } from '../models/user.model';

// The keys used in local storage. HTTP is stateless, so the token has to be
// kept somewhere on the client and sent again with every request.
const TOKEN_KEY = 'tableflow_token';
const USER_KEY = 'tableflow_user';

// What the backend puts inside the token (see utils/get-jwt.js), plus the two
// dates jsonwebtoken adds: iat (issued at) and exp (expires at), in seconds.
interface TokenPayload {
  id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// The screen each role starts on after logging in.
const LANDING_PAGES: Record<UserRole, string> = {
  [UserRole.Admin]: '/admin',
  [UserRole.Manager]: '/admin',
  [UserRole.Chef]: '/kitchen',
  [UserRole.Waiter]: '/waiter',
  [UserRole.Customer]: '/menu',
};

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
  // navigation bar. The constructor fills it from local storage, so a refresh
  // does not log out.
  readonly currentUser = signal<User | null>(null);

  // the roles that can open the management screens
  readonly isStaff = computed(() => {
    const role = this.currentUser()?.role;
    return role !== undefined && role !== UserRole.Customer;
  });

  readonly isAdminOrManager = computed(() => {
    const role = this.currentUser()?.role;
    return role === UserRole.Admin || role === UserRole.Manager;
  });

  constructor() {
    // an expired token from an earlier visit must not show a logged in header
    if (this.isLoggedIn()) {
      this.currentUser.set(this.readStoredUser());
    }
  }

  // POST /api/v1/auth/signup — FormData, so a profile picture can be attached
  signup(data: FormData): Observable<ApiResponse<AuthData>> {
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

  // A token that is only present is not enough: it may have expired. The
  // payload of a JWT is readable by anyone (only the signature is secret), so
  // jwtDecode can read exp without the secret. Checking it here saves a round
  // trip that the backend would answer with 401 anyway.
  isLoggedIn(): boolean {
    if (!this.getToken()) {
      return false;
    }

    const decoded = this.getDecodedToken();

    if (!decoded) {
      this.logout();
      return false;
    }

    // exp is in seconds, Date works in milliseconds
    const expirationDate = new Date(decoded.exp * 1000);

    if (expirationDate < new Date()) {
      this.logout();
      return false;
    }

    return true;
  }

  // The role comes from the token, the same place the backend reads it from.
  getRole(): UserRole | null {
    return this.isLoggedIn() ? (this.getDecodedToken()?.role ?? null) : null;
  }

  // Where to go after logging in when no page asked for it (returnUrl).
  landingPage(): string {
    const role = this.getRole();
    return role ? LANDING_PAGES[role] : '/menu';
  }

  // Decodes the token once, for isLoggedIn() and getRole() to share.
  private getDecodedToken(): TokenPayload | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      // not a valid JWT (someone edited local storage)
      return null;
    }
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
