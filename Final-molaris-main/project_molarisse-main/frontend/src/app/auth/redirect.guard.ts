import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // If authenticated, redirect to dashboard based on role
      const userRole = this.authService.getUserRole();
      if (userRole) {
        this.router.navigate([`/dashboard/${userRole.toLowerCase()}`]);
      } else {
        // Fallback if role not available
        this.router.navigate(['/dashboard']);
      }
    } else {
      // If not authenticated, redirect to login
      this.router.navigate(['/login']);
    }
    return false; // Always return false as we're redirecting
  }
}
