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
  doctor: any;
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
            <h3>{{ data.patient.prenom }} {{ data.patient.nom }}</h3>
            <p *ngIf="data.patient.email">{{ data.patient.email }}</p>
            <p *ngIf="data.patient.phoneNumber">{{ data.patient.phoneNumber }}</p>
          </div>
        </div>
      </div>
      
      <form [formGroup]="appointmentForm" class="appointment-form">
        <!-- Date picker -->
        <div class="form-field">
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
        
        <!-- Time slots -->
        <div class="form-field">
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
    this.appointmentForm = this.fb.group({
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      appointmentType: [AppointmentType.SOIN, Validators.required],
      caseType: [CaseType.NORMAL, Validators.required],
      notes: ['']
    });
  }
  
  ngOnInit(): void {
    // Debug information
    console.log('Doctor data in dialog:', this.data.doctor);
    console.log('Doctor ID:', this.data.doctor?.id, 'Type:', typeof this.data.doctor?.id);
    
    // Generate initial time slots
    this.generateTimeSlots();
    
    // Update time slots when date changes
    this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(() => {
      this.generateTimeSlots();
      // Reset the time when date changes
      this.appointmentForm.get('appointmentTime')?.setValue('');
    });
  }
  
  generateTimeSlots(): void {
    const slots: TimeSlot[] = [];
    
    // Generate time slots from 8:00 to 18:00
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const time = `${formattedHour}:${formattedMinute}`;
        
        // For simplicity, all slots are available in this example
        // In a real app, you would check against booked appointments
        slots.push({ time, available: true });
      }
    }
    
    this.timeSlots = slots;
  }
  
  getPatientInitials(): string {
    if (!this.data.patient) return '?';
    
    const firstName = this.data.patient.prenom ? this.data.patient.prenom.charAt(0).toUpperCase() : '';
    const lastName = this.data.patient.nom ? this.data.patient.nom.charAt(0).toUpperCase() : '';
    
    if (firstName && lastName) return firstName + lastName;
    if (firstName) return firstName;
    if (lastName) return lastName;
    
    return '?';
  }
  
  selectTimeSlot(time: string): void {
    this.appointmentForm.get('appointmentTime')?.setValue(time);
  }
  
  submitAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.submitting = true;
    
    const formValues = this.appointmentForm.value;
    const selectedDate = formValues.appointmentDate;
    const [hours, minutes] = formValues.appointmentTime.split(':');
    
    // Combine date and time
    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    // Format date and time manually to avoid timezone issues
    const year = appointmentDateTime.getFullYear();
    const month = (appointmentDateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = appointmentDateTime.getDate().toString().padStart(2, '0');
    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes.padStart(2, '0');
    
    // Create ISO format string without timezone conversion: YYYY-MM-DDTHH:MM:SS
    const appointmentDateTimeStr = `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}:00`;
    
    // First check if the patient already has an appointment on this day
    console.log('Checking for existing appointments for patient ID:', this.data.patient.id);
    console.log('Appointment date to check:', appointmentDateTimeStr);
    
    this.appointmentService.hasAppointmentSameDayWarning(this.data.patient.id, appointmentDateTimeStr)
      .subscribe({
        next: (result) => {
          console.log('Same day appointment check result:', result);
          if (result.hasAppointment) {
            // Show warning dialog
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
                // User chose to continue with booking despite the warning
                this.submitting = true;
                this.proceedWithBooking(appointmentDateTimeStr, formValues);
              }
            });
          } else {
            // No existing appointment, proceed with booking
            this.proceedWithBooking(appointmentDateTimeStr, formValues);
          }
        },
        error: (error) => {
          console.error('Error checking for existing appointments:', error);
          // Proceed with booking anyway in case of error
          this.proceedWithBooking(appointmentDateTimeStr, formValues);
        }
      });
  }
  
  // New method to handle the actual booking logic
  private proceedWithBooking(appointmentDateTimeStr: string, formValues: any): void {
    // Check if doctor ID is valid
    if (!this.data.doctor.id || this.data.doctor.id < 0) {
      console.log('Invalid doctor ID detected, fetching current doctor ID from API');
      
      try {
        // Utiliser l'endpoint dédié qui existe déjà dans le backend
        const apiUrl = `${environment.apiUrl}/api/v1/api/appointments/current-doctor-id`;
        
        this.http.get(apiUrl, { 
          headers: this.appointmentService['getHeaders']() 
        }).subscribe({
          next: (response: any) => {
            console.log('Current doctor ID response:', response);
            if (response && response.id) {
              const doctorId = response.id;
              console.log('Retrieved doctor ID from API:', doctorId);
              
              this.submitWithDoctorId(
                doctorId,
                this.data.patient.id, 
                appointmentDateTimeStr, 
                formValues.appointmentType, 
                formValues.caseType, 
                formValues.notes || ''
              );
            } else {
              this.handleSubmitError('Impossible de récupérer l\'ID du médecin');
            }
          },
          error: (error) => {
            console.error('Error retrieving doctor ID:', error);
            this.handleSubmitError('Erreur lors de la récupération de l\'ID du médecin');
            this.submitting = false;
          }
        });
      } catch (error) {
        console.error('Error processing doctor ID request:', error);
        this.handleSubmitError('Erreur lors de la récupération des informations du médecin');
        this.submitting = false;
      }
    } else {
      // Use the provided doctor ID
      this.submitWithDoctorId(
        this.data.doctor.id, 
        this.data.patient.id, 
        appointmentDateTimeStr, 
        formValues.appointmentType, 
        formValues.caseType, 
        formValues.notes || ''
      );
    }
  }
  
  private submitWithDoctorId(doctorId: number, patientId: number, appointmentDateTime: string, 
                            appointmentType: AppointmentType, caseType: CaseType, notes: string): void {
    
    console.log('Submitting with doctor ID:', doctorId);
    
    const appointmentRequest = {
      patientId: patientId,
      doctorId: doctorId,
      appointmentDateTime: appointmentDateTime,
      appointmentType: appointmentType,
      caseType: caseType,
      notes: notes
    };
    
    console.log('Appointment request payload:', JSON.stringify(appointmentRequest));
    
    try {
      // Use service's getHeaders method which throws error if token missing
      const headers = this.appointmentService['getHeaders']();
      console.log('Request headers:', headers.keys());
      
      // Get token from localStorage for debugging
      const token = localStorage.getItem('access_token');
      if (token) {
        // Debug token format
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload:', {
              id: payload.id,
              sub: payload.sub,
              roles: payload.authorities || [],
              exp: new Date(payload.exp * 1000).toLocaleString()
            });
          } catch (e) {
            console.error('Error parsing token payload:', e);
          }
        } else {
          console.error('Token format is incorrect, expected 3 parts but got:', tokenParts.length);
        }
      } else {
        console.error('No token found in localStorage');
      }
      
      // Use only the specified URL format
      const apiUrl = `${environment.apiUrl}/api/v1/api/appointments/book-by-doctor`;
      console.log('Using API URL:', apiUrl);
      
      this.http.post(apiUrl, appointmentRequest, { headers, observe: 'response' })
        .subscribe({
          next: (response) => {
            console.log('Full response:', response);
            console.log('Appointment created successfully, status code:', response.status);
            this.submitting = false;
            this.dialogRef.close(response.body);
          },
          error: (error) => {
            console.error('Error creating appointment:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            console.error('Error details:', error.error);
            this.handleSubmitError(error.error?.error || 'Erreur lors de la création du rendez-vous');
          }
        });
    } catch (err) {
      console.error('Error preparing request:', err);
      // Use type assertion to handle unknown type
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      this.handleSubmitError('Erreur d\'authentification: ' + errorMessage);
      this.submitting = false;
    }
  }
  
  private handleSubmitError(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 5000 });
    this.submitting = false;
  }
} 