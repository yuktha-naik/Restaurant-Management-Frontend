import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RestaurantOrder } from '../../../models/restaurant-order';
import { Reservation } from '../../../models/reservation';
import { RestaurantOrderService } from '../../../services/restaurant-order.service';
import { ReservationService } from '../../../services/reservation.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

import {
  Component,
  DestroyRef,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CommonModule,
  CurrencyPipe,
  DatePipe
} from '@angular/common';


@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
  CommonModule,
  MatTableModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatChipsModule,
  MatMenuModule,
  MatSnackBarModule,
  CurrencyPipe,
  DatePipe,
],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderListComponent implements OnInit {
  displayedColumns = ['orderId', 'reservation', 'customer', 'table', 'waiter', 'orderTime', 'status', 'total', 'actions'];
  orders: RestaurantOrder[] = [];
  reservations: Reservation[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
  private orderService: RestaurantOrderService,
  private reservationService: ReservationService,
  private authService: AuthService,
  public router: Router,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
  private confirmDialog: ConfirmDialogService,
) {}
ngOnInit(): void {
  this.loadOrders();
}

  get isWaiter(): boolean {
    return this.authService.isWaiter();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  loadOrders(): void {
    this.loading = true;

    this.orderService
      .getAllOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders = [...orders];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load orders', 'Close', { duration: 10000 });
        },
      });

    this.reservationService
      .getAllReservations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
        },
        error: () => {
          this.snackBar.open('Failed to load reservation details', 'Close', { duration: 10000 });
        },
      });
  }

  customerLabel(order: RestaurantOrder): string {
    const byOrder = order.reservation?.customer;
    if (byOrder?.name?.trim()) return byOrder.name;
    if (byOrder?.customerId != null) return `Customer #${byOrder.customerId}`;

    const reservation = this.findReservation(order.reservation?.reservationId);
    if (reservation?.customer?.name?.trim()) return reservation.customer.name;
    if (reservation?.customer?.customerId != null) return `Customer #${reservation.customer.customerId}`;

    return 'Unknown customer';
  }

  tableLabel(order: RestaurantOrder): string {
    const byOrder = order.reservation?.restaurantTable;
    if (byOrder?.tableNumber != null) return `Table ${byOrder.tableNumber}`;
    if (byOrder?.tableId != null) return `Table #${byOrder.tableId}`;

    const reservation = this.findReservation(order.reservation?.reservationId);
    if (reservation?.restaurantTable?.tableNumber != null) {
      return `Table ${reservation.restaurantTable.tableNumber}`;
    }
    if (reservation?.restaurantTable?.tableId != null) {
      return `Table #${reservation.restaurantTable.tableId}`;
    }

    return 'Not allocated';
  }

  private findReservation(reservationId: number | undefined): Reservation | undefined {
    if (!reservationId) return undefined;
    return this.reservations.find((r) => r.reservationId === reservationId);
  }

  updateStatus(order: RestaurantOrder, status: string): void {
    if (!order.orderId) return;
    this.orderService
      .updateOrder(order.orderId, { status: status as RestaurantOrder['status'], totalAmount: order.totalAmount })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(`Order status updated to ${status}`, 'Close', { duration: 10000 });
          this.loadOrders();
        },
        error: () => this.snackBar.open('Failed to update order status', 'Close', { duration: 10000 }),
      });
  }

  delete(orderId: number): void {
    this.confirmDialog
      .confirm('Delete this order?', { title: 'Delete Order', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.orderService
          .deleteOrder(orderId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Order deleted', 'Close', { duration: 10000 });
              this.loadOrders();
            },
            error: () => this.snackBar.open('Failed to delete order', 'Close', { duration: 10000 }),
          });
      });
  }

  statusColor(status: string): string {
    if (status === 'COMPLETED') return 'primary';
    return 'accent';
  }

  // Order status is a one-way IN_PROGRESS -> COMPLETED transition; once
  // completed there's nothing left to change (server also enforces this).
  nextStatuses(order: RestaurantOrder): string[] {
    return order.status === 'COMPLETED' ? [] : ['COMPLETED'];
  }
}
