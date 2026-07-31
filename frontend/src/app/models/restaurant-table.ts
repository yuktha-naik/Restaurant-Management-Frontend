export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';

export interface RestaurantTable {
  tableId?: number;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  waiter?: { waiterId: number };
}
