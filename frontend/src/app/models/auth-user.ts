export type UserRole = 'CUSTOMER' | 'MANAGER' | 'WAITER';

/** Exact JSON returned by `POST /auth/login` (see FRONTEND_INTEGRATION.md §3). */
export interface AuthResponse {
  token: string;
  role: UserRole;
  userId: number;
  name: string;
  email: string | null;
  phone: string | null;
}

/** The authenticated user we keep in localStorage for the session. */
export interface AuthUser {
  userId: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
}

export interface DecodedAuthToken {
  subject: string;
  role: UserRole;
  exp: number;
}