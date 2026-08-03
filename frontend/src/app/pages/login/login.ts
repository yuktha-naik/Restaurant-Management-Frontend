import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { UserRole } from '../../models/auth-user';

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
  readonly portalRole = signal<UserRole | null>(null);
  readonly portalTitle = signal('Staff Login');
  readonly portalSubtitle = signal('Manager and waiter sign in with email and password');

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    const roleFromRoute = this.route.snapshot.data['staffRole'] as UserRole | undefined;
    if (roleFromRoute) {
      this.portalRole.set(roleFromRoute);
      this.portalTitle.set(`${roleFromRoute} Login`);
      this.portalSubtitle.set(`Sign in as ${roleFromRoute.toLowerCase()} using email and password`);
    }
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
        const loggedInRole = this.authService.getRole();
        const expectedRole = this.portalRole();
        if (expectedRole && loggedInRole !== expectedRole) {
          this.authService.logout();
          this.snackBar.open(
            `This page is only for ${expectedRole.toLowerCase()} accounts.`,
            'Close',
            { duration: 3500 },
          );
          return;
        }

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