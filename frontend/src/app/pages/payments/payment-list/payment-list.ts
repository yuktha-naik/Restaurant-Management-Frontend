import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
} from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Payment } from '../../../models/payment';
import { Reservation } from '../../../models/reservation';
import { RestaurantOrder } from '../../../models/restaurant-order';
import { PaymentService } from '../../../services/payment.service';
import { ReservationService } from '../../../services/reservation.service';
import { RestaurantOrderService } from '../../../services/restaurant-order.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { PaymentMethodDialogService } from '../../../shared/payment-method-dialog/payment-method-dialog.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.css',
})
export class PaymentListComponent implements OnInit {
  displayedColumns = [
    'paymentId',
    'orderId',
    'customer',
    'amount',
    'method',
    'status',
    'time',
    'actions',
  ];

  payments: Payment[] = [];
  orders: RestaurantOrder[] = [];
  reservations: Reservation[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private paymentService: PaymentService,
    private orderService: RestaurantOrderService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
    private paymentMethodDialog: PaymentMethodDialogService,
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  get isManagerOrWaiter(): boolean {
    return this.authService.isManager() || this.authService.isWaiter();
  }

  loadPayments(): void {
    this.loading = true;

    this.paymentService
      .getAllPayments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payments) => {
          this.payments = [...payments];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.snackBar.open(
            'Failed to load payments',
            'Close',
            { duration: 10000 }
          );
        },
      });

    this.orderService
      .getAllOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
        },
        error: () => {
          this.snackBar.open('Failed to load order details', 'Close', { duration: 10000 });
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

  customerLabel(payment: Payment): string {
    const nestedCustomer = payment.restaurantOrder?.reservation?.customer;
    if (nestedCustomer?.name?.trim()) return nestedCustomer.name;
    if (nestedCustomer?.customerId != null) return `Customer #${nestedCustomer.customerId}`;

    const order = this.orders.find((o) => o.orderId === payment.restaurantOrder?.orderId);
    const orderCustomer = order?.reservation?.customer;
    if (orderCustomer?.name?.trim()) return orderCustomer.name;
    if (orderCustomer?.customerId != null) return `Customer #${orderCustomer.customerId}`;

    const reservationId = order?.reservation?.reservationId;
    const reservation = this.reservations.find((r) => r.reservationId === reservationId);
    if (reservation?.customer?.name?.trim()) return reservation.customer.name;
    if (reservation?.customer?.customerId != null) return `Customer #${reservation.customer.customerId}`;

    return 'Unknown customer';
  }

  addPayment(): void {
    this.router.navigate(['/payments/new']);
  }

  editPayment(paymentId: number): void {
    this.router.navigate(['/payments', paymentId, 'edit']);
  }

  finalizePayment(payment: Payment, status: 'PAID' | 'FAILED'): void {
    if (!payment.paymentId) {
      return;
    }

    const title = status === 'PAID' ? 'Confirm Payment' : 'Mark Payment as Failed';
    const message =
      status === 'PAID'
        ? 'Select the mode of payment used by the customer, then confirm.'
        : 'Select the mode of payment attempted, then confirm to mark this payment as failed.';

    const knownMethods = ['CASH', 'CARD', 'UPI'] as const;
    const normalizedMethod = payment.paymentMethod?.trim().toUpperCase();
    const defaultMethod = (knownMethods as readonly string[]).includes(normalizedMethod ?? '')
      ? (normalizedMethod as 'CASH' | 'CARD' | 'UPI')
      : 'CASH';

    this.paymentMethodDialog
      .choosePaymentMethod({
        title,
        message,
        danger: status === 'FAILED',
        confirmText: status === 'PAID' ? 'Confirm Payment' : 'Mark Failed',
        defaultMethod,
      })
      .subscribe((paymentMethod) => {
        if (!paymentMethod) return;

        const payload: Payment = {
          paymentId: payment.paymentId,
          amount: payment.amount,
          paymentMethod,
          status,
          restaurantOrder: { orderId: payment.restaurantOrder.orderId },
        };

        this.paymentService
          .updatePayment(payment.paymentId!, payload)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(
                `Payment updated to ${status}`,
                'Close',
                { duration: 10000 }
              );

              this.loadPayments();
            },
            error: (error) => {
              const message = error?.error?.message ?? `Failed to update payment as ${status}`;
              this.snackBar.open(
                message,
                'Close',
                { duration: 10000 }
              );
            },
          });
      });
  }

  deletePayment(paymentId: number): void {
    this.confirmDialog
      .confirm('Delete this payment?', { title: 'Delete Payment', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.paymentService
          .deletePayment(paymentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(
                'Payment deleted',
                'Close',
                { duration: 10000 }
              );

              this.loadPayments();
            },
            error: () => {
              this.snackBar.open(
                'Failed to delete payment',
                'Close',
                { duration: 10000 }
              );
            },
          });
      });
  }
}