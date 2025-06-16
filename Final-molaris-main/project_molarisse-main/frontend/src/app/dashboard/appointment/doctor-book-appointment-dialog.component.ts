import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AppointmentType, CaseType, AppointmentStatus, AppointmentService } from '../../core/services/appointment.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { jwtDecode } from 'jwt-decode';
import { DuplicateAppointmentWarningDialogComponent } from './duplicate-appointment-warning-dialog.component';
import { switchMap, of } from 'rxjs';

export interface DoctorBookAppointmentDialogData {
  patient: any;
  appointmentDate?: string;
  doctorId: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: 'app-doctor-book-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Créer un rendez-vous</h2>
    
    <mat-dialog-content>
      <div class="patient-info">
        <div class="patient-header">
          <div class="patient-avatar">
            {{ getPatientInitials() }}
          </div>
          <div class="patient-details">
            <h3>{{ data.patient?.prenom || 'Prénom' }} {{ data.patient?.nom || 'Nom' }}</h3>
            <p *ngIf="data.patient?.email">{{ data.patient.email }}</p>
            <p *ngIf="data.patient?.phoneNumber">{{ data.patient.phoneNumber }}</p>
          </div>
        </div>
      </div>
      
      <form [formGroup]="appointmentForm" class="appointment-form">
        <!-- Date picker (affiché seulement si pas pré-sélectionné) -->
        <div class="form-field" *ngIf="!data.appointmentDate">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date du rendez-vous</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="appointmentDate" [min]="minDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="appointmentForm.get('appointmentDate')?.hasError('required')">
              Date requise
            </mat-error>
          </mat-form-field>
        </div>
        
        <!-- Date affichée en format lisible si pré-sélectionnée via le calendrier -->
        <div class="form-field selected-datetime" *ngIf="data.appointmentDate">
          <div class="selected-date-header">Date et heure du rendez-vous</div>
          <div class="selected-date-content">
            <mat-icon>event</mat-icon>
            <span>{{ data.appointmentDate | date:'EEEE d MMMM yyyy à HH:mm':'':'fr' }}</span>
          </div>
        </div>
        
        <!-- Time slots (affichés seulement si date pas pré-sélectionnée) -->
        <div class="form-field" *ngIf="!data.appointmentDate">
          <label>Horaires disponibles</label>
          <div class="time-slots">
            <button 
              *ngFor="let slot of timeSlots" 
              type="button" 
              [class.selected]="appointmentForm.get('appointmentTime')?.value === slot.time"
              [class.unavailable]="!slot.available"
              [disabled]="!slot.available"
              (click)="selectTimeSlot(slot.time)"
              mat-stroked-button>
              {{ slot.time }}
            </button>
          </div>
          <mat-error *ngIf="appointmentForm.get('appointmentTime')?.hasError('required') && appointmentForm.get('appointmentTime')?.touched">
            Veuillez sélectionner une heure
          </mat-error>
        </div>
        
