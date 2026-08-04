import { OrderItem } from './order-item';

export type OrderStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface OrderReservationRef {
  reservationId: number;
  customer?: { customerId?: number; name?: string; [key: string]: unknown };
  restaurantTable?: { tableId?: number; tableNumber?: number; [key: string]: unknown };
  [key: string]: unknown;
}

export interface RestaurantOrder {
  orderId?: number;
  orderTime?: string;
  status?: OrderStatus;
  totalAmount?: number;
  reservation: OrderReservationRef;
  waiter: { waiterId: number; name?: string; [key: string]: unknown };
  orderItems?: OrderItem[];
}
