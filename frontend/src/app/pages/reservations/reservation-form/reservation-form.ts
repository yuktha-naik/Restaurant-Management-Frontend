import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Reservation } from '../../../models/reservation';
import { AuthService } from '../../../services/auth.service';
import { ReservationService } from '../../../services/reservation.service';

/** Restaurant operating hours (24h) — mirrors backend `application.properties`. */
const OPENING_HOUR = 10;
const CLOSING_HOUR = 22;

@Component({
  selector: 'app-reservation-form',
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
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly openingHour = OPENING_HOUR;
  readonly closingHour = CLOSING_HOUR;
  readonly minDate = this.todayIso();

  readonly submitting = signal(false);

  // The person filling this out is the logged-in customer — we use their real
  // id from the stored login session (§3), never spawn a duplicate customer.
  readonly form = this.fb.nonNullable.group({
    reservationDate: [this.todayIso(), [Validators.required]],
    reservationTime: ['19:00', [Validators.required]],
    partySize: [1, [Validators.required, Validators.min(1)]],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Human-readable client-side validation message, or null when OK. */
  readonly validationError = computed(() => {
    const { reservationDate, reservationTime, partySize } = this.formValue();
    const size = Number(partySize);

    if (!size || size < 1) {
      return 'Party size must be at least 1.';
    }
    if (!reservationDate || !reservationTime) {
      return null;
    }

    const when = new Date(`${reservationDate}T${reservationTime}`);
    if (Number.isNaN(when.getTime())) {
      return 'Enter a valid date and time.';
    }
    if (when.getTime() < Date.now()) {
      return 'Reservation time cannot be in the past.';
    }
    const hour = when.getHours();
    if (hour < OPENING_HOUR || hour >= CLOSING_HOUR) {
      return `Reservations are only available between ${OPENING_HOUR}:00 and ${CLOSING_HOUR}:00.`;
    }
    return null;
  });

  constructor() {}

  save(): void {
    this.form.markAllAsTouched();

    const customerId = this.authService.getUserId();
    if (!customerId || !this.authService.isCustomer()) {
      this.snackBar.open('You must be signed in as a customer to check in.', 'Close', {
        duration: 3500,
      });
      return;
    }

    const clientError = this.validationError();
    if (this.form.invalid || clientError) {
      if (clientError) {
        this.snackBar.open(clientError, 'Close', { duration: 3500 });
      }
      return;
    }

    const { reservationDate, reservationTime, partySize } = this.form.getRawValue();

    // §8: only date/time + party size + customer id. The backend auto-assigns
    // the table and status, so we deliberately do NOT send them.
    const reservationPayload: Reservation = {
      reservationDate: `${reservationDate}T${reservationTime}:00`,
      partySize,
      customer: { customerId },
    };

    this.submitting.set(true);

    this.reservationService
      .createReservation(reservationPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open(
            'Reservation created. A table will be assigned automatically.',
            'Close',
            { duration: 4000 },
          );
          this.router.navigate(['/customer/home']);
        },
        error: (err) => {
          this.submitting.set(false);
          const message =
            err?.error?.message ??
            (err?.error?.fieldErrors
              ? Object.values(err.error.fieldErrors).join(' ')
              : 'Unable to complete check-in. Please try again.');
          this.snackBar.open(message, 'Close', { duration: 4000 });
        },
      });
  }

  private todayIso(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
