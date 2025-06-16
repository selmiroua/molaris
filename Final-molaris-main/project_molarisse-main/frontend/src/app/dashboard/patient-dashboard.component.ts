import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../auth/auth.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileWrapperComponent } from '../profile-wrapper/profile-wrapper.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { AppointmentListComponent } from './appointment/appointment-list.component';
import { AppointmentTabsComponent } from './appointment/appointment-tabs.component';
import { ProfileComponent } from "../profile/profile.component";
import { ValidateAccountComponent } from "../validate-account/validate-account.component";
import { BookAppointmentComponent, AppointmentFormDialogComponent } from './appointment/book-appointment.component';
import { AppointmentService, Appointment, AppointmentType, CaseType, AppointmentStatus } from '../core/services/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WelcomeModalComponent } from '../shared/components/welcome-modal/welcome-modal.component';
import { PatientService } from '../core/services/patient.service';
import { PatientAppointmentsComponent } from './appointment/patient-appointments.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MessageBellComponent } from '../shared/message-bell/message-bell.component';
import { MessagingComponent } from '../messaging/messaging.component';
import { ProfileService, UserProfile } from '../profile/profile.service';
import { environment } from '../../environments/environment';
import { BannedUserService } from '../shared/services/banned-user.service';
import { AppointmentDetailDialogComponent } from './appointment/appointment-detail-dialog.component';
// The component is imported dynamically in viewAppointmentDetails to avoid circular dependencies

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatMenuModule, 
    MatIconModule, 
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    ProfileWrapperComponent, 
    NotificationBellComponent, 
    MessageBellComponent,
    AppointmentListComponent,
    AppointmentTabsComponent,
    ProfileComponent, 
    ValidateAccountComponent, 
    BookAppointmentComponent,
    WelcomeModalComponent,
    AppointmentFormDialogComponent,
    PatientAppointmentsComponent,
    MessagingComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PatientDashboardComponent implements OnInit {
  isBaseRoute: boolean = true;
  isMenuOpen: boolean = true;
  activeSection: string = 'dashboard';
  appointments: Appointment[] = [];
  loading: boolean = false;
  patientName: string = '';
  profileImage: string = 'assets/images/default-avatar.png';
  isProfileDropdownOpen: boolean = false;
  isFullscreen: boolean = false;
  isMobile: boolean = false;
  userId: number | null = null;
  timestamp: number = Date.now(); // Timestamp to prevent caching
  
  // Stats properties
  todayAppointments: number = 0;
  pendingAppointments: number = 0;
  totalAppointments: number = 0;
  
  // New properties for appointments handling
  appointmentsLoading: boolean = false;
  appointmentsError: boolean = false;
  appointmentsErrorMessage: string = '';
  
  // New properties for appointments tabs
  activeTab: string = 'upcoming';
  dateRange: string = '04/28/2023 - 05/04/2023';
  searchQuery: string = '';

  userProfile?: UserProfile;
  
  // UI properties
  hasIllustration: boolean = false; // Will be true if the illustration image exists

  isBanned: boolean = false;
  
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private patientService: PatientService,
    private profileService: ProfileService,
    public bannedUserService: BannedUserService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/patient';
    });
    
    // Check if we are on mobile
    this.checkScreenSize();
  }

  // Listen for window resize events
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  // Check screen size to determine if we're on mobile
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    
    // Auto-close menu on mobile
    if (this.isMobile) {
      this.isMenuOpen = false;
    } else {
      this.isMenuOpen = true;
    }
  }

  ngOnInit(): void {
    this.isBaseRoute = this.router.url === '/dashboard/patient';
    this.route.queryParams.subscribe(params => {
      if (params['section'] === 'profile') {
        this.activeSection = 'profile';
      } else if (params['section'] === 'appointments') {
        this.activeSection = 'appointments';
      } else if (params['section'] === 'book-appointment') {
        this.activeSection = 'book-appointment';
      } else if (params['section'] === 'messaging') {
        this.activeSection = 'messaging';
      }
    });
    
    // Load appointments data for dashboard view
    this.loadAppointments();
    
    // First get the current user
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.patientName = (user.prenom || '') + ' ' + (user.nom || '');
        this.userId = user.id;
        console.log('Current user:', user);
        
        // Get profile image using ID-based approach (new method)
        if (user.id) {
          this.profileImage = this.getProfileImageByUserId(user.id);
          console.log('Using profile image by user ID:', this.profileImage);
        } 
        // Fallback to legacy path-based approach if no ID available
        else if (user.profilePicturePath) {
          this.profileImage = this.getProfileImageUrl(user.profilePicturePath);
          console.log('Using profile image by path:', this.profileImage);
        } 
        // Default image as last resort
        else {
          this.profileImage = 'assets/images/default-avatar.png';
          console.log('Using default profile image (no user data available)');
        }

        // Check if patient has a fiche and show welcome modal if not
        this.patientService.getCurrentPatientFiche().subscribe({
          next: (fiche) => {
            if (!fiche) {
              this.dialog.open(WelcomeModalComponent, {
                data: { userName: this.patientName },
                disableClose: true,
                width: '900px',
                maxWidth: '98vw',
              });
            }
          },
          error: (error) => {
            if (error.status === 404) {
              this.dialog.open(WelcomeModalComponent, {
                data: { userName: this.patientName },
                disableClose: true,
                width: '900px',
                maxWidth: '98vw',
              });
            }
          }
        });
      }
    });

    // Fetch user profile for header name
    this.profileService.getCurrentProfile().subscribe(profile => {
      this.userProfile = profile;
      this.patientName = `${profile.prenom} ${profile.nom}`;
      
      // Update profile image if we have a user ID from the profile
      if (profile.id && !this.profileImage.includes('picture-by-id')) {
        this.profileImage = this.getProfileImageByUserId(profile.id);
        console.log('Updated profile image using profile ID:', this.profileImage);
      }
    });

    // Check if user is banned
    this.isBanned = this.bannedUserService.isBanned();
    
    // If banned, show a notification to inform the user
    if (this.isBanned) {
      this.snackBar.open('Votre compte est suspendu. Certaines fonctionnalités sont limitées. Contactez l\'administrateur via la messagerie.', 'Compris', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['banned-notification-snackbar']
      });
    }
  }

  loadAppointments(): void {
    this.loading = true;
    console.log('Loading patient appointments in dashboard...');
    
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments: Appointment[]) => {
        console.log('Successfully fetched appointments:', appointments);
        this.appointments = appointments;
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.todayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDateTime);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        }).length;
        
        this.pendingAppointments = appointments.filter(apt => 
          apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED
        ).length;
        
        this.totalAppointments = appointments.length;
        
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
        
        // Create demo appointments data
        this.createDemoAppointments();
        
        // Show an error message to the user
        this.snackBar.open('Erreur de connexion au serveur. Affichage des données de démonstration.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  // Create demo appointments when server connection fails
  createDemoAppointments(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.appointments = [
      {
        id: 1,
        appointmentDateTime: today.toISOString(),
        status: AppointmentStatus.ACCEPTED,
        caseType: CaseType.NORMAL,
        appointmentType: AppointmentType.SOIN,
        notes: 'Rendez-vous de démonstration',
        doctor: {
          id: 1,
          prenom: 'Jean',
          nom: 'Dupont',
          address: '123 Rue de la Médecine, Paris'
        }
      },
      {
        id: 2,
        appointmentDateTime: tomorrow.toISOString(),
        status: AppointmentStatus.PENDING,
        caseType: CaseType.NORMAL,
        appointmentType: AppointmentType.DETARTRAGE,
        notes: 'Rendez-vous de démonstration',
        doctor: {
          id: 2,
          prenom: 'Marie',
          nom: 'Curie',
          address: '456 Avenue de la Science, Lyon'
        }
      },
      {
        id: 3,
        appointmentDateTime: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: AppointmentStatus.COMPLETED,
        caseType: CaseType.NORMAL,
        appointmentType: AppointmentType.EXTRACTION,
        notes: 'Rendez-vous de démonstration terminé',
        doctor: {
          id: 1,
          prenom: 'Jean',
          nom: 'Dupont',
          address: '123 Rue de la Médecine, Paris'
        }
      }
    ];
    
    // Calculate stats from demo data
    const demoToday = new Date();
    demoToday.setHours(0, 0, 0, 0);
    
    this.todayAppointments = this.appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDateTime);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === demoToday.getTime();
    }).length;
    
    this.pendingAppointments = this.appointments.filter(apt => 
      apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.ACCEPTED
    ).length;
    
    this.totalAppointments = this.appointments.length;
  }

  getAppointmentTypeLabel(type: AppointmentType): string {
    switch (type) {
      case AppointmentType.DETARTRAGE:
        return 'Détartrage';
      case AppointmentType.SOIN:
        return 'Soin';
      case AppointmentType.EXTRACTION:
        return 'Extraction';
      case AppointmentType.BLANCHIMENT:
        return 'Blanchiment';
      case AppointmentType.ORTHODONTIE:
        return 'Orthodontie';
      default:
        return type;
    }
  }

  getCaseTypeLabel(type: CaseType): string {
    switch (type) {
      case CaseType.URGENT:
        return 'Urgent';
      case CaseType.CONTROL:
        return 'Contrôle';
      case CaseType.NORMAL:
        return 'Normal';
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'schedule';
      case 'ACCEPTED':
        return 'check_circle';
      case 'REJECTED':
        return 'cancel';
      case 'COMPLETED':
        return 'task_alt';
      case 'CANCELED':
        return 'event_busy';
      default:
        return 'help';
    }
  }

  getCaseTypeIcon(type: string): string {
    switch (type) {
      case 'URGENT':
        return 'priority_high';
      case 'CONTROL':
        return 'event_repeat';
      case 'NORMAL':
        return 'check_circle_outline';
      default:
        return 'info';
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

  viewAppointmentDetails(appointment: Appointment): void {
    console.log('View appointment details:', appointment);
    // Import dynamically to avoid circular dependencies
    import('./appointment/appointment-detail-dialog.component').then(({ AppointmentDetailDialogComponent }) => {
      this.dialog.open(AppointmentDetailDialogComponent, {
        width: '900px',
        maxWidth: '98vw',
        data: appointment,
        panelClass: 'appointment-dialog'
      });
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    // Close menu when clicking outside on mobile
    if (this.isMobile && this.isMenuOpen) {
      // Add click outside listener
      setTimeout(() => {
        const backdrop = document.querySelector('.dashboard-container::before') as HTMLElement;
        if (backdrop) {
          backdrop.addEventListener('click', this.closeMenuOnBackdropClick);
        }
      }, 100);
    }
  }
  
  closeMenuOnBackdropClick = () => {
    this.isMenuOpen = false;
    // Remove the listener
    const backdrop = document.querySelector('.dashboard-container::before') as HTMLElement;
    if (backdrop) {
      backdrop.removeEventListener('click', this.closeMenuOnBackdropClick);
    }
  }

  showDashboard(event?: Event): void {
    if (event && this.bannedUserService.handleLinkClick(event, 'dashboard')) {
      return;
    }
    this.activeSection = 'dashboard';
    this.router.navigate(['/dashboard/patient']);
  }

  showProfile(event?: Event): void {
    if (event && this.bannedUserService.handleLinkClick(event, 'profile')) {
      return;
    }
    this.activeSection = 'profile';
    this.router.navigate(['/dashboard/patient'], { queryParams: { section: 'profile' } });
  }

  showAppointments(event?: Event): void {
    if (event && this.bannedUserService.handleLinkClick(event, 'appointments')) {
      return;
    }
    this.activeSection = 'appointments';
    this.router.navigate(['/dashboard/patient'], { queryParams: { section: 'appointments' } });
    
    // Start loading indicator
    this.appointmentsLoading = true;
    this.appointmentsError = false;
    
    // Fetch appointments fresh when viewing this section
    this.refreshAppointments();
  }

  navigateToBookAppointment(event?: Event): void {
    if (event && this.bannedUserService.handleLinkClick(event, 'book-appointment')) {
      return;
    }
    this.activeSection = 'book-appointment';
    this.router.navigate(['/dashboard/patient'], { queryParams: { section: 'book-appointment' } });
  }

  showMessaging(): void {
    this.activeSection = 'messaging';
    this.router.navigate(['/dashboard/patient'], { queryParams: { section: 'messaging' } });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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

  refreshAppointments(): void {
    this.appointmentsLoading = true;
    this.appointmentsError = false;
    
    console.log('Manually refreshing appointments...');
    
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments) => {
        console.log('Successfully refreshed appointments:', appointments);
        this.appointments = appointments;
        this.appointmentsLoading = false;
        
        // Log doctor info for debugging
        if (appointments.length > 0) {
          const firstDoctor = appointments[0].doctor;
          console.log('First doctor info:', firstDoctor);
          console.log('Email resolved to:', this.getDoctorEmail(firstDoctor));
          console.log('Phone resolved to:', this.getDoctorPhone(firstDoctor));
        }
      },
      error: (error) => {
        console.error('Error refreshing appointments:', error);
        this.appointmentsLoading = false;
        this.appointmentsError = true;
        this.appointmentsErrorMessage = error.message || 'Une erreur est survenue lors du chargement des rendez-vous.';
        
        // Create demo appointments data
        this.createDemoAppointments();
        
        this.snackBar.open('Erreur de connexion au serveur. Affichage des données de démonstration.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  getAppointmentTypeForDisplay(type: AppointmentType): string {
    // This method allows us to perform string comparisons in the template
    // We need to convert the enum to a string representation for comparison
    return type ? type.toString() : '';
  }

  handleImageError(event: any): void {
    console.log('Image loading error occurred', event);
    const imgElement = event.target as HTMLImageElement;
    
    // Try to get the image using the other method if we have userId
    if (this.userId && imgElement.src.includes('profile/picture/')) {
      console.log('Trying to load image using picture-by-id instead');
      imgElement.src = this.getProfileImageByUserId(this.userId);
    } 
    // If we were already using picture-by-id or we don't have userId, use default
    else {
      console.log('Falling back to default avatar');
      imgElement.src = 'assets/images/default-avatar.png';
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  getTabCount(status: string, additionalStatus?: string): number {
    return this.appointments.filter(a => 
      a.status === status || (additionalStatus && a.status === additionalStatus)
    ).length;
  }
  
  getFilteredAppointments(): Appointment[] {
    // Filter by active tab
    let filtered = this.appointments.filter(a => {
      if (this.activeTab === 'upcoming') {
        return a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.ACCEPTED;
      } else if (this.activeTab === 'cancelled') {
        return a.status === AppointmentStatus.CANCELED || a.status === AppointmentStatus.REJECTED;
      } else if (this.activeTab === 'completed') {
        return a.status === AppointmentStatus.COMPLETED;
      }
      return true;
    });
    
    // Filter by search query if present
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.doctor?.nom?.toLowerCase().includes(query) || 
        a.doctor?.prenom?.toLowerCase().includes(query) ||
        this.getAppointmentTypeLabel(a.appointmentType).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }
  
  filterAppointments(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  getDoctorEmail(doctor: any): string {
    if (!doctor) return 'N/A';
    
    console.log('Getting doctor email from:', doctor);
    
    // Check different possible locations for email
    const email = doctor.email || 
                 (doctor.user && doctor.user.email) || 
                 (doctor.userProfile && doctor.userProfile.email) ||
                 'N/A';
                 
    console.log('Resolved email to:', email);
    return email;
  }

  getDoctorPhone(doctor: any): string {
    if (!doctor) return 'N/A';
    
    console.log('Getting doctor phone from:', doctor);
    
    // Check different possible locations for phone
    const phone = doctor.phoneNumber || 
                 doctor.phone || 
                 (doctor.user && doctor.user.phoneNumber) || 
                 (doctor.userProfile && doctor.userProfile.phoneNumber) ||
                 'N/A';
                 
    console.log('Resolved phone to:', phone);
    return phone;
  }

  getDoctorName(doctor: any): string {
    if (!doctor) return 'Unknown Doctor';
    
    const firstName = doctor.prenom || (doctor.userProfile && doctor.userProfile.prenom) || '';
    const lastName = doctor.nom || (doctor.userProfile && doctor.userProfile.nom) || '';
    
    if (!firstName && !lastName) return 'Dr.';
    
    return `Dr. ${lastName} ${firstName}`.trim();
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  showSettings(): void {
    // Implement settings view
    console.log('Show settings');
  }

  showNotifications(): void {
    // Implement notifications view
    console.log('Show notifications');
  }

  // Get today's appointments
  getTodaysAppointments(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDateTime);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    }).sort((a, b) => {
      // Sort by time ascending
      const timeA = new Date(a.appointmentDateTime).getTime();
      const timeB = new Date(b.appointmentDateTime).getTime();
      return timeA - timeB;
    });
  }

  // Book a follow-up appointment with the same doctor
  bookFollowUpAppointment(appointment: Appointment): void {
    console.log('Book follow-up appointment with:', appointment.doctor);
    if (!appointment.doctor) {
      this.snackBar.open('Informations du médecin manquantes', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      });
      return;
    }
    
    // Open the appointment booking dialog with the doctor pre-selected
    import('./appointment/book-appointment.component').then(({ AppointmentFormDialogComponent }) => {
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
    });
  }

  // Add the method from profile component
  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = Date.now();
        // Use the standard profile picture endpoint
        const url = `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
        console.log('Profile picture URL:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    console.log('Using default avatar');
    return 'assets/images/default-avatar.png';
  }

  // Method to get profile image by user ID
  getProfileImageByUserId(userId: number): string {
    if (userId) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = Date.now();
        // Use the picture-by-id endpoint
        const url = `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${userId}?t=${timestamp}`;
        console.log('Profile picture URL by ID:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL by ID:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    console.log('Using default avatar (no user ID)');
    return 'assets/images/default-avatar.png';
  }
}
