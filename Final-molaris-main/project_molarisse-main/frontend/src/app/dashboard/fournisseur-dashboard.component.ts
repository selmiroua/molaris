import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { ValidateAccountComponent } from '../validate-account/validate-account.component';

@Component({
  selector: 'app-fournisseur-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    ProfileComponent,
    ValidateAccountComponent

  ],
  templateUrl: './fournisseur-dashboard.component.html',
  styleUrls: ['./fournisseur-dashboard.component.scss']
})
export class FournisseurDashboardComponent {
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
  showValidateAccount() {
    this.activeSection = 'validate';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
