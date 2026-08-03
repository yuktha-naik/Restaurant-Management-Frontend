import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuItem } from '../../models/menu-item';
import { AuthService } from '../../services/auth.service';
import { MenuItemService } from '../../services/menu-item.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.css',
})
export class CustomerHomeComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuItemService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly menuItems = signal<MenuItem[]>([]);

  get welcomeName(): string {
    return this.authService.getName() ?? 'Guest';
  }

  constructor() {
    this.loadMenu();
  }

  private loadMenu(): void {
    this.menuService
      .getAllMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.menuItems.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const message = err?.error?.message ?? 'Unable to load menu items.';
          this.snackBar.open(message, 'Close', { duration: 3500 });
        },
      });
  }
}

