import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  readonly submitting = signal(false);

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onLogin(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.submitting.set(true);

    this.authService.login(email, password).subscribe({
      next: () => {
        this.submitting.set(false);
        // Backend decides the role (MANAGER/WAITER) from the credentials —
        // the form doesn't ask for or enforce which one it is.
        const loggedInRole = this.authService.getRole();

        const destination =
          loggedInRole === 'CUSTOMER'
            ? '/reservations/new'
            : '/dashboard';

        this.router.navigate([destination]);
      },

      error: () => {
        this.submitting.set(false);

        this.snackBar.open(
          'Invalid email or password.',
          'Close',
          {
            duration: 3500,
          }
        );
      },
    });
  }
}