export type UserRole = 'CUSTOMER' | 'MANAGER' | 'WAITER';

export interface AuthUser {
  role: UserRole;
  name: string;
}
