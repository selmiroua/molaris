import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { AppointmentListComponent } from './appointment/appointment-list.component';
import { AppointmentTabsComponent } from './appointment/appointment-tabs.component';
import { AuthService } from '../core/services/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { ValidateAccountComponent } from '../validate-account/validate-account.component';
import { AppointmentCalendarComponent } from '../appointment-calendar/appointment-calendar.component';
import { SecretaryApplicationsComponent } from '../doctor/secretary-applications/secretary-applications.component';
import { UserService } from '../core/services/user.service';
import { jwtDecode } from 'jwt-decode';
import { NotificationService } from '../core/services/notification.service';
import { SecretaryRequestsComponent } from '../doctor/secretary-requests/secretary-requests.component';
import { UnassignedSecretariesComponent } from '../doctor/unassigned-secretaries/unassigned-secretaries.component';
import { AssignedSecretariesComponent } from '../doctor/assigned-secretaries/assigned-secretaries.component';
import { DoctorSecretaryViewComponent } from './appointment/doctor-secretary-view.component';
import { AppointmentService } from '../core/services/appointment.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProfileService } from '../profile/profile.service';
import { environment } from '../../environments/environment';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DoctorWelcomeDialogComponent } from '../doctor/doctor-welcome-dialog/doctor-welcome-dialog.component';
import { AppointmentDetailDialogComponent } from './appointment/appointment-detail-dialog.component';
import { MessageBellComponent } from '../shared/message-bell/message-bell.component';
import { MessagingComponent } from '../messaging/messaging.component';
import { ColorPaletteDialogComponent } from './color-palette-dialog.component';
import { ColorPreferenceService } from '../core/services/color-preference.service';
import { HttpClient } from '@angular/common/http';
import { DoctorVerificationService } from '../core/services/doctor-verification.service';
import { MatCardModule } from '@angular/material/card';
import { SecretaryAppointmentListComponent } from './appointment/secretary-appointment-list.component';
import { DoctorStatisticsComponent } from './statistics/doctor-statistics.component';

interface User {
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

interface AppointmentStats {
  today: number;
  pending: number;
  total: number;
}

interface DecodedToken {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  profilePicturePath?: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    NotificationBellComponent,
    AppointmentListComponent,
    AppointmentTabsComponent,
    ProfileComponent,
    ValidateAccountComponent,
    AppointmentCalendarComponent,
    SecretaryApplicationsComponent,
    SecretaryRequestsComponent,
    UnassignedSecretariesComponent,
    AssignedSecretariesComponent,
    DoctorSecretaryViewComponent,
    AppointmentDetailDialogComponent,
    MessageBellComponent,
    MessagingComponent,
    ColorPaletteDialogComponent,
    MatCardModule,
    SecretaryAppointmentListComponent,
    DoctorStatisticsComponent
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit {
  isMenuOpen = true;
  activeSection = 'dashboard';
  isBaseRoute = true;
  hasAssignedSecretary = false;
  isVerified = false;
  verificationStatusChecked = false;
  // Development mode toggle - set to false to enable verification checks
  static isDevelopmentMode = false;
  userProfileImage: string | null = null;
  userName: string = '';
  isProfileDropdownOpen: boolean = false;
  doctorName: string = '';
  doctorRole: string = '';
  profilePicture: string | null = null;
  todayAppointments: number = 0;
  pendingAppointments: number = 0;
  totalAppointments: number = 0;
  isFullscreen: boolean = false;
  environment = environment;
  isMobile: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService,
    private appointmentService: AppointmentService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private colorPreferenceService: ColorPreferenceService,
    private http: HttpClient,
    private doctorVerificationService: DoctorVerificationService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/doctor';
    });
    
