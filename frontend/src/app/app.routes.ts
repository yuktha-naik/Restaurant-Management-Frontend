import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { customerGuard } from './guards/customer.guard';
import { managerGuard } from './guards/manager.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
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
    canActivate: [authGuard, customerGuard],
    loadComponent: () =>
      import('./pages/reservations/reservation-form/reservation-form').then(
        (m) => m.ReservationFormComponent,
      ),
  },

  // ── Customers (Manager / Waiter view) ────────────────────────────────────
  {
    path: 'customers',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/customers/customer-list/customer-list').then(
        (m) => m.CustomerListComponent,
      ),
  },

  // ── Waiters ───────────────────────────────────────────────────────────────
  {
    path: 'waiters',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/waiters/waiter-list/waiter-list').then(
        (m) => m.WaiterListComponent,
      ),
  },
  {
    path: 'waiters/new',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/waiters/waiter-form/waiter-form').then(
        (m) => m.WaiterFormComponent,
      ),
  },
  {
    path: 'waiters/:id/edit',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/waiters/waiter-form/waiter-form').then(
        (m) => m.WaiterFormComponent,
      ),
  },

  // ── Tables ────────────────────────────────────────────────────────────────
  {
    path: 'tables',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/tables/table-list/table-list').then(
        (m) => m.TableListComponent,
      ),
  },
  {
    path: 'tables/new',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/tables/table-form/table-form').then(
        (m) => m.TableFormComponent,
      ),
  },
  {
    path: 'tables/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/tables/table-form/table-form').then(
        (m) => m.TableFormComponent,
      ),
  },

  // ── Menu ──────────────────────────────────────────────────────────────────
  {
    path: 'menu',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/menu/menu-list/menu-list').then((m) => m.MenuListComponent),
  },
  {
    path: 'menu/new',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/menu/menu-form/menu-form').then((m) => m.MenuFormComponent),
  },
  {
    path: 'menu/:id/edit',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/menu/menu-form/menu-form').then((m) => m.MenuFormComponent),
  },

  // ── Reservations ──────────────────────────────────────────────────────────
  {
    path: 'reservations',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/reservations/reservation-list/reservation-list').then(
        (m) => m.ReservationListComponent,
      ),
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/orders/order-list/order-list').then(
        (m) => m.OrderListComponent,
      ),
  },
  {
    path: 'orders/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/orders/order-form/order-form').then(
        (m) => m.OrderFormComponent,
      ),
  },

  { path: '**', redirectTo: 'dashboard' },
];

