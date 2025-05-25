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
import { AppointmentDetailDialogComponent } from './appointment-detail-dialog.component';
import { RescheduleAppointmentDialogComponent } from './reschedule-appointment-dialog.component';
import { SecretaryBookAppointmentDialogComponent } from './secretary-book-appointment-dialog.component';
import { UserService } from '../../core/services/user.service';

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
    HttpClientModule
  ],
  template: `
    <div class="view-container">
      <!-- Title header with refresh button -->
      <div class="title-container">
        <h1 class="view-title">Gestion des Rendez-vous</h1>
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
          <div *ngFor="let appointment of todayAppointments" class="appointment-card today-card">
            <!-- Avatar and patient info -->
            <div class="patient-section">
              <!-- Display profile picture or initials placeholder -->
              <div class="avatar patient-profile-pic" [ngClass]="{'avatar-placeholder': !appointment.patient?.profilePicturePath}">
                <img *ngIf="appointment.patient?.profilePicturePath" 
                     [src]="getProfileImageUrl(appointment.patient?.profilePicturePath)" 
                     (error)="handleImageError($event)" 
                     alt="Patient profile picture">
                <span *ngIf="!appointment.patient?.profilePicturePath">
                  {{ getPatientInitials(appointment.patient) }}
                </span>
              </div>
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
              
              <button mat-icon-button matTooltip="Nouveau rendez-vous" (click)="createNewAppointment(appointment)">
                <mat-icon>post_add</mat-icon>
              </button>
              
              <button mat-raised-button color="primary" class="start-button">
                Commencer
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filter tabs -->
      <div class="tabs-container">
        <div class="tab-group">
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'upcoming'"
            (click)="activeTab = 'upcoming'"
          >
            À Venir <span class="badge" *ngIf="upcomingAppointments.length > 0">{{ upcomingAppointments.length }}</span>
          </button>
          
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'past'"
            (click)="activeTab = 'past'"
          >
            Passé <span class="badge" *ngIf="pastAppointments.length > 0">{{ pastAppointments.length }}</span>
          </button>
          
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'cancelled'"
            (click)="activeTab = 'cancelled'"
          >
            Annulés <span class="badge warn" *ngIf="cancelledAppointments.length > 0">{{ cancelledAppointments.length }}</span>
          </button>
          
          <button 
            class="tab-button" 
            [class.active]="activeTab === 'completed'"
            (click)="activeTab = 'completed'"
          >
            Terminés <span class="badge success" *ngIf="completedAppointments.length > 0">{{ completedAppointments.length }}</span>
          </button>
        </div>
        
        <!-- Date range and filter buttons -->
        <div class="filter-controls">
          <button mat-button class="filter-btn date-range">
            <mat-icon>date_range</mat-icon>
            28/04/2025 - 04/05/2025
          </button>
          <button mat-button class="filter-btn">
            <span>Filtrer Par</span>
            <mat-icon>keyboard_arrow_down</mat-icon>
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
        <div *ngFor="let appointment of getFilteredAppointments()" class="appointment-card">
          <!-- Avatar and patient info -->
          <div class="patient-section">
            <!-- Display profile picture or initials placeholder -->
            <div class="avatar patient-profile-pic" [ngClass]="{'avatar-placeholder': !appointment.patient?.profilePicturePath}">
              <img *ngIf="appointment.patient?.profilePicturePath" 
                   [src]="getProfileImageUrl(appointment.patient?.profilePicturePath)" 
                   (error)="handleImageError($event)" 
                   alt="Patient profile picture">
              <span *ngIf="!appointment.patient?.profilePicturePath">
                {{ getPatientInitials(appointment.patient) }}
              </span>
            </div>
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
            
            <button mat-icon-button matTooltip="Nouveau rendez-vous" (click)="createNewAppointment(appointment)">
              <mat-icon>post_add</mat-icon>
            </button>
            
            <button mat-raised-button color="primary" class="start-button">
              {{ activeTab === 'upcoming' ? 'Commencer' : activeTab === 'completed' ? 'Replanifier' : 'Reprendre RDV' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .view-container {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .view-title {
      font-size: 1.75rem;
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
      margin-bottom: 30px;
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
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 18px;
      overflow: hidden;
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
    
    @media (max-width: 768px) {
      .appointment-card {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .action-buttons {
        justify-content: flex-start;
        width: 100%;
        margin-top: 10px;
      }
      
      .patient-section, .appointment-details, .contact-info {
        width: 100%;
      }
    }
  `],
  providers: [DatePipe]
})
export class DoctorSecretaryViewComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  activeTab = 'upcoming';
  apiUrl = environment.apiUrl;
  AppointmentStatus = AppointmentStatus;

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
            
            // Always try to fetch the profile picture directly from the user table
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
        // Check if it's already a full URL
        if (profilePicturePath.startsWith('http')) {
          console.log('Using full URL:', profilePicturePath);
          return profilePicturePath;
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        // Fix the URL path to match the backend endpoint
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
    console.error('HTTP Status Code (if available):', imgElement.naturalWidth === 0 ? 'Image not loaded' : 'Image partially loaded');
    
    // Create a new div element with initials instead of the image
    try {
      const parentElement = imgElement.parentElement;
      if (parentElement) {
        // Get the appointment data to create initials
        const appointmentCard = parentElement.closest('.appointment-card');
        if (appointmentCard) {
          // Try to find the patient name
          const patientNameElement = appointmentCard.querySelector('.patient-name');
          if (patientNameElement && patientNameElement.textContent) {
            const name = patientNameElement.textContent.trim();
            const initials = this.getInitialsFromName(name);
            console.log('Creating initials for:', name, '→', initials);
            
            // Create a div with initials
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar';
            avatarDiv.textContent = initials;
            avatarDiv.style.display = 'flex';
            avatarDiv.style.alignItems = 'center';
            avatarDiv.style.justifyContent = 'center';
            avatarDiv.style.backgroundColor = '#1976d2';
            avatarDiv.style.color = 'white';
            
            // Replace the image with the avatar div
            parentElement.replaceChild(avatarDiv, imgElement);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error creating initials avatar:', error);
    }
    
    // Fallback to default avatar image if the above fails
    console.log('Using default avatar as fallback');
    imgElement.src = 'assets/images/default-avatar.png';
    // Add an event listener to prevent infinite loop if default image also fails
    imgElement.onerror = null;
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
} 