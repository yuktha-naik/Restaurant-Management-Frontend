import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Customer } from '../../../models/customer';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerListComponent implements OnInit{
  customers: Customer[] = [];
  loading = true;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
  private customerService: CustomerService,
  private authService: AuthService,
  private router: Router,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
) {}
ngOnInit(): void {
  this.loadCustomers();
}

  loadCustomers(): void {
  this.loading = true;

  this.customerService.getAllCustomers().subscribe({
    next: (customers) => {
      this.customers = [...customers];
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.loading = false;
    },
  });
}
  get isManager(): boolean {
    return this.authService.isManager();
  }

  addCustomer(): void {
    this.router.navigate(['/customers/new']);
  }

  editCustomer(customerId: number): void {
    this.router.navigate(['/customers', customerId, 'edit']);
  }

  deleteCustomer(customerId: number): void {
    if (!confirm('Delete this customer?')) {
      return;
    }

    this.customerService
      .deleteCustomer(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Customer deleted successfully',
            'Close',
            { duration: 2500 }
          );

          this.loadCustomers();
        },
        error: () => {
          this.snackBar.open(
            'Failed to delete customer',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
}