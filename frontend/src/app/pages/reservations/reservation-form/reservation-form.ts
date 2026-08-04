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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Reservation } from '../../../models/reservation';
import { AuthService } from '../../../services/auth.service';
import { ReservationService } from '../../../services/reservation.service';

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
    MatDatepickerModule,
    MatTimepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
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

  readonly submitting = signal(false);
  readonly minDate = new Date();

  // The person filling this out is the logged-in customer — we use their real
  // id from the stored login session (§3), never spawn a duplicate customer.
  // Date and time are two separate pickers (calendar + clock, no seconds)
  // that both default to "right now" and are merged into one timestamp below.
  readonly form = this.fb.nonNullable.group({
    partySize: [1, [Validators.required, Validators.min(1)]],
    reservationDate: [new Date(), [Validators.required]],
    reservationTime: [new Date(), [Validators.required]],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Merges the date-picker's date with the time-picker's hh:mm (seconds always 0). */
  readonly combinedDateTime = computed<Date | null>(() => {
    const { reservationDate, reservationTime } = this.formValue();
    if (!reservationDate || !reservationTime) {
      return null;
    }

    const merged = new Date(reservationDate);
    merged.setHours(reservationTime.getHours(), reservationTime.getMinutes(), 0, 0);
    return merged;
  });

  /** Friendly preview of the merged timestamp, e.g. "Wed, 5 Aug 2026 · 7:30 PM". */
  readonly formattedPreview = computed(() => {
    const dt = this.combinedDateTime();
    if (!dt) return '';
    const datePart = dt.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timePart = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  });

  /** Human-readable client-side validation message, or null when OK. */
  readonly validationError = computed(() => {
    const { partySize } = this.formValue();
    const size = Number(partySize);

    if (!size || size < 1) {
      return 'Party size must be at least 1.';
    }

    const dt = this.combinedDateTime();
    if (!dt) {
      return 'Please pick a reservation date and time.';
    }

    if (dt.getTime() <= Date.now()) {
      return 'Reservation date and time must be in the future.';
    }

    return null;
  });

  constructor() {}

  /** Resets both pickers back to the current date/time. */
  resetToNow(): void {
    const now = new Date();
    this.form.patchValue({ reservationDate: now, reservationTime: now });
  }

  save(): void {
    this.form.markAllAsTouched();

    const customerId = this.authService.getUserId();
    if (!customerId || !this.authService.isCustomer()) {
      this.snackBar.open('You must be signed in as a customer to check in.', 'Close', {
        duration: 10000,
      });
      return;
    }

    const clientError = this.validationError();
    if (this.form.invalid || clientError) {
      if (clientError) {
        this.snackBar.open(clientError, 'Close', { duration: 10000 });
      }
      return;
    }

    const { partySize } = this.form.getRawValue();

    // §8: only date/time + party size + customer id. The backend auto-assigns
    // the table and status, so we deliberately do NOT send them.
    const reservationPayload: Reservation = {
      reservationDate: this.toIsoNoSeconds(this.combinedDateTime()!),
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
            { duration: 10000 },
          );
          this.router.navigate(['/customer/home']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.snackBar.open(this.describeError(err), 'Close', { duration: 10000 });
        },
      });
  }

  /**
   * Maps the backend's reservation-create error responses to a clear,
   * customer-facing message. The 409 "1-hour rule" (a customer can't have two
   * reservations within an hour of each other) is the one worth calling out
   * specifically — the rest fall back to whatever message the backend sent.
   */
  private describeError(err: { status?: number; error?: { message?: string; fieldErrors?: Record<string, string> } }): string {
    if (err?.status === 409) {
      return (
        err?.error?.message ??
        'You already have a reservation within 1 hour of this time. Please wait a bit before checking in again.'
      );
    }

    if (err?.status === 400) {
      return (
        err?.error?.message ??
        (err?.error?.fieldErrors ? Object.values(err.error.fieldErrors).join(' ') : null) ??
        'Invalid reservation details. Please check the party size and try again.'
      );
    }

    if (err?.status === 404) {
      return 'Your customer account could not be found. Please sign in again.';
    }

    if (err?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    return err?.error?.message ?? 'Unable to complete check-in. Please try again.';
  }

  /** yyyy-MM-dd'T'HH:mm:00 — matches the backend's required format exactly, seconds always zeroed. */
  private toIsoNoSeconds(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }
}
