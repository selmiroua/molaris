import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AppointmentTypeSelectionData {
  date: Date;
}

@Component({
  selector: 'app-appointment-type-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Créer un rendez-vous</h2>
    <mat-dialog-content>
      <p>Pour le {{data.date | date:'EEEE d MMMM yyyy à HH:mm':'':'fr'}}</p>
      <div class="appointment-options">
        <button mat-raised-button color="primary" (click)="selectOption('registered')">
          <mat-icon>person</mat-icon>
          Pour un patient existant
        </button>
        <button mat-raised-button color="accent" (click)="selectOption('unregistered')">
          <mat-icon>person_add</mat-icon>
          Pour un patient non inscrit
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .appointment-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 20px 0;
    }
    
    button {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 12px 16px;
      font-size: 16px;
    }
    
    mat-icon {
      margin-right: 8px;
    }
  `]
})
export class AppointmentTypeSelectionDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<AppointmentTypeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentTypeSelectionData
  ) {}

  selectOption(type: 'registered' | 'unregistered'): void {
    this.dialogRef.close(type);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
} 