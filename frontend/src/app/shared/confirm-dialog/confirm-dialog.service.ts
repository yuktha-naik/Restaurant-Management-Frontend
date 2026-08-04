import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog';

/**
 * Replaces the browser's blocking `window.confirm()` with an in-app Material
 * dialog. `confirm(...)` returns `Observable<boolean>` instead of a
 * synchronous boolean — call sites subscribe and act only when `true`.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(private readonly dialog: MatDialog) {}

  confirm(message: string, options?: Omit<ConfirmDialogData, 'message'>): Observable<boolean> {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: { message, ...options },
        width: '420px',
        autoFocus: false,
      },
    );

    return ref.afterClosed().pipe(map((result) => result === true));
  }
}
