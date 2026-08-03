import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RestaurantTable } from '../../../models/restaurant-table';
import { RestaurantTableService } from '../../../services/restaurant-table.service';
import { AuthService } from '../../../services/auth.service';

import { CommonModule } from '@angular/common';

import {
  
  ChangeDetectorRef,
 
} from '@angular/core';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    CommonModule,  MatTableModule, MatButtonModule , MatIconModule, MatCardModule, MatChipsModule, MatSnackBarModule,
  ],
  templateUrl: './table-list.html',
  styleUrl: './table-list.css',
})
export class TableListComponent {
  displayedColumns = ['tableId', 'tableNumber', 'capacity', 'status', 'actions'];
  tables: RestaurantTable[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

 constructor(
  private tableService: RestaurantTableService,
  private authService: AuthService,
  public router: Router,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
) {
  this.loadTables();
}

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get isWaiter(): boolean {
    return this.authService.isWaiter();
  }

 loadTables(): void {
  this.loading = true;

  this.tableService
    .getAllTables()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (tables) => {
        this.tables = [...tables];
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('TABLE LOAD ERROR:', error);

        this.loading = false;

        this.snackBar.open(
          'Failed to load tables',
          'Close',
          { duration: 3000 }
        );
      },
    });
}

  edit(tableId: number): void {
    if (!this.isManager) return;
    this.router.navigate(['/tables', tableId, 'edit']);
  }

  release(tableId: number): void {
    if (
      !confirm(
        'Mark this table as cleaned and available? This will automatically seat the next best-fit waiting reservation, if any.',
      )
    ) {
      return;
    }
    this.tableService
      .releaseTable(tableId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Table released and available for reallocation', 'Close', {
            duration: 3000,
          });
          this.loadTables();
        },
        error: () => this.snackBar.open('Failed to release table', 'Close', { duration: 3000 }),
      });
  }

  delete(tableId: number): void {
    if (!confirm('Delete this table?')) return;
    this.tableService
      .deleteTable(tableId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Table deleted', 'Close', { duration: 2500 });
          this.loadTables();
        },
        error: () => this.snackBar.open('Failed to delete table', 'Close', { duration: 3000 }),
      });
  }

  statusColor(status: string): string {
    if (status === 'AVAILABLE') return 'primary';
    if (status === 'OCCUPIED') return 'warn';
    return 'accent';
  }
}