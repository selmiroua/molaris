import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>
        <mat-icon [color]="data.action === 'approve' ? 'primary' : 'warn'">
          {{ data.action === 'approve' ? 'check_circle' : 'cancel' }}
        </mat-icon>
        {{ data.action === 'approve' ? 'Approuver la vérification' : 'Refuser la vérification' }}
      </h2>
      
      <mat-dialog-content>
        <p>
          {{ data.action === 'approve' 
            ? 'Êtes-vous sûr de vouloir approuver cette demande de vérification de médecin ?' 
            : 'Êtes-vous sûr de vouloir refuser cette demande de vérification de médecin ?' 
          }}
        </p>
        
        <p *ngIf="data.doctorInfo" class="doctor-info">
          <strong>Dr. {{ data.doctorInfo }}</strong>
        </p>
        
        <mat-form-field *ngIf="data.action === 'reject'" appearance="outline" class="message-field">
          <mat-label>Message de refus (optionnel)</mat-label>
          <textarea matInput [(ngModel)]="message" rows="4" placeholder="Indiquez la raison du refus..."></textarea>
        </mat-form-field>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Annuler</button>
        <button 
          mat-raised-button 
          [color]="data.action === 'approve' ? 'primary' : 'warn'"
          [mat-dialog-close]="data.action === 'reject' ? message : true">
          {{ data.action === 'approve' ? 'Approuver' : 'Refuser' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 1rem;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #2c3e50;
    }
    
    mat-dialog-content {
      overflow-y: auto;
      max-height: calc(80vh - 120px);
    }
    
    p {
      color: #4b5563;
      margin-bottom: 1rem;
    }
    
    .doctor-info {
      background-color: #f8fafc;
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
      color: #334155;
    }
    
    .message-field {
      width: 100%;
      margin-top: 1rem;
    }
    
    mat-dialog-actions {
      padding-top: 1rem;
    }
  `]
})
export class ConfirmationDialogComponent {
  message: string = '';
  
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      action: 'approve' | 'reject';
      doctorInfo?: string;
    }
  ) {}
} 