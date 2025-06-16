import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { DatePipe } from '@angular/common';
import { retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SecretaryAppointmentDetailDialogComponent } from './secretary-appointment-detail-dialog.component';
import { UserService } from '../../core/services/user.service';

interface Secretary {
  id: number;
  nom: string;
  prenom: string;
}

interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phoneNumber: string;
  profilePicturePath?: string;
}

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phoneNumber: string;
  profilePicturePath?: string;
}

@Component({
  selector: 'app-secretary-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatCardModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    MatDialogModule,
    SecretaryAppointmentDetailDialogComponent
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Manage Appointments</mat-card-title>
          <div class="card-actions">
            <button mat-icon-button color="primary" (click)="loadAppointments()" title="Refresh appointments">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div *ngIf="!loading && appointments.length === 0" class="no-data">
            <p>No appointments found.</p>
          </div>
          
          <div *ngIf="!loading && appointments.length > 0" class="table-container">
            <table mat-table [dataSource]="appointments" class="mat-elevation-z2">
              <!-- Profile Picture Column for Patient -->
              <ng-container matColumnDef="patientPicture">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let appointment">
                  <div class="profile-picture-container" [ngClass]="{'profile-initials': !appointment.patient?.profilePicturePath}">
                    <img *ngIf="appointment.patient?.profilePicturePath"
                         [src]="getProfileImageUrl(appointment.patient?.profilePicturePath)" 
                         (error)="handleImageError($event)" 
                         class="profile-picture" 
                         alt="Patient profile picture">
                    <span *ngIf="!appointment.patient?.profilePicturePath">
                      {{ getPatientInitials(appointment.patient) }}
                    </span>
                  </div>
                </td>
              </ng-container>
              
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.appointmentDateTime | date:'dd/MM/yyyy HH:mm' }}
                </td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let appointment">
                  <span [ngClass]="'status-' + appointment.status.toLowerCase()">
                    {{ appointment.status }}
                  </span>
                </td>
              </ng-container>
              
              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.appointmentType }}
                </td>
              </ng-container>
              
              <!-- Case Column -->
              <ng-container matColumnDef="case">
                <th mat-header-cell *matHeaderCellDef>Case</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.caseType }}
                </td>
              </ng-container>
              
              <!-- Patient Column -->
              <ng-container matColumnDef="patient">
                <th mat-header-cell *matHeaderCellDef>Patient</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.patient?.prenom }} {{ appointment.patient?.nom }}
                </td>
              </ng-container>

              <!-- Doctor Column with Profile Picture -->
              <ng-container matColumnDef="doctor">
                <th mat-header-cell *matHeaderCellDef>Doctor</th>
                <td mat-cell *matCellDef="let appointment" class="doctor-cell">
                  <div class="profile-picture-container doctor-picture" [ngClass]="{'doctor-initials': !appointment.doctor?.profilePicturePath}">
                    <img *ngIf="appointment.doctor?.profilePicturePath"
                         [src]="getProfileImageUrl(appointment.doctor?.profilePicturePath)" 
                         (error)="handleDoctorImageError($event)" 
                         class="profile-picture" 
                         alt="Doctor profile picture">
                    <span *ngIf="!appointment.doctor?.profilePicturePath">
                      {{ getDoctorInitials(appointment.doctor) }}
                    </span>
                  </div>
                  <span>Dr. {{ appointment.doctor?.prenom }} {{ appointment.doctor?.nom }}</span>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let appointment">
                  <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="viewAppointmentDetails(appointment)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(appointment.id, AppointmentStatus.ACCEPTED)">
                      <mat-icon>check_circle</mat-icon>
                      <span>Accept</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(appointment.id, AppointmentStatus.REJECTED)">
                      <mat-icon>cancel</mat-icon>
                      <span>Reject</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(appointment.id, AppointmentStatus.COMPLETED)">
                      <mat-icon>done_all</mat-icon>
                      <span>Mark as Completed</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 30px;
    }
    
    .no-data {
      text-align: center;
      padding: 30px;
      color: #666;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
    }
    
    .mat-column-actions {
      width: 80px;
      text-align: center;
    }
    
    .status-pending {
      color: #ff9800;
      font-weight: 500;
    }
    
    .status-accepted {
      color: #4caf50;
      font-weight: 500;
    }
    
    .status-rejected {
      color: #f44336;
      font-weight: 500;
    }
    
    .status-completed {
      color: #2196f3;
      font-weight: 500;
    }
    
    .card-actions {
      margin-left: auto;
    }
    
    mat-card-header {
      display: flex;
      align-items: center;
    }

    .profile-picture-container {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .profile-picture {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-initials {
      font-size: 16px;
      font-weight: 500;
      color: white;
      background-color: #1976d2;
    }

    .doctor-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .doctor-picture {
      flex-shrink: 0;
    }

    .doctor-initials {
      background-color: #4caf50;
    }
  `],
  providers: [DatePipe]
})
export class SecretaryAppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  displayedColumns: string[] = ['patientPicture', 'date', 'status', 'type', 'case', 'patient', 'doctor', 'actions'];
  loading = true;
  AppointmentStatus = AppointmentStatus; // Make enum available in template

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    this.loadAppointments();
  }
  
  loadAppointments(): void {
    this.loading = true;
    console.log('Secretary appointment list: Loading appointments...');
    // Use getSecretaryAppointments for secretary dashboard
    this.appointmentService.getSecretaryAppointments(this.userService.currentUser?.id || 0).pipe(
      retry(3) // Retry up to 3 times
    ).subscribe({
      next: (appointments) => {
        console.log('Secretary appointment list: Received appointments:', appointments);
        
        // Set direct profile picture URLs for patients and doctors
        appointments.forEach(appointment => {
          if (appointment.patient && appointment.patient.id) {
            const patientId = appointment.patient.id;
            console.log(`Patient ${appointment.patient.prenom} ${appointment.patient.nom} - ID: ${patientId}`);
            
            // Set the profile picture URL directly using the patient ID with the correct API path
            appointment.patient.profilePicturePath = `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${patientId}`;
            console.log(`Set direct profile picture URL for patient ${patientId}:`, appointment.patient.profilePicturePath);
          }
          
          if (appointment.doctor && appointment.doctor.id) {
            const doctorId = appointment.doctor.id;
            console.log(`Doctor ${appointment.doctor.prenom} ${appointment.doctor.nom} - ID: ${doctorId}`);
            
            // Set the profile picture URL directly using the doctor ID with the correct API path
            appointment.doctor.profilePicturePath = `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${doctorId}`;
            console.log(`Set direct profile picture URL for doctor ${doctorId}:`, appointment.doctor.profilePicturePath);
          }
        });
        
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Secretary appointment list: Error loading appointments:', error);
        this.snackBar.open(error.message || 'Failed to load appointments', 'Close', {
          duration: 3000
        });
        this.loading = false;
        // In case of error, set empty array to prevent UI issues
        this.appointments = [];
      }
    });
  }
  
  updateStatus(appointmentId: number, status: AppointmentStatus): void {
    this.appointmentService.updateAppointmentStatus(appointmentId, status).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
        this.snackBar.open('Appointment status updated successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        this.snackBar.open(error.message || 'Failed to update appointment status', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // If it already contains the full URL with picture-by-id, return it directly
        if (profilePicturePath.includes('profile/picture-by-id')) {
          return profilePicturePath;
        }
        
        // Check if it's already a full URL
        if (profilePicturePath.startsWith('http')) {
          return profilePicturePath;
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        // Use the correct API URL path
        return `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    return 'assets/images/default-avatar.png';
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    const originalSrc = imgElement.src;
    console.error('Image loading failed in secretary list:', originalSrc);
    
    // Create a new div element with initials instead of the image
    try {
      const parentElement = imgElement.parentElement;
      if (parentElement) {
        // Find the row to get the patient name
        const row = parentElement.closest('tr');
        if (row) {
          const patientCell = row.querySelector('td:nth-child(6)'); // Patient column
          if (patientCell && patientCell.textContent) {
            const name = patientCell.textContent.trim();
            const initials = this.getInitialsFromName(name);
            
            // Create a div with initials
            const initialsDiv = document.createElement('div');
            initialsDiv.className = 'profile-initials';
            initialsDiv.textContent = initials;
            initialsDiv.style.fontSize = '16px';
            initialsDiv.style.fontWeight = '500';
            initialsDiv.style.color = 'white';
            initialsDiv.style.backgroundColor = '#1976d2';
            initialsDiv.style.width = '100%';
            initialsDiv.style.height = '100%';
            initialsDiv.style.display = 'flex';
            initialsDiv.style.alignItems = 'center';
            initialsDiv.style.justifyContent = 'center';
            
            // Clear the parent and append the initials div
            parentElement.innerHTML = '';
            parentElement.appendChild(initialsDiv);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error creating initials avatar:', error);
    }
    
    // Fallback to default avatar image if the above fails
    imgElement.src = 'assets/images/default-avatar.png';
  }

  handleDoctorImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    const originalSrc = imgElement.src;
    console.error('Doctor image loading failed in secretary list:', originalSrc);
    
    // Create a new div element with initials instead of the image
    try {
      const parentElement = imgElement.parentElement;
      if (parentElement) {
        // Find the row to get the doctor name
        const row = parentElement.closest('tr');
        if (row) {
          const doctorCell = row.querySelector('td:nth-child(7)'); // Doctor column
          if (doctorCell && doctorCell.textContent) {
            const name = doctorCell.textContent.trim().replace('Dr. ', '');
            const initials = this.getInitialsFromName(name);
            
            // Create a div with initials
            const initialsDiv = document.createElement('div');
            initialsDiv.className = 'profile-initials doctor-initials';
            initialsDiv.textContent = initials;
            initialsDiv.style.fontSize = '16px';
            initialsDiv.style.fontWeight = '500';
            initialsDiv.style.color = 'white';
            initialsDiv.style.backgroundColor = '#4caf50';
            initialsDiv.style.width = '100%';
            initialsDiv.style.height = '100%';
            initialsDiv.style.display = 'flex';
            initialsDiv.style.alignItems = 'center';
            initialsDiv.style.justifyContent = 'center';
            
            // Clear the parent and append the initials div
            parentElement.innerHTML = '';
            parentElement.appendChild(initialsDiv);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error creating initials avatar:', error);
    }
    
    // Fallback to default avatar image if the above fails
    imgElement.src = 'assets/images/default-avatar.png';
  }
  
  // Helper method to get initials from a name
  private getInitialsFromName(name: string): string {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return '?';
  }

  getPatientInitials(patient: any): string {
    if (!patient) return '?';
    
    const firstLetter = patient.prenom ? patient.prenom.charAt(0).toUpperCase() : '';
    const secondLetter = patient.nom ? patient.nom.charAt(0).toUpperCase() : '';
    
    if (firstLetter && secondLetter) return firstLetter + secondLetter;
    if (firstLetter) return firstLetter;
    if (secondLetter) return secondLetter;
    
    return '?';
  }

  getDoctorInitials(doctor: any): string {
    if (!doctor) return '?';
    
    const firstLetter = doctor.prenom ? doctor.prenom.charAt(0).toUpperCase() : '';
    const secondLetter = doctor.nom ? doctor.nom.charAt(0).toUpperCase() : '';
    
    if (firstLetter && secondLetter) return firstLetter + secondLetter;
    if (firstLetter) return firstLetter;
    if (secondLetter) return secondLetter;
    
    return '?';
  }

  viewAppointmentDetails(appointment: Appointment): void {
    this.dialog.open(SecretaryAppointmentDetailDialogComponent, {
      width: '800px',
      maxWidth: '98vw',
      data: appointment,
      panelClass: 'appointment-dialog'
    });
  }
} 