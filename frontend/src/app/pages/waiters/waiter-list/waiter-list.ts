import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Waiter } from '../../../models/waiter';
import { WaiterService } from '../../../services/waiter.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-waiter-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './waiter-list.html',
  styleUrl: './waiter-list.css',
})
export class WaiterListComponent {
  displayedColumns = ['waiterId', 'name', 'email', 'phone', 'actions'];
  waiters: Waiter[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private waiterService: WaiterService,
    private authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loadWaiters();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  loadWaiters(): void {
    this.loading = true;
    this.waiterService
      .getAllWaiters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (waiters) => {
          this.waiters = waiters;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load waiters', 'Close', { duration: 3000 });
        },
      });
  }

  edit(waiterId: number): void {
    this.router.navigate(['/waiters', waiterId, 'edit']);
  }

  delete(waiterId: number): void {
    if (!confirm('Delete this waiter?')) return;
    this.waiterService
      .deleteWaiter(waiterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Waiter deleted', 'Close', { duration: 2500 });
          this.loadWaiters();
        },
        error: () => this.snackBar.open('Failed to delete waiter', 'Close', { duration: 3000 }),
      });
  }
}
