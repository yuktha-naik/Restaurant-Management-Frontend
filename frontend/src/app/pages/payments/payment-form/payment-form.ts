import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Payment } from '../../../models/payment';
import { RestaurantOrder } from '../../../models/restaurant-order';
import { PaymentService } from '../../../services/payment.service';
import { RestaurantOrderService } from '../../../services/restaurant-order.service';

@Component({
  selector: 'app-payment-form',
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
    MatSnackBarModule,
  ],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css',
})
export class PaymentFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly orderService = inject(RestaurantOrderService);
  private readonly snackBar = inject(MatSnackBar);

  readonly paymentId = this.route.snapshot.paramMap.get('id');
  orders: RestaurantOrder[] = [];

  readonly form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['', [Validators.required]],
    orderId: [0, [Validators.required, Validators.min(1)]],
  });

  get isEditMode(): boolean {
    return this.paymentId !== null;
  }

  constructor() {
    this.loadOrders();
    if (this.isEditMode) {
      this.loadPayment();
    }
  }

  loadOrders(): void {
    this.orderService
      .getAllOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => (this.orders = orders),
        error: () => this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 }),
      });
  }

  loadPayment(): void {
    this.paymentService
      .getPaymentById(Number(this.paymentId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) =>
          this.form.patchValue({
            amount: payment.amount,
            paymentMethod: payment.paymentMethod ?? '',
            orderId: payment.restaurantOrder.orderId,
          }),
        error: () => {
          this.snackBar.open('Failed to load payment', 'Close', { duration: 3000 });
          this.router.navigate(['/payments']);
        },
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload: Payment = {
      amount: this.form.controls.amount.value,
      paymentMethod: this.form.controls.paymentMethod.value,
      status: 'PENDING',
      restaurantOrder: { orderId: this.form.controls.orderId.value },
    };

    const request$ = this.isEditMode
      ? this.paymentService.updatePayment(Number(this.paymentId), payload)
      : this.paymentService.createPayment(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(`Payment ${this.isEditMode ? 'updated' : 'recorded'} successfully`, 'Close', {
          duration: 2500,
        });
        this.router.navigate(['/payments']);
      },
      error: () =>
        this.snackBar.open(`Failed to ${this.isEditMode ? 'update' : 'record'} payment`, 'Close', {
          duration: 3000,
        }),
    });
  }

  cancel(): void {
    this.router.navigate(['/payments']);
  }
}