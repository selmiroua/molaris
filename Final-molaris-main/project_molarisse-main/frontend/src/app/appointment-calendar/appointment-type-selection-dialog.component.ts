import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CreateFicheDialogComponent } from '../dashboard/appointment/create-fiche-dialog.component';
import { UnregisteredPatientAppointmentDialogComponent } from './unregistered-patient-appointment-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface AppointmentTypeSelectionData {
  date: Date;
  doctorId?: number;
}

@Component({
  selector: 'app-appointment-type-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
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
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 16px;
      background-color: white;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
    }
    
    mat-dialog-content {
      margin-bottom: 16px;
    }
    
    .appointment-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 20px 0;
    }
    
    button[mat-raised-button] {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 12px 16px;
      font-size: 16px;
      width: 100%;
    }
    
    mat-icon {
      margin-right: 8px;
    }
    
    p {
      font-size: 16px;
      margin-bottom: 12px;
    }
    
    h2 {
      margin-top: 0;
      color: #333;
    }
  `]
})
export class AppointmentTypeSelectionDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<AppointmentTypeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentTypeSelectionData,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  selectOption(type: 'registered' | 'unregistered'): void {
    if (type === 'unregistered') {
      // Instead of opening the fiche dialog directly, open the unregistered appointment dialog first
      this.openUnregisteredPatientAppointmentDialog();
    } else {
      this.dialogRef.close(type);
    }
  }

  openUnregisteredPatientAppointmentDialog(): void {
    console.log('Opening unregistered patient dialog with doctorId:', this.data.doctorId);
    
    // Prepare the dialog data
    const dialogData: any = {
      appointmentDateTime: this.data.date,
      formattedDateTime: this.data.date.toISOString()
    };
    
    // Add doctor data if available
    if (this.data.doctorId) {
      dialogData.doctor = { id: this.data.doctorId };
      console.log('Added doctor data to dialog:', JSON.stringify(dialogData));
    }
    
    const appointmentDialog = this.dialog.open(UnregisteredPatientAppointmentDialogComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true
    });

    appointmentDialog.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Appointment created successfully, now we can create the fiche patient
        if (result.appointment && result.appointment.patient && result.appointment.patient.id) {
          this.openCreateFicheDialog(result.appointment.patient.id, 
                                    result.appointment.patient.nom, 
                                    result.appointment.patient.prenom);
        } else {
          // Just close the dialog if we can't get the patient ID
          this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close('unregistered');
        }
      }
    });
  }

  openCreateFicheDialog(patientId: number, nom?: string, prenom?: string): void {
    const createFicheDialog = this.dialog.open(CreateFicheDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        patientId: patientId,
        nom: nom,
        prenom: prenom
      }
    });

    createFicheDialog.afterClosed().subscribe(result => {
      if (result) {
        // If patient fiche was created successfully, close this dialog with a special result 
        // to signal that both appointment and fiche were created
        this.snackBar.open('Fiche patient créée avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close('completed_with_fiche');
      } else {
        // Even if fiche wasn't created, the appointment was created, so close the dialog
        this.dialogRef.close('unregistered');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
} 