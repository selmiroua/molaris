import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService, CaseType, AppointmentType, UnregisteredPatientAppointmentRequest, Appointment } from '../core/services/appointment.service';
import { ProfileService } from '../profile/profile.service';

// Register French locale
registerLocaleData(localeFr);

export interface UnregisteredAppointmentDialogData {
  appointmentDateTime: Date;
  formattedDateTime?: string;
  doctor?: { id: number };
}

@Component({
  selector: 'app-unregistered-patient-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="appointment-dialog">
      <h2 mat-dialog-title>Prendre un rendez-vous pour un patient non inscrit</h2>
      
      <mat-dialog-content>
        <form [formGroup]="appointmentForm" class="appointment-form">
          <h3>Informations du patient</h3>
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="nom" required>
              <mat-error *ngIf="appointmentForm.get('nom')?.hasError('required')">Le nom est requis</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Prénom</mat-label>
              <input matInput formControlName="prenom" required>
              <mat-error *ngIf="appointmentForm.get('prenom')?.hasError('required')">Le prénom est requis</mat-error>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-error *ngIf="appointmentForm.get('email')?.hasError('required')">L'email est requis</mat-error>
              <mat-error *ngIf="appointmentForm.get('email')?.hasError('email')">Format d'email invalide</mat-error>
            </mat-form-field>
          </div>
          
          <h3>Détails du rendez-vous</h3>
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Date et heure</mat-label>
              <input matInput [value]="formattedDateTime" disabled>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Type de cas</mat-label>
              <mat-select formControlName="caseType" required>
                <mat-option [value]="CaseType.URGENT">Urgent</mat-option>
                <mat-option [value]="CaseType.NORMAL">Normal</mat-option>
                <mat-option [value]="CaseType.CONTROL">Contrôle</mat-option>
              </mat-select>
              <mat-error *ngIf="appointmentForm.get('caseType')?.hasError('required')">Le type de cas est requis</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Type de rendez-vous</mat-label>
              <mat-select formControlName="appointmentType" required>
                <mat-option [value]="AppointmentType.DETARTRAGE">Détartrage</mat-option>
                <mat-option [value]="AppointmentType.SOIN">Soin</mat-option>
                <mat-option [value]="AppointmentType.EXTRACTION">Extraction</mat-option>
                <mat-option [value]="AppointmentType.BLANCHIMENT">Blanchiment</mat-option>
                <mat-option [value]="AppointmentType.ORTHODONTIE">Orthodontie</mat-option>
              </mat-select>
              <mat-error *ngIf="appointmentForm.get('appointmentType')?.hasError('required')">Le type de rendez-vous est requis</mat-error>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="appointmentForm.invalid || loading">
          <span *ngIf="!loading">Créer le rendez-vous</span>
          <mat-spinner *ngIf="loading" diameter="24"></mat-spinner>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      padding: 0;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .appointment-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    h3 {
      margin: 20px 0 10px;
      color: #1976d2;
      font-weight: 500;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      width: 100%;
    }
    
    .form-field {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-dialog-actions {
      padding: 16px 0;
      margin-bottom: 0;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class UnregisteredPatientAppointmentDialogComponent implements OnInit {
  appointmentForm: FormGroup;
  loading = false;
  formattedDateTime: string;
  
  // Exposer les enums pour le template
  CaseType = CaseType;
  AppointmentType = AppointmentType;
  
  doctorId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UnregisteredPatientAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnregisteredAppointmentDialogData
  ) {
    this.appointmentForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      caseType: [CaseType.NORMAL, Validators.required],
      appointmentType: [AppointmentType.SOIN, Validators.required],
      notes: ['']
    });
    
    // Formater la date pour l'affichage uniquement
    this.formattedDateTime = new Date(data.appointmentDateTime).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnInit(): void {
    console.log('Unregistered Patient Dialog Data:', JSON.stringify(this.data));
    
    // Check if doctor ID is provided directly in the data object
    if (this.data.doctor && this.data.doctor.id) {
      this.doctorId = Number(this.data.doctor.id);
      console.log('Médecin connecté (depuis data), ID utilisé:', this.doctorId);
    } else {
      console.log('Aucun ID de médecin trouvé dans les données, tentative de récupération via le profil');
      // If doctor ID is not provided, try to get it from the profile service
      this.profileService.getCurrentProfile().subscribe({
        next: (profile: any) => {
          console.log('Profil récupéré (contenu complet):', JSON.stringify(profile));
          
          // Debug exactly what's in the profile
          console.log('Profile ID:', profile?.id);
          console.log('Profile role:', profile?.role);
          console.log('Profile assignedDoctor:', profile?.assignedDoctor);
          
          if (profile?.assignedDoctor?.id) {
            this.doctorId = Number(profile.assignedDoctor.id);
            console.log('ID du médecin assigné récupéré:', this.doctorId);
          } else if (profile?.role === 'DOCTOR' && profile?.id) {
            // Changed from 'MEDECIN' to 'DOCTOR' - this might be the issue!
            this.doctorId = Number(profile.id);
            console.log('Médecin connecté (depuis profil), ID utilisé:', this.doctorId);
          } else if (profile?.role === 'MEDECIN' && profile?.id) {
            // Also try with 'MEDECIN'
            this.doctorId = Number(profile.id);
            console.log('Médecin connecté (depuis profil avec MEDECIN), ID utilisé:', this.doctorId);
          } else {
            console.error('Aucun médecin assigné trouvé dans le profil');
            this.snackBar.open('Vous devez être assigné à un médecin pour créer des rendez-vous', 'Fermer', { duration: 5000 });
            this.dialogRef.close();
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du profil', error);
          this.snackBar.open('Erreur lors de la récupération de votre profil', 'Fermer', { duration: 5000 });
          this.dialogRef.close();
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid || !this.doctorId) {
      console.log('Form is invalid or doctorId is missing:', {
        formValid: this.appointmentForm.valid,
        doctorId: this.doctorId
      });
      
      // Try to get doctorId one more time if it's null
      if (!this.doctorId) {
        this.snackBar.open('ID du médecin manquant. Récupération...', 'Fermer', { duration: 2000 });
        
        // Get current profile one more time
        this.profileService.getCurrentProfile().subscribe({
          next: (profile: any) => {
            console.log('Profil récupéré (nouvel essai):', profile);
            
            // Try to get doctor ID from different sources
            if (profile?.assignedDoctor?.id) {
              this.doctorId = Number(profile.assignedDoctor.id);
              console.log('ID du médecin assigné récupéré:', this.doctorId);
              // Try submitting again
              this.submitAppointmentWithRequest();
            } else if (profile?.role === 'MEDECIN' && profile?.id) {
              this.doctorId = Number(profile.id);
              console.log('ID du médecin (depuis profil):', this.doctorId);
              // Try submitting again
              this.submitAppointmentWithRequest();
            } else {
              this.snackBar.open('Impossible de trouver l\'ID du médecin', 'Fermer', { duration: 5000 });
            }
          },
          error: (err) => {
            console.error('Erreur lors de la récupération du profil (nouvel essai)', err);
            this.snackBar.open('Erreur lors de la récupération du profil', 'Fermer', { duration: 5000 });
          }
        });
      }
      
      return;
    }

    this.loading = true;
    this.submitAppointmentWithRequest();
  }

  private submitAppointmentWithRequest(): void {
    // Use the original selected date/time from the calendar
    // This ensures we use exactly what was selected without timezone adjustments
    let appointmentDateTime;
    if (this.data.formattedDateTime) {
      appointmentDateTime = this.data.formattedDateTime;
      console.log('Using explicitly formatted date/time to avoid timezone issues:', appointmentDateTime);
    } else {
      // Fallback to ISO string only if formatted string not provided
      appointmentDateTime = this.data.appointmentDateTime.toISOString();
      console.log('Warning: Using ISO string which may have timezone issues:', appointmentDateTime);
    }
    
    const request: UnregisteredPatientAppointmentRequest = {
      nom: this.appointmentForm.get('nom')?.value,
      prenom: this.appointmentForm.get('prenom')?.value,
      email: this.appointmentForm.get('email')?.value,
      dateNaissance: '', // Use empty string instead of null
      phoneNumber: '', // Use empty string instead of null
      doctorId: this.doctorId!,
      appointmentDateTime: appointmentDateTime,
      caseType: this.appointmentForm.get('caseType')?.value,
      appointmentType: this.appointmentForm.get('appointmentType')?.value,
      notes: this.appointmentForm.get('notes')?.value || ''
    };
    
    console.log('Sending request with doctorId:', this.doctorId);
    
    // Check if the user is a doctor from the data passed
    const isDoctor = this.data.doctor && this.data.doctor.id;
    
    if (isDoctor) {
      // If doctor, use the doctor-specific method
      console.log('Using doctor-specific endpoint for unregistered patient appointment');
      this.appointmentService.bookAppointmentForUnregisteredPatientByDoctor(request)
        .subscribe({
          next: (appointment: Appointment) => {
            console.log('Appointment created successfully by doctor:', appointment);
            this.loading = false;
            this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
            
            // Forcer un rafraîchissement en passant true comme résultat
            this.dialogRef.close({success: true, appointment: appointment});
          },
          error: (error: any) => {
            console.error('Error creating appointment by doctor:', error);
            this.loading = false;
            
            // Check if the error is related to duplicate email
            const errorMsg = error.message || '';
            if (errorMsg.includes('Duplicate entry') || errorMsg.includes('duplicate')) {
              this.snackBar.open('Un patient avec cet email existe déjà dans le système. Veuillez utiliser un email différent ou demander au patient de se connecter à son compte.', 'Fermer', { duration: 8000 });
            } else {
              this.snackBar.open('Erreur lors de la création du rendez-vous: ' + (errorMsg || 'Une erreur est survenue'), 'Fermer', { duration: 5000 });
            }
          }
        });
    } else {
      // If secretary, use the standard method
      console.log('Using secretary endpoint for unregistered patient appointment');
      this.appointmentService.bookAppointmentForUnregisteredPatient(request)
        .subscribe({
          next: (appointment: Appointment) => {
            console.log('Appointment created successfully by secretary:', appointment);
            this.loading = false;
            this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
            
            // Forcer un rafraîchissement en passant true comme résultat
            this.dialogRef.close({success: true, appointment: appointment});
          },
          error: (error: any) => {
            console.error('Error creating appointment by secretary:', error);
            this.loading = false;
            
            // Check if the error is related to duplicate email
            const errorMsg = error.message || '';
            if (errorMsg.includes('Duplicate entry') || errorMsg.includes('duplicate')) {
              this.snackBar.open('Un patient avec cet email existe déjà dans le système. Veuillez utiliser un email différent ou demander au patient de se connecter à son compte.', 'Fermer', { duration: 8000 });
            } else {
              this.snackBar.open('Erreur lors de la création du rendez-vous: ' + (errorMsg || 'Une erreur est survenue'), 'Fermer', { duration: 5000 });
            }
          }
        });
    }
  }
} 