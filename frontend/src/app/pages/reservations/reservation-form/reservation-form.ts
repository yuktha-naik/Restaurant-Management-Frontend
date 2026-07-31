import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Customer } from '../../../models/customer';
import { Reservation } from '../../../models/reservation';
import { RestaurantTable } from '../../../models/restaurant-table';
import { AuthService } from '../../../services/auth.service';
import { CustomerService } from '../../../services/customer.service';
import { ReservationService } from '../../../services/reservation.service';
import { RestaurantTableService } from '../../../services/restaurant-table.service';

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
  private readonly customerService = inject(CustomerService);
  private readonly reservationService = inject(ReservationService);
  private readonly restaurantTableService = inject(RestaurantTableService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);
  readonly availableTables = signal<RestaurantTable[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    partySize: [1, [Validators.required, Validators.min(1)]],
  });

  readonly suggestedTable = computed(() => {
  const guestCount = this.form.controls.partySize.value;

 

  return this.findBestFitTable(
    guestCount,
    this.availableTables()
  );
});

  constructor() {
    const user = this.authService.getUser();
    if (user?.role === 'CUSTOMER') {
      this.form.patchValue({ name: user.name });
    }
    this.loadTables();
  }

  loadTables(): void {
  this.restaurantTableService
    .getAllTables()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (tables) => {
        
        this.availableTables.set(tables);
      },
      error: () => {
        this.snackBar.open('Failed to load available tables', 'Close', {
          duration: 3000,
        });
      },
    });
}

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.suggestedTable() === null) {
      if (this.suggestedTable() === null) {
        this.snackBar.open('No available table can fit this party size right now.', 'Close', {
          duration: 3500,
        });
      }
      return;
    }

    this.submitting.set(true);

    const customerPayload: Customer = {
      name: this.form.controls.name.value.trim(),
      phone: this.form.controls.phone.value.trim(),
      email: this.form.controls.email.value.trim(),
    };

    this.customerService
      .createCustomer(customerPayload)
      .pipe(
        switchMap((customer) => {
          const reservationTime = new Date();
reservationTime.setHours(reservationTime.getHours() + 1);

const reservationPayload: Reservation = {
  reservationDate: this.toLocalDateTime(reservationTime),
  partySize: this.form.controls.partySize.value,
  customer,
  restaurantTable: { tableId: this.suggestedTable()!.tableId },
};

          return this.reservationService.createReservation(reservationPayload);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (reservation) => {
          this.submitting.set(false);
          this.snackBar.open(
            `Reservation created. Table ${this.suggestedTable()!.tableNumber} has been assigned.`,
            'Close',
            { duration: 4000 },
          );
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.submitting.set(false);
          this.snackBar.open('Unable to complete check-in. Please try again.', 'Close', {
            duration: 3500,
          });
        },
      });
  }

  private findBestFitTable(
    guestCount: number,
    tables: RestaurantTable[],
  ): RestaurantTable | null {
    const eligibleTables = tables
      .filter((table) => table.status === 'AVAILABLE' && table.capacity >= guestCount)
      .sort((left, right) => left.capacity - right.capacity);

    return eligibleTables[0] ?? null;
  }

  private toLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const seconds = `${date.getSeconds()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}
