import { Customer } from './customer';
import { RestaurantTable } from './restaurant-table';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

/**
 * On create we only send `{ customerId }` (§6). GET responses may echo more
 * customer fields, so the extra ones are optional.
 */
export type ReservationCustomer = { customerId: number } & Partial<Customer>;

export interface Reservation {
  reservationId?: number;
  reservationDate: string;
  partySize: number;
  // `status` and `restaurantTable` are assigned by the backend's auto-allocation
  // logic — never sent on create (§8). Present only on GET responses.
  status?: ReservationStatus;
  customer: ReservationCustomer;
  restaurantTable?: Partial<RestaurantTable>;
}