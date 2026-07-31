import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { Reservation, ReservationStatus } from '../../../models/reservation';
import { ReservationService } from '../../../services/reservation.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    DatePipe,
  ],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css',
})
export class ReservationListComponent {
  displayedColumns = [
    'reservationId',
    'customer',
    'table',
    'guests',
    'date',
    'status',
    'actions',
  ];
  reservations: Reservation[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
    this.loadReservations();
  }

  get isManagerOrWaiter(): boolean {
    return this.authService.isManager() || this.authService.isWaiter();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService
      .getAllReservations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.reservations = r;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load reservations', 'Close', { duration: 3000 });
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
          this.snackBar.open(`Status updated to ${status}`, 'Close', { duration: 2500 });
          this.loadReservations();
        },
        error: () =>
          this.snackBar.open('Failed to update status', 'Close', { duration: 3000 }),
      });
  }

  cancel(reservationId: number): void {
    if (!confirm('Cancel this reservation? The table will be freed.')) return;
    this.reservationService
      .cancelReservation(reservationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Reservation cancelled', 'Close', { duration: 2500 });
          this.loadReservations();
        },
        error: () => this.snackBar.open('Failed to cancel', 'Close', { duration: 3000 }),
      });
  }

  statusColor(status: string): string {
    if (status === 'CONFIRMED') return 'primary';
    if (status === 'CANCELLED') return 'warn';
    return 'accent';
  }
}
