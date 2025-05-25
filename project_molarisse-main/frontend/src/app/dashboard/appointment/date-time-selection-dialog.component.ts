import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '../../core/services/appointment.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService, UserProfile } from '../../profile/profile.service';

// Extended interface for UserProfile to include secretary-specific properties
interface SecretaryProfile extends UserProfile {
  role?: string;
  assignedDoctor?: {
    id: number;
    nom?: string;
    prenom?: string;
  };
}

export interface DateTimeSelectionData {
  initialDate?: Date;
}

@Component({
  selector: 'app-date-time-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Sélectionner une date et une heure</h2>
    <mat-dialog-content>
      <form [formGroup]="dateTimeForm">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date du rendez-vous</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" required 
                  (dateChange)="onDateSelected()">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="dateTimeForm.get('date')?.hasError('required')">
              La date est requise
            </mat-error>
            <mat-error *ngIf="dateTimeForm.get('date')?.hasError('pastDate')">
              La date ne peut pas être dans le passé
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row" *ngIf="isLoadingTimeSlots">
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Chargement des créneaux disponibles...</span>
          </div>
        </div>
        
        <div class="form-row" *ngIf="!isLoadingTimeSlots && availableTimeSlots.length > 0">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Créneau disponible</mat-label>
            <mat-select formControlName="timeSlot" required>
              <mat-option *ngFor="let slot of availableTimeSlots" [value]="slot">
                {{ formatTimeDisplay(slot) }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="dateTimeForm.get('timeSlot')?.hasError('required')">
              Le créneau est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row info-message" *ngIf="!isLoadingTimeSlots && availableTimeSlots.length === 0 && dateTimeForm.get('date')?.valid">
          <mat-icon color="warning">info</mat-icon>
          <span>Aucun créneau disponible pour cette date. Veuillez sélectionner une autre date.</span>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" 
              [disabled]="!dateTimeForm.valid || availableTimeSlots.length === 0">
        Continuer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-height: 200px;
      min-width: 350px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-row {
      margin-bottom: 16px;
    }
    
    h2 {
      margin-top: 0;
      color: #333;
    }
    
    mat-dialog-actions {
      margin-top: 16px;
    }
    
    .loading-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 20px 0;
      color: #666;
    }
    
    .info-message {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #fff8e1;
      border-radius: 4px;
      padding: 12px;
      color: #ff8f00;
    }
  `]
})
export class DateTimeSelectionDialogComponent implements OnInit {
  dateTimeForm: FormGroup;
  availableTimeSlots: string[] = [];
  isLoadingTimeSlots: boolean = false;
  doctorId: number | null = null;
  
  constructor(
    private dialogRef: MatDialogRef<DateTimeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DateTimeSelectionData,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    // Set default date to today or use provided date
    const initialDate = data.initialDate || new Date();
    
    // Initialize form with validation but without time selection yet
    this.dateTimeForm = this.fb.group({
      date: [initialDate, [Validators.required, this.pastDateValidator]],
      timeSlot: [null, Validators.required]
    });
  }
  
  ngOnInit(): void {
    // Get the assigned doctor ID (for secretary)
    this.loadDoctorId();
  }
  
  loadDoctorId(): void {
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Profile data:', profile);
        
        // Cast to SecretaryProfile to access assignedDoctor property
        const secretaryProfile = profile as SecretaryProfile;
        
        if (secretaryProfile && secretaryProfile.assignedDoctor && secretaryProfile.assignedDoctor.id) {
          this.doctorId = secretaryProfile.assignedDoctor.id;
          console.log('Found doctor ID:', this.doctorId);
          
          // If we already have a valid date, load time slots
          if (this.dateTimeForm.get('date')?.valid) {
            this.onDateSelected();
          }
        } else {
          console.error('No assigned doctor found in profile');
          this.snackBar.open('Erreur: Aucun médecin assigné trouvé', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error loading profile for doctor ID:', error);
        this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  // Called when a date is selected in the datepicker
  onDateSelected(): void {
    const selectedDate = this.dateTimeForm.get('date')?.value;
    if (!selectedDate || !this.doctorId) {
      return;
    }
    
    // Reset time slot selection
    this.dateTimeForm.get('timeSlot')?.setValue(null);
    
    // Convert date to YYYY-MM-DD format for API
    const formattedDate = this.formatDateForApi(selectedDate);
    console.log('Fetching available slots for date:', formattedDate);
    
    // Set loading state
    this.isLoadingTimeSlots = true;
    this.availableTimeSlots = [];
    
    // Get available time slots from API
    this.appointmentService.getAvailableTimeSlots(this.doctorId, formattedDate).subscribe({
      next: (slots) => {
        console.log('Available time slots:', slots);
        this.availableTimeSlots = slots;
        this.isLoadingTimeSlots = false;
        
        // Auto-select the first slot if available
        if (slots.length > 0) {
          this.dateTimeForm.get('timeSlot')?.setValue(slots[0]);
        }
      },
      error: (error) => {
        console.error('Error fetching available time slots:', error);
        this.isLoadingTimeSlots = false;
        this.snackBar.open('Erreur lors du chargement des créneaux disponibles', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  // Format date to YYYY-MM-DD for API calls
  private formatDateForApi(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  
  // Format time slot for display (from HH:MM:SS to HH:MM)
  formatTimeDisplay(timeSlot: string): string {
    // If timeSlot is already in HH:MM format
    if (timeSlot.length === 5) {
      return timeSlot;
    }
    
    // If timeSlot is in HH:MM:SS format
    if (timeSlot.length === 8) {
      return timeSlot.substring(0, 5);
    }
    
    // If timeSlot is a full ISO datetime
    if (timeSlot.includes('T')) {
      const timePart = timeSlot.split('T')[1];
      return timePart.substring(0, 5);
    }
    
    return timeSlot;
  }
  
  // Validator to prevent past dates
  pastDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0); // Clear time part for date comparison
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Clear time part for date comparison
    
    return selectedDate < today ? { pastDate: true } : null;
  }
  
  onConfirm(): void {
    if (this.dateTimeForm.valid) {
      const dateValue = this.dateTimeForm.get('date')?.value;
      const timeSlotValue = this.dateTimeForm.get('timeSlot')?.value;
      
      if (!dateValue || !timeSlotValue) return;
      
      // Create a date object combining the selected date and time slot
      const selectedDate = new Date(dateValue);
      
      // Extract hours and minutes from time slot (format can be HH:MM or HH:MM:SS)
      let hours = 0, minutes = 0;
      
      if (typeof timeSlotValue === 'string') {
        const timeParts = timeSlotValue.split(':');
        hours = parseInt(timeParts[0]);
        minutes = parseInt(timeParts[1]);
      }
      
      selectedDate.setHours(hours, minutes, 0, 0);
      
      this.dialogRef.close(selectedDate);
    }
  }
  
  onCancel(): void {
    this.dialogRef.close(null);
  }
} 