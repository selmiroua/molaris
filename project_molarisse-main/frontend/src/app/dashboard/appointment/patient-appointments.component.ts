import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentFormDialogComponent } from './book-appointment.component';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient-appointments',
  templateUrl: './patient-appointments.component.html',
  styleUrls: ['./patient-appointments.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSelectModule
  ]
})
export class PatientAppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  loading: boolean = false;
  error: boolean = false;
  errorMessage: string = '';
  activeTab: string = 'upcoming';
  searchQuery: string = '';
  
  // Pagination variables
  pageSize: number = 5;
  currentPage: number = 0;
  pageSizeOptions: number[] = [5, 10, 25];
  totalAppointments: number = 0;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  // Pagination handler
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = false;

    // Try to load both patient and doctor appointments
    this.appointmentService.getMyAppointments().subscribe({
      next: (patientAppointments) => {
        // First, save the patient appointments
        this.appointments = patientAppointments;
        
        // Process each appointment to fetch doctor profile pictures
        patientAppointments.forEach(appointment => {
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
          } else {
            console.warn('Appointment has missing or invalid doctor data:', appointment);
          }
        });
        
        // Then try to get the doctor appointments and combine them
        this.appointmentService.getMyDoctorAppointments().subscribe({
          next: (doctorAppointments) => {
            console.log('Doctor appointments loaded:', doctorAppointments.length);
            
            // Process each doctor appointment to fetch patient profile pictures
            doctorAppointments.forEach(appointment => {
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
            
            // Combine both sets of appointments, avoiding duplicates by ID
            const existingIds = new Set(this.appointments.map(a => a.id));
            const newAppointments = doctorAppointments.filter(a => !existingIds.has(a.id));
            
            // Add the new, non-duplicate appointments
            this.appointments = [...this.appointments, ...newAppointments];
            console.log('Total appointments after combining:', this.appointments.length);
            
            this.loading = false;
          },
          error: (err) => {
            // If doctor appointments fail, we still have the patient appointments
            console.error('Error loading doctor appointments:', err);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading patient appointments:', error);
        
        // Try doctor appointments as fallback
        this.appointmentService.getMyDoctorAppointments().subscribe({
          next: (doctorAppointments) => {
            this.appointments = doctorAppointments;
            this.loading = false;
          },
          error: (doctorError) => {
            // Both failed, so show error and use demo data
            console.error('Error loading doctor appointments as fallback:', doctorError);
            this.loading = false;
            this.error = true;
            this.errorMessage = error.message || 'Une erreur est survenue lors du chargement des rendez-vous.';
            
            this.createDemoAppointments();
            
            this.snackBar.open('Erreur de connexion au serveur. Affichage des données de démonstration.', 'Fermer', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom'
            });
          }
        });
      }
    });
  }

  createDemoAppointments(): void {
    const today = new Date();
    const appointments = [];
    
    // Create a series of past appointments
    for (let i = 1; i <= 10; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - i * 3); // Every 3 days in the past
      
      const status = i % 4 === 0 ? AppointmentStatus.CANCELED : 
                    i % 3 === 0 ? AppointmentStatus.REJECTED :
                    AppointmentStatus.COMPLETED;
      
      const appointmentType = i % 3 === 0 ? 'DETARTRAGE' as any :
                             i % 5 === 0 ? 'EXTRACTION' as any :
                             i % 7 === 0 ? 'BLANCHIMENT' as any :
                             'SOIN' as any;
      
      const doctor = i % 2 === 0 ? {
        id: 1,
        prenom: 'Jean',
        nom: 'Dupont',
        address: '123 Rue de la Médecine, Paris'
      } : {
        id: 2,
        prenom: 'Marie',
        nom: 'Curie',
        address: '456 Avenue de la Science, Lyon'
      };
      
      appointments.push({
        id: 100 + i,
        appointmentDateTime: pastDate.toISOString(),
        status: status,
        caseType: 'NORMAL' as any,
        appointmentType: appointmentType,
        notes: 'Rendez-vous de démonstration',
        doctor: doctor
      });
    }
    
    // Create current and upcoming appointments
    for (let i = 0; i < 15; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i * 2); // Every 2 days in the future
      
      const status = i === 0 ? AppointmentStatus.ACCEPTED :
                    i % 5 === 0 ? AppointmentStatus.PENDING :
                    i % 7 === 0 ? AppointmentStatus.CANCELED :
                    AppointmentStatus.ACCEPTED;
      
      const appointmentType = i % 2 === 0 ? 'SOIN' as any :
                             i % 3 === 0 ? 'DETARTRAGE' as any :
                             i % 5 === 0 ? 'EXTRACTION' as any :
                             'ORTHODONTIE' as any;
      
      const doctorIndex = i % 3;
      const doctor = doctorIndex === 0 ? {
        id: 1,
        prenom: 'Jean',
        nom: 'Dupont',
        address: '123 Rue de la Médecine, Paris'
      } : doctorIndex === 1 ? {
        id: 2,
        prenom: 'Marie',
        nom: 'Curie',
        address: '456 Avenue de la Science, Lyon'
      } : {
        id: 3,
        prenom: 'Robert',
        nom: 'Martin',
        address: '789 Boulevard des Soins, Marseille'
      };
      
      appointments.push({
        id: 200 + i,
        appointmentDateTime: futureDate.toISOString(),
        status: status,
        caseType: 'NORMAL' as any,
        appointmentType: appointmentType,
        notes: 'Rendez-vous de démonstration',
        doctor: doctor
      });
    }
    
    this.appointments = appointments;
    this.loading = false;
    this.error = false;
  }

  getFilteredAppointments(): Appointment[] {
    // Start with all appointments
    let filtered = [...this.appointments];
    
    // Apply tab filters
    if (this.activeTab === 'à venir' || this.activeTab === 'upcoming') {
      // Future appointments (pending or accepted)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(a.appointmentDateTime);
        return (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.ACCEPTED) && 
               appointmentDate >= today;
      });
    } else if (this.activeTab === 'annulés') {
      // Cancelled or rejected appointments
      filtered = filtered.filter(a => 
        a.status === AppointmentStatus.CANCELED || a.status === AppointmentStatus.REJECTED
      );
    } else if (this.activeTab === 'terminés') {
      // Completed appointments
      filtered = filtered.filter(a => a.status === AppointmentStatus.COMPLETED);
    } else if (this.activeTab === 'passés') {
      // Past appointments (date in the past, regardless of status)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(a.appointmentDateTime);
        return appointmentDate < today && a.status !== AppointmentStatus.COMPLETED;
      });
    }
    
    // Apply search query filter if present
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        const doctorName = a.doctor ? 
          `${a.doctor.prenom || ''} ${a.doctor.nom || ''}`.toLowerCase() : '';
        const appointmentType = this.getAppointmentTypeLabel(a.appointmentType).toLowerCase();
        const date = new Date(a.appointmentDateTime).toLocaleDateString();
        
        return doctorName.includes(query) || 
               appointmentType.includes(query) || 
               date.includes(query);
      });
    }
    
    // Sort appointments by date - most recent first
    filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDateTime);
      const dateB = new Date(b.appointmentDateTime);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Update total count for pagination
    this.totalAppointments = filtered.length;
    
    // Apply pagination
    const start = this.currentPage * this.pageSize;
    const paginatedResults = filtered.slice(start, start + this.pageSize);
    
    return paginatedResults;
  }

  getAppointmentTypeLabel(type: string): string {
    switch (type) {
      case 'DETARTRAGE':
        return 'Détartrage';
      case 'SOIN':
        return 'Soin';
      case 'EXTRACTION':
        return 'Extraction';
      case 'BLANCHIMENT':
        return 'Blanchiment';
      case 'ORTHODONTIE':
        return 'Orthodontie';
      default:
        return type;
    }
  }

  getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.ACCEPTED:
        return 'Accepté';
      case AppointmentStatus.REJECTED:
        return 'Refusé';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELED:
        return 'Annulé';
      default:
        return status;
    }
  }

  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'status-pending';
      case AppointmentStatus.ACCEPTED:
        return 'status-accepted';
      case AppointmentStatus.COMPLETED:
        return 'status-completed';
      case AppointmentStatus.REJECTED:
      case AppointmentStatus.CANCELED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  cancelAppointment(appointment: Appointment): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.appointmentService.cancelAppointment(appointment.id).subscribe({
        next: () => {
          this.loadAppointments();
          this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          this.snackBar.open('Erreur lors de l\'annulation du rendez-vous', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
        }
      });
    }
  }

  rescheduleAppointment(appointment: Appointment): void {
    if (!appointment.doctor) {
      this.snackBar.open('Informations du médecin manquantes', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
      return;
    }

    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      data: {
        doctor: appointment.doctor,
        isEdit: true,
        appointment: appointment
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAppointments();
        this.snackBar.open('Rendez-vous modifié avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  // Reset to first page when changing tab or search criteria
  resetPagination(): void {
    this.currentPage = 0;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab.toLowerCase();
    this.resetPagination();
  }

  filterAppointments(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.resetPagination();
  }
  
  // Navigate to booking page or open booking dialog
  bookAppointment(): void {
    this.router.navigate(['/dashboard/patient'], { queryParams: { section: 'book-appointment' } });
  }

  /**
   * Books a new appointment with the same doctor from a previous appointment
   * @param appointment The previous appointment with the doctor
   */
  bookWithSameDoctor(appointment: Appointment): void {
    if (!appointment.doctor) {
      this.snackBar.open('Informations du médecin manquantes', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
      return;
    }
    
    // Open the appointment booking dialog with the doctor pre-selected
    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      data: {
        doctor: appointment.doctor,
        isNewAppointment: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAppointments(); // Refresh the appointments list
        this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  // Method to get doctor initials for avatar display
  getDoctorInitials(doctor: any): string {
    if (!doctor) return '?';
    
    const firstLetter = doctor.prenom ? doctor.prenom.charAt(0).toUpperCase() : '';
    const secondLetter = doctor.nom ? doctor.nom.charAt(0).toUpperCase() : '';
    
    if (firstLetter && secondLetter) return firstLetter + secondLetter;
    if (firstLetter) return firstLetter;
    if (secondLetter) return secondLetter;
    
    return '?';
  }

  // Method to get profile image URL
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

  // Method to handle image loading errors
  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    const originalSrc = imgElement.src;
    console.error('Image loading failed in patient appointments:', originalSrc);
    
    // Create a new div element with initials instead of the image
    try {
      const parentElement = imgElement.parentElement;
      if (parentElement) {
        // Get the appointment data to create initials
        const appointmentCard = parentElement.closest('.appointment-card');
        if (appointmentCard) {
          // Try to find the doctor name
          const doctorNameElement = appointmentCard.querySelector('.doctor-name');
          if (doctorNameElement && doctorNameElement.textContent) {
            const name = doctorNameElement.textContent.trim();
            const initials = this.getInitialsFromName(name);
            
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
} 