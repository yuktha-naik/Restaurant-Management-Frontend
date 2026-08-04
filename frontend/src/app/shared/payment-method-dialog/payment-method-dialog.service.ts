import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import {
  PaymentMethod,
  PaymentMethodDialogComponent,
  PaymentMethodDialogData,
  PaymentMethodDialogResult,
} from './payment-method-dialog';

/**
 * Opens a single Material dialog with a mode-of-payment dropdown
 * (CASH/CARD/UPI). Replaces the old confirm() + prompt() two-step flow.
 * Resolves to the selected `PaymentMethod`, or `undefined` if cancelled.
 */
@Injectable({ providedIn: 'root' })
export class PaymentMethodDialogService {
  constructor(private readonly dialog: MatDialog) {}

  choosePaymentMethod(
    options?: PaymentMethodDialogData,
  ): Observable<PaymentMethod | undefined> {
    const ref = this.dialog.open<
      PaymentMethodDialogComponent,
      PaymentMethodDialogData,
      PaymentMethodDialogResult | undefined
    >(PaymentMethodDialogComponent, {
      data: { ...options },
      width: '380px',
      autoFocus: false,
    });

    return ref.afterClosed().pipe(map((result) => result?.paymentMethod));
  }
}
