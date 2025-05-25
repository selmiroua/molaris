import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-verified-doctors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="doctors-container">
      <mat-card class="doctors-card">
        <mat-card-header>
          <mat-card-title>Médecins vérifiés</mat-card-title>
          <mat-card-subtitle>Liste des médecins vérifiés sur la plateforme</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="loading-spinner" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement des médecins...</p>
          </div>
          <div class="doctors-list" *ngIf="!loading">
            <!-- Doctors list content -->
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .doctors-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .doctors-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .loading-spinner {
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

    .doctors-list {
      padding: 20px;
    }
  `]
})
export class VerifiedDoctorsComponent implements OnInit {
  loading = true;
  doctors: User[] = [];

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadVerifiedDoctors();
  }

  private loadVerifiedDoctors(): void {
    this.loading = true;
    this.userService.getVerifiedDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading verified doctors:', error);
        this.snackBar.open('Erreur lors du chargement des médecins', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }
} 