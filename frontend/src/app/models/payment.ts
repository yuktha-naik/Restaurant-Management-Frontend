export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Payment {
  paymentId?: number;
  amount?: number;
  paymentTime?: string;
  status?: PaymentStatus;
  paymentMethod?: string;
}
