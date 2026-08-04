import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Manager } from '../../../models/manager';
import { Waiter } from '../../../models/waiter';
import { WaiterService } from '../../../services/waiter.service';
import { ManagerService } from '../../../services/manager.service';

@Component({
  selector: 'app-waiter-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './waiter-form.html',
  styleUrl: './waiter-form.css',
})
export class WaiterFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly waiterService = inject(WaiterService);
  private readonly managerService = inject(ManagerService);
  private readonly snackBar = inject(MatSnackBar);

  readonly waiterId = this.route.snapshot.paramMap.get('id');
  managers: Manager[] = [];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    managerId: [0 as number, [Validators.required, Validators.min(1)]],
    password: [''],
  });

  get isEditMode(): boolean {
    return this.waiterId !== null;
  }

  constructor() {
    this.loadManagers();
    if (this.isEditMode) {
      this.loadWaiter();
    } else {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(4)]);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  loadManagers(): void {
    this.managerService
      .getAllManagers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (managers) => (this.managers = managers) });
  }

  loadWaiter(): void {
    this.waiterService
      .getWaiterById(Number(this.waiterId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (w) =>
          this.form.patchValue({
            name: w.name,
            phone: w.phone,
            email: w.email,
            managerId: w.manager?.managerId ?? 0,
          }),
        error: () => {
          this.snackBar.open('Failed to load waiter', 'Close', { duration: 10000 });
          this.router.navigate(['/waiters']);
        },
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, phone, email, managerId, password } = this.form.getRawValue();
    const payload: Waiter = { name, phone, email, manager: { managerId } };
    if (!this.isEditMode) {
      payload.password = password;
    }

    const request$ = this.isEditMode
      ? this.waiterService.updateWaiter(Number(this.waiterId), payload)
      : this.waiterService.createWaiter(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(
          `Waiter ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 10000 },
        );
        this.router.navigate(['/waiters']);
      },
      error: () =>
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} waiter`,
          'Close',
          { duration: 10000 },
        ),
    });
  }

  cancel(): void {
    this.router.navigate(['/waiters']);
  }
}