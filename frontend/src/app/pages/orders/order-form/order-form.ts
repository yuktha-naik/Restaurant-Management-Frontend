import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Reservation } from '../../../models/reservation';
import { Waiter } from '../../../models/waiter';
import { MenuItem } from '../../../models/menu-item';
import { RestaurantOrder } from '../../../models/restaurant-order';
import { OrderItem } from '../../../models/order-item';
import { ReservationService } from '../../../services/reservation.service';
import { WaiterService } from '../../../services/waiter.service';
import { MenuItemService } from '../../../services/menu-item.service';
import { OrderItemService } from '../../../services/order-item.service';
import { RestaurantOrderService } from '../../../services/restaurant-order.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly reservationService = inject(ReservationService);
  private readonly waiterService = inject(WaiterService);
  private readonly menuService = inject(MenuItemService);
  private readonly orderItemService = inject(OrderItemService);
  private readonly orderService = inject(RestaurantOrderService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly creatingOrder = signal(false);
  readonly mutatingItem = signal(false);
  readonly reservations = signal<Reservation[]>([]);
  readonly existingOrders = signal<RestaurantOrder[]>([]);
  readonly waiters = signal<Waiter[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly createdOrder = signal<RestaurantOrder | null>(null);
  readonly currentItems = signal<OrderItem[]>([]);
  /** True when the route contains an orderId — we are editing, not creating. */
  readonly editMode = signal(false);

  readonly createOrderForm = this.fb.nonNullable.group({
    reservationId: [0 as number, [Validators.required, Validators.min(1)]],
    waiterId: [0 as number, [Validators.required, Validators.min(1)]],
  });

  readonly addItemForm = this.fb.nonNullable.group({
    itemId: [0 as number, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  readonly canCreateOrder = computed(() => !this.createdOrder() && !this.creatingOrder());
  readonly canAddItems = computed(() => !!this.createdOrder() && !this.mutatingItem());
  // Only one order per reservation (per table/customer) at a time — hide any
  // reservation that already has an order, matching the backend's 409 rule.
  readonly confirmedReservations = computed(() => {
    const reservedIds = new Set(this.existingOrders().map((o) => o.reservation?.reservationId));
    return this.reservations().filter(
      (r) =>
        r.status === 'CONFIRMED' &&
        !!r.restaurantTable &&
        !!r.reservationId &&
        !reservedIds.has(r.reservationId),
    );
  });
  readonly selectedReservation = computed(() => {
    const selectedId = this.createOrderForm.controls.reservationId.value;
    return this.confirmedReservations().find((r) => r.reservationId === selectedId) ?? null;
  });

  constructor() {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (orderId) {
      this.editMode.set(true);
      this.loadEditMode(orderId);
    } else {
      this.loadSeedData();
    }
  }

  get isWaiter(): boolean {
    return this.authService.isWaiter();
  }

  /** Edit mode: load the existing order + its items directly, skip creation step. */
  private loadEditMode(orderId: number): void {
    this.loading.set(true);

    this.menuService
      .getAllMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.menuItems.set(items.filter((m) => m.available)),
        error: () => this.snackBar.open('Failed to load menu items', 'Close', { duration: 10000 }),
      });

    this.orderService
      .getOrderById(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.createdOrder.set(order);
          this.loading.set(false);
          this.loadCurrentOrderState();
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load order', 'Close', { duration: 10000 });
          this.router.navigate(['/orders']);
        },
      });
  }

  private loadSeedData(): void {
    this.loading.set(true);

    this.reservationService
      .getAllReservations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservations) => this.reservations.set(reservations),
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load reservations', 'Close', { duration: 10000 });
        },
      });

    this.waiterService
      .getAllWaiters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (waiters) => {
          this.waiters.set(waiters);
          if (this.authService.isWaiter()) {
            const currentUserId = this.authService.getUserId();
            const self = waiters.find((w) => w.waiterId === currentUserId);
            if (self?.waiterId) {
              this.createOrderForm.controls.waiterId.setValue(self.waiterId);
            }
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load waiters', 'Close', { duration: 10000 });
        },
      });

    this.menuService
      .getAllMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (menuItems) => {
          this.menuItems.set(menuItems.filter((m) => m.available));
        },
        error: () => {
          this.snackBar.open('Failed to load menu items', 'Close', { duration: 10000 });
        },
      });

    this.orderService
      .getAllOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => this.existingOrders.set(orders),
        error: () => {
          this.snackBar.open('Failed to load existing orders', 'Close', { duration: 10000 });
        },
      });
  }

  createOrder(): void {
    this.createOrderForm.markAllAsTouched();
    if (this.createOrderForm.invalid || !this.canCreateOrder()) return;

    const reservation = this.selectedReservation();
    if (!reservation?.reservationId) {
      this.snackBar.open('Pick a confirmed reservation with allocated table.', 'Close', {
        duration: 10000,
      });
      return;
    }

    const waiterId = this.createOrderForm.controls.waiterId.value;
    this.creatingOrder.set(true);

    const payload: RestaurantOrder = {
      reservation: { reservationId: reservation.reservationId },
      waiter: { waiterId },
    };

    this.orderService
      .createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.creatingOrder.set(false);
          this.createdOrder.set(created);
          this.existingOrders.update((orders) => [...orders, created]);
          this.loadCurrentOrderState();
          this.snackBar.open('Order created. Add items below.', 'Close', { duration: 10000 });
        },
        error: (err) => {
          this.creatingOrder.set(false);
          const message = err?.error?.message ?? 'Failed to create order.';
          this.snackBar.open(message, 'Close', { duration: 10000 });
        },
      });
  }

  addItem(): void {
    this.addItemForm.markAllAsTouched();
    const order = this.createdOrder();
    if (!order?.orderId || this.addItemForm.invalid) return;

    const { itemId, quantity } = this.addItemForm.getRawValue();
    this.mutatingItem.set(true);

    this.orderItemService
      .createOrderItem({
        quantity,
        restaurantOrder: { orderId: order.orderId },
        menuItem: { itemId },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mutatingItem.set(false);
          this.addItemForm.reset({ itemId: 0, quantity: 1 });
          this.loadCurrentOrderState();
        },
        error: (err) => {
          this.mutatingItem.set(false);
          const message = err?.error?.message ?? 'Failed to add order item.';
          this.snackBar.open(message, 'Close', { duration: 10000 });
        },
      });
  }

  updateItemQuantity(item: OrderItem, quantity: number): void {
    const orderId = this.createdOrder()?.orderId;
    if (!item.orderItemId || !item.menuItem.itemId || !orderId || quantity < 1) return;

    this.mutatingItem.set(true);
    this.orderItemService
      .updateOrderItem(item.orderItemId, {
        quantity,
        restaurantOrder: { orderId },
        menuItem: { itemId: item.menuItem.itemId },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mutatingItem.set(false);
          this.loadCurrentOrderState();
        },
        error: (err) => {
          this.mutatingItem.set(false);
          const message = err?.error?.message ?? 'Failed to update item quantity.';
          this.snackBar.open(message, 'Close', { duration: 10000 });
        },
      });
  }

  removeItem(item: OrderItem): void {
    if (!item.orderItemId) return;
    this.mutatingItem.set(true);

    this.orderItemService
      .deleteOrderItem(item.orderItemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.mutatingItem.set(false);
          this.loadCurrentOrderState();
        },
        error: (err) => {
          this.mutatingItem.set(false);
          const message = err?.error?.message ?? 'Failed to delete item.';
          this.snackBar.open(message, 'Close', { duration: 10000 });
        },
      });
  }

  resetForAnotherOrder(): void {
    this.createdOrder.set(null);
    this.currentItems.set([]);
    this.addItemForm.reset({ itemId: 0, quantity: 1 });
    this.createOrderForm.controls.reservationId.setValue(0);
  }

  finish(): void {
    this.router.navigate(['/orders']);
  }

  private loadCurrentOrderState(): void {
    const order = this.createdOrder();
    if (!order?.orderId) return;

    this.orderService
      .getOrderById(order.orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (freshOrder) => this.createdOrder.set(freshOrder),
        error: () => {
          this.snackBar.open('Failed to refresh order total.', 'Close', { duration: 10000 });
        },
      });

    this.orderItemService
      .getAllOrderItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.currentItems.set(
            items.filter((item) => item.restaurantOrder?.orderId === order.orderId),
          );
        },
        error: () => {
          this.snackBar.open('Failed to refresh order items.', 'Close', { duration: 10000 });
        },
      });
  }
}

