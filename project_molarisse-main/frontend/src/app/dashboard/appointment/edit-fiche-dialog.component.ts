import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppointmentService } from '../../core/services/appointment.service';
import { FichePatient } from '../../core/services/patient.service';

interface EditFicheDialogData {
  appointment: any;
  fichePatient: FichePatient;
}

@Component({
  selector: 'app-edit-fiche-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    HttpClientModule
  ],
  template: `
    <div class="edit-fiche-dialog">
      <h2 mat-dialog-title>
        <mat-icon>edit</mat-icon>
        Modifier la fiche patient
      </h2>
      
      <mat-dialog-content>
        <div *ngIf="isLoading" class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Mise à jour en cours...</p>
        </div>
        
        <form [formGroup]="ficheForm" *ngIf="!isLoading" class="fiche-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>État général / Antécédents médicaux</mat-label>
            <textarea 
              matInput 
              formControlName="medicalHistory" 
              placeholder="Informations sur l'état de santé général"
              rows="2"
            ></textarea>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Allergies</mat-label>
            <textarea 
              matInput 
              formControlName="allergies" 
              placeholder="Allergies connues du patient"
              rows="2"
            ></textarea>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observations dentaires</mat-label>
            <textarea 
              matInput 
              formControlName="dentalObservations" 
              placeholder="Notes sur l'état bucco-dentaire"
              rows="2"
            ></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false" [disabled]="isLoading">
          Annuler
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="saveFiche()" 
          [disabled]="ficheForm.invalid || isLoading"
        >
          <mat-icon>save</mat-icon>
          Enregistrer
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .edit-fiche-dialog {
      padding: 0;
      max-width: 600px;
      max-height: 80vh;
      width: 100%;
      overflow: hidden;
    }
    
    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 12px 20px;
      background: linear-gradient(to right, #f5f7ff, #ffffff);
      border-bottom: 1px solid #eaeaea;
    }
    
    mat-dialog-content {
      padding: 16px;
      max-height: 60vh;
      overflow-y: auto;
    }
    
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      gap: 12px;
    }
    
    .fiche-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .full-width {
      width: 100%;
    }
    
    textarea {
      max-height: 100px;
    }
  `]
})
export class EditFicheDialogComponent {
  ficheForm: FormGroup;
  isLoading = false;
  
  constructor(
    public dialogRef: MatDialogRef<EditFicheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditFicheDialogData,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {
    this.ficheForm = this.fb.group({
      medicalHistory: [data.fichePatient?.etatGeneral || '', Validators.maxLength(1000)],
      allergies: [data.fichePatient?.allergies || '', Validators.maxLength(500)],
      dentalObservations: [data.fichePatient?.observationsDentaires || '', Validators.maxLength(1000)]
    });
  }
  
  saveFiche(): void {
    if (this.ficheForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    const editData = {
      medicalHistory: this.ficheForm.value.medicalHistory,
      allergies: this.ficheForm.value.allergies,
      dentalObservations: this.ficheForm.value.dentalObservations
    };
    
    this.appointmentService.updateFichePatient(this.data.appointment.id, editData).subscribe({
      next: (result) => {
        console.log('Fiche patient updated:', result);
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error updating fiche patient:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la mise à jour de la fiche patient', 'Fermer', { duration: 5000 });
      }
    });
  }
} 