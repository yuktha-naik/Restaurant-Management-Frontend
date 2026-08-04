import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

/**
 * Customer walk-in flow from updated backend contract:
 * single identify-or-create call `POST /auth/customer` with name/phone/city.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    city: [''],
  });

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const { name, phone, city } = this.form.getRawValue();
    this.submitting.set(true);

    this.authService.customerAuth(name.trim(), phone.trim(), city).subscribe({
      next: () => this.finish(`Welcome, ${name.trim()}!`),
      error: (err: HttpErrorResponse) => {
        this.fail(err, 'Could not complete customer check-in. Please try again.');
      },
    });
  }

  private finish(message: string): void {
    this.submitting.set(false);
    this.snackBar.open(message, 'Close', { duration: 10000 });
    this.router.navigate(['/customer/home']);
  }

  private fail(err: HttpErrorResponse, fallback: string): void {
    this.submitting.set(false);
    const serverMsg =
      err?.error?.message ??
      (err?.error?.fieldErrors ? Object.values(err.error.fieldErrors).join(' ') : null);
    this.snackBar.open(serverMsg ?? fallback, 'Close', { duration: 10000 });
  }
}
