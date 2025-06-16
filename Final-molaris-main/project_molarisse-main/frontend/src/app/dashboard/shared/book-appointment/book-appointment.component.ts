import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { DoctorService } from '../../../services/doctor.service';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="appointment-container">
      <h2>Prendre un rendez-vous</h2>
      <p>Sélectionnez le médecin de votre choix pour prendre un rendez-vous</p>

      <!-- Location Filter -->
      <div class="filter-section">
        <mat-form-field appearance="outline" class="location-filter">
          <mat-label>Filtrer par ville</mat-label>
          <input matInput [formControl]="locationFilter" placeholder="Entrez une ville">
          <mat-icon matSuffix>location_on</mat-icon>
        </mat-form-field>
      </div>

      <!-- Doctor List -->
      <div class="doctor-list">
        <mat-card class="doctor-card" *ngFor="let doctor of filteredDoctors" (click)="selectDoctor(doctor)" [class.selected]="selectedDoctor?.id === doctor.id">
          <div class="doctor-header">
            <div class="doctor-avatar">
              <img [src]="doctor.profilePicturePath || 'assets/images/default-avatar.png'" [alt]="'Dr. ' + doctor.nom + ' ' + doctor.prenom">
            </div>
            <div class="doctor-info">
              <h3>Dr. {{ doctor.nom }} {{ doctor.prenom }}</h3>
              <div class="specialties">
                <span *ngFor="let specialty of doctor.specialities">{{ specialty }}</span>
              </div>
            </div>
          </div>
          
          <div class="doctor-details">
            <div class="location-info">
              <mat-icon>location_on</mat-icon>
              <span>{{ doctor.cabinetAddress || doctor.address || 'Adresse non spécifiée' }}</span>
            </div>
            <div class="contact-info">
              <mat-icon>phone</mat-icon>
              <span>{{ doctor.phoneNumber || 'Non spécifié' }}</span>
            </div>
            <div class="experience-info" *ngIf="doctor.yearsOfExperience">
              <mat-icon>work</mat-icon>
              <span>{{ doctor.yearsOfExperience }} ans d'expérience</span>
            </div>
          </div>

          <button mat-raised-button color="primary" class="book-button">
            <mat-icon>event</mat-icon>
            Prendre rendez-vous
          </button>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .appointment-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filter-section {
      margin: 20px 0;
      width: 100%;
      max-width: 400px;
    }

    .location-filter {
      width: 100%;
    }

    .doctor-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .doctor-card {
      padding: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border: 2px solid #3f51b5;
      }
    }

    .doctor-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .doctor-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 16px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .doctor-info {
      flex: 1;

      h3 {
        margin: 0 0 8px;
        font-size: 1.2rem;
        color: #333;
      }
    }

    .specialties {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      span {
        background-color: #e3f2fd;
        padding: 4px 8px;
        border-radius: 16px;
        font-size: 0.9rem;
        color: #1976d2;
      }
    }

    .doctor-details {
      margin: 16px 0;

      > div {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        color: #666;

        mat-icon {
          margin-right: 8px;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .book-button {
      width: 100%;
      margin-top: 16px;

      mat-icon {
        margin-right: 8px;
      }
    }
  `]
})
export class BookAppointmentComponent implements OnInit {
  locationFilter = new FormControl('');
  filteredDoctors: any[] = [];
  allDoctors: any[] = [];

  constructor(
    private doctorService: DoctorService,
  ) {}

  ngOnInit() {
    // Load all doctors
    this.loadDoctors();

    // Subscribe to location filter changes
    this.locationFilter.valueChanges.subscribe(location => {
      this.filterDoctors(location);
    });
  }

  private loadDoctors() {
    this.doctorService.getAllDoctors().subscribe({
      next: (doctors) => {
        this.allDoctors = doctors;
        this.filteredDoctors = doctors;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
      }
    });
  }

  private filterDoctors(location: string | null) {
    if (!location) {
      this.filteredDoctors = this.allDoctors;
      return;
    }

    const searchTerm = location.toLowerCase().trim();
    this.filteredDoctors = this.allDoctors.filter(doctor => {
      const cabinetAddress = doctor.cabinetAddress?.toLowerCase() || '';
      const address = doctor.address?.toLowerCase() || '';
      return cabinetAddress.includes(searchTerm) || address.includes(searchTerm);
    });
  }
} 