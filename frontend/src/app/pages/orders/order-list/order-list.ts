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
import { RestaurantOrderService } from '../../../services/restaurant-order.service';
import { AuthService } from '../../../services/auth.service';

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
  displayedColumns = ['orderId', 'reservation', 'waiter', 'orderTime', 'status', 'total', 'actions'];
  orders: RestaurantOrder[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);
  readonly ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
  private orderService: RestaurantOrderService,
  private authService: AuthService,
  public router: Router,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
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
          this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 });
        },
      });
  }

  updateStatus(order: RestaurantOrder, status: string): void {
    if (!order.orderId) return;
    this.orderService
      .updateOrder(order.orderId, { status: status as RestaurantOrder['status'], totalAmount: order.totalAmount })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(`Order status updated to ${status}`, 'Close', { duration: 2500 });
          this.loadOrders();
        },
        error: () => this.snackBar.open('Failed to update order status', 'Close', { duration: 3000 }),
      });
  }

  delete(orderId: number): void {
    if (!confirm('Delete this order?')) return;
    this.orderService
      .deleteOrder(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Order deleted', 'Close', { duration: 2500 });
          this.loadOrders();
        },
        error: () => this.snackBar.open('Failed to delete order', 'Close', { duration: 3000 }),
      });
  }

  statusColor(status: string): string {
    if (status === 'DELIVERED') return 'primary';
    if (status === 'CANCELLED') return 'warn';
    return 'accent';
  }
}
