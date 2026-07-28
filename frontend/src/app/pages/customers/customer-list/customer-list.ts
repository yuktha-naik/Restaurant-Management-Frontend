import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Customer } from '../../../models/customer';
import { CustomerService } from '../../../services/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerListComponent {
  displayedColumns: string[] = ['customerId', 'name', 'email', 'phone'];
  customers: Customer[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
  ) {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService
      .getAllCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load customers', 'Close', { duration: 3000 });
        },
      });
  }

}
