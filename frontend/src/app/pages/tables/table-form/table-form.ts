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
import { TableStatus, RestaurantTable } from '../../../models/restaurant-table';
import { Waiter } from '../../../models/waiter';
import { RestaurantTableService } from '../../../services/restaurant-table.service';
import { WaiterService } from '../../../services/waiter.service';

const TABLE_STATUSES: TableStatus[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED'];

@Component({
  selector: 'app-table-form',
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
  templateUrl: './table-form.html',
  styleUrl: './table-form.css',
})
export class TableFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tableService = inject(RestaurantTableService);
  private readonly waiterService = inject(WaiterService);
  private readonly snackBar = inject(MatSnackBar);

  readonly tableId = this.route.snapshot.paramMap.get('id');
  readonly statuses = TABLE_STATUSES;
  waiters: Waiter[] = [];

  readonly form = this.fb.nonNullable.group({
    tableNumber: [1, [Validators.required, Validators.min(1)]],
    capacity: [1, [Validators.required, Validators.min(1)]],
    status: ['AVAILABLE' as TableStatus, Validators.required],
    waiterId: [null as number | null],
  });

  get isEditMode(): boolean {
    return this.tableId !== null;
  }

  constructor() {
    this.loadWaiters();
    if (this.isEditMode) this.loadTable();
  }

  loadWaiters(): void {
    this.waiterService
      .getAllWaiters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (w) => (this.waiters = w) });
  }

  loadTable(): void {
    this.tableService
      .getTableById(Number(this.tableId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) =>
          this.form.patchValue({
            tableNumber: t.tableNumber,
            capacity: t.capacity,
            status: t.status,
            waiterId: t.waiter?.waiterId ?? null,
          }),
        error: () => {
          this.snackBar.open('Failed to load table', 'Close', { duration: 3000 });
          this.router.navigate(['/tables']);
        },
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { tableNumber, capacity, status, waiterId } = this.form.getRawValue();
    const payload: RestaurantTable = {
      tableNumber,
      capacity,
      status,
      waiter: waiterId ? { waiterId } : undefined,
    };

    const request$ = this.isEditMode
      ? this.tableService.updateTable(Number(this.tableId), payload)
      : this.tableService.createTable(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(`Table ${this.isEditMode ? 'updated' : 'created'}`, 'Close', {
          duration: 2500,
        });
        this.router.navigate(['/tables']);
      },
      error: () =>
        this.snackBar.open(`Failed to ${this.isEditMode ? 'update' : 'create'} table`, 'Close', {
          duration: 3000,
        }),
    });
  }

  cancel(): void {
    this.router.navigate(['/tables']);
  }
}
