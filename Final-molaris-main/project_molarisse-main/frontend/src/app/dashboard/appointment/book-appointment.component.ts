import { Component, OnInit, Inject, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { AppointmentService, AppointmentType, CaseType, AppointmentStatus } from '../../core/services/appointment.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';

// Define this inline instead of importing from a non-existent file
export interface User {
  id: number;
  nom: string;
  prenom: string;
  specialization: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  profilePicturePath?: string;
  ville?: string;
  specialite?: string;
  specialities?: string[];
  isAvailable?: boolean;
  verificationStatus?: string;
}

interface DoctorAppointment {
  appointmentDateTime: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
}

// Add interface for the dialog data to include edit mode
export interface AppointmentFormDialogData {
  doctor: User;
  isEdit?: boolean;
  appointment?: any;
}

@Component({
  selector: 'app-appointment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <div class="appointment-dialog">
      <div class="timeline-container">
        <div class="timeline">
          <div class="timeline-step active">
            <div class="step-icon">
              <mat-icon>person</mat-icon>
            </div>
            <div class="step-label">Infos Patient</div>
          </div>
          <div class="timeline-connector active"></div>
          <div class="timeline-step active">
            <div class="step-icon">
              <mat-icon>event</mat-icon>
            </div>
            <div class="step-label">Détails RDV</div>
          </div>
          <div class="timeline-connector active"></div>
          <div class="timeline-step active">
            <div class="step-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="step-label">Confirmation Auto</div>
          </div>
        </div>
      </div>

      <h2 mat-dialog-title>
        <div class="dialog-header">
          <div class="doctor-avatar">
            <div *ngIf="!doctor.profilePicture" class="avatar-initials">
              {{ doctor.prenom[0] }}{{ doctor.nom[0] }}
            </div>
            <img *ngIf="doctor.profilePicture" [src]="doctor.profilePicture" alt="Photo du médecin">
          </div>
          <div class="dialog-title-content">
            <span class="appointment-with">Rendez-vous avec</span>
            <span class="doctor-name">Dr. {{ doctor.prenom }} {{ doctor.nom }}</span>
            <span class="doctor-specialization" *ngIf="doctor.specialization">{{ doctor.specialization }}</span>
          </div>
        </div>
        <button mat-icon-button class="close-button" (click)="closeDialog()" [disabled]="submitting">
          <mat-icon>close</mat-icon>
        </button>
      </h2>

      <mat-dialog-content>
        <div class="booking-rules">
          <mat-icon class="warning-icon">warning</mat-icon>
          <span><strong>Important:</strong> Vous ne pouvez avoir qu'un seul rendez-vous par jour, quel que soit le médecin. Les dates où vous avez déjà un rendez-vous ne sont pas disponibles.</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-section">
            <h3 class="section-label">
              <mat-icon>event</mat-icon> Date et Heure
            </h3>
            <div class="form-row date-time-section">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Date du rendez-vous</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="appointmentDate"
                       [min]="minDate" placeholder="Choisir une date" [matDatepickerFilter]="dateFilter">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="form.get('appointmentDate')?.hasError('required')">
                  La date est obligatoire
                </mat-error>
              </mat-form-field>

              <div class="time-slots-container">
                <h4>Horaires disponibles</h4>
                <div class="time-slots-grid">
                  <button type="button"
                          *ngFor="let slot of allTimeSlots"
                          [class.selected]="form.get('appointmentTime')?.value === slot.time"
                          [class.unavailable]="!slot.available"
                          [disabled]="!slot.available"
                          (click)="selectTimeSlot(slot.time)"
                          mat-stroked-button>
                    {{ slot.time }}
                    <span class="slot-status" *ngIf="!slot.available">(Indisponible)</span>
                  </button>
                </div>
                <mat-error *ngIf="form.get('appointmentTime')?.hasError('required') && form.get('appointmentTime')?.touched">
                  L'heure est obligatoire
                </mat-error>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-label">
              <mat-icon>medical_services</mat-icon> Détails médicaux
            </h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Type de cas</mat-label>
                <mat-select formControlName="caseType" required>
                  <mat-option [value]="CaseType.URGENT">Urgent</mat-option>
                  <mat-option [value]="CaseType.CONTROL">Contrôle</mat-option>
                  <mat-option [value]="CaseType.NORMAL">Normal</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('caseType')?.hasError('required')">
                  Veuillez sélectionner le type de cas
                </mat-error>
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
                <mat-error *ngIf="form.get('appointmentType')?.hasError('required')">
                  Veuillez sélectionner le type de rendez-vous
                </mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-label">
              <mat-icon>note</mat-icon> Informations complémentaires
            </h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (optionnel)</mat-label>
              <textarea matInput rows="4" formControlName="notes" placeholder="Décrivez votre situation ou ajoutez des informations utiles pour le médecin"></textarea>
            </mat-form-field>
          </div>

          <div class="action-buttons">
            <button mat-button type="button" (click)="closeDialog()" [disabled]="submitting" class="cancel-button">
              Annuler
            </button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting" class="submit-button">
              <mat-icon>check_circle</mat-icon>
              {{ submitting ? 'Réservation en cours...' : 'Confirmer le rendez-vous automatique' }}
            </button>
          </div>
        </form>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      padding: 0;
      position: relative;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .booking-rules {
      display: flex;
      align-items: center;
      background-color: #fff3e0;
      padding: 15px 18px;
      border-radius: 8px;
      margin-bottom: 25px;
      border-left: 4px solid #ff9800;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .booking-rules .warning-icon {
      color: #ff9800;
      margin-right: 14px;
      flex-shrink: 0;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .booking-rules span {
      font-size: 15px;
      color: #333;
      line-height: 1.5;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      padding-right: 40px;
    }

    .close-button {
      position: absolute;
      top: 16px;
      right: 16px;
    }

    mat-dialog-title {
      padding: 24px 24px 0;
      margin: 0;
    }

    .dialog-title-content {
      display: flex;
      flex-direction: column;
    }

    .appointment-with {
      font-size: 14px;
      color: #757575;
      margin-bottom: 4px;
    }

    .doctor-name {
      font-size: 24px;
      font-weight: 500;
      color: #2196F3;
      margin-bottom: 4px;
    }

    .doctor-specialization {
      font-size: 14px;
      color: #424242;
    }

    .doctor-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 15px;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.1);
      margin-top: 10px;
    }

    .avatar-initials {
      color: white;
      font-size: 24px;
      font-weight: 500;
    }

    .doctor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    mat-dialog-content {
      padding: 24px;
      max-height: calc(70vh);
      overflow-y: auto;
      flex: 1;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .section-label {
      display: flex;
      align-items: center;
      color: #2196F3;
      font-size: 16px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .section-label mat-icon {
      margin-right: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .cancel-button {
      color: #757575;
    }

    .submit-button {
      min-width: 200px;
      background-color: rgb(35, 107, 188);
      color: white;
    }

    .submit-button mat-icon {
      margin-right: 8px;
    }

    .submit-button:hover {
      background-color: rgb(27, 72, 140);
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .action-buttons {
        flex-direction: column-reverse;
      }

      .submit-button, .cancel-button {
        width: 100%;
      }
    }

    .success-prompt {
      text-align: center;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 12px;
      margin: 20px;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      animation: scaleIn 0.5s ease-out;
    }

    .success-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }

    .success-prompt h2 {
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 500;
      color: #2c3e50;
    }

    .success-prompt p {
      font-size: 18px;
      color: #34495e;
      margin-bottom: 32px;
    }

    .prompt-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      width: 100%;
      max-width: 400px;
    }

    .prompt-actions button {
      flex: 1;
      padding: 12px 24px;
      border-radius: 30px;
      font-weight: 500;
      min-width: 150px;
      transition: all 0.3s ease;
    }

    .prompt-actions button:first-child {
      background-color: #f5f5f5;
      color: #757575;
    }

    .prompt-actions button:first-child:hover {
      background-color: #e0e0e0;
    }

    .prompt-actions button:last-child {
      background-color: #2196F3;
      color: white;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    }

    .prompt-actions button:last-child:hover {
      background-color: #1976D2;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .timeline-container {
      padding: 24px 24px 0;
      background: linear-gradient(135deg, #f5f5f5, #ffffff);
      border-bottom: 1px solid #e0e0e0;
    }

    .timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      position: relative;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .step-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }

    .step-icon mat-icon {
      color: #757575;
      transition: all 0.3s ease;
    }

    .step-label {
      font-size: 12px;
      color: #757575;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .timeline-connector {
      flex: 1;
      height: 2px;
      background-color: #e0e0e0;
      margin: 0 8px;
      position: relative;
      top: -20px;
      transition: all 0.3s ease;
    }

    .timeline-step.active .step-icon {
      background-color: #2196F3;
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
    }

    .timeline-step.active .step-icon mat-icon {
      color: white;
    }

    .timeline-step.active .step-label {
      color: #2196F3;
      font-weight: 600;
    }

    .timeline-step.completed .step-icon {
      background-color: #4CAF50;
    }

    .timeline-step.completed .step-icon mat-icon {
      color: white;
    }

    .timeline-connector.active {
      background-color: #2196F3;
    }

    @keyframes progressAnimation {
      from { width: 0; }
      to { width: 100%; }
    }

    .timeline-connector.active::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: #4CAF50;
      animation: progressAnimation 0.5s ease forwards;
    }

    .date-time-section {
      flex-direction: column;
      gap: 20px;
    }

    .time-slots-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .time-slots-container h4 {
      margin: 0 0 16px 0;
      color: #2196F3;
      font-size: 16px;
      font-weight: 500;
    }

    .time-slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
      max-height: 180px;
      overflow-y: auto;
      padding: 5px;
    }

    .time-slots-grid button {
      position: relative;
      padding: 8px 0;
      min-width: unset;
      line-height: 24px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      border-color: #ddd;
      transition: all 0.2s ease;
    }

    .time-slots-grid button.unavailable {
      opacity: 0.7;
      background-color: #f5f5f5;
      border-color: #ddd;
      cursor: not-allowed;
    }

    .time-slots-grid button:not(.unavailable) {
      background-color: #ffffff;
      border-color: #2196F3;
      color: #2196F3;
    }

    .time-slots-grid button:not(.unavailable):hover {
      background-color: rgba(35, 107, 188, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(35, 107, 188, 0.2);
    }

    .time-slots-grid button.selected:not(.unavailable) {
      background-color: rgb(35, 107, 188);
      color: white;
      border-color: rgb(35, 107, 188);
      box-shadow: 0 2px 5px rgba(35, 107, 188, 0.3);
      transform: translateY(-2px);
    }

    .slot-status {
      display: block;
      font-size: 11px;
      color: #f44336;
      margin-top: 2px;
    }

    @media (max-width: 600px) {
      .time-slots-grid {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      }

      .time-slots-grid button {
        font-size: 13px;
        padding: 6px;
      }
    }

    .specialty-disponible {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      width: 100%;
    }

    .specialty-info {
      color: #4c6ef5;
      font-weight: 600;
      font-size: 14px;
    }

    .available-badge {
      color: #4caf50;
      font-weight: 500;
      font-size: 14px;
    }
    .vertical-bar {
      position: absolute;
      left: 0;
      top: 220px;
      bottom: 0;
      width: 6px;
      background-color: #4c6ef5;
      z-index: 1;
    }

    .specialty-text {
      color: #4c6ef5;
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      white-space: normal;
      max-width: 70%;
      overflow-wrap: break-word;
      text-align: left;
    }

    .disponible-text {
      color: #4caf50;
      font-weight: 500;
      font-size: 14px;
      text-align: center;
      margin: 0 0 15px 0;
      padding: 0;
      width: 100%;
    }

    .specialty-disponible-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: 10px 0;
      width: 100%;
      padding: 0 15px;
      flex-wrap: wrap;
    }
  `]
})
export class AppointmentFormDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  submitting = false;
  CaseType = CaseType;
  AppointmentType = AppointmentType;
  availableTimeSlots: string[] = [];
  minDate = new Date();
  doctorAppointments: DoctorAppointment[] = [];
  patientAppointments: any[] = [];
  disabledDates: Date[] = [];
  isEditMode = false;
  appointmentBeingEdited: any = null;
  doctor: User;

  // Add this property to store all time slots with their availability
  allTimeSlots: { time: string; available: boolean }[] = [];

  appointmentDurations: { [key in AppointmentType]: number } = {
    DETARTRAGE: 30,
    SOIN: 45,
    EXTRACTION: 60,
    BLANCHIMENT: 90,
    ORTHODONTIE: 60
  };

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private dialogRef: MatDialogRef<AppointmentFormDialogComponent>,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentFormDialogData,
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Get doctor from data
    this.doctor = data.doctor;
    
    // Check if we're in edit mode
    this.isEditMode = !!data.isEdit;
    this.appointmentBeingEdited = data.appointment;
    
    // Set minDate to today
    this.minDate.setHours(0, 0, 0, 0);

    // Initialize form
    this.form = this.fb.group({
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      caseType: [CaseType.NORMAL, Validators.required],
      appointmentType: [AppointmentType.DETARTRAGE, Validators.required],
      notes: ['']
    });

    // Subscribe to changes
    this.form.get('appointmentDate')?.valueChanges.subscribe(() => {
      this.updateAvailableTimeSlots();
    });

    this.form.get('appointmentType')?.valueChanges.subscribe(() => {
      this.updateAvailableTimeSlots();
    });
  }

  ngOnInit() {
    // Load patient's existing appointments first, then doctor's appointments
    this.loadPatientAppointments();
    
    // Load doctor's appointments
    this.loadDoctorAppointments();
    
    // If in edit mode, pre-fill the form with appointment data
    if (this.isEditMode && this.appointmentBeingEdited) {
      const appointmentDate = new Date(this.appointmentBeingEdited.appointmentDateTime);
      
      // Format time as HH:MM
      const hours = appointmentDate.getHours().toString().padStart(2, '0');
      const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
      const appointmentTime = `${hours}:${minutes}`;
      
      // Set values after a short delay to ensure the form is ready
      setTimeout(() => {
        this.form.patchValue({
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime,
          caseType: this.appointmentBeingEdited.caseType || CaseType.NORMAL,
          appointmentType: this.appointmentBeingEdited.appointmentType || AppointmentType.DETARTRAGE,
          notes: this.appointmentBeingEdited.notes || ''
        });
      }, 100);
    }
  }

  private loadPatientAppointments() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/appointments/my-appointments`, { headers }).subscribe({
      next: (appointments) => {
        console.log('Patient appointments loaded:', appointments);
        this.patientAppointments = appointments;
        
        // Process appointments to get days that should be disabled
        this.updateDisabledDates();
      },
      error: (error) => {
        console.error('Error loading patient appointments:', error);
        this.snackBar.open('Erreur lors du chargement de vos rendez-vous', 'Fermer', { duration: 3000 });
      }
    });
  }

  private updateDisabledDates() {
    this.disabledDates = [];
    
    // Get booked dates from patient appointments
    if (this.patientAppointments && this.patientAppointments.length > 0) {
      this.patientAppointments.forEach(appointment => {
        // Only consider active appointments (PENDING or ACCEPTED)
        if (appointment.status === 'PENDING' || appointment.status === 'ACCEPTED') {
          const appointmentDate = new Date(appointment.appointmentDateTime);
          
          // Reset time to start of day
          appointmentDate.setHours(0, 0, 0, 0);
          
          // Check if already in disabledDates to avoid duplicates
          const alreadyDisabled = this.disabledDates.some(
            disabledDate => 
              disabledDate.getDate() === appointmentDate.getDate() &&
              disabledDate.getMonth() === appointmentDate.getMonth() &&
              disabledDate.getFullYear() === appointmentDate.getFullYear()
          );
          
          if (!alreadyDisabled) {
            console.log(`Disabling date: ${appointmentDate.toLocaleDateString()}`);
            this.disabledDates.push(appointmentDate);
          }
        }
      });
    }
  }

  private loadDoctorAppointments() {
    console.log('Loading appointments for doctor:', this.doctor.id);

    this.appointmentService.getDoctorAppointments(this.doctor.id).subscribe({
      next: (appointments) => {
            console.log('DEBUG - All appointments received:', appointments);

            // Store all appointments
        this.doctorAppointments = appointments;

            // Log each appointment's details
            appointments.forEach(apt => {
                console.log('Appointment details:', {
                    dateTime: apt.appointmentDateTime,
                    parsedDate: new Date(apt.appointmentDateTime).toLocaleString(),
                    status: apt.status,
                    type: apt.appointmentType
                });
            });

            // Log only accepted appointments
            const acceptedAppointments = appointments.filter(apt => {
                const isAccepted = apt.status === 'ACCEPTED';
                console.log(`Appointment status check:`, {
                    appointmentTime: new Date(apt.appointmentDateTime).toLocaleString(),
                    status: apt.status,
                    isAccepted: isAccepted
                });
                return isAccepted;
            });

            console.log('DEBUG - Accepted appointments:', acceptedAppointments);

            // Update time slots if we have a selected date and type
        const selectedDate = this.form.get('appointmentDate')?.value;
        const selectedType = this.form.get('appointmentType')?.value;
        if (selectedDate && selectedType) {
          this.generateAvailableTimeSlots(selectedDate, selectedType);
        }
      },
      error: (error) => {
        console.error('Error loading doctor appointments:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
        this.doctorAppointments = [];
        this.allTimeSlots = [];
        this.availableTimeSlots = [];
      }
    });
  }

  private updateAvailableTimeSlots() {
    const selectedDate = this.form.get('appointmentDate')?.value;
    const selectedType = this.form.get('appointmentType')?.value;

    if (!selectedDate || !selectedType || !this.doctorAppointments) {
      this.allTimeSlots = [];
      this.availableTimeSlots = [];
      return;
    }

    // Check if this date has any existing patient appointments
    if (this.patientAppointments && this.patientAppointments.length > 0) {
      // Convert to Date object if it isn't already
      const date = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      date.setHours(0, 0, 0, 0);
      
      const hasAppointmentOnDay = this.patientAppointments.some(apt => {
        // Only consider pending or accepted appointments
        if (apt.status !== 'PENDING' && apt.status !== 'ACCEPTED') {
          return false;
        }
        
        const aptDate = new Date(apt.appointmentDateTime);
        aptDate.setHours(0, 0, 0, 0);
        return date.getTime() === aptDate.getTime();
      });
      
      if (hasAppointmentOnDay) {
        this.snackBar.open(
          'Vous avez déjà un rendez-vous ce jour. Vous ne pouvez pas avoir plus d\'un rendez-vous par jour.',
          'Fermer',
          { duration: 5000 }
        );
        
        // Reset the date and time slots
        this.form.get('appointmentDate')?.setValue(null);
        this.allTimeSlots = [];
        this.availableTimeSlots = [];
        return;
      }
    }

    // Convert to Date object if it isn't already
    const date = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

    // Reset time to start of day to avoid timezone issues
    date.setHours(0, 0, 0, 0);

    this.generateAvailableTimeSlots(date, selectedType);
  }

  private generateAvailableTimeSlots(date: Date, appointmentType: AppointmentType) {
    console.log('DEBUG - Generating time slots for date:', date);

    // Reset available time slots
    this.availableTimeSlots = [];
    this.allTimeSlots = [];

    // Create a new date object at the start of the selected day in local timezone
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Get all ACCEPTED appointments for the selected date
    const dayAppointments = this.doctorAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDateTime);
        const appointmentDayStart = new Date(appointmentDate);
        appointmentDayStart.setHours(0, 0, 0, 0);

        const isOnSelectedDate = appointmentDayStart.getTime() === selectedDate.getTime();
        const isAccepted = appointment.status === 'ACCEPTED';

        console.log('Checking appointment:', {
            date: appointmentDate.toLocaleString(),
            status: appointment.status,
            isOnSelectedDate,
            isAccepted
        });

        return isOnSelectedDate && isAccepted;
    });

    console.log('Accepted appointments for selected date:', dayAppointments.map(apt => ({
        time: new Date(apt.appointmentDateTime).toLocaleTimeString(),
        status: apt.status
    })));

    // Generate all possible time slots between 8:00 and 17:00
    for (let hour = 8; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            // Check if this exact time matches with any accepted appointment
            const isSlotTaken = dayAppointments.some(appointment => {
                const appointmentDate = new Date(appointment.appointmentDateTime);
                const appointmentHour = appointmentDate.getHours();
                const appointmentMinute = appointmentDate.getMinutes();

                const isMatch = appointmentHour === hour && appointmentMinute === minute;
                if (isMatch) {
                    console.log(`Slot ${timeSlot} matches with accepted appointment at ${appointmentDate.toLocaleString()}`);
                }
                return isMatch;
            });

            // A slot is available if it doesn't match any accepted appointment
            const available = !isSlotTaken;

            this.allTimeSlots.push({
                time: timeSlot,
                available: available
            });

            if (available) {
                this.availableTimeSlots.push(timeSlot);
            }
        }
    }

    // Sort the time slots
    this.allTimeSlots.sort((a, b) => a.time.localeCompare(b.time));

    console.log('Time slots status:', this.allTimeSlots.map(slot => ({
        time: slot.time,
        available: slot.available
    })));
  }

  private checkTimeSlotOverlap(
    hour: number,
    minute: number,
    duration: number,
    dayAppointments: DoctorAppointment[],
    selectedDate: Date
  ): boolean {
    // Create start and end times for the proposed slot
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + duration);

    // Add buffer times (15 minutes before and after)
    const bufferStart = new Date(slotStart);
    bufferStart.setMinutes(bufferStart.getMinutes() - 15);
    const bufferEnd = new Date(slotEnd);
    bufferEnd.setMinutes(bufferEnd.getMinutes() + 15);

    // Check against each existing appointment
    return dayAppointments.some(appointment => {
      const appointmentDateTime = new Date(appointment.appointmentDateTime);
      const appointmentDuration = this.appointmentDurations[appointment.appointmentType];
      const appointmentEnd = new Date(appointmentDateTime);
      appointmentEnd.setMinutes(appointmentDateTime.getMinutes() + appointmentDuration);

      // Debug logging
      console.log('Checking overlap:', {
        slot: `${hour}:${minute}`,
        slotStart: slotStart.toLocaleTimeString(),
        slotEnd: slotEnd.toLocaleTimeString(),
        appointmentStart: appointmentDateTime.toLocaleTimeString(),
        appointmentEnd: appointmentEnd.toLocaleTimeString(),
        bufferStart: bufferStart.toLocaleTimeString(),
        bufferEnd: bufferEnd.toLocaleTimeString()
      });

      // Check if the slots overlap including buffer times
      const hasOverlap = (
        (bufferStart < appointmentEnd && bufferEnd > appointmentDateTime)
      );

      if (hasOverlap) {
        console.log(`Slot ${hour}:${minute} overlaps with appointment at ${appointmentDateTime.toLocaleTimeString()}`);
      }

      return hasOverlap;
    });
  }

  private calculateEndTime(hour: number, minute: number, durationMinutes: number): Date {
    const endTime = new Date();
    endTime.setHours(hour, minute + durationMinutes, 0, 0);
    return endTime;
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;

    const formValues = this.form.value;
    const selectedTime = formValues.appointmentTime;

    // Check if the selected time slot is still available
    const isTimeSlotAvailable = this.allTimeSlots.find(
        slot => slot.time === selectedTime && slot.available
    );

    if (!isTimeSlotAvailable) {
      this.snackBar.open('Cette plage horaire n\'est plus disponible. Veuillez en choisir une autre.', 'Fermer', { duration: 3000 });
      return;
    }

    this.submitting = true;

    // Check for existing appointments first
    const token = localStorage.getItem('access_token');
    if (!token) {
        this.snackBar.open('Erreur: Token d\'authentification manquant', 'Fermer', { duration: 3000 });
      this.submitting = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Create the appointment date from form values
    const appointmentDate = new Date(formValues.appointmentDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    // First get the latest appointments to ensure we have up-to-date data
    this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/appointments/my-appointments`, { headers }).subscribe({
        next: (appointments) => {
            // Update our local cache of appointments
            this.patientAppointments = appointments;
            
            // Check if there's already any appointment on the same day
            const existingAppointmentSameDay = appointments.some(apt => {
                // Skip checking the appointment we're editing
                if (this.isEditMode && this.appointmentBeingEdited && apt.id === this.appointmentBeingEdited.id) {
                  return false;
                }
                
                // Check if it's on the same day, regardless of doctor
                const aptDate = new Date(apt.appointmentDateTime);
                const isSameDay = 
                    aptDate.getDate() === appointmentDate.getDate() &&
                    aptDate.getMonth() === appointmentDate.getMonth() &&
                    aptDate.getFullYear() === appointmentDate.getFullYear();
                
                // Only consider pending or accepted appointments
                const isActiveAppointment = apt.status === 'PENDING' || apt.status === 'ACCEPTED';
                
                return isSameDay && isActiveAppointment;
            });

            if (existingAppointmentSameDay) {
                this.snackBar.open(
                    'Vous avez déjà un rendez-vous ce jour. Vous ne pouvez pas avoir plus d\'un rendez-vous par jour.',
                    'Fermer',
                    { duration: 5000 }
                );
                this.submitting = false;
                return;
            }

            // If we're in edit mode, use updateAppointment instead of bookAppointment
            if (this.isEditMode && this.appointmentBeingEdited) {
              this.updateExistingAppointment(appointmentDate, formValues);
            } else {
              // Continue with appointment booking
              this.proceedWithBooking(appointmentDate, formValues, hours, minutes, headers);
            }
        },
        error: (error) => {
            console.error('Error checking existing appointments:', error);
            this.snackBar.open('Erreur lors de la vérification des rendez-vous existants.', 'Fermer', { duration: 5000 });
            this.submitting = false;
        }
    });
  }

  private updateExistingAppointment(appointmentDate: Date, formValues: any) {
    // Format the date as an ISO string without the 'Z' at the end for LocalDateTime
    const year = appointmentDate.getFullYear();
    const month = (appointmentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = appointmentDate.getDate().toString().padStart(2, '0');
    const hours = appointmentDate.getHours().toString().padStart(2, '0');
    const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
    
    // LocalDateTime format without timezone (backend uses LocalDateTime)
    const appointmentDateTime = `${year}-${month}-${day}T${hours}:${minutes}:00`;
    
    console.log(`Updating appointment ${this.appointmentBeingEdited.id} with date: ${appointmentDateTime}`);
    
    this.appointmentService.updateAppointment(
      this.appointmentBeingEdited.id,
      appointmentDateTime,
      formValues.notes
    ).subscribe({
      next: (response) => {
        // Refresh patient appointments to update disabled dates
        this.loadPatientAppointments();
        
        this.snackBar.open('Rendez-vous modifié avec succès!', 'Fermer', { duration: 3000 });
        this.submitting = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Erreur lors de la modification du rendez-vous:', err);
        let errorMessage = 'Échec de la modification. Veuillez réessayer.';
        if (err.error && err.error.message) {
            errorMessage = err.error.message;
        } else if (err.error && err.error.error) {
            errorMessage = err.error.error;
        }
        this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
        this.submitting = false;
      }
    });
  }

  private proceedWithBooking(appointmentDate: Date, formValues: any, hours: number, minutes: number, headers: HttpHeaders) {
    // Create a date string that explicitly includes the timezone offset
    const year = appointmentDate.getFullYear();
    const month = (appointmentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = appointmentDate.getDate().toString().padStart(2, '0');
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');

    // Create an ISO string but preserve the local time
    const localISOString = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00.000Z`;

    // Get the patient ID and proceed with appointment creation
    this.http.get<any>(`${environment.apiUrl}/api/v1/api/patients/me`, { headers }).subscribe({
        next: (response) => {
            const appointmentData = {
                patientId: response.id,
                doctorId: this.doctor.id,
                appointmentDateTime: localISOString,
                caseType: formValues.caseType,
                appointmentType: formValues.appointmentType,
                notes: formValues.notes
            };

            // Directly book the appointment
            this.appointmentService.bookAppointment(appointmentData).subscribe({
                next: (response) => {
                    // Refresh patient appointments to update disabled dates
                    this.loadPatientAppointments();
                    
                    this.snackBar.open('Rendez-vous confirmé automatiquement!', 'Fermer', { duration: 3000 });
                    this.submitting = false;
                    this.dialogRef.close(true); // Close dialog and return to doctor list
                },
                error: (err) => {
                    console.error('Erreur lors de la réservation du rendez-vous:', err);
                    let errorMessage = 'Échec de la réservation. Veuillez réessayer.';
                    if (err.error && err.error.error) {
                        errorMessage = err.error.error;
                    }
                    this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
                    this.submitting = false;
                }
            });
        },
        error: (error) => {
            console.error('Error getting patient ID:', error);
            this.snackBar.open('Erreur lors de la récupération des informations du patient', 'Fermer', { duration: 3000 });
            this.submitting = false;
        }
    });
  }

  closeDialog(): void {
    if (this.submitting) {
      return; // Prevent closing while submitting
    }
    this.dialogRef.close(false);
  }

  selectTimeSlot(slot: string) {
    const timeSlot = this.allTimeSlots.find(s => s.time === slot);
    if (timeSlot && timeSlot.available) {
      this.form.patchValue({ appointmentTime: slot });
    }
  }

  isTimeSlotAvailable(slot: string): boolean {
    const timeSlot = this.allTimeSlots.find(s => s.time === slot);
    return timeSlot ? timeSlot.available : false;
  }

  // Date filter function for the datepicker
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    
    // When in edit mode and checking the current appointment's date, always allow it
    if (this.isEditMode && this.appointmentBeingEdited) {
      const appointmentDate = new Date(this.appointmentBeingEdited.appointmentDateTime);
      if (date.getDate() === appointmentDate.getDate() &&
          date.getMonth() === appointmentDate.getMonth() &&
          date.getFullYear() === appointmentDate.getFullYear()) {
        return true;
      }
    }
    
    // Check if this date has any existing appointments
    if (this.patientAppointments && this.patientAppointments.length > 0) {
      const hasAppointmentOnDay = this.patientAppointments.some(apt => {
        // Skip the appointment being edited when checking for conflicts
        if (this.isEditMode && this.appointmentBeingEdited && apt.id === this.appointmentBeingEdited.id) {
          return false;
        }
        
        // Only consider pending or accepted appointments
        if (apt.status !== 'PENDING' && apt.status !== 'ACCEPTED') {
          return false;
        }
        
        const aptDate = new Date(apt.appointmentDateTime);
        return date.getDate() === aptDate.getDate() &&
               date.getMonth() === aptDate.getMonth() &&
               date.getFullYear() === aptDate.getFullYear();
      });
      
      if (hasAppointmentOnDay) {
        // If user somehow tries to select this date (UI should prevent this already)
        setTimeout(() => {
          this.snackBar.open(
            'Vous avez déjà un rendez-vous ce jour. Vous ne pouvez pas avoir plus d\'un rendez-vous par jour.',
            'Fermer',
            { duration: 5000 }
          );
        }, 100);
        return false; // Disable dates with existing appointments
      }
    }
    
    // Default behavior of checking against manually disabled dates
    return !this.disabledDates.some(
      disabledDate => 
        disabledDate.getDate() === date.getDate() &&
        disabledDate.getMonth() === date.getMonth() &&
        disabledDate.getFullYear() === date.getFullYear()
    );
  };

  ngOnDestroy() {
    // Cleanup code if needed
  }
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss']
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  loading = false;
  doctors: User[] = [];
  selectedVilles: string[] = [];
  selectedSpecialites: string[] = [];
  uniqueVilles: string[] = [];
  uniqueSpecialites: string[] = [];
  showFilterPanel: boolean = false;
  sortOption: string = '';
  isMobile: boolean = false;
  
  // Search and filtering
  villeSearchText: string = '';
  specialiteSearchText: string = '';
  filteredVilles: string[] = [];
  filteredSpecialites: string[] = [];

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  // Check if screen is mobile size
  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  // Static lists for all villes and specialites
  allVilles: string[] = [
    'Ariana',
    'Béja',
    'Ben Arous',
    'Bizerte',
    'Gabès',
    'Gafsa',
    'Jendouba',
    'Kairouan',
    'Kasserine',
    'Kébili',
    'Kef',
    'Mahdia',
    'Manouba',
    'Médenine',
    'Monastir',
    'Nabeul',
    'Sfax',
    'Sidi Bouzid',
    'Siliana',
    'Sousse',
    'Tataouine',
    'Tozeur',
    'Tunis',
    'Zaghouan'
  ];
  
  // Complete list of dental specialties
  allSpecialites: string[] = [
    'Chirurgie buccale et maxillo-faciale',
    'Dentisterie esthétique',
    'Dentisterie générale',
    'Dentisterie gériatrique',
    'Dentisterie pédiatrique',
    'Dentisterie préventive',
    'Endodontie',
    'Implantologie',
    'Médecine buccale',
    'Orthodontie',
    'Parodontie',
    'Prothèse dentaire',
    'Radiologie buccale'
  ];

  get filteredDoctors(): User[] {
    let filtered = this.doctors.filter(doc => {
      // Match if no ville filter is selected or if any of the selected villes match
      const villeMatch = this.selectedVilles.length === 0 || 
        (doc.ville && this.selectedVilles.includes(doc.ville));
      
      // Match if no speciality filter is selected or if any of the selected specialities
      // match any of the doctor's specialities
      const specialiteMatch = this.selectedSpecialites.length === 0 || 
        (doc.specialities && doc.specialities.some(spec => this.selectedSpecialites.includes(spec)));
      
      return villeMatch && specialiteMatch;
    });

    // Apply sorting
    return this.sortDoctors(filtered);
  }

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.fetchDoctors();
    this.checkScreenSize();
    
    // Initialize filtered arrays
    this.filteredVilles = [...this.allVilles];
    this.filteredSpecialites = [...this.allSpecialites];
  }

  fetchDoctors(): void {
    this.loading = true;
    const token = localStorage.getItem('access_token');

    if (!token) {
      this.snackBar.open('Erreur d\'authentification. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
      this.loading = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // First get all approved doctor verifications
    this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/doctor-verifications/approved`, { headers }).subscribe({
      next: (approvedVerifications) => {
        console.log('Approved doctor verifications:', approvedVerifications);
        
        if (!approvedVerifications || approvedVerifications.length === 0) {
          this.doctors = [];
          this.loading = false;
          return;
        }
        
        // Extract doctor IDs from approved verifications
        const approvedDoctorIds = approvedVerifications.map(verification => verification.doctorId);
        console.log('Approved doctor IDs:', approvedDoctorIds);
        
        // Then fetch the actual doctor details
    this.http.get<User[]>(`${environment.apiUrl}/api/v1/api/users/doctors`, { headers }).subscribe({
      next: (doctors) => {
        console.log('Raw doctors data from API:', doctors);
        
            // Filter only the approved doctors
            const approvedDoctors = doctors.filter(doc => approvedDoctorIds.includes(doc.id));
            console.log('Filtered approved doctors:', approvedDoctors);
            
            this.doctors = approvedDoctors.map((doc) => ({
          ...doc,
          profilePicture: getProfileImageUrl(doc.profilePicturePath),
          // Keep the original specialities array intact, but still provide a single specialite for display purposes
              specialite: doc.specialities && doc.specialities.length > 0 ? doc.specialities[0] : undefined,
              // Set default availability
              isAvailable: doc.isAvailable !== undefined ? doc.isAvailable : true
        }));

        console.log('Processed doctors with specialities:', this.doctors);

            // Extract unique villes from doctor data
        this.uniqueVilles = Array.from(new Set(this.doctors.map(d => d.ville).filter((v): v is string => Boolean(v))));
        
        // Extract unique specialties from all doctors' specialities arrays
            const doctorSpecialities = this.doctors.flatMap(d => d.specialities || []);
            this.uniqueSpecialites = Array.from(new Set(doctorSpecialities.filter(Boolean)));
        
            console.log('Available specialties from doctors:', this.uniqueSpecialites);
            
            // Combine predefined specialties list with any unique specialties from doctors
            const combinedSpecialities = [...this.allSpecialites];
            
            // Add any doctor specialties that aren't in our predefined list
            this.uniqueSpecialites.forEach(specialty => {
              if (!combinedSpecialities.includes(specialty)) {
                combinedSpecialities.push(specialty);
              }
            });
            
            // Sort alphabetically and update the allSpecialites array
            this.allSpecialites = combinedSpecialities.sort((a, b) => a.localeCompare(b));
            this.filteredSpecialites = [...this.allSpecialites];
            
            console.log('Combined specialties list:', this.allSpecialites);
        
        this.loading = false;
      },
      error: (error) => {
            console.error('Error loading doctors:', error);
        this.snackBar.open('Impossible de charger la liste des médecins. Veuillez réessayer plus tard.', 'Fermer', { duration: 5000 });
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading approved doctor verifications:', error);
        this.snackBar.open('Impossible de charger la liste des médecins vérifiés. Veuillez réessayer plus tard.', 'Fermer', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  // Add trackBy function for doctor cards
  trackByDoctorId(index: number, doctor: User) {
    return doctor.id;
  }

  openAppointmentDialog(doctor: User): void {
    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: this.isMobile ? '100%' : '600px',
      maxWidth: '100vw',
      panelClass: 'appointment-dialog-container',
      data: { doctor: doctor, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Appointment was booked successfully, refresh the existing appointments check
        this.snackBar.open('Rendez-vous réservé avec succès!', 'Fermer', { duration: 3000 });
        this.fetchDoctors();
      }
    });
  }

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  // Method to add a ville to the selectedVilles array
  addVille(ville: string): void {
    if (!this.selectedVilles.includes(ville)) {
      this.selectedVilles.push(ville);
      this.applyFilters();
    }
  }

  // Method to add a specialite to the selectedSpecialites array
  addSpecialite(specialite: string): void {
    if (!this.selectedSpecialites.includes(specialite)) {
      this.selectedSpecialites.push(specialite);
      this.applyFilters();
    }
  }

  // Method to remove a ville from selectedVilles
  removeVille(ville: string): void {
    this.selectedVilles = this.selectedVilles.filter(v => v !== ville);
    this.applyFilters();
  }

  // Method to remove a specialite from selectedSpecialites
  removeSpecialite(specialite: string): void {
    this.selectedSpecialites = this.selectedSpecialites.filter(s => s !== specialite);
    this.applyFilters();
  }

  applyFilters(): void {
    console.log('Applying filters - Villes:', this.selectedVilles, 'Specialités:', this.selectedSpecialites);
    console.log('Filtered doctors count:', this.filteredDoctors.length);
    // The getter will handle the filtering automatically
  }

  clearFilters(): void {
    this.selectedVilles = [];
    this.selectedSpecialites = [];
    this.villeSearchText = '';
    this.specialiteSearchText = '';
    this.filteredVilles = [...this.allVilles];
    this.filteredSpecialites = [...this.allSpecialites];
  }

  applySort(): void {
    // The sorting is handled by the sortDoctors function
  }

  private sortDoctors(doctors: User[]): User[] {
    // If no sort option is selected, return the original array
    if (!this.sortOption) {
      return doctors;
    }
    
    return [...doctors].sort((a, b) => {
      switch (this.sortOption) {
        case 'nomAsc':
          return a.nom.localeCompare(b.nom);
        case 'nomDesc':
          return b.nom.localeCompare(a.nom);
        case 'specialite':
          // Get first specialty or empty string for each doctor for sorting
          const specA = a.specialities && a.specialities.length > 0 ? a.specialities[0] : '';
          const specB = b.specialities && b.specialities.length > 0 ? b.specialities[0] : '';
          return specA.localeCompare(specB);
        case 'ville':
          const villeA = a.ville || '';
          const villeB = b.ville || '';
          return villeA.localeCompare(villeB);
        default:
          return 0;
      }
    });
  }

  ngOnDestroy() {
    // Cleanup code if needed
  }

  // Filter cities based on search text
  filterVilles(): void {
    if (!this.villeSearchText) {
      this.filteredVilles = [...this.allVilles];
    } else {
      const searchText = this.villeSearchText.toLowerCase();
      this.filteredVilles = this.allVilles.filter(
        ville => ville.toLowerCase().includes(searchText)
      );
    }
  }

  // Filter specialties based on search text
  filterSpecialites(): void {
    if (!this.specialiteSearchText) {
      this.filteredSpecialites = [...this.allSpecialites];
    } else {
      const searchText = this.specialiteSearchText.toLowerCase();
      this.filteredSpecialites = this.allSpecialites.filter(
        specialite => specialite.toLowerCase().includes(searchText)
      );
    }
  }
}

function getProfileImageUrl(profilePicturePath?: string): string {
  if (profilePicturePath) {
    try {
      // Remove timestamp to allow browser caching
      const url = `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}`;
      return url;
    } catch (error) {
      return 'assets/images/default-avatar.png';
    }
  }
  return 'assets/images/default-avatar.png';
}
