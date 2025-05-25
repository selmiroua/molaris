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
import { Appointment } from '../../core/services/appointment.service';

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
    MatIconModule
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
            <input matInput [matDatepicker]="picker" formControlName="date">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="rescheduleForm.get('date')?.hasError('required')">
              La date est requise
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Heure</mat-label>
            <input matInput type="time" formControlName="time">
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
        [disabled]="rescheduleForm.invalid || loading"
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
  
  constructor(
    public dialogRef: MatDialogRef<RescheduleAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RescheduleDialogData,
    private fb: FormBuilder
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
      
      this.rescheduleForm.patchValue({
        date: appointmentDate,
        time: this.formatTimeForInput(appointmentDate)
      });
    }
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
    const newDate = formValues.date;
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