import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService } from '../../core/services/profile.service';
import { AppointmentService, CaseType, AppointmentType, UnregisteredPatientAppointmentRequest } from '../../core/services/appointment.service';
import { Router } from '@angular/router';

// Register French locale
registerLocaleData(localeFr);

@Component({
  selector: 'app-book-unregistered-patient-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container mt-4">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Prendre un rendez-vous pour un patient non inscrit</mat-card-title>
          <mat-card-subtitle>Remplissez les informations du patient et les détails du rendez-vous</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="appointmentForm" (ngSubmit)="onSubmit()" class="mt-3">
            <h3>Informations du patient</h3>
            <div class="row">
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="nom" required>
                  <mat-error *ngIf="appointmentForm.get('nom')?.hasError('required')">Le nom est requis</mat-error>
                </mat-form-field>
              </div>
              
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Prénom</mat-label>
                  <input matInput formControlName="prenom" required>
                  <mat-error *ngIf="appointmentForm.get('prenom')?.hasError('required')">Le prénom est requis</mat-error>
                </mat-form-field>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" required>
                  <mat-error *ngIf="appointmentForm.get('email')?.hasError('required')">L'email est requis</mat-error>
                  <mat-error *ngIf="appointmentForm.get('email')?.hasError('email')">Format d'email invalide</mat-error>
                </mat-form-field>
              </div>
              
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Téléphone</mat-label>
                  <input matInput formControlName="phoneNumber" required>
                  <mat-error *ngIf="appointmentForm.get('phoneNumber')?.hasError('required')">Le téléphone est requis</mat-error>
                </mat-form-field>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Date de naissance</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="dateNaissance" required>
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="appointmentForm.get('dateNaissance')?.hasError('required')">La date de naissance est requise</mat-error>
                </mat-form-field>
              </div>
            </div>
            
            <h3 class="mt-4">Détails du rendez-vous</h3>
            <div class="row">
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Date et heure</mat-label>
                  <input matInput [matDatepicker]="appointmentPicker" formControlName="appointmentDate" required>
                  <mat-datepicker-toggle matSuffix [for]="appointmentPicker"></mat-datepicker-toggle>
                  <mat-datepicker #appointmentPicker></mat-datepicker>
                  <mat-error *ngIf="appointmentForm.get('appointmentDate')?.hasError('required')">La date est requise</mat-error>
                </mat-form-field>
              </div>
              
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Heure</mat-label>
                  <input matInput type="time" formControlName="appointmentTime" required>
                  <mat-error *ngIf="appointmentForm.get('appointmentTime')?.hasError('required')">L'heure est requise</mat-error>
                </mat-form-field>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Type de cas</mat-label>
                  <mat-select formControlName="caseType" required>
                    <mat-option [value]="CaseType.URGENT">Urgent</mat-option>
                    <mat-option [value]="CaseType.NORMAL">Normal</mat-option>
                    <mat-option [value]="CaseType.CONTROL">Contrôle</mat-option>
                  </mat-select>
                  <mat-error *ngIf="appointmentForm.get('caseType')?.hasError('required')">Le type de cas est requis</mat-error>
                </mat-form-field>
              </div>
              
              <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Type de rendez-vous</mat-label>
                  <mat-select formControlName="appointmentType" required>
                    <mat-option [value]="AppointmentType.DETARTRAGE">Consultation</mat-option>
                    <mat-option [value]="AppointmentType.EXTRACTION">Extraction</mat-option>
                    <mat-option [value]="AppointmentType.SOIN">Autre</mat-option>
                  </mat-select>
                  <mat-error *ngIf="appointmentForm.get('appointmentType')?.hasError('required')">Le type de rendez-vous est requis</mat-error>
                </mat-form-field>
              </div>
            </div>
            
            <div class="row">
              <div class="col-12">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes" rows="4"></textarea>
                </mat-form-field>
              </div>
            </div>
            
            <div class="d-flex justify-content-end mt-3">
              <button mat-button type="button" routerLink="/secretary/appointments">Annuler</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="appointmentForm.invalid || loading">
                <span *ngIf="!loading">Créer le rendez-vous</span>
                <mat-spinner *ngIf="loading" diameter="24"></mat-spinner>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    h3 {
      margin-top: 20px;
      margin-bottom: 15px;
      color: #333;
      font-weight: 500;
    }
    
    mat-card {
      padding: 20px;
    }
    
    mat-card-header {
      margin-bottom: 20px;
    }
    
    mat-card-title {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    mat-card-subtitle {
      font-size: 16px;
    }
  `]
})
export class BookUnregisteredPatientAppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  loading = false;
  
  // Exposing enums for the template
  CaseType = CaseType;
  AppointmentType = AppointmentType;
  
  doctorId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.appointmentForm = this.fb.group({
      // Patient information
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      
      // Appointment information
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      caseType: ['', Validators.required],
      appointmentType: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Get the assigned doctor ID for the secretary
    this.profileService.getCurrentProfile().subscribe((profile: any) => {
      if (profile?.assignedDoctor?.id) {
        this.doctorId = profile.assignedDoctor.id;
      } else {
        this.snackBar.open('Vous devez être assigné à un médecin pour créer des rendez-vous', 'Fermer', { duration: 5000 });
        this.router.navigate(['/secretary/dashboard']);
      }
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid || !this.doctorId) {
      return;
    }

    this.loading = true;
    
    // Combine date and time for appointment
    const appointmentDate = this.appointmentForm.get('appointmentDate')?.value;
    const appointmentTime = this.appointmentForm.get('appointmentTime')?.value;
    
    // Get birth date directly
    const birthDate = this.appointmentForm.get('dateNaissance')?.value;
    
    // Create full ISO datetime string
    const combinedDate = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':');
    combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    const formattedAppointmentDateTime = combinedDate.toISOString();
    
    const request: UnregisteredPatientAppointmentRequest = {
      nom: this.appointmentForm.get('nom')?.value,
      prenom: this.appointmentForm.get('prenom')?.value,
      email: this.appointmentForm.get('email')?.value,
      phoneNumber: this.appointmentForm.get('phoneNumber')?.value,
      dateNaissance: birthDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      doctorId: this.doctorId,
      appointmentDateTime: formattedAppointmentDateTime,
      caseType: this.appointmentForm.get('caseType')?.value,
      appointmentType: this.appointmentForm.get('appointmentType')?.value,
      notes: this.appointmentForm.get('notes')?.value
    };
    
    console.log('Sending request:', request);
    
    this.appointmentService.bookAppointmentForUnregisteredPatient(request)
      .subscribe({
        next: (appointment) => {
          this.loading = false;
          this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/secretary/appointments']);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Erreur lors de la création du rendez-vous: ' + (error.message || 'Une erreur est survenue'), 'Fermer', { duration: 5000 });
        }
      });
  }
} 