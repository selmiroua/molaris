import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class BannedUserService {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Check if a user is banned
   */
  isBanned(): boolean {
    return this.authService.isBanned();
  }

  /**
   * Check if a link should be disabled for banned users
   * @param link The link path
   * @returns true if the link should be disabled, false otherwise
   */
  shouldDisableLink(link: string): boolean {
    if (!this.isBanned()) {
      return false; // Not banned, don't disable anything
    }

    // Allow messaging even when banned
    if (link.includes('messaging')) {
      return false;
    }

    // Disable all other links for banned users
    return true;
  }

  /**
   * Handle a click on a navigation link
   * @param event The click event
   * @param link The link to navigate to
   * @returns true if the event should be prevented, false otherwise
   */
  handleLinkClick(event: Event, link: string): boolean {
    if (this.shouldDisableLink(link)) {
      event.preventDefault();
      event.stopPropagation();
      
      // Instead of redirecting, just show a notification
      this.snackBar.open('Votre compte est suspendu. Vous pouvez uniquement accéder à la messagerie.', 'Fermer', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['banned-snackbar']
      });
      
      return true;
    }
    return false;
  }
} 