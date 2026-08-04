import {
  Component,
  DestroyRef,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-waiter-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './waiter-list.html',
  styleUrl: './waiter-list.css',
})
export class WaiterListComponent implements OnInit {
  displayedColumns = ['waiterId', 'name', 'email', 'phone', 'actions'];

  waiters: Waiter[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private waiterService: WaiterService,
    private authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
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
          console.log('WAITERS RESPONSE:', waiters);

          this.waiters = [...waiters];
          this.loading = false;

          this.cdr.detectChanges();

          console.log('WAITER COUNT:', this.waiters.length);
        },
        error: (err) => {
          console.error('WAITER ERROR:', err);

          this.loading = false;

          this.snackBar.open(
            'Failed to load waiters',
            'Close',
            { duration: 10000 }
          );
        },
      });
  }

  edit(waiterId: number): void {
    this.router.navigate(['/waiters', waiterId, 'edit']);
  }

  delete(waiterId: number): void {
    this.confirmDialog
      .confirm('Delete this waiter?', { title: 'Delete Waiter', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.waiterService
          .deleteWaiter(waiterId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(
                'Waiter deleted',
                'Close',
                { duration: 10000 }
              );

              this.loadWaiters();
            },
            error: () => {
              this.snackBar.open(
                'Failed to delete waiter',
                'Close',
                { duration: 10000 }
              );
            },
          });
      });
  }
}