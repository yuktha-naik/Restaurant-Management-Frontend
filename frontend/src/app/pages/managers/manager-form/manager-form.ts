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
import { Manager } from '../../../models/manager';
import { ManagerService } from '../../../services/manager.service';

@Component({
  selector: 'app-manager-form',
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
  templateUrl: './manager-form.html',
  styleUrl: './manager-form.css',
})
export class ManagerFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly managerService = inject(ManagerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly managerId = this.route.snapshot.paramMap.get('id');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: [''],
  });

  get isEditMode(): boolean {
    return this.managerId !== null;
  }

  constructor() {
    if (this.isEditMode) {
      this.loadManager();
    } else {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(4)]);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  loadManager(): void {
    const id = Number(this.managerId);
    this.managerService
      .getManagerById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (manager) =>
          this.form.patchValue({
            name: manager.name,
            email: manager.email,
            phone: manager.phone,
          }),
        error: () => {
          this.snackBar.open('Failed to load manager details', 'Close', { duration: 3000 });
          this.router.navigate(['/managers']);
        },
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, phone, password } = this.form.getRawValue();
    const payload: Manager = { name, email, phone };
    if (!this.isEditMode) {
      payload.password = password;
    }

    if (this.isEditMode) {
      this.managerService
        .updateManager(Number(this.managerId), payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open('Manager updated successfully', 'Close', { duration: 2500 });
            this.router.navigate(['/managers']);
          },
          error: () => {
            this.snackBar.open('Failed to update manager', 'Close', { duration: 3000 });
          },
        });
      return;
    }

    this.managerService
      .createManager(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Manager created successfully', 'Close', { duration: 2500 });
          this.router.navigate(['/managers']);
        },
        error: () => {
          this.snackBar.open('Failed to create manager', 'Close', { duration: 3000 });
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/managers']);
  }
}