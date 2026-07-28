import { Customer } from './customer';
import { RestaurantTable } from './restaurant-table';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  reservationId?: number;
  reservationDate: string;
  numberOfGuests: number;
  status?: ReservationStatus;
  customer: Customer;
  restaurantTable: Pick<RestaurantTable, 'tableId'>;
}
