import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService, User } from '../auth/auth.service';

@Component({
  selector: 'app-banned-account',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './banned-account.component.html',
  styleUrls: ['./banned-account.component.scss']
})
export class BannedAccountComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';
  hasAuthenticatedUser: boolean = false;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Try to get the last attempted email from localStorage
    const lastAttemptedEmail = localStorage.getItem('lastAttemptedEmail');
    
    if (lastAttemptedEmail) {
      this.userEmail = lastAttemptedEmail;
      this.userName = this.userEmail;
    }
    
    // Try to get current user info if available
    this.authService.getCurrentUser().subscribe({
      next: (user: User) => {
        if (user) {
          this.hasAuthenticatedUser = true;
          // Handle potential null/undefined values
          this.userName = user.nom && user.prenom ? 
            `${user.prenom} ${user.nom}` : 
            user.email || this.userEmail || 'Utilisateur';
          
          if (user.email) {
            this.userEmail = user.email;
          }
        }
      },
      error: () => {
        // If no authenticated user, we'll use the email from localStorage
        console.log('No authenticated user found, using lastAttemptedEmail');
      }
    });
  }
  
  goToMessaging(): void {
    if (this.hasAuthenticatedUser) {
      this.router.navigate(['/messaging']);
    } else {
      // If not authenticated, redirect to login first
      this.router.navigate(['/login']);
    }
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
