import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  date: string;
  start: Date;
}

@Component({
  selector: 'app-confirm-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>Créer un rendez-vous</h2>
      <mat-dialog-content>
        <div class="dialog-content">
          <div class="icon-container">
            <mat-icon class="calendar-icon">event_available</mat-icon>
          </div>
          <div class="message">
            <p>Vous avez sélectionné le créneau suivant :</p>
            <p class="date-time">{{ data.date }}</p>
            <p>Souhaitez-vous créer un rendez-vous pour un patient non inscrit ?</p>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" (click)="onCreate()">
          Créer un rendez-vous
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 10px;
    }
    
    .dialog-content {
      display: flex;
      align-items: center;
      margin: 20px 0;
    }
    
    .icon-container {
      margin-right: 20px;
    }
    
    .calendar-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }
    
    .message {
      flex: 1;
    }
    
    .date-time {
      font-weight: bold;
      font-size: 18px;
      color: #1976d2;
      margin: 10px 0;
    }
    
    mat-dialog-actions {
      padding: 10px 0;
    }
  `]
})
export class ConfirmAppointmentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  onCreate(): void {
    this.dialogRef.close('create');
  }
} 