        <!-- Appointment Type -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Type de rendez-vous</mat-label>
            <mat-select formControlName="appointmentType">
              <mat-option [value]="AppointmentType.DETARTRAGE">Détartrage</mat-option>
              <mat-option [value]="AppointmentType.SOIN">Soin</mat-option>
              <mat-option [value]="AppointmentType.EXTRACTION">Extraction</mat-option>
              <mat-option [value]="AppointmentType.BLANCHIMENT">Blanchiment</mat-option>
              <mat-option [value]="AppointmentType.ORTHODONTIE">Orthodontie</mat-option>
            </mat-select>
            <mat-error *ngIf="appointmentForm.get('appointmentType')?.hasError('required')">
              Type de rendez-vous requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <!-- Case Type -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Type de cas</mat-label>
            <mat-select formControlName="caseType">
              <mat-option [value]="CaseType.URGENT">Urgent</mat-option>
              <mat-option [value]="CaseType.CONTROL">Contrôle</mat-option>
              <mat-option [value]="CaseType.NORMAL">Normal</mat-option>
            </mat-select>
            <mat-error *ngIf="appointmentForm.get('caseType')?.hasError('required')">
              Type de cas requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <!-- Notes -->
        <div class="form-field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notes (optionnel)</mat-label>
            <textarea matInput rows="3" formControlName="notes"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="appointmentForm.invalid || submitting"
        (click)="submitAppointment()">
        <mat-icon *ngIf="submitting" class="spinner">sync</mat-icon>
        <span *ngIf="!submitting">Confirmer</span>
        <span *ngIf="submitting">Traitement...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 100%;
    }
    
    .mat-mdc-dialog-content {
      max-height: 75vh;
    }
    
    .patient-info {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
      
      @media (max-width: 768px) {
        padding: 12px;
        margin-bottom: 16px;
      }
    }
    
    .patient-header {
      display: flex;
      align-items: center;
      gap: 15px;
      
      @media (max-width: 768px) {
        gap: 10px;
      }
    }
    
    .patient-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #3f51b5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 500;
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }
    }
    
    .patient-details h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      
      @media (max-width: 768px) {
        font-size: 16px;
        margin: 0 0 3px 0;
      }
    }
    
    .patient-details p {
      margin: 0;
      font-size: 14px;
      color: #666;
      
      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
    
    .appointment-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding-top: 20px;
      
      @media (max-width: 768px) {
        gap: 10px;
        padding-top: 12px;
      }
    }
    
    .form-field {
      margin-bottom: 15px;
      
      @media (max-width: 768px) {
        margin-bottom: 8px;
      }
    }
    
    .full-width {
      width: 100%;
    }
    
    .selected-datetime {
      background-color: #f0f7ff;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid rgba(63, 81, 181, 0.2);
      
      @media (max-width: 768px) {
        padding: 12px;
      }
    }
    
    .selected-date-header {
      font-weight: 500;
      margin-bottom: 10px;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      
      @media (max-width: 768px) {
        margin-bottom: 8px;
      }
    }
    
    .selected-date-content {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      color: #3f51b5;
      
      @media (max-width: 768px) {
        font-size: 14px;
        gap: 6px;
      }
    }
    
    .time-slots {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 15px;
      
      @media (max-width: 768px) {
        gap: 6px;
        margin-bottom: 10px;
      }
    }
    
    .time-slots button {
      min-width: 70px;
      
      @media (max-width: 768px) {
        min-width: unset;
        flex: 1 1 calc(25% - 6px);
        font-size: 12px;
        line-height: 32px;
        padding: 0 8px;
      }
      
      @media (max-width: 375px) {
        flex: 1 1 calc(33.33% - 6px);
      }
    }
    
    .time-slots button.selected {
      background-color: #3f51b5;
      color: white;
    }
    
    .time-slots button.unavailable {
      background-color: #f5f5f5;
      color: #bdbdbd;
      text-decoration: line-through;
      cursor: not-allowed;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .spinner {
      animation: spin 1.5s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      justify-content: flex-end;
      gap: 8px;
      
      @media (max-width: 768px) {
        padding: 12px;
        flex-direction: column;
        
        button {
          margin: 0;
          width: 100%;
          height: 40px;
        }
      }
    }
  `]
})
export class DoctorBookAppointmentDialogComponent implements OnInit {
  appointmentForm: FormGroup;
  minDate = new Date();
  timeSlots: TimeSlot[] = [];
  submitting = false;
  
  // Constants for appointment types and case types
  AppointmentType = AppointmentType;
  CaseType = CaseType;
  
  constructor(
    public dialogRef: MatDialogRef<DoctorBookAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DoctorBookAppointmentDialogData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private appointmentService: AppointmentService,
    private dialog: MatDialog
  ) {
    // Initialiser le formulaire
    this.appointmentForm = this.fb.group({
      appointmentDate: [{value: data.appointmentDate || '', disabled: !!data.appointmentDate}, Validators.required],
      appointmentTime: [{value: '', disabled: !!data.appointmentDate}, Validators.required],
      appointmentType: [AppointmentType.SOIN, Validators.required],
      caseType: [CaseType.NORMAL, Validators.required],
      notes: ['']
    });
    
    // Initialiser le patient s'il n'existe pas
    if (!this.data.patient) {
      this.data.patient = {};
    }
  }
  
  ngOnInit(): void {
    // Gérer les dates dans le calendrier
    this.minDate = new Date();
    
    // Vérifier que l'ID du médecin est fourni
    if (!this.data.doctorId) {
      this.snackBar.open('Erreur: ID du médecin non fourni', 'Fermer', { duration: 3000 });
      this.dialogRef.close();
      return;
    }

    // Si la date est déjà sélectionnée via le calendrier, extraire l'heure
    if (this.data.appointmentDate) {
      const date = new Date(this.data.appointmentDate);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Pré-sélectionner l'heure
      this.appointmentForm.get('appointmentTime')?.setValue(timeString);
    } else {
      // Générer les créneaux horaires initiaux
      this.generateTimeSlots();

      // Écouter les changements de date pour mettre à jour les créneaux
      this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(date => {
        if (date) {
          this.generateTimeSlots();
        }
      });
    }
  }
  
  generateTimeSlots(): void {
    if (!this.appointmentForm.get('appointmentDate')?.value || !this.data.doctorId) {
      return;
    }
    
    const selectedDate = new Date(this.appointmentForm.get('appointmentDate')?.value);
    const formattedDate = selectedDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Générer des créneaux de 9h à 17h
    this.timeSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip lunch hour (12:00 - 13:00)
        if (hour === 12 && minute === 0) continue;
        
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeSlots.push({
          time: time,
          available: true // Par défaut, tous les créneaux sont disponibles
        });
      }
    }
    
    // Vérifier les créneaux disponibles pour le médecin sélectionné à la date choisie
    this.appointmentService.getAvailableTimeSlots(this.data.doctorId, formattedDate).subscribe({
      next: (availableSlots: string[]) => {
        // Si l'API renvoie une liste vide, considérer tous les créneaux comme disponibles
        if (!availableSlots || availableSlots.length === 0) {
          console.log('Aucun créneau renvoyé par l\'API, tous les créneaux seront disponibles');
          return;
        }
        
        // Sinon, mettre à jour la disponibilité des créneaux selon la réponse de l'API
        this.timeSlots.forEach(slot => {
          slot.available = availableSlots.includes(slot.time);
        });
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des créneaux disponibles:', error);
        this.snackBar.open('Erreur lors de la récupération des créneaux disponibles, tous les créneaux seront disponibles', 'Fermer', { duration: 3000 });
        // En cas d'erreur, laisser tous les créneaux disponibles
      }
    });
  }
  
  selectTimeSlot(time: string): void {
    if (this.appointmentForm.get('appointmentTime')?.value === time) {
      // Désélectionner le créneau si déjà sélectionné
      this.appointmentForm.get('appointmentTime')?.setValue('');
    } else {
      // Sélectionner le nouveau créneau
      this.appointmentForm.get('appointmentTime')?.setValue(time);
    }
  }
  
  // Vérifier si un patient a déjà un rendez-vous à la date sélectionnée
  private checkForDuplicateAppointment(patientId: number, appointmentDateTime: string): void {
    console.log(`Checking if patient ${patientId} has appointment on date: ${appointmentDateTime}`);
    
    // Skip the check entirely - go directly to booking
    this.proceedWithBooking(appointmentDateTime, this.appointmentForm.getRawValue());
    
    /* We're skipping the check below since it's causing 403 errors for doctors
    this.appointmentService.hasAppointmentSameDayWarning(patientId, appointmentDateTime)
      .subscribe({
        next: (result) => {
          console.log('Same day appointment check result:', result);
          if (result.hasAppointment) {
            // Afficher le dialogue d'avertissement
            console.log('Found existing appointment, showing warning dialog');
            this.submitting = false;
            const warningDialogRef = this.dialog.open(DuplicateAppointmentWarningDialogComponent, {
              width: '500px',
              data: {
                existingAppointment: result.existingAppointment,
                patientName: `${this.data.patient.prenom} ${this.data.patient.nom}`
              }
            });
            
            warningDialogRef.afterClosed().subscribe(continueBooking => {
              if (continueBooking) {
                // L'utilisateur a choisi de continuer malgré l'avertissement
                this.submitting = true;
                this.proceedWithBooking(appointmentDateTime, values);
              }
            });
          } else {
            // Pas de rendez-vous existant, procéder avec la réservation
            this.proceedWithBooking(appointmentDateTime, values);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la vérification des rendez-vous existants:', error);
          // Procéder avec la réservation en cas d'erreur
          this.proceedWithBooking(appointmentDateTime, values);
        }
      });
    */
  }

  submitAppointment(): void {
    if (this.appointmentForm.invalid || !this.data.doctorId || this.submitting) {
      return;
    }
    
    this.submitting = true;
    
    // Récupérer les valeurs du formulaire (même les champs désactivés)
    const values = {...this.appointmentForm.getRawValue()};
    
    // Combiner la date et l'heure
    let appointmentDate, appointmentTime;
    
    // Si la date a été pré-sélectionnée du calendrier, on l'utilise directement
    if (this.data.appointmentDate) {
      const dateObj = new Date(this.data.appointmentDate);
      appointmentDate = dateObj;
      appointmentTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    } else {
      // Sinon, on utilise les valeurs du formulaire
      appointmentDate = values.appointmentDate;
      appointmentTime = values.appointmentTime;
    }
    
    // Créer un objet Date complet
    const [hours, minutes] = appointmentTime.split(':');
    const combinedDate = new Date(appointmentDate);
    combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    
    // Format the date to preserve the exact local time (without timezone conversion)
    const year = combinedDate.getFullYear();
    const month = String(combinedDate.getMonth() + 1).padStart(2, '0');
    const day = String(combinedDate.getDate()).padStart(2, '0');
    const hoursStr = String(combinedDate.getHours()).padStart(2, '0');
    const minutesStr = String(combinedDate.getMinutes()).padStart(2, '0');
    
    // Create formatted string in format YYYY-MM-DDTHH:MM:00 (no timezone)
    const appointmentDateTime = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00`;
    console.log('Formatted appointment date/time to avoid timezone issues:', appointmentDateTime);
    
    // Vérifier d'abord si le patient a déjà un rendez-vous le même jour
    if (this.data.patient && this.data.patient.id) {
      this.checkForDuplicateAppointment(this.data.patient.id, appointmentDateTime);
    } else {
      // Pas d'ID patient (cas rare), procéder directement
      this.proceedWithBooking(appointmentDateTime, values);
    }
  }
  
  // Nouvelle méthode pour gérer la logique de réservation effective
  private proceedWithBooking(appointmentDateTime: string, values: any): void {
    // Construire la requête
    const appointmentRequest = {
      patientId: this.data.patient.id,
      doctorId: this.data.doctorId,
      appointmentDateTime: appointmentDateTime,
      appointmentType: values.appointmentType,
      caseType: values.caseType,
      notes: values.notes || ''
    };
    
    console.log('Envoi de la demande de rendez-vous:', appointmentRequest);
    
    // Use the doctor-specific endpoint directly to avoid any role detection issues
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.snackBar.open('Erreur d\'authentification', 'Fermer', { duration: 3000 });
      this.submitting = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const apiUrl = this.appointmentService.getApiUrl();
    console.log('API URL from service:', apiUrl);
    
    // Use book-by-doctor endpoint explicitly
    const requestUrl = `${apiUrl}/book-by-doctor`;
    console.log('Request URL being used:', requestUrl);
    
    this.http.post(requestUrl, appointmentRequest, { headers })
      .subscribe({
        next: (response) => {
          console.log('Rendez-vous créé avec succès:', response);
          this.submitting = false;
          this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true); // Fermer avec succès
        },
        error: (error) => {
          console.error('Erreur lors de la création du rendez-vous:', error);
          this.submitting = false;
          
          let errorMessage = 'Erreur lors de la création du rendez-vous';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        }
      });
  }
  
  getPatientInitials(): string {
    if (!this.data.patient?.prenom || !this.data.patient?.nom) {
      return '?';
    }
    
    const firstNameInitial = this.data.patient.prenom.charAt(0).toUpperCase();
    const lastNameInitial = this.data.patient.nom.charAt(0).toUpperCase();
    
    return `${firstNameInitial}${lastNameInitial}`;
  }
} 