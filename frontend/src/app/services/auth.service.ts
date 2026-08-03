import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser, DecodedAuthToken, UserRole } from '../models/auth-user';
import { Customer } from '../models/customer';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
/** Legacy key written by older builds — purged on logout so it never lingers. */
const LEGACY_USER_KEY = 'rms_user';

interface JwtPayload {
  sub?: string;
  role?: UserRole;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly customersUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  /** Staff login: MANAGER / WAITER (`POST /auth/login`). */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap((response) => this.storeSession(response)),
      );
  }

  /**
   * Customer identify-or-create (`POST /auth/customer`) using phone.
   * This is passwordless and always returns a CUSTOMER JWT on valid input.
   */
  customerAuth(name: string, phone: string, city?: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/customer`, {
        name,
        phone,
        city: city?.trim() ? city.trim() : undefined,
      })
      .pipe(
        tap((response) => this.storeSession(response)),
      );
  }

  /** Public customer self-registration — `POST /customers` (see §3/§5). */
  signup(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.customersUrl, customer);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  getUserId(): number | null {
    return this.getCurrentUser()?.userId ?? null;
  }

  getName(): string | null {
    return this.getCurrentUser()?.name ?? null;
  }

  getDecodedToken(): DecodedAuthToken | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = jwtDecode<JwtPayload>(token);

      if (!payload.sub || !payload.role || !payload.exp) {
        return null;
      }

      return {
        subject: payload.sub,
        role: payload.role,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }

  getEmail(): string | null {
    return this.getCurrentUser()?.email ?? null;
  }

  getPhone(): string | null {
    return this.getCurrentUser()?.phone ?? null;
  }

  getIdentityLabel(): string | null {
    return this.getName() ?? this.getPhone() ?? this.getEmail() ?? this.getDecodedToken()?.subject ?? null;
  }

  getRole(): UserRole | null {
    return this.getCurrentUser()?.role ?? this.getDecodedToken()?.role ?? null;
  }

  isLoggedIn(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return false;
    }

    return Date.now() < decoded.exp * 1000;
  }

  isManager(): boolean {
    return this.getRole() === 'MANAGER';
  }

  isWaiter(): boolean {
    return this.getRole() === 'WAITER';
  }

  isCustomer(): boolean {
    return this.getRole() === 'CUSTOMER';
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    const user: AuthUser = {
      userId: response.userId,
      name: response.name,
      email: response.email ?? null,
      phone: response.phone ?? null,
      role: response.role,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}