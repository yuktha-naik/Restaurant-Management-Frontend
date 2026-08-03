import { MenuItem } from './menu-item';

export interface OrderItem {
  orderItemId?: number;
  quantity: number;
  subTotal?: number;
  restaurantOrder?: { orderId: number };
  menuItem: Pick<MenuItem, 'itemId'>;
}
