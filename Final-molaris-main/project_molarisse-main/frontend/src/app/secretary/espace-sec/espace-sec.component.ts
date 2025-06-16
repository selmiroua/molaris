import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VerifiedDoctorsComponent } from '../verified-doctors/verified-doctors.component';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-espace-sec',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    VerifiedDoctorsComponent
  ],
  template: `
    <div class="espace-sec-container">
      <header class="page-header">
        <h1>Espace Secrétaire</h1>
        <p *ngIf="!accountLocked">Liste des médecins vérifiés</p>
      </header>
      
      <main class="main-content">
        <div *ngIf="accountLocked" class="account-locked-message">
          <mat-icon class="lock-icon">lock</mat-icon>
          <h2>Accès Temporairement Désactivé</h2>
          <p>Votre accès au tableau de bord a été temporairement désactivé par votre médecin.</p>
          <p>Veuillez le contacter pour plus d'informations.</p>
          <button mat-raised-button color="primary" (click)="logout()">Se déconnecter</button>
        </div>
        
        <app-verified-doctors *ngIf="!accountLocked"></app-verified-doctors>
      </main>
    </div>
  `,
  styles: [`
    .espace-sec-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
      text-align: center;
    }

    .page-header h1 {
      color: #333;
      font-size: 2rem;
      margin: 0 0 10px;
    }

    .page-header p {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .main-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
    }
    
    .account-locked-message {
      text-align: center;
      padding: 40px 20px;
      color: #d32f2f;
    }
    
    .lock-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
    }

    button {
      margin-top: 20px;
    }
  `]
})
export class EspaceSecComponent implements OnInit {
  accountLocked = false;
  
  constructor(private authService: AuthService, private router: Router) {}
  
  ngOnInit(): void {
    this.checkAccountStatus();
  }
  
  checkAccountStatus(): void {
    // First check localStorage
    if (this.authService.isAccountLocked()) {
      this.accountLocked = true;
      return;
    }
    
    // Then verify with the server
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.accountLocked = user.accountLocked || false;
        // Update localStorage if needed
        if (this.accountLocked) {
          localStorage.setItem('accountLocked', 'true');
        }
      },
      error: (error) => {
        console.error('Error checking account status:', error);
      }
    });
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 