    // Check if we are on mobile
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.loadDoctorProfile();
    this.checkSecretaryAssignment();
    this.loadAppointmentStats();
    this.loadColorPreferences();
  }

  checkSecretaryAssignment(): void {
    this.userService.getAssignedSecretaries().subscribe({
      next: (secretaries) => {
        this.hasAssignedSecretary = secretaries && secretaries.length > 0;
        console.log('Has assigned secretary:', this.hasAssignedSecretary);
        
        if (this.hasAssignedSecretary && this.activeSection === 'secretary-applications') {
          this.showDashboard();
        }
      },
      error: (error) => {
        console.error('Error checking secretary assignment:', error);
        this.hasAssignedSecretary = false;
      }
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

  showDashboard() {
    this.activeSection = 'dashboard';
  }

  showProfile() {
    this.activeSection = 'profile';
  }

  showValidateAccount() {
    this.activeSection = 'validate';
  }

  showAppointments() {
    this.activeSection = 'appointments';
  }

  showCalendar() {
    this.activeSection = 'calendar';
  }

  showStatistics() {
    this.activeSection = 'statistics';
  }

  showMessaging() {
    this.activeSection = 'messaging';
  }

  showSecretaryApplications() {
    this.activeSection = 'secretary-applications';
  }

  logout() {
    console.log('Logging out...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileElement = (event.target as HTMLElement).closest('.user-profile');
    if (!profileElement) {
      this.isProfileDropdownOpen = false;
    }
  }

  private loadDoctorProfile(): void {
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        const capitalizedNom = profile.nom.charAt(0).toUpperCase() + profile.nom.slice(1);
        const capitalizedPrenom = profile.prenom.charAt(0).toUpperCase() + profile.prenom.slice(1);
        this.doctorName = `Dr. ${capitalizedPrenom} ${capitalizedNom}`;
        this.userName = `${capitalizedPrenom} ${capitalizedNom}`;
        this.doctorRole = 'Médecin';
        this.profilePicture = this.getProfileImageUrl(profile.profilePicturePath);
        localStorage.setItem('user_name', JSON.stringify({
          nom: capitalizedNom,
          prenom: capitalizedPrenom
        }));

        // Check verification status
        console.log('Checking verification for doctor ID:', profile.id);
        this.doctorVerificationService.getVerificationByDoctorId(Number(profile.id)).subscribe({
          next: (verification) => {
            console.log('Got verification:', verification);
            console.log('Raw verification object:', JSON.stringify(verification));
            
            if (verification && verification.status) {
              const status = verification.status.toLowerCase();
              console.log('Verification status:', status);
              
              // Set isVerified to true ONLY when status is 'approved'
              this.isVerified = status === 'approved';
              console.log('Setting isVerified to:', this.isVerified);
            } else {
              this.isVerified = false;
            }
            
            // Always set this to true after checking
            this.verificationStatusChecked = true;
            console.log('Final verification state - isVerified:', this.isVerified, 'statusChecked:', this.verificationStatusChecked);
          },
          error: (error) => {
            console.log('Verification error:', error.status);
            this.isVerified = false;
            this.verificationStatusChecked = true;
            
            if (error.status === 404) {
              this.openWelcomeDialog();
            } else {
              console.error('Error checking verification:', error);
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loadNameFromLocalStorage();
      }
    });
  }

  private loadNameFromLocalStorage(): void {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      try {
        const { prenom, nom } = JSON.parse(storedName);
        this.doctorName = `Dr. ${nom} ${prenom}`;
      } catch (e) {
        this.setDefaultValues();
      }
    } else {
      this.setDefaultValues();
    }
  }

  private setDefaultValues(): void {
    this.doctorName = '';
    this.doctorRole = 'Médecin';
    this.profilePicture = null;
  }

  private loadAppointmentStats(): void {
    this.appointmentService.getMyDoctorAppointments().subscribe({
      next: (appointments: any[]) => {
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count today's appointments (all appointments for today regardless of status)
        this.todayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDateTime);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        }).length;
        
        // Count pending appointments (appointments with PENDING status)
        this.pendingAppointments = appointments.filter(apt => 
          apt.status === 'PENDING'
        ).length;
        
        // Total appointments (all appointments regardless of status)
        this.totalAppointments = appointments.length;
        
        // Log the counts for debugging
        console.log('Appointment Stats:', {
          today: this.todayAppointments,
          pending: this.pendingAppointments,
          total: this.totalAppointments,
          appointments: appointments
        });
      },
      error: (error: Error) => {
        console.error('Error loading appointment stats:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
      }
    });
  }

  getHeaderTitle(): string {
    switch (this.activeSection) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'profile':
        return 'Mon Profile';
      case 'verification':
        return 'Vérification Professionnelle';
      case 'appointments':
        return 'Liste des RDV';
      case 'calendar':
        return 'Calendrier';
      case 'secretary-requests':
        return 'Vérifications des médecins';
      case 'unassigned-secretaries':
        return 'Secrétaires disponibles';
      case 'my-staff':
        return 'Mon équipe';
      default:
        return 'Tableau de bord';
    }
  }

  showSecretaryRequests(): void {
    this.activeSection = 'secretary-requests';
  }

  showUnassignedSecretaries() {
    this.activeSection = 'unassigned-secretaries';
  }

  showMyStaff() {
    this.activeSection = 'my-staff';
  }

  showSettings(): void {
    // Open color palette dialog
    const dialogRef = this.dialog.open(ColorPaletteDialogComponent, {
      width: '500px',
      disableClose: false,
      data: null  // We'll load the current colors inside the component
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Save the color preferences if dialog was not cancelled
        this.colorPreferenceService.saveColorPreferences(result).subscribe({
          next: () => {
            // Apply the new colors to the DOM
            this.colorPreferenceService.applyColorPreferencesToDOM(result);
            this.snackBar.open('Les préférences de couleurs ont été enregistrées', 'OK', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error saving color preferences:', error);
            this.snackBar.open('Erreur lors de l\'enregistrement des préférences', 'OK', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
      this.isProfileDropdownOpen = false;
    });
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        this.isFullscreen = false;
      }
    }
  }

  @HostListener('document:fullscreenchange', [])
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
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

  get profileImage(): string {
    return this.profilePicture || 'assets/images/default-avatar.png';
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }

  showNotifications(): void {
    console.log('Showing notifications...');
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    if (section === 'dashboard') {
      this.router.navigate(['/dashboard/doctor']);
    } else {
      this.router.navigate([`/dashboard/doctor/${section}`]);
    }
  }

  openWelcomeDialog() {
    const dialogRef = this.dialog.open(DoctorWelcomeDialogComponent, {
      data: { userName: `Dr. ${this.userName}` },
      disableClose: true,
      width: '800px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Show profile inside dashboard and update URL
      this.activeSection = 'profile';
      this.router.navigate(['/dashboard/doctor/profile']);
    });
  }

  // Load and apply color preferences
  private loadColorPreferences(): void {
    this.colorPreferenceService.getColorPreferences().subscribe(
      colors => {
        this.colorPreferenceService.applyColorPreferencesToDOM(colors);
      },
      error => {
        console.error('Error loading color preferences:', error);
        // Apply defaults if there was an error
        this.colorPreferenceService.applyColorPreferencesToDOM(this.colorPreferenceService.defaultColors);
      }
    );
  }

  // Reset color preferences to default
  resetColorPreferences(): void {
    this.colorPreferenceService.resetColorPreferences().subscribe({
      next: () => {
        // Apply default colors
        this.colorPreferenceService.applyColorPreferencesToDOM(this.colorPreferenceService.defaultColors);
        this.snackBar.open('Les couleurs ont été réinitialisées', 'OK', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error resetting color preferences:', error);
        this.snackBar.open('Erreur lors de la réinitialisation des couleurs', 'OK', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
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
}
