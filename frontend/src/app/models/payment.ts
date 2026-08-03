export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface PaymentOrderRef {
  orderId: number;
  reservation?: {
    reservationId?: number;
    customer?: { customerId?: number; name?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Payment {
  paymentId?: number;
  amount: number;
  paymentTime?: string;
  status: PaymentStatus;
  paymentMethod?: string | null;
  restaurantOrder: PaymentOrderRef;
}
