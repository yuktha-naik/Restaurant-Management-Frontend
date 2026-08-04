import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { MenuItem } from '../../models/menu-item';
import { Reservation } from '../../models/reservation';
import { AuthService } from '../../services/auth.service';
import { MenuItemService } from '../../services/menu-item.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.css',
})
export class CustomerHomeComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuItemService);
  private readonly reservationService = inject(ReservationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly reservationLoading = signal(true);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly reservations = signal<Reservation[]>([]);

  get welcomeName(): string {
    return this.authService.getName() ?? 'Guest';
  }

  constructor() {
    this.loadMenu();
    this.loadReservations();
  }

  reservationStatus(reservation: Reservation): string {
    return reservation.status ?? 'UNKNOWN';
  }

  formatReservationDate(dateValue: string): string {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsed);
  }

  tableLabel(reservation: Reservation): string {
    if (reservation.restaurantTable?.tableNumber != null) {
      return `Table ${reservation.restaurantTable.tableNumber}`;
    }
    if (reservation.restaurantTable?.tableId != null) {
      return `Table #${reservation.restaurantTable.tableId}`;
    }
    return 'Not allocated yet';
  }

  totalBill(reservation: Reservation): number | null {
    const unknownReservation = reservation as unknown as Record<string, unknown>;
    const order = unknownReservation['restaurantOrder'] as Record<string, unknown> | undefined;
    const payment = unknownReservation['payment'] as Record<string, unknown> | undefined;
    const orderPayment = order?.['payment'] as Record<string, unknown> | undefined;

    return this.firstNumber(
      this.toNumber(payment?.['amount']),
      this.toNumber(orderPayment?.['amount']),
      this.toNumber(order?.['totalAmount']),
      this.toNumber(unknownReservation['totalAmount']),
      this.toNumber(unknownReservation['amount']),
      this.toNumber(order?.['amount']),
    );
  }

  canCancel(reservation: Reservation): boolean {
    const status = (reservation.status ?? '').toUpperCase();
    return status !== 'CANCELLED' && status !== 'FINISHED';
  }

  cancelReservation(reservation: Reservation): void {
    if (!reservation.reservationId || !this.canCancel(reservation)) {
      return;
    }

    const reservationId = reservation.reservationId;

    this.confirmDialog
      .confirm('Cancel this reservation?', { title: 'Cancel Reservation', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.reservationService
          .cancelReservation(reservationId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Reservation cancelled', 'Close', { duration: 10000 });
              this.loadReservations( );
            },
            error: (err) => {
              const message = err?.error?.message ?? 'Unable to cancel reservation.';
              this.snackBar.open(message, 'Close', { duration: 10000 });
            },
          });
      });
  }

  private loadMenu(): void {
    this.menuService
      .getAllMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.menuItems.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const message = err?.error?.message ?? 'Unable to load menu items.';
          this.snackBar.open(message, 'Close', { duration: 10000 });
        },
      });
  }

  // private loadReservations(): void {
  //   this.reservationLoading.set(true);
  //   const userId = this.authService.getUserId();

  //   this.reservationService
  //     .getAllReservations()
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (reservations) => {
  //         const own = userId
  //           ? reservations
  //               .filter((r) => r.customer?.customerId === userId)
  //               .sort(
  //                 (a, b) =>
  //                   new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime(),
  //               )
  //           : [];
  //         this.reservations.set(own);
  //         this.reservationLoading.set(false);
  //       },
  //       error: (err) => {
  //         this.reservationLoading.set(false);
  //         const message = err?.error?.message ?? 'Unable to load your reservations.';
  //         this.snackBar.open(message, 'Close', { duration: 10000 });
  //       },
  //     });
  // }
private loadReservations(): void {
  this.reservationLoading.set(true);

  const userId = this.authService.getUserId();

  if (!userId) {
    this.reservations.set([]);
    this.reservationLoading.set(false);
    return;
  }

  this.reservationService
    .getReservationsByCustomerId(userId)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (reservations) => {
        this.reservations.set(
          reservations.sort(
            (a, b) =>
              new Date(b.reservationDate).getTime() -
              new Date(a.reservationDate).getTime()
          )
        );

        this.reservationLoading.set(false);
      },
      error: (err) => {
        this.reservationLoading.set(false);

        const message =
          err?.error?.message ?? 'Unable to load your reservations.';

        this.snackBar.open(message, 'Close', {
          duration: 10000,
        });
      },
    });
}
  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private firstNumber(...values: Array<number | null>): number | null {
    for (const value of values) {
      if (value != null) {
        return value;
      }
    }
    return null;
  }
}

