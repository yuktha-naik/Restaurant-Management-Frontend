import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';

export interface PaymentMethodDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  /** Renders the confirm button in the "warn" (red) palette, e.g. for marking a payment as failed. */
  danger?: boolean;
  defaultMethod?: PaymentMethod;
}

export interface PaymentMethodDialogResult {
  confirmed: true;
  paymentMethod: PaymentMethod;
}

@Component({
  selector: 'app-payment-method-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './payment-method-dialog.html',
  styleUrl: './payment-method-dialog.css',
})
export class PaymentMethodDialogComponent {
  readonly methods: PaymentMethod[] = ['CASH', 'CARD', 'UPI'];
  selectedMethod: PaymentMethod;

  constructor(
    private readonly dialogRef: MatDialogRef<PaymentMethodDialogComponent, PaymentMethodDialogResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public readonly data: PaymentMethodDialogData,
  ) {
    this.selectedMethod = data.defaultMethod ?? 'CASH';
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    this.dialogRef.close({ confirmed: true, paymentMethod: this.selectedMethod });
  }
}
