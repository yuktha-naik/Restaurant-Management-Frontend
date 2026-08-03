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
import { PaymentService } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';

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
    'amount',
    'method',
    'status',
    'time',
    'actions',
  ];

  payments: Payment[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
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
            { duration: 3000 }
          );
        },
      });
  }

  addPayment(): void {
    this.router.navigate(['/payments/new']);
  }

  editPayment(paymentId: number): void {
    this.router.navigate(['/payments', paymentId, 'edit']);
  }

  confirmPayment(paymentId: number): void {
    if (
      !confirm(
        'Confirm this payment? This will mark the payment as PAID and complete the reservation.'
      )
    ) {
      return;
    }

    this.paymentService
      .confirmPayment(paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Payment confirmed',
            'Close',
            { duration: 2500 }
          );

          this.loadPayments();
        },
        error: () => {
          this.snackBar.open(
            'Failed to confirm payment',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }

  deletePayment(paymentId: number): void {
    if (!confirm('Delete this payment?')) {
      return;
    }

    this.paymentService
      .deletePayment(paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Payment deleted',
            'Close',
            { duration: 2500 }
          );

          this.loadPayments();
        },
        error: () => {
          this.snackBar.open(
            'Failed to delete payment',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
}