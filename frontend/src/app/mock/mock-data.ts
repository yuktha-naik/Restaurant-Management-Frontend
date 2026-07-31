import { Customer } from '../models/customer';
import { Manager } from '../models/manager';
import { Waiter } from '../models/waiter';
import { MenuItem } from '../models/menu-item';
import { RestaurantTable } from '../models/restaurant-table';
import { Reservation } from '../models/reservation';
import { RestaurantOrder } from '../models/restaurant-order';

// ─── Managers ────────────────────────────────────────────────────────────────
export const managers: Manager[] = [
  { managerId: 1, name: 'Alice Johnson', phone: '0711000001', email: 'alice@rms.com' },
  { managerId: 2, name: 'Bob Smith',     phone: '0711000002', email: 'bob@rms.com' },
];

// ─── Waiters ──────────────────────────────────────────────────────────────────
export const waiters: Waiter[] = [
  { waiterId: 1, name: 'Carlos Diaz',   phone: '0722000001', email: 'carlos@rms.com', manager: { managerId: 1 } },
  { waiterId: 2, name: 'Diana Prince',  phone: '0722000002', email: 'diana@rms.com',  manager: { managerId: 1 } },
  { waiterId: 3, name: 'Ethan Hunt',    phone: '0722000003', email: 'ethan@rms.com',  manager: { managerId: 2 } },
];

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers: Customer[] = [
  { customerId: 1, name: 'Frank Castle',  email: 'frank@mail.com',  phone: '0733000001' },
  { customerId: 2, name: 'Grace Hopper',  email: 'grace@mail.com',  phone: '0733000002' },
  { customerId: 3, name: 'Henry Ford',    email: 'henry@mail.com',  phone: '0733000003' },
];

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tables: RestaurantTable[] = [
  { tableId: 1, tableNumber: 1, capacity: 2, status: 'AVAILABLE', waiter: { waiterId: 1 } },
  { tableId: 2, tableNumber: 2, capacity: 4, status: 'AVAILABLE', waiter: { waiterId: 1 } },
  { tableId: 3, tableNumber: 3, capacity: 4, status: 'RESERVED',  waiter: { waiterId: 2 } },
  { tableId: 4, tableNumber: 4, capacity: 6, status: 'OCCUPIED',  waiter: { waiterId: 2 } },
  { tableId: 5, tableNumber: 5, capacity: 8, status: 'AVAILABLE', waiter: { waiterId: 3 } },
];

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems: MenuItem[] = [
  { itemId: 1, name: 'Spring Rolls',      category: 'STARTER',     price: 8.50,  available: true,  manager: { managerId: 1 } },
  { itemId: 2, name: 'Caesar Salad',      category: 'STARTER',     price: 9.00,  available: true,  manager: { managerId: 1 } },
  { itemId: 3, name: 'Grilled Chicken',   category: 'MAIN_COURSE', price: 18.00, available: true,  manager: { managerId: 1 } },
  { itemId: 4, name: 'Beef Steak',        category: 'MAIN_COURSE', price: 28.00, available: true,  manager: { managerId: 2 } },
  { itemId: 5, name: 'Pasta Carbonara',   category: 'MAIN_COURSE', price: 15.50, available: true,  manager: { managerId: 2 } },
  { itemId: 6, name: 'Chocolate Lava Cake', category: 'DESSERT',   price: 7.00,  available: true,  manager: { managerId: 1 } },
  { itemId: 7, name: 'Ice Cream Sundae',  category: 'DESSERT',     price: 5.50,  available: false, manager: { managerId: 1 } },
  { itemId: 8, name: 'Fresh Orange Juice', category: 'BEVERAGE',   price: 4.00,  available: true,  manager: { managerId: 2 } },
  { itemId: 9, name: 'Sparkling Water',   category: 'BEVERAGE',    price: 2.50,  available: true,  manager: { managerId: 2 } },
];

// ─── Reservations ─────────────────────────────────────────────────────────────
export const reservations: Reservation[] = [
  {
    reservationId: 1,
    reservationDate: '2026-07-30T12:00:00',
    partySize: 2,
    status: 'CONFIRMED',
    customer: customers[0],
    restaurantTable: { tableId: 3 },
  },
  {
    reservationId: 2,
    reservationDate: '2026-07-30T13:30:00',
    partySize: 4,
    status: 'CONFIRMED',
    customer: customers[1],
    restaurantTable: { tableId: 4 },
  },
];

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders: RestaurantOrder[] = [
  {
    orderId: 1,
    orderTime: '2026-07-30T12:15:00',
    status: 'CONFIRMED',
    totalAmount: 37.00,
    reservation: { reservationId: 1 },
    waiter: { waiterId: 1 },
    orderItems: [
      { orderItemId: 1, quantity: 2, price: 8.50,  menuItem: { itemId: 1 } },
      { orderItemId: 2, quantity: 1, price: 18.00, menuItem: { itemId: 3 } },
      { orderItemId: 3, quantity: 1, price: 4.00,  menuItem: { itemId: 8 } },
    ],
  },
];
