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
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CreatePatientDialogComponent } from '../secretary/create-patient-dialog.component';

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
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>Sélectionner un patient</h2>
    
    <mat-dialog-content>
      <div class="search-container">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher un patient</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Nom, prénom ou email">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>
      
      <!-- Button to create a new patient -->
      <div class="create-patient-container">
        <button mat-raised-button color="primary" (click)="createNewPatient()">
          <mat-icon>person_add</mat-icon>
          Créer un nouveau patient
        </button>
      </div>
      
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement des patients...</p>
      </div>
      
      <div *ngIf="!loading && filteredPatients.length === 0" class="no-results">
        <mat-icon>person_search</mat-icon>
        <p>Aucun patient correspondant trouvé</p>
      </div>
      
      <div class="patients-list" *ngIf="!loading && filteredPatients.length > 0">
        <div class="patient-card" 
          *ngFor="let patient of filteredPatients" 
          (click)="selectPatient(patient)"
          [class.unavailable]="patient.hasAppointmentOnSelectedDate"
          [matTooltip]="patient.hasAppointmentOnSelectedDate ? 'Ce patient a déjà un rendez-vous ce jour' : ''"
          [matTooltipPosition]="'above'">
          <div class="patient-avatar" [class.booked]="patient.hasAppointmentOnSelectedDate">
            {{ getPatientInitials(patient) }}
          </div>
          <div class="patient-info">
            <div class="patient-name">
              {{ patient.prenom }} {{ patient.nom }}
              <mat-icon *ngIf="patient.hasAppointmentOnSelectedDate" 
                class="warning-icon" 
                color="warn">
                warning
              </mat-icon>
            </div>
            <div class="patient-email" *ngIf="patient.email">{{ patient.email }}</div>
            <div class="patient-phone" *ngIf="patient.phoneNumber">{{ patient.phoneNumber }}</div>
            <div class="booked-warning" *ngIf="patient.hasAppointmentOnSelectedDate">
              Déjà un rendez-vous ce jour
            </div>
          </div>
          <mat-icon class="select-icon" *ngIf="!patient.hasAppointmentOnSelectedDate">arrow_forward</mat-icon>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Annuler</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-height: 250px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .search-container {
      margin-bottom: 16px;
    }
    
    .search-field {
      width: 100%;
    }
    
    .create-patient-container {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
    }
    
    .create-patient-container button {
      width: 100%;
      padding: 12px;
      font-weight: 500;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #666;
    }
    
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #666;
      text-align: center;
    }
    
    .no-results mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }
    
    .patients-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .patient-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #eee;
    }
    
    .patient-card:hover {
      background: #f1f3f5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transform: translateY(-2px);
      border-color: #3f51b5;
    }
    
    .patient-card.unavailable {
      cursor: not-allowed;
      opacity: 0.8;
      border-color: #f44336;
    }
    
    .patient-card.unavailable:hover {
      background: #fff1f1;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2);
      transform: none;
    }
    
    .patient-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #3f51b5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .patient-avatar.booked {
      background-color: #f44336;
    }
    
    .patient-info {
      flex-grow: 1;
    }
    
    .patient-name {
      font-weight: 500;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .patient-email, .patient-phone {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    
    .booked-warning {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
      font-weight: 500;
    }
    
    .warning-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      vertical-align: middle;
    }
    
    .select-icon {
      color: #3f51b5;
      margin-left: 16px;
    }
  `]
})
export class PatientSelectionDialogComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = true;
  searchControl = new FormControl('');
  
  constructor(
    public dialogRef: MatDialogRef<PatientSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientSelectionData,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(value => {
      this.filterPatients(value || '');
    });
    
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.userService.getDoctorPatients().subscribe({
      next: (patients: Patient[]) => {
        this.patients = patients;
        
        // If there's a selected date, check for existing appointments
        if (this.data?.selectedDate) {
          const selectedDateStr = this.formatDateForApi(this.data.selectedDate);
          const requests: Observable<boolean>[] = patients.map(patient => 
            this.appointmentService.checkPatientHasAppointmentOnDate(patient.id, selectedDateStr).pipe(
              // Default to false if there's an error
              catchError(() => of(false))
            )
          );
          
          forkJoin(requests).subscribe({
            next: (results) => {
              // Mark patients with existing appointments
              this.patients = this.patients.map((patient, index) => ({
                ...patient,
                hasAppointmentOnSelectedDate: results[index]
              }));
              
              this.filteredPatients = [...this.patients];
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              // In case of error, still show patients but without appointment info
              this.filteredPatients = [...this.patients];
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.filteredPatients = [...this.patients];
          this.loading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading patients:', error);
        this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const searchTerm = this.searchControl.value || '';
    this.filterPatients(searchTerm);
  }

  filterPatients(searchTerm: string): void {
    searchTerm = searchTerm.toLowerCase().trim();
    this.filteredPatients = this.patients.filter(patient => 
      patient.nom.toLowerCase().includes(searchTerm) || 
      patient.prenom.toLowerCase().includes(searchTerm) || 
      (patient.email && patient.email.toLowerCase().includes(searchTerm))
    );
  }

  getPatientInitials(patient: Patient): string {
    if (!patient.nom || !patient.prenom) return '?';
    
    const firstNameInitial = patient.prenom.charAt(0).toUpperCase();
    const lastNameInitial = patient.nom.charAt(0).toUpperCase();
    
    return `${firstNameInitial}${lastNameInitial}`;
  }

  selectPatient(patient: Patient): void {
    if (patient.hasAppointmentOnSelectedDate) {
      this.snackBar.open('Ce patient a déjà un rendez-vous à cette date', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.dialogRef.close(patient);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
  
  createNewPatient(): void {
    const dialogRef = this.dialog.open(CreatePatientDialogComponent, {
      width: '700px',
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the patient list to include the newly created patient
        this.loadPatients();
        
        // Optionally, you can automatically select the new patient
        // by returning it from this dialog
        // this.dialogRef.close(result);
      }
    });
  }
  
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
} 