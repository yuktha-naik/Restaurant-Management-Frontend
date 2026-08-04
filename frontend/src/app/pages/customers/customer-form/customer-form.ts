import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
})
export class CustomerFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly customerId = this.route.snapshot.paramMap.get('id');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.required]],
    city: [''],
  });

  get isEditMode(): boolean {
    return this.customerId !== null;
  }

  constructor() {
    if (this.isEditMode) {
      this.loadCustomer();
    }
  }

  loadCustomer(): void {
    const id = Number(this.customerId);
    this.customerService
      .getCustomerById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (customer) =>
          this.form.patchValue({
            name: customer.name,
            email: customer.email ?? '',
            phone: customer.phone,
            city: customer.city ?? '',
          }),
        error: () => {
          this.snackBar.open('Failed to load customer details', 'Close', { duration: 10000 });
          this.router.navigate(['/customers']);
        },
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, phone, city } = this.form.getRawValue();
    const payload: Customer = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() ? email.trim() : null,
      city: city.trim() ? city.trim() : undefined,
    };

    if (this.isEditMode) {
      this.customerService
        .updateCustomer(Number(this.customerId), payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Customer updated successfully', 'Close', { duration: 10000 });
            this.router.navigate(['/customers']);
          },
          error: () => {
            this.snackBar.open('Failed to update customer', 'Close', { duration: 10000 });
          },
        });
      return;
    }

    this.customerService
      .createCustomer(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Customer created successfully', 'Close', { duration: 10000 });
          this.router.navigate(['/customers']);
        },
        error: () => {
          this.snackBar.open('Failed to create customer', 'Close', { duration: 10000 });
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/customers']);
  }
}