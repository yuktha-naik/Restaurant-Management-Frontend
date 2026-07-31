import { Customer } from './customer';
import { RestaurantTable } from './restaurant-table';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  reservationId?: number;
  reservationDate: string;
  partySize: number;
  status?: ReservationStatus;
  customer: Customer;
  restaurantTable: Pick<RestaurantTable, 'tableId'>;
}