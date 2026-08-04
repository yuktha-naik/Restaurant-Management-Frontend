import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuCategory, MenuItem } from '../../../models/menu-item';
import { Manager } from '../../../models/manager';
import { MenuItemService } from '../../../services/menu-item.service';
import { ManagerService } from '../../../services/manager.service';

const CATEGORIES: MenuCategory[] = ['STARTER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE'];

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './menu-form.html',
  styleUrl: './menu-form.css',
})
export class MenuFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly menuService = inject(MenuItemService);
  private readonly managerService = inject(ManagerService);
  private readonly snackBar = inject(MatSnackBar);

  readonly itemId = this.route.snapshot.paramMap.get('id');
  readonly categories = CATEGORIES;
  managers: Manager[] = [];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['STARTER' as MenuCategory, Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    available: [true],
    managerId: [0 as number, [Validators.required, Validators.min(1)]],
  });

  get isEditMode(): boolean {
    return this.itemId !== null;
  }

  constructor() {
    this.loadManagers();
    if (this.isEditMode) this.loadItem();
  }

  loadManagers(): void {
    this.managerService
      .getAllManagers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (m) => (this.managers = m) });
  }

  loadItem(): void {
    this.menuService
      .getMenuItemById(Number(this.itemId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (i) =>
          this.form.patchValue({
            name: i.name,
            category: i.category,
            price: i.price,
            available: i.available,
            managerId: i.manager?.managerId ?? 0,
          }),
        error: () => {
          this.snackBar.open('Failed to load menu item', 'Close', { duration: 10000 });
          this.router.navigate(['/menu']);
        },
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, category, price, available, managerId } = this.form.getRawValue();
    const payload: MenuItem = { name, category, price, available, manager: { managerId } };

    const request$ = this.isEditMode
      ? this.menuService.updateMenuItem(Number(this.itemId), payload)
      : this.menuService.createMenuItem(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(`Menu item ${this.isEditMode ? 'updated' : 'created'}`, 'Close', {
          duration: 10000,
        });
        this.router.navigate(['/menu']);
      },
      error: () =>
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} menu item`,
          'Close',
          { duration: 10000 },
        ),
    });
  }

  cancel(): void {
    this.router.navigate(['/menu']);
  }
}
