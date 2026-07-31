import { MenuItem } from './menu-item';

export interface OrderItem {
  orderItemId?: number;
  quantity: number;
  price: number;
  menuItem: Pick<MenuItem, 'itemId'>;
}
