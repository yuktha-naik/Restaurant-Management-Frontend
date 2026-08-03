import { OrderItem } from './order-item';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface RestaurantOrder {
  orderId?: number;
  orderTime?: string;
  status?: OrderStatus;
  totalAmount?: number;
  reservation: { reservationId: number; [key: string]: unknown };
  waiter: { waiterId: number; name?: string; [key: string]: unknown };
  orderItems?: OrderItem[];
}
