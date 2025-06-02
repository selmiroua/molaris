import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Appointment, AppointmentService } from '../../core/services/appointment.service';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface RescheduleDialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-reschedule-appointment-dialog',
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
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Replanifier un rendez-vous</h2>
    
    <mat-dialog-content>
      <div class="appointment-info">
        <div class="patient-name">
          <strong>Patient:</strong> {{ data.appointment.patient?.prenom }} {{ data.appointment.patient?.nom }}
        </div>
        <div class="current-date">
          <strong>Date actuelle:</strong> {{ formatCurrentDate() }}
        </div>
        <div class="appointment-type">
          <strong>Type:</strong> {{ data.appointment.appointmentType }} • {{ data.appointment.caseType }}
        </div>
      </div>
      
      <div class="reschedule-form" [formGroup]="rescheduleForm">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nouvelle date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" (dateChange)="onDateChange()" [min]="minDate">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="rescheduleForm.get('date')?.hasError('required')">
              La date est requise
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Heure disponible</mat-label>
            <mat-select formControlName="time">
              <mat-option *ngIf="loadingTimeSlots">
                <mat-spinner diameter="20"></mat-spinner> Chargement...
              </mat-option>
              <mat-option *ngIf="!loadingTimeSlots && availableTimeSlots.length === 0" disabled>
                Aucun créneau disponible pour cette date
              </mat-option>
              <mat-option *ngFor="let slot of availableTimeSlots" [value]="slot">
                {{ slot }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="rescheduleForm.get('time')?.hasError('required')">
              L'heure est requise
            </mat-error>
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="rescheduleForm.invalid || loading || availableTimeSlots.length === 0"
        (click)="onSubmit()"
      >
        <span *ngIf="loading">
          <mat-icon class="spinner">sync</mat-icon>
          Traitement...
        </span>
        <span *ngIf="!loading">Confirmer</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .appointment-info {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .appointment-info > div {
      margin-bottom: 8px;
    }
    
    .form-row {
      margin-bottom: 15px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .spinner {
      animation: spin 1.5s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class RescheduleAppointmentDialogComponent implements OnInit {
  rescheduleForm: FormGroup;
  loading = false;
  loadingTimeSlots = false;
  availableTimeSlots: string[] = [];
  minDate = new Date(); // Set minimum date to today to disable past dates
  
  constructor(
    public dialogRef: MatDialogRef<RescheduleAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RescheduleDialogData,
    private fb: FormBuilder,
    private appointmentService: AppointmentService
  ) {
    this.rescheduleForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    // Initialize form with current appointment date/time
    if (this.data.appointment && this.data.appointment.appointmentDateTime) {
      const appointmentDate = new Date(this.data.appointment.appointmentDateTime);
      
      // If the appointment date is in the past, set it to today
      if (appointmentDate < this.minDate) {
        appointmentDate.setTime(this.minDate.getTime());
      }
      
      this.rescheduleForm.patchValue({
        date: appointmentDate
      });
      
      // Load available time slots for the current date
      this.loadAvailableTimeSlots(appointmentDate);
    }
  }
  
  onDateChange(): void {
    const selectedDate = this.rescheduleForm.get('date')?.value;
    if (selectedDate) {
      // Reset the time field when date changes
      this.rescheduleForm.patchValue({ time: '' });
      
      // Load available time slots for the selected date
      this.loadAvailableTimeSlots(selectedDate);
    }
  }
  
  loadAvailableTimeSlots(date: Date): void {
    if (!date || !this.data.appointment.doctor?.id) {
      return;
    }
    
    this.loadingTimeSlots = true;
    this.availableTimeSlots = [];
    
    // Format date as YYYY-MM-DD
    const formattedDate = this.formatDateForApi(date);
    
    // Get doctor ID from the appointment
    const doctorId = this.data.appointment.doctor.id;
    
    // Call the appointment service to get available time slots, excluding the current appointment
    this.appointmentService.getAvailableTimeSlots(doctorId, formattedDate, this.data.appointment.id)
      .subscribe({
        next: (timeSlots) => {
          this.availableTimeSlots = timeSlots;
          this.loadingTimeSlots = false;
          
          // If there are available slots and the current appointment time is among them,
          // select it by default
          if (timeSlots.length > 0) {
            const currentTime = this.formatTimeForInput(new Date(this.data.appointment.appointmentDateTime));
            if (timeSlots.includes(currentTime)) {
              this.rescheduleForm.patchValue({ time: currentTime });
            } else {
              // Otherwise select the first available slot
              this.rescheduleForm.patchValue({ time: timeSlots[0] });
            }
          }
        },
        error: (error) => {
          console.error('Error loading available time slots:', error);
          this.loadingTimeSlots = false;
        }
      });
  }
  
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  formatCurrentDate(): string {
    if (!this.data.appointment || !this.data.appointment.appointmentDateTime) {
      return 'Non spécifiée';
    }
    
    const date = new Date(this.data.appointment.appointmentDateTime);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatTimeForInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  onSubmit(): void {
    if (this.rescheduleForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const formValues = this.rescheduleForm.value;
    const newDate = new Date(formValues.date);
    const [hours, minutes] = formValues.time.split(':');
    
    // Set the hours and minutes in local time
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    // Format date and time manually to avoid timezone issues
    const year = newDate.getFullYear();
    const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const day = newDate.getDate().toString().padStart(2, '0');
    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes.padStart(2, '0');
    
    // Create ISO format string without timezone conversion: YYYY-MM-DDTHH:MM:SS
    const newDateTimeStr = `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}:00`;
    
    // Return the new date time to the parent component
    this.dialogRef.close(newDateTimeStr);
  }
} 