import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { DoctorVerificationService } from '../../core/services/doctor-verification.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../auth/auth.service';
import { DoctorVerification } from '../../core/models/doctor-verification.model';
import { environment } from '../../../environments/environment';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface DoctorCard extends DoctorVerification {
  profilePicture?: string;
  rating?: number;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-verified-doctors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Trouvez le spécialiste qui vous convient</h1>
      </header>

      <div class="doctors-grid">
        <mat-card class="doctor-card" *ngFor="let doctor of verifiedDoctors">
          <div class="card-header">
            <div class="profile-image">
              <img [src]="getProfilePicture(doctor.profilePicture)" [alt]="'Dr. ' + getDoctorName(doctor.email)">
              <button class="favorite-btn" mat-icon-button>
                <mat-icon>favorite_border</mat-icon>
              </button>
            </div>
            <div class="rating">
              <mat-icon>star</mat-icon>
              <span>{{ doctor.rating }}</span>
            </div>
          </div>

          <div class="specialties">
            <mat-chip-listbox>
              <mat-chip *ngFor="let specialty of doctor.specialties">{{ specialty }}</mat-chip>
            </mat-chip-listbox>
          </div>

          <div class="doctor-info">
            <h2>Dr. {{ getDoctorName(doctor.email) }}</h2>
            
            <div class="location">
              <mat-icon>location_on</mat-icon>
              <span>{{ doctor.cabinetAddress || 'Non spécifié' }}</span>
            </div>

            <div class="details">
              <div class="detail-item">
                <mat-icon>work</mat-icon>
                <span>{{ doctor.yearsOfExperience }} ans d'exp.</span>
              </div>
              <div class="detail-item">
                <mat-icon>schedule</mat-icon>
                <span>Flexible</span>
              </div>
              <div class="detail-item">
                <mat-icon>euro</mat-icon>
                <span>100€ / acte</span>
              </div>
            </div>

            <button mat-raised-button color="primary" class="submit-btn" (click)="onSubmitApplication(doctor)">
              <mat-icon>assignment</mat-icon>
              Soumettre une candidature
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 40px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .page-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .page-header h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
    }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 30px;
    }

    .doctor-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background: white;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-5px);
      }
    }

    .card-header {
      position: relative;
      padding: 20px;
    }

    .profile-image {
      position: relative;
      width: 100%;
      height: 200px;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .favorite-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.9);
      mat-icon {
        color: #ff4081;
      }
    }

    .rating {
      position: absolute;
      bottom: 30px;
      right: 30px;
      background: white;
      padding: 4px 8px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      mat-icon {
        color: #ffc107;
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 4px;
      }

      span {
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .specialties {
      padding: 0 20px;
      margin-bottom: 15px;

      mat-chip {
        background-color: #4054b2 !important;
        color: white !important;
      }
    }

    .doctor-info {
      padding: 0 20px 20px;

      h2 {
        margin: 0 0 10px;
        color: #2c3e50;
        font-size: 1.5rem;
      }
    }

    .location {
      display: flex;
      align-items: center;
      color: #666;
      margin-bottom: 15px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }
    }

    .details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      color: #666;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }

      span {
        font-size: 0.9rem;
      }
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 1rem;
      border-radius: 25px;
      background-color: #4054b2;
      color: white;

      mat-icon {
        margin-right: 8px;
        color: white;
      }

      &:hover {
        background-color: #303f9f;
      }
    }
  `]
})
export class VerifiedDoctorsComponent implements OnInit {
  verifiedDoctors: DoctorCard[] = [];

  constructor(
    private doctorVerificationService: DoctorVerificationService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVerifiedDoctors();
  }

  loadVerifiedDoctors() {
    this.doctorVerificationService.getApprovedVerifications().subscribe({
      next: (doctors) => {
        this.verifiedDoctors = doctors.map(doctor => ({
          ...doctor,
          rating: 4.8 // Default rating for now
        }));
        console.log('Loaded verified doctors:', this.verifiedDoctors);
      },
      error: (error) => {
        console.error('Error loading verified doctors:', error);
      }
    });
  }

  getProfilePicture(fileName: string | undefined): string {
    if (!fileName) {
      return 'assets/images/default-doctor.jpg';
    }
    if (fileName.startsWith('http')) {
      return fileName;
    }
    return `${environment.apiUrl}/api/users/profile/picture/${fileName}`;
  }

  getDoctorName(email: string): string {
    return email.split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  onSubmitApplication(doctor: DoctorCard) {
    if (!this.authService.isAuthenticated()) {
      // Store the return URL in localStorage to redirect back after login
      localStorage.setItem('returnUrl', this.router.url);
      this.router.navigate(['/login']);
      return;
    }
    
    // Handle submission for authenticated users
    // TODO: Implement application submission logic
    console.log('Submitting application for doctor:', doctor);
  }
} 