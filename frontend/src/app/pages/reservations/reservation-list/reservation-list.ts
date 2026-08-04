import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Reservation, ReservationStatus } from '../../../models/reservation';
import { ReservationService } from '../../../services/reservation.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

  
@Component({
  selector: 'app-reservation-list',
  standalone: true,
 imports: [
  CommonModule,
  MatTableModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatChipsModule,
  MatSnackBarModule,
    CurrencyPipe,
  DatePipe,
],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationListComponent implements OnInit {
  private readonly reservationStatusColor: Record<ReservationStatus, 'primary' | 'warn' | 'accent'> = {
    PENDING: 'accent',
    CONFIRMED: 'primary',
    CANCELLED: 'warn',
    FINISHED: 'accent',
  };

  displayedColumns = [
    'reservationId',
    'customer',
    'table',
    'guests',
    'date',
    'bill',
    'status',
    'actions',
  ];
  reservations: Reservation[] = [];
  visibleReservations: Reservation[] = [];
  loading = false;

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  get canManageStatus(): boolean {
    const role = this.authService.getRole();
    return role === 'MANAGER';
  }

  get canCancelReservation(): boolean {
    return this.authService.getRole() !== 'WAITER';
  }

  customerLabel(r: Reservation): string {
    return r.customer?.name ?? (r.customer?.customerId != null ? `#${r.customer.customerId}` : '—');
  }

  tableLabel(r: Reservation): string {
    const t = r.restaurantTable;
    if (!t) return 'Auto';
    return t.tableNumber != null ? `Table ${t.tableNumber}` : (t.tableId != null ? `#${t.tableId}` : 'Auto');
  }

  totalBill(r: Reservation): number | null {
    const unknownReservation = r as unknown as Record<string, unknown>;
    const restaurantOrder = unknownReservation['restaurantOrder'] as Record<string, unknown> | undefined;
    const payment = unknownReservation['payment'] as Record<string, unknown> | undefined;
    const orderTotal = restaurantOrder?.['totalAmount'];
    const paymentAmount = (restaurantOrder?.['payment'] as Record<string, unknown> | undefined)?.['amount'];

    return this.toNumber(payment?.['amount'])
      ?? this.toNumber(paymentAmount)
      ?? this.toNumber(orderTotal)
      ?? this.toNumber(unknownReservation['totalAmount']);
  }

  canCancel(r: Reservation): boolean {
    const status = (r.status ?? '').toUpperCase();
    return status !== 'CANCELLED' && status !== 'FINISHED';
  }

  statusText(r: Reservation): string {
    return r.status ?? 'UNKNOWN';
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor(
  private reservationService: ReservationService,
  private authService: AuthService,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
  private confirmDialog: ConfirmDialogService,
) {}

ngOnInit(): void {
  this.loadReservations();
}

loadReservations(): void {
  this.loading = true;

  this.reservationService
    .getAllReservations()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (reservations) => {
        this.reservations = [...reservations];
        this.visibleReservations = this.filterForCurrentUser(this.reservations);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;

        this.snackBar.open(
          'Failed to load reservations',
          'Close',
          { duration: 10000 }
        );
      },
    });
}


  updateStatus(reservation: Reservation, status: ReservationStatus): void {
    if (!reservation.reservationId) return;
    this.reservationService
      .updateReservation(reservation.reservationId, { ...reservation, status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(`Status updated to ${status}`, 'Close', { duration: 10000 });
          this.loadReservations();
        },
        error: () =>
          this.snackBar.open('Failed to update status', 'Close', { duration: 10000 }),
      });
  }

  cancel(reservationId: number | undefined): void {
    if (!reservationId) return;
    this.confirmDialog
      .confirm('Cancel this reservation? The table will be freed.', {
        title: 'Cancel Reservation',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.reservationService
          .cancelReservation(reservationId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Reservation cancelled', 'Close', { duration: 10000 });
              this.loadReservations();
            },
            error: () => this.snackBar.open('Failed to cancel', 'Close', { duration: 10000 }),
          });
      });
  }

  statusColor(status: string | undefined): 'primary' | 'warn' | 'accent' {
    const normalized = (status ?? 'PENDING') as ReservationStatus;
    return this.reservationStatusColor[normalized] ?? 'accent';
  }

  private filterForCurrentUser(items: Reservation[]): Reservation[] {
    if (!this.isCustomer) {
      return items;
    }

    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      return [];
    }

    return items.filter((reservation) => reservation.customer?.customerId === currentUserId);
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
}
