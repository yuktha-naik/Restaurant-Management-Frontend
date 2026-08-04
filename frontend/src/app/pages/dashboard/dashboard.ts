import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { WaiterService } from '../../services/waiter.service';
import { RestaurantTableService } from '../../services/restaurant-table.service';
import { MenuItemService } from '../../services/menu-item.service';
import { ReservationService } from '../../services/reservation.service';
import { RestaurantOrderService } from '../../services/restaurant-order.service';
import { PaymentService } from '../../services/payment.service';

interface StatCard {
  icon: string;
  label: string;
  count: number;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly backendOffline = signal(false);
  readonly stats = signal<StatCard[]>([]);

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private waiterService: WaiterService,
    private tableService: RestaurantTableService,
    private menuService: MenuItemService,
    private reservationService: ReservationService,
    private orderService: RestaurantOrderService,
    private paymentService: PaymentService,
  ) {
    if (!this.authService.isCustomer()) {
      this.loadStats();
    }
  }

  get userName(): string {
    return this.authService.getIdentityLabel() ?? 'User';
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  get isWaiter(): boolean {
    return this.authService.isWaiter();
  }

  loadStats(): void {
  this.loading.set(true);
  this.backendOffline.set(false);

  const isStaff = this.isManager || this.isWaiter;

  forkJoin({
    customers: this.isManager
      ? this.customerService
          .getAllCustomers()
          .pipe(catchError(() => of([])))
      : of([]),

    waiters: isStaff
      ? this.waiterService
          .getAllWaiters()
          .pipe(catchError(() => of([])))
      : of([]),

    tables: this.tableService
      .getAllTables()
      .pipe(catchError(() => of([]))),

    menu: this.menuService
      .getAllMenuItems()
      .pipe(catchError(() => of([]))),

    reservations: isStaff
      ? this.reservationService
          .getAllReservations()
          .pipe(catchError(() => of([])))
      : of([]),

    orders: this.orderService
      .getAllOrders()
      .pipe(catchError(() => of([]))),

    payments: this.paymentService
      .getAllPayments()
      .pipe(catchError(() => of([]))),
  })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.loading.set(false);
        this.backendOffline.set(false);

        const cards: StatCard[] = [];

        // `GET /customers` is MANAGER-only server-side — don't show a
        // misleading "0" card for waiters who aren't allowed to see it.
        if (this.isManager) {
          cards.push({
            icon: 'people',
            label: 'Customers',
            count: data.customers.length,
            route: '/customers',
            color: '#3f51b5',
          });
        }

        cards.push(
          {
            icon: 'room_service',
            label: 'Waiters',
            count: data.waiters.length,
            route: '/waiters',
            color: '#e91e63',
          },
          {
            icon: 'table_restaurant',
            label: 'Tables',
            count: data.tables.length,
            route: '/tables',
            color: '#009688',
          },
          {
            icon: 'menu_book',
            label: 'Menu Items',
            count: data.menu.length,
            route: '/menu',
            color: '#ff5722',
          },
          {
            icon: 'event_seat',
            label: 'Reservations',
            count: data.reservations.length,
            route: '/reservations',
            color: '#9c27b0',
          },
          {
            icon: 'receipt_long',
            label: 'Orders',
            count: data.orders.length,
            route: '/orders',
            color: '#ff9800',
          },
          {
            icon: 'payments',
            label: 'Payments',
            count: data.payments.length,
            route: '/payments',
            color: '#4caf50',
          },
        );

        this.stats.set(cards);
      },
      error: () => {
        this.loading.set(false);
        this.backendOffline.set(true);
      },
    });
}
foodFacts: string[] = [
  "People who eat together are happier together. 🍽️",
  "Did you know? Honey never spoils—even after thousands of years!",
  "Good food is the foundation of genuine happiness.",
  "Every meal is a chance to make a beautiful memory.",
  "Fresh ingredients make every dish taste better.",
  "Pizza was once considered food for the poor in Italy.",
  "Dark chocolate contains antioxidants that are good for your heart.",
  "The world's most expensive spice is saffron.",
  "A balanced diet is a cookie in each hand... just kidding! 😄",
  "Great food starts with fresh ingredients and good company.",
  "There are over 10,000 varieties of tomatoes worldwide.",
  "Your next favorite dish might be something you've never tried before.",
  "Eating slowly helps you enjoy food more and may improve digestion.",
  "Coffee is one of the most traded commodities in the world.",
  "Life is uncertain. Eat dessert first. 🍰"
];

randomFoodFact = '';

ngOnInit(): void {

  this.randomFoodFact =
    this.foodFacts[Math.floor(Math.random() * this.foodFacts.length)];

}
}
