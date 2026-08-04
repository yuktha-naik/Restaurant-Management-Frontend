import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:1rem;">
      <h1>403 — Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      <button mat-raised-button color="primary" (click)="goBack()">Go to Dashboard</button>
    </div>
  `,
})
export class AccessDeniedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
