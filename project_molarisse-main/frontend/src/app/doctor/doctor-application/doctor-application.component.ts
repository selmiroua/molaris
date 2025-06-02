import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DoctorApplicationService } from '../../core/services/doctor-application.service';

@Component({
  selector: 'app-doctor-application',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="application-container">
      <mat-card class="application-card">
        <mat-card-header>
          <mat-card-title>Candidature médecin</mat-card-title>
          <mat-card-subtitle>Complétez votre profil pour devenir médecin</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="application-status" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement de votre candidature...</p>
          </div>
          <div class="application-form" *ngIf="!loading">
            <!-- Application form content -->
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .application-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .application-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .application-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      text-align: center;

      p {
        margin-top: 20px;
        color: #666;
      }
    }

    .application-form {
      padding: 20px;
    }
  `]
})
export class DoctorApplicationComponent implements OnInit {
  loading = true;

  constructor(
    private doctorApplicationService: DoctorApplicationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadApplication();
  }

  private loadApplication(): void {
    this.loading = true;
    // Implement loading application logic
    this.loading = false;
  }
} 