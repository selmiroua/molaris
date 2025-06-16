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
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RescheduleAppointmentDialogComponent } from './reschedule-appointment-dialog.component';
import { SecretaryBookAppointmentDialogComponent } from './secretary-book-appointment-dialog.component';
import { UserService } from '../../core/services/user.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AppointmentDetailDialogComponent } from './appointment-detail-dialog.component';

@Component({
  selector: 'app-doctor-secretary-view',
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
    MatPaginatorModule
  ],
  template: `
    <div class="view-container">
      <!-- Title header with refresh button -->
      <div class="title-container">
        <button mat-raised-button color="primary" class="refresh-button" (click)="loadAppointments()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </div>
      
      <!-- Today's Appointments Section -->
      <div class="today-appointments-section" *ngIf="todayAppointments.length > 0">
        <h2 class="section-title">
          <mat-icon>today</mat-icon>
          Rendez-vous d'aujourd'hui
          <span class="badge today-badge">{{ todayAppointments.length }}</span>
        </h2>
        
        <div class="appointments-list today-list">
          <div *ngFor="let appointment of getPaginatedTodayAppointments()" class="appointment-card today-card">
            <!-- Avatar and patient info -->
            <div class="patient-section">
              <ng-container *ngIf="hasProfilePicture(appointment.patient); else defaultAvatar">
                <div class="avatar patient-profile-pic">
                  <img 
                    [src]="getProfileImageUrl(appointment.patient?.profilePicturePath)" 
                    (error)="handleImageError($event)" 
                    alt="Patient profile picture">
                </div>
              </ng-container>
              <ng-template #defaultAvatar>
                <div class="avatar avatar-placeholder">
                  {{ getInitialsFromName(appointment.patient?.prenom + ' ' + appointment.patient?.nom) }}
                </div>
              </ng-template>
              <div class="patient-info">
                <div class="appointment-id">#Apt{{ padNumber(appointment.id, 4) }}</div>
                <div class="patient-name">{{ appointment.patient?.prenom }} {{ appointment.patient?.nom }}</div>
              </div>
            </div>
            
            <!-- Appointment details -->
            <div class="appointment-details">
              <div class="datetime">
                <mat-icon>schedule</mat-icon>
                {{ formatTime(appointment.appointmentDateTime) }}
              </div>
              <div class="type">
                {{ getTypeDisplay(appointment.appointmentType) }} • {{ getAppointmentTypeLabel(appointment.caseType) }}
              </div>
            </div>
            
            <!-- Contact info -->
            <div class="contact-info">
              <div class="email" *ngIf="appointment.patient?.email">
                <mat-icon>email</mat-icon>
                {{ appointment.patient?.email }}
              </div>
              <div class="phone" *ngIf="appointment.patient?.phoneNumber">
                <mat-icon>phone</mat-icon>
                {{ appointment.patient?.phoneNumber || 'N/A' }}
              </div>
            </div>
            
            <!-- Action buttons -->
            <div class="action-buttons">
              <button mat-icon-button matTooltip="Voir détails" (click)="viewAppointmentDetails(appointment)">
                <mat-icon>visibility</mat-icon>
              </button>
              
              <button mat-icon-button matTooltip="Replanifier" (click)="rescheduleAppointment(appointment)">
                <mat-icon>event_repeat</mat-icon>
              </button>
              
              <button mat-raised-button color="primary" class="start-button">
                Commencer
              </button>
            </div>
          </div>
        </div>
        
        <!-- Today's Appointments Pagination -->
        <div class="pagination-container" *ngIf="todayAppointments.length > pageSize">
          <mat-paginator
            [length]="todayAppointments.length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25]"
            [showFirstLastButtons]="true"
            (page)="onTodayPageChange($event)"
            #todayPaginator>
          </mat-paginator>
        </div>
      </div>
      
      <!-- Filter tabs -->
      <div class="tabs-container">
        <div class="tab-group">
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'upcoming'"
            (click)="activeTab = 'upcoming'; resetPagination()"
          >
            À Venir <span class="badge" *ngIf="upcomingAppointments.length > 0">{{ upcomingAppointments.length }}</span>
          </button>
          
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'past'"
            (click)="activeTab = 'past'; resetPagination()"
          >
            Passé <span class="badge" *ngIf="pastAppointments.length > 0">{{ pastAppointments.length }}</span>
          </button>
          
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'cancelled'"
            (click)="activeTab = 'cancelled'; resetPagination()"
          >
            Annulés <span class="badge warn" *ngIf="cancelledAppointments.length > 0">{{ cancelledAppointments.length }}</span>
          </button>
          
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'completed'"
            (click)="activeTab = 'completed'; resetPagination()"
          >
            Terminés <span class="badge success" *ngIf="completedAppointments.length > 0">{{ completedAppointments.length }}</span>
          </button>
        </div>
      </div>
      
      <!-- Loading state -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement des rendez-vous...</p>
      </div>
      
      <!-- Empty state -->
      <div *ngIf="!loading && getFilteredAppointments().length === 0" class="empty-state">
        <p>Aucun rendez-vous {{ activeTab === 'upcoming' ? 'à venir' : activeTab === 'past' ? 'passé' : activeTab === 'cancelled' ? 'annulé' : 'terminé' }} trouvé.</p>
      </div>
      
      <!-- Appointment cards -->
      <div *ngIf="!loading && getFilteredAppointments().length > 0" class="appointments-list">
        <div *ngFor="let appointment of getPaginatedAppointments()" class="appointment-card">
          <!-- Avatar and patient info -->
          <div class="patient-section">
            <ng-container *ngIf="hasProfilePicture(appointment.patient); else defaultAvatar">
              <div class="avatar patient-profile-pic">
                <img 
                  [src]="getProfileImageUrl(appointment.patient?.profilePicturePath)" 
                  (error)="handleImageError($event)" 
                  alt="Patient profile picture">
              </div>
            </ng-container>
            <ng-template #defaultAvatar>
              <div class="avatar avatar-placeholder">
                {{ getInitialsFromName(appointment.patient?.prenom + ' ' + appointment.patient?.nom) }}
              </div>
            </ng-template>
            <div class="patient-info">
              <div class="appointment-id">#Apt{{ padNumber(appointment.id, 4) }}</div>
              <div class="patient-name">{{ appointment.patient?.prenom }} {{ appointment.patient?.nom }}</div>
            </div>
          </div>
          
          <!-- Appointment details -->
          <div class="appointment-details">
            <div class="datetime">
              <mat-icon>event</mat-icon>
              {{ formatDate(appointment.appointmentDateTime) }}
            </div>
            <div class="type">
              {{ getTypeDisplay(appointment.appointmentType) }} • {{ getAppointmentTypeLabel(appointment.caseType) }}
            </div>
          </div>
          
          <!-- Contact info -->
          <div class="contact-info">
            <div class="email" *ngIf="appointment.patient?.email">
              <mat-icon>email</mat-icon>
              {{ appointment.patient?.email }}
            </div>
            <div class="phone" *ngIf="appointment.patient?.phoneNumber">
              <mat-icon>phone</mat-icon>
              {{ appointment.patient?.phoneNumber || 'N/A' }}
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="action-buttons">
            <button mat-icon-button matTooltip="Voir détails" (click)="viewAppointmentDetails(appointment)">
              <mat-icon>visibility</mat-icon>
            </button>
            
            <button mat-icon-button matTooltip="Replanifier" (click)="rescheduleAppointment(appointment)">
              <mat-icon>event_repeat</mat-icon>
            </button>
            
            <button mat-raised-button color="primary" class="start-button">
              {{ activeTab === 'upcoming' ? 'Commencer' : activeTab === 'completed' ? 'Replanifier' : 'Reprendre RDV' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Main Pagination -->
      <div class="pagination-container" *ngIf="getFilteredAppointments().length > pageSize">
        <mat-paginator
          [length]="getFilteredAppointments().length"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25]"
          [showFirstLastButtons]="true"
          (page)="onPageChange($event)"
          #mainPaginator>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .view-container {
      background-color: white;
      border-radius: 0;
      padding: 15px;
      box-shadow: none;
    }
    
    .title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .view-title {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 0;
      color: #333;
    }
    
    .refresh-button {
      border-radius: 30px;
    }
    
    .tabs-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .tab-group {
      display: flex;
      gap: 10px;
    }
    
    .tab-button {
      background: #f5f5f5;
      border: none;
      padding: 8px 20px;
      cursor: pointer;
      font-weight: 500;
      color: #666;
      display: flex;
      align-items: center;
      position: relative;
      transition: all 0.2s ease;
      border-radius: 30px;
    }
    
    .tab-button.active {
      background: #007bff;
      color: white;
    }
    
    .badge {
      background: #007bff;
      color: white;
      border-radius: 50%;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      font-size: 12px;
      margin-left: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .badge.warn {
      background: #dc3545;
    }
    
    .badge.success {
      background: #28a745;
    }
    
    .today-badge {
      background: #ff6b00;
    }
    
    .today-appointments-section {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #fff8f0;
      border-radius: 8px;
      border-left: 4px solid #ff6b00;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      font-size: 1.2rem;
      color: #333;
      margin-bottom: 15px;
    }
    
    .section-title mat-icon {
      color: #ff6b00;
      margin-right: 8px;
    }
    
    .today-list {
      margin-top: 0;
    }
    
    .today-card {
      background-color: white;
      border-left: 3px solid #ff6b00;
    }
    
    .today-avatar {
      background: #ff6b00;
    }
    
    .filter-controls {
      display: flex;
      gap: 10px;
    }
    
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      padding: 5px 15px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      color: #666;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 0;
      color: #666;
      font-style: italic;
    }
    
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 20px;
    }
    
    .appointment-card {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: space-between;
      background: white;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      align-items: center;
    }
    
    .patient-section {
      display: flex;
      align-items: center;
      gap: 15px;
      min-width: 180px;
    }
    
    .avatar {
      width: 50px;
      height: 50px;
      min-width: 50px;
      min-height: 50px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 22px;
      overflow: hidden;
      user-select: none;
    }

    .avatar-placeholder {
      background-color: #1976d2;
    }

    .patient-profile-pic {
      object-fit: cover;
      background: none;
    }
    
    .patient-profile-pic img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .patient-info {
      display: flex;
      flex-direction: column;
    }
    
    .appointment-id {
      font-size: 12px;
      color: #0066cc;
      margin-bottom: 3px;
    }
    
    .patient-name {
      font-weight: 500;
    }
    
    .appointment-details {
      flex-grow: 1;
      min-width: 200px;
    }
    
    .datetime {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 5px;
    }
    
    .type {
      color: #666;
    }
    
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 200px;
    }
    
    .email, .phone {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 14px;
    }
    
    .action-buttons {
      display: flex;
      gap: 5px;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      min-width: 200px;
    }
    
    .start-button {
      margin-left: 10px;
      border-radius: 30px;
    }
    
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
    
    @media (max-width: 768px) {
      .appointment-card {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .action-buttons {
        width: 100%;
        justify-content: flex-start;
        margin-top: 10px;
      }
      }
  `]
})
export class DoctorSecretaryViewComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  activeTab = 'upcoming';
  apiUrl = environment.apiUrl;
  AppointmentStatus = AppointmentStatus;
  
  // Pagination properties
  pageSize = 5;
  currentPage = 0;
  todayCurrentPage = 0;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadAppointments();
  }
  
  loadAppointments(): void {
    this.loading = true;
    console.log('Doctor secretary view: Loading appointments...');
    this.appointmentService.getMyDoctorAppointments().pipe(
      retry(3) // Retry up to 3 times
    ).subscribe({
      next: (appointments) => {
        console.log('Doctor secretary view: Received appointments:', appointments);
        
        // Process appointments to ensure all patients have profile pictures or initials
        appointments.forEach(appointment => {
          if (appointment.patient && appointment.patient.id) {
            const patientId = appointment.patient.id;
            console.log(`Patient ${appointment.patient.prenom} ${appointment.patient.nom} - ID: ${patientId}`);
            
            // Set the profile picture URL directly using the patient ID with the correct API path
            appointment.patient.profilePicturePath = `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${patientId}`;
            console.log(`Set direct profile picture URL for patient ${patientId}:`, appointment.patient.profilePicturePath);
          } else {
            console.warn('Appointment has missing or invalid patient data:', appointment);
          }
        });
        
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Doctor secretary view: Error loading appointments:', error);
        this.snackBar.open(error.message || 'Failed to load appointments', 'Close', {
          duration: 3000
        });
        this.loading = false;
        // In case of error, set empty array to prevent UI issues
        this.appointments = [];
      }
    });
  }
  
  get todayAppointments(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
    
    return this.appointments.filter(apt => {
      const status = apt.status.toLowerCase();
      const aptDate = new Date(apt.appointmentDateTime);
      aptDate.setHours(0, 0, 0, 0);
      return (status === 'pending' || status === 'accepted') && aptDate.getTime() === today.getTime();
    });
  }
  
  get upcomingAppointments(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
    
    return this.appointments.filter(apt => {
      const status = apt.status.toLowerCase();
      const aptDate = new Date(apt.appointmentDateTime);
      return (status === 'pending' || status === 'accepted') && aptDate >= today;
    });
  }
  
  get pastAppointments(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
    
    return this.appointments.filter(apt => {
      const status = apt.status.toLowerCase();
      const aptDate = new Date(apt.appointmentDateTime);
      return (status === 'pending' || status === 'accepted') && aptDate < today;
    });
  }
  
  get cancelledAppointments(): Appointment[] {
    return this.appointments.filter(apt => {
      const status = apt.status.toLowerCase();
      return status === 'canceled' || status === 'rejected';
    });
  }
  
  get completedAppointments(): Appointment[] {
    return this.appointments.filter(apt => apt.status.toLowerCase() === 'completed');
  }
  
  getFilteredAppointments(): Appointment[] {
    switch(this.activeTab) {
      case 'upcoming': return this.upcomingAppointments;
      case 'past': return this.pastAppointments;
      case 'cancelled': return this.cancelledAppointments;
      case 'completed': return this.completedAppointments;
      default: return this.appointments;
    }
  }
  
  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      // Format: "10:30"
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Error';
    }
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
  
  getPatientInitials(patient: any): string {
    if (!patient) return '?';
    
    const firstLetter = patient.prenom ? patient.prenom.charAt(0).toUpperCase() : '';
    const secondLetter = patient.nom ? patient.nom.charAt(0).toUpperCase() : '';
    
    if (firstLetter && secondLetter) return firstLetter + secondLetter;
    if (firstLetter) return firstLetter;
    if (secondLetter) return secondLetter;
    
    return '?';
  }
  
  padNumber(num: number, size: number): string {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format: "Mar 15, 2025 - 10:30 AM"
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      return new Intl.DateTimeFormat('fr-FR', options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  }
  
  getTypeDisplay(type: string): string {
    return type || 'N/A';
  }
  
  getAppointmentTypeLabel(type: string): string {
    return type || 'N/A';
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    console.log('Profile picture path received:', profilePicturePath);
    if (profilePicturePath) {
      try {
        // If it already contains the full URL with picture-by-id, return it directly
        if (profilePicturePath.includes('profile/picture-by-id')) {
          return profilePicturePath;
        }
        
        // Check if it's already a full URL
        if (profilePicturePath.startsWith('http')) {
          console.log('Using full URL:', profilePicturePath);
          return profilePicturePath;
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        // Use the correct API URL path
        const url = `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
        console.log('Constructed profile picture URL:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    console.log('No profile picture path provided, using default');
    return 'assets/images/default-avatar.png';
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    const originalSrc = imgElement.src;
    console.error('Image loading failed:', originalSrc);
    try {
      const parentElement = imgElement.parentElement;
      if (parentElement) {
        // Find the card to get the patient name
        const appointmentCard = parentElement.closest('.appointment-card');
        if (appointmentCard) {
          const patientNameElement = appointmentCard.querySelector('.patient-name');
          if (patientNameElement && patientNameElement.textContent) {
            const name = patientNameElement.textContent.trim();
            const initials = this.getInitialsFromName(name);
            // Create a div with initials styled as avatar
            const initialsDiv = document.createElement('div');
            initialsDiv.className = 'avatar avatar-placeholder';
            initialsDiv.textContent = initials;
            initialsDiv.style.fontSize = '22px';
            initialsDiv.style.fontWeight = '500';
            initialsDiv.style.color = 'white';
            initialsDiv.style.backgroundColor = '#1976d2';
            initialsDiv.style.width = '50px';
            initialsDiv.style.height = '50px';
            initialsDiv.style.display = 'flex';
            initialsDiv.style.alignItems = 'center';
            initialsDiv.style.justifyContent = 'center';
            initialsDiv.style.userSelect = 'none';
            initialsDiv.style.borderRadius = '50%';
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
    imgElement.src = 'assets/images/default-avatar.png';
    imgElement.onerror = null;
  }
  
  // Helper method to get initials from a name
  getInitialsFromName(name: string): string {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return '?';
  }

  // View appointment details in a modal dialog
  viewAppointmentDetails(appointment: Appointment): void {
    console.log('Opening appointment details dialog with data:', appointment);
    
    // Make sure we have all the necessary data before opening the dialog
    if (!appointment) {
      this.snackBar.open('Données du rendez-vous manquantes', 'Fermer', { duration: 3000 });
      return;
    }
    
    const dialogRef = this.dialog.open(AppointmentDetailDialogComponent, {
      width: '650px',
      data: appointment
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the appointments list if the appointment was updated
        this.loadAppointments();
      }
    });
  }
  
  // Reschedule appointment
  rescheduleAppointment(appointment: Appointment): void {
    console.log('Rescheduling appointment:', appointment);
    
    if (!appointment || !appointment.id) {
      this.snackBar.open('Données du rendez-vous manquantes', 'Fermer', { duration: 3000 });
      return;
    }
    
    // Open the reschedule dialog
    const dialogRef = this.dialog.open(RescheduleAppointmentDialogComponent, {
      width: '450px',
      data: { appointment }
    });
    
    dialogRef.afterClosed().subscribe(newDateTimeStr => {
      if (newDateTimeStr) {
        // Call the service to update the appointment time
        this.appointmentService.updateAppointmentTimeByDoctor(appointment.id, newDateTimeStr)
          .subscribe({
            next: (updatedAppointment) => {
              console.log('Appointment rescheduled successfully:', updatedAppointment);
              this.snackBar.open('Rendez-vous replanifié avec succès', 'Fermer', { duration: 3000 });
              this.loadAppointments(); // Refresh the list
            },
            error: (error) => {
              console.error('Error rescheduling appointment:', error);
              this.snackBar.open('Erreur lors de la replanification: ' + error.message, 'Fermer', { duration: 5000 });
            }
          });
      }
    });
  }
  
  // Navigate to messaging component
  goToMessaging(appointment: Appointment): void {
    // Simply redirect to messaging without parameters
    this.router.navigate(['/dashboard/doctor/messaging']);
  }
  
  // View patient profile
  viewPatientProfile(appointment: Appointment): void {
    if (appointment && appointment.patient && appointment.patient.id) {
      this.router.navigate(['/dashboard/doctor/patient', appointment.patient.id]);
    } else {
      this.snackBar.open('Impossible de trouver les informations du patient', 'OK', {
        duration: 3000
      });
    }
  }

  // Create a new appointment for the same patient
  createNewAppointment(appointment: Appointment): void {
    console.log('Creating new appointment for patient:', appointment.patient);
    
    if (!appointment.patient) {
      this.snackBar.open('Informations du patient manquantes', 'Fermer', { duration: 3000 });
      return;
    }
    
    // Ouvrir le dialogue de réservation pour secrétaire
    this.openSecretaryBookAppointmentDialog(appointment.patient);
  }
  
  private openSecretaryBookAppointmentDialog(patient: any): void {
    // Ouvrir le dialogue de réservation spécifique pour secrétaire
    const dialogRef = this.dialog.open(SecretaryBookAppointmentDialogComponent, {
      width: '600px',
      data: {
        patient: patient
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Rafraîchir les rendez-vous après la réservation
        this.loadAppointments();
        this.snackBar.open('Nouveau rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }

  // New methods for pagination
  getPaginatedAppointments(): Appointment[] {
    const filtered = this.getFilteredAppointments();
    const startIndex = this.currentPage * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }
  
  getPaginatedTodayAppointments(): Appointment[] {
    const startIndex = this.todayCurrentPage * this.pageSize;
    return this.todayAppointments.slice(startIndex, startIndex + this.pageSize);
  }
  
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  
  onTodayPageChange(event: PageEvent): void {
    this.todayCurrentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  
  resetPagination(): void {
    this.currentPage = 0;
  }

  hasProfilePicture(patient: any): boolean {
    return !!(patient && patient.profilePicturePath && patient.profilePicturePath !== 'null' && patient.profilePicturePath !== '');
  }
} 