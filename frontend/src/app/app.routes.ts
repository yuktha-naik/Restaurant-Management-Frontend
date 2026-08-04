import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'customer', pathMatch: 'full' },

  {
    path: 'customer',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/signup/signup').then((m) => m.SignupComponent),
  },
  {
    path: 'customer/home',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER'] },
    loadComponent: () =>
      import('./pages/customer-home/customer-home').then((m) => m.CustomerHomeComponent),
  },

  {
    path: 'signup',
    redirectTo: 'customer',
    pathMatch: 'full',
  },

  {
    path: 'staff/login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  { path: 'staff/manager', redirectTo: 'staff/login', pathMatch: 'full' },
  { path: 'staff/waiter', redirectTo: 'staff/login', pathMatch: 'full' },
  {
    path: 'login',
    redirectTo: 'staff/login',
    pathMatch: 'full',
  },

  {
    path: 'customer/login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/signup/signup').then((m) => m.SignupComponent),
  },

  // ── Protected shell ──────────────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
  },

  // ── Customer check-in (CUSTOMER role only) ───────────────────────────────
  {
    path: 'reservations/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER', 'WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/reservations/reservation-form/reservation-form').then(
        (m) => m.ReservationFormComponent,
      ),
  },

  // ── Customers (Manager / Waiter view) ────────────────────────────────────
  {
    path: 'customers',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/customers/customer-list/customer-list').then(
        (m) => m.CustomerListComponent,
      ),
  },
  {
    path: 'customers/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/customers/customer-form/customer-form').then(
        (m) => m.CustomerFormComponent,
      ),
  },
  {
    path: 'customers/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/customers/customer-form/customer-form').then(
        (m) => m.CustomerFormComponent,
      ),
  },

  // ── Managers (Manager only) ──────────────────────────────────────────────
  {
    path: 'managers',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/managers/manager-list/manager-list').then(
        (m) => m.ManagerListComponent,
      ),
  },
  {
    path: 'managers/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/managers/manager-form/manager-form').then(
        (m) => m.ManagerFormComponent,
      ),
  },
  {
    path: 'managers/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/managers/manager-form/manager-form').then(
        (m) => m.ManagerFormComponent,
      ),
  },

  // ── Waiters ───────────────────────────────────────────────────────────────
  {
    path: 'waiters',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/waiters/waiter-list/waiter-list').then(
        (m) => m.WaiterListComponent,
      ),
  },
  {
    path: 'waiters/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/waiters/waiter-form/waiter-form').then(
        (m) => m.WaiterFormComponent,
      ),
  },
  {
    path: 'waiters/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/waiters/waiter-form/waiter-form').then(
        (m) => m.WaiterFormComponent,
      ),
  },

  // ── Tables ────────────────────────────────────────────────────────────────
  {
    path: 'tables',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/tables/table-list/table-list').then(
        (m) => m.TableListComponent,
      ),
  },
  {
    path: 'tables/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/tables/table-form/table-form').then(
        (m) => m.TableFormComponent,
      ),
  },
  {
    path: 'tables/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/tables/table-form/table-form').then(
        (m) => m.TableFormComponent,
      ),
  },

  // ── Menu ──────────────────────────────────────────────────────────────────
  {
    path: 'menu-items',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER', 'WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/menu/menu-list/menu-list').then((m) => m.MenuListComponent),
  },
  { path: 'menu', redirectTo: 'menu-items', pathMatch: 'full' },
  {
    path: 'menu-items/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/menu/menu-form/menu-form').then((m) => m.MenuFormComponent),
  },
  { path: 'menu/new', redirectTo: 'menu-items/new', pathMatch: 'full' },
  {
    path: 'menu-items/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./pages/menu/menu-form/menu-form').then((m) => m.MenuFormComponent),
  },
  { path: 'menu/:id/edit', redirectTo: 'menu-items/:id/edit', pathMatch: 'full' },

  // ── Reservations ──────────────────────────────────────────────────────────
  {
    path: 'reservations',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER', 'WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/reservations/reservation-list/reservation-list').then(
        (m) => m.ReservationListComponent,
      ),
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    path: 'orders',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/orders/order-list/order-list').then(
        (m) => m.OrderListComponent,
      ),
  },
  {
    path: 'orders/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/orders/order-form/order-form').then(
        (m) => m.OrderFormComponent,
      ),
  },
  {
    path: 'orders/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/orders/order-form/order-form').then(
        (m) => m.OrderFormComponent,
      ),
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  {
    path: 'payments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/payments/payment-list/payment-list').then(
        (m) => m.PaymentListComponent,
      ),
  },
  {
    path: 'payments/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/payments/payment-form/payment-form').then(
        (m) => m.PaymentFormComponent,
      ),
  },
  {
    path: 'payments/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER'] },
    loadComponent: () =>
      import('./pages/payments/payment-form/payment-form').then(
        (m) => m.PaymentFormComponent,
      ),
  },

  {
    path: 'access-denied',
    loadComponent: () =>
      import('./pages/access-denied/access-denied').then((m) => m.AccessDeniedComponent),
  },

  { path: '**', redirectTo: 'customer' },
];