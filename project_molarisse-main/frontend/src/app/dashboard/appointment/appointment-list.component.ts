import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { Observable } from 'rxjs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AppointmentDetailsDialogComponent } from '../../appointment-details-dialog/appointment-details-dialog.component';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProfileService } from '../../profile/profile.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="appointment-container">
      <div class="header">
        <h2>{{ title }}</h2>
        <button *ngIf="userRole === 'patient'" mat-raised-button color="primary" (click)="navigateToBooking()">
          Nouveau Rendez-vous
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        Chargement des rendez-vous...
      </div>

      <div *ngIf="!loading && appointments.length === 0" class="no-data">
        Aucun rendez-vous trouvé.
      </div>

      <table *ngIf="!loading && appointments.length > 0" mat-table [dataSource]="displayedAppointments" class="appointment-table">
        <!-- Profile Picture Column -->
        <ng-container matColumnDef="profilePicture">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let appointment">
            <div class="profile-picture-container">
              <img 
                *ngIf="userRole === 'patient' && appointment.doctor?.profilePicturePath" 
                [src]="getProfileImageUrl(appointment.doctor?.profilePicturePath)" 
                (error)="handleImageError($event)" 
                class="profile-picture" 
                alt="Doctor profile picture"
              >
              <img 
                *ngIf="userRole !== 'patient' && appointment.patient?.profilePicturePath" 
                [src]="getProfileImageUrl(appointment.patient?.profilePicturePath)" 
                (error)="handleImageError($event)" 
                class="profile-picture" 
                alt="Patient profile picture"
              >
              <div 
                *ngIf="(userRole === 'patient' && !appointment.doctor?.profilePicturePath) || 
                       (userRole !== 'patient' && !appointment.patient?.profilePicturePath)" 
                class="profile-initials"
              >
                {{ getPersonInitials(appointment) }}
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Date Column -->
        <ng-container matColumnDef="appointmentDateTime">
          <th mat-header-cell *matHeaderCellDef>Date & Heure</th>
          <td mat-cell *matCellDef="let appointment">
            {{ getDateDisplay(appointment.appointmentDateTime) }}
          </td>
        </ng-container>

        <!-- Status Column -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Statut</th>
          <td mat-cell *matCellDef="let appointment">
            <span class="status-badge" [ngClass]="getStatusClass(appointment.status)">
              {{ getStatusLabel(appointment.status) }}
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
          <th mat-header-cell *matHeaderCellDef>Cas</th>
          <td mat-cell *matCellDef="let appointment">
            {{ appointment.caseType }}
          </td>
        </ng-container>

        <!-- Doctor/Patient Column -->
        <ng-container matColumnDef="person">
          <th mat-header-cell *matHeaderCellDef>{{ userRole === 'patient' ? 'Médecin' : 'Patient' }}</th>
          <td mat-cell *matCellDef="let appointment">
            <ng-container *ngIf="userRole === 'patient' && appointment.doctor">
              Dr. {{ appointment.doctor.prenom }} {{ appointment.doctor.nom }}
            </ng-container>
            <ng-container *ngIf="userRole !== 'patient' && appointment.patient">
              {{ appointment.patient.prenom }} {{ appointment.patient.nom }}
            </ng-container>
          </td>
        </ng-container>

        <!-- Notes Column -->
        <ng-container matColumnDef="notes">
          <th mat-header-cell *matHeaderCellDef>Notes</th>
          <td mat-cell *matCellDef="let appointment">
            {{ appointment.notes }}
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
              <!-- Status update options for doctor/secretary -->
              <ng-container *ngIf="userRole === 'doctor' || userRole === 'secretaire'">
                <button mat-menu-item
                        *ngIf="appointment.status === 'PENDING'"
                        (click)="updateStatus(appointment, AppointmentStatus.ACCEPTED)">
                  <mat-icon>check_circle</mat-icon>
                  <span>Accepter</span>
                </button>

                <button mat-menu-item
                        *ngIf="appointment.status === 'PENDING'"
                        (click)="updateStatus(appointment, AppointmentStatus.REJECTED)">
                  <mat-icon>cancel</mat-icon>
                  <span>Refuser</span>
                </button>

                <button mat-menu-item
                        *ngIf="appointment.status === 'ACCEPTED'"
                        (click)="updateStatus(appointment, AppointmentStatus.COMPLETED)">
                  <mat-icon>task_alt</mat-icon>
                  <span>Marquer comme terminé</span>
                </button>
              </ng-container>

              <!-- Cancel option for patients -->
              <button mat-menu-item
                      *ngIf="userRole === 'patient' && (appointment.status === 'PENDING' || appointment.status === 'ACCEPTED')"
                      (click)="cancelAppointment(appointment)">
                <mat-icon>event_busy</mat-icon>
                <span>Annuler le rendez-vous</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      
      <!-- Pagination for appointments -->
      <mat-paginator *ngIf="!loading && totalAppointments > 0"
                    [length]="totalAppointments"
                    [pageSize]="pageSize"
                    [pageSizeOptions]="pageSizeOptions"
                    [pageIndex]="currentPage"
                    (page)="onPageChange($event)"
                    aria-label="Sélectionner une page">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .appointment-container {
      margin: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .appointment-table {
      width: 100%;
    }

    .loading, .no-data {
      padding: 20px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.3px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
    }

    .pending {
      background-color: #FFF8E1;
      color: #FFA000;
      border: 1px solid rgba(255, 160, 0, 0.2);
    }

    .accepted {
      background-color: #E8F5E9;
      color: #2E7D32;
      border: 1px solid rgba(46, 125, 50, 0.2);
    }

    .rejected {
      background-color: #FFEBEE;
      color: #C62828;
      border: 1px solid rgba(198, 40, 40, 0.2);
    }

    .completed {
      background-color: #E3F2FD;
      color: #1565C0;
      border: 1px solid rgba(21, 101, 192, 0.2);
    }

    .canceled {
      background-color: #FAFAFA;
      color: #616161;
      border: 1px solid rgba(97, 97, 97, 0.2);
    }

    .status-badge::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .pending::before {
      background-color: #FFA000;
    }

    .accepted::before {
      background-color: #2E7D32;
    }

    .rejected::before {
      background-color: #C62828;
    }

    .completed::before {
      background-color: #1565C0;
    }

    .canceled::before {
      background-color: #616161;
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
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Pagination styles */
    mat-paginator {
      margin-top: 20px;
      border-radius: 8px;
      background-color: #f9fafb;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  `],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [DatePipe]
})
export class AppointmentListComponent implements OnInit {
  @Input() userRole!: 'patient' | 'doctor' | 'secretaire';
  @Input() limit?: number;
  @ViewChild(MatPaginatorModule) paginator: any;
  
  appointments: Appointment[] = [];
  displayedAppointments: Appointment[] = [];
  loading = true;
  displayedColumns: string[] = ['profilePicture', 'appointmentDateTime', 'status', 'type', 'case', 'person', 'notes', 'actions'];
  title = 'Appointments';
  AppointmentStatus = AppointmentStatus;
  
  // Pagination variables
  pageSize: number = 10;
  currentPage: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  totalAppointments: number = 0;
  
  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    if (this.limit) {
      this.pageSize = this.limit;
    }

    this.loadAppointments();

    // Set title based on user role
    if (this.userRole === 'patient') {
      this.title = 'Mes rendez-vous';
    } else if (this.userRole === 'doctor' || this.userRole === 'secretaire') {
      this.title = 'Gestion des rendez-vous';
    }
  }
  
  // Pagination handler
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedAppointments();
  }

  loadAppointments(): void {
    this.loading = true;

    // Debug logging
    console.log('Loading appointments for role:', this.userRole);
    console.log('JWT token available:', !!localStorage.getItem('access_token'));

    if (this.userRole === 'patient') {
      this.appointmentService.getMyAppointments().subscribe({
        next: (data) => {
          this.appointments = data;
          
          // Fetch profile pictures for doctors
          this.appointments.forEach(appointment => {
            if (appointment.doctor && appointment.doctor.id) {
              const doctorId = appointment.doctor.id;
              console.log(`Doctor ${appointment.doctor.prenom} ${appointment.doctor.nom} - ID: ${doctorId}`);
              
              // Always fetch the profile picture directly from the user table
              this.appointmentService.getUserProfilePicture(doctorId).subscribe(
                profilePath => {
                  if (profilePath) {
                    appointment.doctor.profilePicturePath = profilePath;
                    console.log(`Updated profile picture for doctor ${doctorId}:`, profilePath);
                  } else {
                    console.log(`No profile picture found for doctor ${doctorId}`);
                  }
                },
                error => {
                  console.error(`Error fetching profile picture for doctor ${doctorId}:`, error);
                }
              );
            }
          });
          
          this.totalAppointments = data.length;
          this.updateDisplayedAppointments();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading appointments', error);
          this.loading = false;
        }
      });
    } else if (this.userRole === 'doctor') {
      console.log('Making request to:', `${this.appointmentService['apiUrl']}/my-doctor-appointments`);
      this.appointmentService.getMyDoctorAppointments().subscribe({
        next: (data) => {
          this.appointments = data;
          
          // Fetch profile pictures for patients
          this.appointments.forEach(appointment => {
            if (appointment.patient && appointment.patient.id) {
              const patientId = appointment.patient.id;
              console.log(`Patient ${appointment.patient.prenom} ${appointment.patient.nom} - ID: ${patientId}`);
              
              // Always fetch the profile picture directly from the user table
              this.appointmentService.getUserProfilePicture(patientId).subscribe(
                profilePath => {
                  if (profilePath) {
                    appointment.patient.profilePicturePath = profilePath;
                    console.log(`Updated profile picture for patient ${patientId}:`, profilePath);
                  } else {
                    console.log(`No profile picture found for patient ${patientId}`);
                  }
                },
                error => {
                  console.error(`Error fetching profile picture for patient ${patientId}:`, error);
                }
              );
            }
          });
          
          this.totalAppointments = data.length;
          this.updateDisplayedAppointments();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading appointments', error);
          this.loading = false;
        }
      });
    } else if (this.userRole === 'secretaire') {
      this.appointmentService.getMySecretaryAppointments().subscribe({
        next: (data) => {
          this.appointments = data;
          
          // Fetch profile pictures for patients
          this.appointments.forEach(appointment => {
            if (appointment.patient && appointment.patient.id) {
              const patientId = appointment.patient.id;
              console.log(`Patient ${appointment.patient.prenom} ${appointment.patient.nom} - ID: ${patientId}`);
              
              // Always fetch the profile picture directly from the user table
              this.appointmentService.getUserProfilePicture(patientId).subscribe(
                profilePath => {
                  if (profilePath) {
                    appointment.patient.profilePicturePath = profilePath;
                    console.log(`Updated profile picture for patient ${patientId}:`, profilePath);
                  } else {
                    console.log(`No profile picture found for patient ${patientId}`);
                  }
                },
                error => {
                  console.error(`Error fetching profile picture for patient ${patientId}:`, error);
                }
              );
            }
          });
          
          this.totalAppointments = data.length;
          this.updateDisplayedAppointments();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading appointments', error);
          this.loading = false;
        }
      });
    }
  }

  private updateDisplayedAppointments(): void {
    // Sort appointments by date - most recent first
    this.appointments.sort((a, b) => {
      const dateA = new Date(a.appointmentDateTime);
      const dateB = new Date(b.appointmentDateTime);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Use pagination if not limited
    if (this.limit) {
      // Use a fixed limit if specified
      this.displayedAppointments = this.appointments.slice(0, this.limit);
    } else {
      // Use pagination
      const startIndex = this.currentPage * this.pageSize;
      this.displayedAppointments = this.appointments.slice(startIndex, startIndex + this.pageSize);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Date non spécifiée';

    try {
      // Essayer de créer une date à partir de la chaîne
      const date = new Date(dateStr);

      // Vérifier si la date est valide
      if (!isNaN(date.getTime())) {
        // Format the date using 24-hour time format (HH:MM)
        return date.toLocaleDateString('fr-FR') + ' ' + 
               date.toLocaleTimeString('fr-FR', { 
                 hour: '2-digit', 
                 minute: '2-digit',
                 hour12: false // Ensure 24-hour format
               });
      }

      // Si le format est "DD/MM/YYYY HH:MM" directement
      if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/)) {
        return dateStr; // Retourner tel quel si déjà formaté
      }

      // Retourner la chaîne originale si ce n'est pas un format reconnu
      return dateStr;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Invalid Date';
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REJECTED':
        return 'Refusé';
      case 'COMPLETED':
        return 'Terminé';
      case 'CANCELED':
        return 'Annulé';
      default:
        return status;
    }
  }

  navigateToBooking(): void {
    this.router.navigate(['/dashboard/patient/book-appointment']);
  }

  viewDetails(appointment: Appointment): void {
    this.dialog.open(AppointmentDetailsDialogComponent, {
      data: appointment
    });
  }

  updateStatus(appointment: Appointment, status: AppointmentStatus): void {
    if (this.userRole === 'doctor') {
      this.appointmentService.updateMyAppointmentStatus(appointment.id, status).subscribe({
        next: () => {
          this.snackBar.open(`Appointment status updated to ${status}`, 'Close', { duration: 3000 });
          this.loadAppointments(); // Reload the list
        },
        error: (error) => {
          console.error('Error updating appointment status', error);
          this.snackBar.open('Failed to update appointment status', 'Close', { duration: 3000 });
        }
      });
    } else if (this.userRole === 'secretaire') {
      // Get the current user profile to obtain the secretary ID
      this.profileService.getCurrentProfile().subscribe({
        next: (profile) => {
          console.log('Current user profile:', profile);
          if (profile && profile.id) {
            console.log('Using secretary ID:', profile.id);

            this.appointmentService.updateAppointmentStatus(
              appointment.id,
              status
            ).subscribe({
              next: () => {
                this.snackBar.open(`Appointment status updated to ${status}`, 'Close', { duration: 3000 });
                this.loadAppointments(); // Reload the list
              },
              error: (error) => {
                console.error('Error updating appointment status', error);
                this.snackBar.open('Failed to update appointment status. You may not have permission.', 'Close', { duration: 3000 });
              }
            });
          } else {
            console.error('Could not determine secretary ID from profile', profile);
            this.snackBar.open('Could not determine your user ID. Please try again later.', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error getting user profile', error);
          this.snackBar.open('Failed to get your user profile. Please try again later.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelAppointment(appointment: Appointment): void {
    // This would be implemented with a confirmation dialog
    this.snackBar.open('Appointment cancellation not implemented yet', 'Close', { duration: 3000 });
  }

  getDateDisplay(dateStr: any): string {
    // Appeler la méthode formatDate pour obtenir le texte formaté
    const formattedDate = this.formatDate(dateStr);

    // Si le résultat est "Invalid Date" (soit en tant que chaîne, soit comme résultat de formatage)
    if (formattedDate === 'Invalid Date' || dateStr === 'Invalid Date') {
      return 'Date non disponible';
    }

    return formattedDate;
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Check if it's already a full URL
        if (profilePicturePath.startsWith('http')) {
          return profilePicturePath;
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        // Fix the URL path to match the backend endpoint
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
    imgElement.src = 'assets/images/default-avatar.png';
  }

  getPersonInitials(appointment: Appointment): string {
    if (this.userRole === 'patient' && appointment.doctor) {
      const firstLetter = appointment.doctor.prenom ? appointment.doctor.prenom.charAt(0).toUpperCase() : '';
      const secondLetter = appointment.doctor.nom ? appointment.doctor.nom.charAt(0).toUpperCase() : '';
      return firstLetter + secondLetter;
    } else if (this.userRole !== 'patient' && appointment.patient) {
      const firstLetter = appointment.patient.prenom ? appointment.patient.prenom.charAt(0).toUpperCase() : '';
      const secondLetter = appointment.patient.nom ? appointment.patient.nom.charAt(0).toUpperCase() : '';
      return firstLetter + secondLetter;
    }
    return '??';
  }
} 
