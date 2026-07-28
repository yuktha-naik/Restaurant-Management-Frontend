import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}

  get userName(): string {
    return this.authService.getUser()?.name ?? 'User';
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  get isWaiter(): boolean {
    return this.authService.isWaiter();
  }
}
