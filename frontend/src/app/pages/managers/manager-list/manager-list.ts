import { Component, DestroyRef, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Manager } from '../../../models/manager';
import { ManagerService } from '../../../services/manager.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-manager-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './manager-list.html',
  styleUrl: './manager-list.css',
})
export class ManagerListComponent implements OnInit, OnDestroy {

  displayedColumns = ['managerId', 'name', 'email', 'phone', 'actions'];

  managers: Manager[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
  private managerService: ManagerService,
  private authService: AuthService,
  public router: Router,
  private snackBar: MatSnackBar,
  private cdr: ChangeDetectorRef,
  private confirmDialog: ConfirmDialogService,
) {
  console.log('MANAGER LIST CONSTRUCTOR');
}

  ngOnInit(): void {
    console.log('NG ON INIT');
    this.loadManagers();
  }

  ngOnDestroy(): void {
    console.log('NG ON DESTROY');
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  loadManagers(): void {
    console.log('LOAD MANAGERS START');

    this.loading = true;

    this.managerService
      .getAllManagers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (managers) => {
  console.log('MANAGERS RESPONSE:', managers);

  this.managers = managers;
  this.loading = false;

  this.cdr.detectChanges();

  console.log('LOADING VALUE:', this.loading);
  console.log('MANAGERS COUNT:', this.managers.length);
},

        error: (error) => {
          console.error('MANAGER LOAD ERROR:', error);

          this.loading = false;

          this.snackBar.open(
            'Failed to load managers',
            'Close',
            {
              duration: 10000,
            }
          );
        },
      });
  }

  edit(managerId: number): void {
    this.router.navigate(['/managers', managerId, 'edit']);
  }

  delete(managerId: number): void {
    this.confirmDialog
      .confirm('Delete this manager?', { title: 'Delete Manager', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.managerService
          .deleteManager(managerId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(
                'Manager deleted',
                'Close',
                {
                  duration: 10000,
                }
              );

              this.loadManagers();
            },

            error: () => {
              this.snackBar.open(
                'Failed to delete manager',
                'Close',
                {
                  duration: 10000,
                }
              );
            },
          });
      });
  }
}