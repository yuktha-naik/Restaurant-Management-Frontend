import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const token = authService.getToken();

  const authorizedReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authorizedReq).pipe(
    catchError((error) => {
      // Let auth endpoints surface their own errors inline (e.g. bad password)
      if (req.url.includes('/auth/')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        authService.logout();
        router.navigate(['/customer']);
      } else if (error.status === 403) {
        const message: string =
          error.error?.message ?? 'You are not authorised to perform this action.';
        snackBar.open(message, 'Close', { duration: 6000 });
      } else {
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};