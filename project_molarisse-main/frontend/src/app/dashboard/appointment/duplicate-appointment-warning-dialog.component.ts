import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Appointment } from '../../core/services/appointment.service';

export interface DuplicateAppointmentWarningData {
  existingAppointment: Appointment;
  patientName: string;
}

@Component({
  selector: 'app-duplicate-appointment-warning-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DatePipe
  ],
  template: `
    <h2 mat-dialog-title class="warning-title">
      <mat-icon color="warn">warning</mat-icon>
      Attention : Rendez-vous déjà prévu
    </h2>
    
    <mat-dialog-content>
      <div class="warning-message">
        <p><strong>{{ data.patientName }}</strong> a déjà un rendez-vous prévu ce jour :</p>
        
        <div class="existing-appointment">
          <div class="appointment-details">
            <p><strong>Date :</strong> {{ data.existingAppointment.appointmentDateTime | date:'dd MMMM yyyy':'':'fr' }}</p>
            <p><strong>Heure :</strong> {{ data.existingAppointment.appointmentDateTime | date:'HH:mm':'':'fr' }}</p>
            <p><strong>Médecin :</strong> Dr. {{ data.existingAppointment.doctor?.nom }} {{ data.existingAppointment.doctor?.prenom }}</p>
            <p><strong>Type :</strong> {{ data.existingAppointment.appointmentType }}</p>
          </div>
        </div>
        
        <p class="warning-info">
          <mat-icon>info</mat-icon>
          Pour votre information, notre politique permet généralement un seul rendez-vous par jour par patient.
        </p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Annuler</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        Créer quand même
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
    }
    
    .warning-message {
      margin: 16px 0;
    }
    
    .existing-appointment {
      background-color: #f9f9f9;
      border-left: 4px solid #f44336;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    
    .appointment-details p {
      margin: 8px 0;
    }
    
    .warning-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background-color: #fff8e1;
      border-radius: 4px;
      color: #ff8f00;
    }
  `]
})
export class DuplicateAppointmentWarningDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DuplicateAppointmentWarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DuplicateAppointmentWarningData
  ) {}
} 