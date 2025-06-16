import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../core/services/user.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CreatePatientDialogComponent } from '../secretary/create-patient-dialog.component';
import { ProfileService } from '../../profile/profile.service';

export interface PatientSelectionData {
  selectedDate: Date;
}

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  phoneNumber?: string;
  hasAppointmentOnSelectedDate?: boolean;
  dateNaissance: string;
  profilePicturePath?: string;
}

@Component({
  selector: 'app-patient-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <div class="patient-selection-dialog">
      <h2 mat-dialog-title>
        <mat-icon>person_search</mat-icon>
        Sélectionner un patient
      </h2>
    
    <mat-dialog-content>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher un patient</mat-label>
          <input matInput [formControl]="searchControl" (keyup)="onSearch()" placeholder="Nom, prénom ou email">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
          <p>Recherche en cours...</p>
        </div>

        <div *ngIf="!loading && error" class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
      </div>
      
        <div *ngIf="!loading && !error && patients.length === 0" class="empty-container">
          <mat-icon color="primary">info</mat-icon>
          <p>Aucun patient trouvé</p>
      </div>
      
        <div *ngIf="!loading && !error && patients.length > 0" class="patient-list">
          <div *ngFor="let patient of patients" (click)="selectPatient(patient)" class="patient-card">
            <div class="patient-card-content">
              <div class="patient-avatar">
                <div *ngIf="!patient.profilePicturePath" class="avatar-initials">
                  {{ patient.prenom[0] || '' }}{{ patient.nom[0] || '' }}
                </div>
                <img *ngIf="patient.profilePicturePath" [src]="patient.profilePicturePath" alt="Patient">
              </div>
              <div class="patient-info">
                <h3 class="patient-name">{{ patient.prenom }} {{ patient.nom }}</h3>
                <p *ngIf="patient.email" class="patient-email">{{ patient.email }}</p>
                <p *ngIf="patient.phoneNumber" class="patient-phone">{{ patient.phoneNumber }}</p>
              </div>
            </div>
            <mat-icon class="select-arrow">chevron_right</mat-icon>
          </div>
        </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Annuler</button>
    </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .patient-selection-dialog {
      padding: 0;
      max-width: 600px;
      width: 100%;
    }
    
    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #3f51b5;
      margin-bottom: 0;
      padding: 16px 24px 8px;
    }
    
    mat-dialog-content {
      padding: 0 24px 24px;
      margin: 0;
      max-height: 60vh;
    }
    
    .search-field {
      width: 100%;
    }
    
    .loading-container, .error-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #757575;
    }
    
    .loading-container mat-spinner, .error-container mat-icon, .empty-container mat-icon {
      margin-bottom: 1rem;
    }
    
    .error-container mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    
    .patient-list {
      max-height: 400px;
      overflow-y: auto;
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .patient-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      background-color: white;
      border: 1px solid #e0e0e0;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .patient-card:hover {
      background-color: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-color: #3f51b5;
    }
    
    .patient-card-content {
      display: flex;
      align-items: center;
      flex: 1;
    }
    
    .patient-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #3f51b5;
      color: white;
      margin-right: 16px;
      font-weight: 500;
      flex-shrink: 0;
    }
    
    .avatar-initials {
      font-size: 16px;
      font-weight: 600;
    }
    
    .patient-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    
    .patient-info {
      flex: 1;
      min-width: 0;
    }
    
    .patient-name {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .patient-email, .patient-phone {
      margin: 2px 0;
      color: #757575;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .select-arrow {
      color: #757575;
      margin-left: 8px;
    }
  `]
})
export class PatientSelectionDialogComponent implements OnInit {
  searchControl = new FormControl('');
  patients: Patient[] = [];
  loading = false;
  error: string | null = null;
  
  constructor(
    public dialogRef: MatDialogRef<PatientSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientSelectionData,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch(): void {
    this.loading = true;
    this.error = null;
    this.patients = [];

    this.profileService.getCurrentProfile().subscribe({
      next: (profile: any) => {
        let doctorId = null;
        if (profile.role && typeof profile.role === 'string' && profile.role.toLowerCase() === 'doctor') {
          doctorId = profile.id;
        } else if (profile.role && profile.role.name === 'DOCTOR') {
          doctorId = profile.id;
        } else if (profile.assignedDoctor && profile.assignedDoctor.id) {
          doctorId = profile.assignedDoctor.id;
        }
        if (!doctorId && profile.id) {
          doctorId = profile.id;
        }

        if (!doctorId) {
          this.snackBar.open('Impossible de déterminer le médecin pour la recherche de patients', 'Fermer', { duration: 3000 });
          this.loading = false;
          return;
        }

        this.userService.getDoctorPatientsById(doctorId).subscribe({
          next: (patients: Patient[]) => {
            this.patients = patients;
            if (this.data?.selectedDate) {
              const selectedDateStr = this.formatDateForApi(this.data.selectedDate);
              const requests: Observable<boolean>[] = patients.map(patient => 
                this.appointmentService.checkPatientHasAppointmentOnDate(patient.id, selectedDateStr).pipe(
                  catchError(() => of(false))
                )
              );
              forkJoin(requests).subscribe({
                next: (results) => {
                  this.patients = this.patients.map((patient, index) => ({
                    ...patient,
                    hasAppointmentOnSelectedDate: results[index]
                  }));
                  this.loading = false;
                  this.cdr.detectChanges();
                },
                error: () => {
                  this.patients = [...this.patients];
                  this.loading = false;
                  this.cdr.detectChanges();
                }
              });
            } else {
              this.loading = false;
            }
          },
          error: (error: any) => {
            console.error('Error loading patients:', error);
            this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', { duration: 3000 });
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors de la récupération du profil utilisateur', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  selectPatient(patient: Patient): void {
    if (patient.hasAppointmentOnSelectedDate) {
      this.snackBar.open('Ce patient a déjà un rendez-vous à cette date', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.dialogRef.close(patient);
  }
  
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
} 