import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks authenticated users from reaching public-only pages (login, signup). */
export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  return auth.isCustomer()
    ? router.createUrlTree(['/customer/home'])
    : router.createUrlTree(['/dashboard']);
};
