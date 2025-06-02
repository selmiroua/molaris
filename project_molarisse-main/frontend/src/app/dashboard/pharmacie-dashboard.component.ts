import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-pharmacie-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    ProfileComponent
  ],
  templateUrl: './pharmacie-dashboard.component.html',
  styleUrls: ['./pharmacie-dashboard.component.scss']
})
export class PharmacieDashboardComponent {
  isMenuOpen = false;
  activeSection = 'dashboard'; // Default to dashboard view

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  showDashboard() {
    this.activeSection = 'dashboard';
  }

  showProfile() {
    this.activeSection = 'profile';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
