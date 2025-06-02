import { MatDialog } from '@angular/material/dialog';
import { DoctorWelcomeDialogComponent } from './frontend/src/app/doctor/doctor-welcome-dialog/doctor-welcome-dialog.component';

/**
 * Example of how to open the verification dialog
 * This would typically be done in a component where MatDialog is injected
 */
export class DoctorVerificationTest {
  constructor(private dialog: MatDialog) {}

  openVerificationDialog(doctorId: number, doctorName: string): void {
    const dialogRef = this.dialog.open(DoctorWelcomeDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true, // Prevent closing by clicking outside
      data: {
        doctorId: doctorId,
        userName: doctorName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Verification completed successfully!');
        // You can refresh the doctor's profile or update UI here
      } else {
        console.log('Verification dialog closed or canceled');
      }
    });
  }
}

/**
 * Usage example:
 * 
 * In your component:
 * 
 * import { Component } from '@angular/core';
 * import { MatDialog } from '@angular/material/dialog';
 * 
 * @Component({
 *   selector: 'app-doctor-dashboard',
 *   template: `<button (click)="startVerification()">Start Verification</button>`
 * })
 * export class DoctorDashboardComponent {
 *   constructor(private dialog: MatDialog) {}
 * 
 *   startVerification(): void {
 *     // Get the current doctor ID and name
 *     const doctorId = 123; // Replace with actual doctor ID
 *     const doctorName = 'Dr. John Smith'; // Replace with actual doctor name
 *     
 *     const test = new DoctorVerificationTest(this.dialog);
 *     test.openVerificationDialog(doctorId, doctorName);
 *   }
 * }
 */ 