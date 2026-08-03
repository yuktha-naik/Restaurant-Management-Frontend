import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { MenuItem } from '../../../models/menu-item';
import { MenuItemService } from '../../../services/menu-item.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [
  CommonModule,
  MatTableModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatChipsModule,
  MatSnackBarModule,
  CurrencyPipe,
],
  templateUrl: './menu-list.html',
  styleUrl: './menu-list.css',
})
export class MenuListComponent implements OnInit {
  displayedColumns = [
    'itemId',
    'name',
    'category',
    'price',
    'available',
    'actions',
  ];

  items: MenuItem[] = [];
  loading = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private menuService: MenuItemService,
    private authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  loadItems(): void {
    this.loading = true;

    this.menuService
      .getAllMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items = [...items];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load menu items', 'Close', { duration: 3000 });
        },
      });
  }

  edit(itemId: number): void {
    this.router.navigate(['/menu', itemId, 'edit']);
  }

  delete(itemId: number): void {
    if (!confirm('Delete this menu item?')) return;

    this.menuService
      .deleteMenuItem(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Menu item deleted',
            'Close',
            { duration: 2500 }
          );

          this.loadItems();
        },
        error: () =>
          this.snackBar.open(
            'Failed to delete menu item',
            'Close',
            { duration: 3000 }
          ),
      });
  }
}