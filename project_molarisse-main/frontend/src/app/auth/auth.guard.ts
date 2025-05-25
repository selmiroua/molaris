import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('AuthGuard.canActivate called for URL:', state.url);
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('User role:', this.authService.getUserRole());
    
    const userRole = this.authService.getUserRole();
    const requiredRole = route.data['role'];
    const isAuthenticated = this.authService.isAuthenticated();

    // For all protected pages that require authentication
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // For dashboard pages that require a specific role
    if (state.url.includes('/dashboard/')) {
      // Extract the role from the URL
      const urlParts = state.url.split('/');
      const urlRole = urlParts[2]; // dashboard/{role}
      
      console.log('URL role:', urlRole);
      console.log('User role:', userRole);
      
      // If user tries to access a dashboard that doesn't match their role
      if (userRole && urlRole && userRole.toLowerCase() !== urlRole.toLowerCase()) {
        console.log('User trying to access unauthorized dashboard, redirecting to their dashboard');
        this.router.navigate([`/dashboard/${userRole.toLowerCase()}`]);
        return false;
      }
    }

    // For pages that require a specific role
    if (requiredRole && userRole && userRole !== requiredRole) {
      console.log('User does not have required role, redirecting to their dashboard');
      this.router.navigate([`/dashboard/${userRole.toLowerCase()}`]);
      return false;
    }

    return true;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(childRoute, state);
  }
}
