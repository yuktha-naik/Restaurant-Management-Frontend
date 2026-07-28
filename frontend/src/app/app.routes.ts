import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { customerGuard } from './guards/customer.guard';
import { managerGuard } from './guards/manager.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'customers',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./pages/customers/customer-list/customer-list').then(
        (m) => m.CustomerListComponent,
      ),
  },
  {
    path: 'reservations/new',
    canActivate: [authGuard, customerGuard],
    loadComponent: () =>
      import('./pages/reservations/reservation-form/reservation-form').then(
        (m) => m.ReservationFormComponent,
      ),
  },
  // Phase 3 — Waiter Module
  // Phase 4 — Table Module
  // Phase 5 — Menu Module
  // Phase 6 — Reservation Module
  // Phase 7 — Order Module
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
