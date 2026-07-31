import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { Reservation } from '../../../models/reservation';
import { Waiter } from '../../../models/waiter';
import { MenuItem } from '../../../models/menu-item';
import { RestaurantOrder } from '../../../models/restaurant-order';
import { ReservationService } from '../../../services/reservation.service';
import { WaiterService } from '../../../services/waiter.service';
import { MenuItemService } from '../../../services/menu-item.service';
import { RestaurantOrderService } from '../../../services/restaurant-order.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
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
  private readonly reservationService = inject(ReservationService);
  private readonly waiterService = inject(WaiterService);
  private readonly menuService = inject(MenuItemService);
  private readonly orderService = inject(RestaurantOrderService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  reservations: Reservation[] = [];
  waiters: Waiter[] = [];
  menuItems: MenuItem[] = [];
  readonly submitting = signal(false);

  get totalAmount(): number {
    return this.orderItemsArray.controls.reduce((sum, ctrl) => {
      const qty: number = ctrl.get('quantity')?.value ?? 0;
      const price: number = ctrl.get('price')?.value ?? 0;
      return sum + qty * price;
    }, 0);
  }

  readonly form = this.fb.nonNullable.group({
    reservationId: [0 as number, [Validators.required, Validators.min(1)]],
    waiterId: [0 as number, [Validators.required, Validators.min(1)]],
    orderItems: this.fb.array([this.buildItemRow()]),
  });

  get orderItemsArray(): FormArray {
    return this.form.controls.orderItems as FormArray;
  }

  constructor() {
    this.loadDropdowns();
  }

  private buildItemRow() {
    return this.fb.nonNullable.group({
      itemId: [0 as number, [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  loadDropdowns(): void {
    this.reservationService
      .getAllReservations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => (this.reservations = r) });

    this.waiterService
      .getAllWaiters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (w) => (this.waiters = w) });

    this.menuService
      .getAllMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (m) => (this.menuItems = m.filter((i) => i.available)) });
  }

  onMenuItemSelected(rowIndex: number): void {
    const row = this.orderItemsArray.at(rowIndex);
    const itemId: number = row.get('itemId')?.value ?? 0;
    const menuItem = this.menuItems.find((i) => i.itemId === itemId);
    if (menuItem) {
      row.patchValue({ price: menuItem.price });
    }
  }

  addItem(): void {
    this.orderItemsArray.push(this.buildItemRow());
  }

  removeItem(index: number): void {
    if (this.orderItemsArray.length > 1) {
      this.orderItemsArray.removeAt(index);
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);

    const { reservationId, waiterId, orderItems } = this.form.getRawValue();

    const payload: RestaurantOrder = {
      reservation: { reservationId },
      waiter: { waiterId },
      totalAmount: this.totalAmount,
      orderItems: orderItems.map((row) => ({
        quantity: row.quantity,
        price: row.price,
        menuItem: { itemId: row.itemId },
      })),
    };

    this.orderService
      .createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open('Order created successfully', 'Close', { duration: 2500 });
          this.router.navigate(['/orders']);
        },
        error: () => {
          this.submitting.set(false);
          this.snackBar.open('Failed to create order', 'Close', { duration: 3000 });
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/orders']);
  }
}
