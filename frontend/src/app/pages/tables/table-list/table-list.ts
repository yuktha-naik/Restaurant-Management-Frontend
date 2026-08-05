import { Component, DestroyRef, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RestaurantTable } from '../../../models/restaurant-table';
import { Reservation } from '../../../models/reservation';
import { RestaurantTableService } from '../../../services/restaurant-table.service';
import { ReservationService } from '../../../services/reservation.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { forkJoin } from 'rxjs';

import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
} from '@angular/core';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    CommonModule,
  ],
  templateUrl: './table-list.html',
  styleUrl: './table-list.css',
})
export class TableListComponent {
  displayedColumns = ['tableId', 'tableNumber', 'capacity', 'customer', 'status', 'actions'];
  tables: RestaurantTable[] = [];
  private activeReservationByTable = new Map<number, Reservation>();
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

 constructor(
  private tableService: RestaurantTableService,
  private reservationService: ReservationService,
  private authService: AuthService,
  public router: Router,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
  private confirmDialog: ConfirmDialogService,
) {
  this.loadTables();
}

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get isWaiter(): boolean {
    return this.authService.isWaiter();
  }

 loadTables(): void {
    this.loading = true;

    forkJoin({
      tables: this.tableService.getAllTables(),
      reservations: this.reservationService.getAllReservations(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tables, reservations }) => {
          this.tables = [...tables];
          this.activeReservationByTable = this.buildActiveReservationMap(reservations);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('TABLE/RESERVATION LOAD ERROR:', error);
          this.loading = false;
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load table details'), 'Close', {
            duration: 10000,
          });
        },
      });
  }

  customerLabelForTable(table: RestaurantTable): string {
    const reservation = this.currentReservationForTable(table);
    if (!reservation) return 'No active customer';
    if (reservation.customer?.name?.trim()) return reservation.customer.name;
    if (reservation.customer?.customerId != null) return `Customer #${reservation.customer.customerId}`;
    return 'Customer assigned';
  }

  reservationLabelForTable(table: RestaurantTable): string {
    const reservation = this.currentReservationForTable(table);
    if (!reservation?.reservationId) return '';
    return `Reservation #${reservation.reservationId}`;
  }

  private currentReservationForTable(table: RestaurantTable): Reservation | undefined {
    const tableId = Number(table.tableId);
    if (!Number.isFinite(tableId)) return undefined;
    return this.activeReservationByTable.get(tableId);
  }

  private buildActiveReservationMap(reservations: Reservation[]): Map<number, Reservation> {
    const map = new Map<number, Reservation>();

    reservations
      .filter((r) => r.status === 'CONFIRMED' && r.restaurantTable?.tableId != null)
      .forEach((r) => {
        const tableId = Number(r.restaurantTable?.tableId);
        if (Number.isFinite(tableId)) {
          map.set(tableId, r);
        }
      });

    return map;
  }

  edit(tableId: number): void {
    if (!this.isManager) return;
    this.router.navigate(['/tables', tableId, 'edit']);
  }

  release(tableId: number): void {
    this.confirmDialog
      .confirm(
        'Mark this table as cleaned and available? This will automatically seat the next best-fit waiting reservation, if any.',
        { title: 'Release Table' },
      )
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.tableService
          .releaseTable(tableId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Table released and available for reallocation', 'Close', {
                duration: 10000,
              });
              this.loadTables();
            },
            error: (error) =>
              this.snackBar.open(this.getErrorMessage(error, 'Failed to release table'), 'Close', {
                duration: 10000,
              }),
          });
      });
  }

  delete(tableId: number): void {
    this.confirmDialog
      .confirm('Delete this table?', { title: 'Delete Table', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.tableService
          .deleteTable(tableId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Table deleted', 'Close', { duration: 10000 });
              this.loadTables();
            },
            error: (error) =>
              this.snackBar.open(this.getErrorMessage(error, 'Failed to delete table'), 'Close', {
                duration: 10000,
              }),
          });
      });
  }

  private getErrorMessage(error: HttpErrorResponse | unknown, fallback: string): string {
    const anyError = error as { error?: string | { message?: string }; message?: string };
    if (typeof anyError?.error === 'string' && anyError.error.trim()) {
      return anyError.error;
    }

    if (anyError?.error && typeof anyError.error === 'object' && 'message' in anyError.error) {
      const message = (anyError.error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (typeof anyError?.message === 'string' && anyError.message.trim()) {
      return anyError.message;
    }

    return fallback;
  }

  statusColor(status: string): string {
    if (status === 'AVAILABLE') return 'primary';
    if (status === 'OCCUPIED') return 'warn';
    return 'accent';
  }
}