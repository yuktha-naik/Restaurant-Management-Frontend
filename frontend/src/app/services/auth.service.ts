import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, UserRole } from '../models/auth-user';

const USER_KEY = 'rms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router) {}

  login(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  }

  getRole(): UserRole | null {
    return this.getUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
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
}
