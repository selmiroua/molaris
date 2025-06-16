import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
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
import { DateTimeSelectionDialogComponent } from './appointment/date-time-selection-dialog.component';
import { AppointmentTypeSelectionDialogComponent } from '../appointment-calendar/appointment-type-selection-dialog.component';
import { UnregisteredPatientAppointmentDialogComponent } from '../appointment-calendar/unregistered-patient-appointment-dialog.component';
import { DoctorPatientSelectionDialogComponent } from './appointment/doctor-patient-selection-dialog.component';
import { DoctorBookAppointmentDialogComponent } from './appointment/doctor-book-appointment-dialog.component';
import { BannedUserService } from '../shared/services/banned-user.service';
import { DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentDetailDialogFichePComponent } from './appointment/appointment-detail-dialog-ficheP';
import { EditFicheDialogComponent } from './appointment/edit-fiche-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { SecretaryBookAppointmentDialogComponent } from './appointment/secretary-book-appointment-dialog.component';

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
    DoctorStatisticsComponent,
    DateTimeSelectionDialogComponent,
    AppointmentTypeSelectionDialogComponent,
    UnregisteredPatientAppointmentDialogComponent,
    DoctorPatientSelectionDialogComponent,
    DoctorBookAppointmentDialogComponent,
    MatProgressSpinnerModule,
    AppointmentDetailDialogFichePComponent,
    EditFicheDialogComponent,
    FormsModule,
    MatPaginatorModule,
    SecretaryBookAppointmentDialogComponent
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.scss'],
  providers: [DatePipe]
})
export class DoctorDashboardComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
  currentDoctorId: number | null = null;
  isBanned: boolean = false;
  doctorPatients: any[] = [];
  filteredPatients: any[] = [];
  loadingPatients = false;
  patientsPerPage = 5;
  currentPage = 1;
  patientsPerPageOptions = [5, 10, 15];
  pageSize = 10;
  private _paginatedPatients: any[] = [];

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
    private doctorVerificationService: DoctorVerificationService,
    public bannedUserService: BannedUserService
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
    // Check if user is banned
    this.isBanned = this.bannedUserService.isBanned();
    
    // If banned, redirect to messaging if not already there
    if (this.isBanned && this.activeSection !== 'messaging') {
      this.showMessaging();
      this.snackBar.open('Votre compte est suspendu. Vous avez été redirigé vers la messagerie.', 'Compris', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['banned-notification-snackbar']
      });
    }
    
    // Check for query parameters
    this.router.routerState.root.queryParams.subscribe(params => {
      if (params['section']) {
        this.activeSection = params['section'];
        console.log('Setting active section from query params:', this.activeSection);
      }
    });
    
    this.loadDoctorProfile();
    this.checkSecretaryAssignment();
    this.loadAppointmentStats();
    this.loadColorPreferences();
    this.updatePaginatedPatients();
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

  showDashboard(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'dashboard')) return;
    this.activeSection = 'dashboard';
    this.router.navigate(['/dashboard/doctor']);
  }

  showProfile(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'profile')) return;
    this.activeSection = 'profile';
  }

  showValidateAccount(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'validate-account')) return;
    this.activeSection = 'validate-account';
  }

  showAppointments(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'appointments')) return;
    console.log('Setting active section to appointments');
    this.activeSection = 'appointments';
    // Force a UI update by triggering change detection
    setTimeout(() => {
      console.log('Active section is now:', this.activeSection);
      // Force reload of appointments data
      this.loadAppointmentStats();
    }, 100);
  }

  showCalendar(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'calendar')) return;
    this.activeSection = 'calendar';
  }

  showStatistics(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'statistics')) return;
    this.activeSection = 'statistics';
  }

  showMessaging(): void {
    this.activeSection = 'messaging';
    this.router.navigate(['/dashboard/doctor'], { queryParams: { section: 'messaging' } });
  }

  showSecretaryApplications(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'secretary-applications')) return;
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
        
        // Use direct URL to profile picture by ID with the correct API path
        if (profile.id) {
          this.profilePicture = `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${profile.id}`;
          console.log('Using direct profile picture URL by ID:', this.profilePicture);
        } else if (profile.profilePicturePath) {
          this.profilePicture = this.getProfileImageUrl(profile.profilePicturePath);
        } else {
          this.profilePicture = null;
        }
        
        this.currentDoctorId = profile.id ? Number(profile.id) : null;
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
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'secretary-requests')) return;
    this.activeSection = 'secretary-requests';
  }

  showUnassignedSecretaries(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'unassigned-secretaries')) return;
    this.activeSection = 'unassigned-secretaries';
  }

  showMyStaff(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'assigned-secretaries')) return;
    console.log('Setting active section to assigned-secretaries');
    this.activeSection = 'assigned-secretaries';
    // Force a UI update by triggering change detection
    setTimeout(() => {
      console.log('Active section is now:', this.activeSection);
      // Check secretary assignment
      this.checkSecretaryAssignment();
    }, 100);
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

  openBookAppointmentDialog(): void {
    // Ensure we have the doctor ID before proceeding
    if (!this.currentDoctorId) {
      this.profileService.getCurrentProfile().subscribe({
        next: (profile) => {
          this.currentDoctorId = profile.id ? Number(profile.id) : null;
          // Now proceed with appointment dialog
          this.openAppointmentDialogWithDoctorId();
        },
        error: (error) => {
          console.error('Error fetching doctor profile:', error);
          this.snackBar.open('Erreur lors de la récupération de votre profil', 'Fermer', { duration: 5000 });
        }
      });
    } else {
      // We already have the doctor ID, proceed directly
      this.openAppointmentDialogWithDoctorId();
    }
  }

  private openAppointmentDialogWithDoctorId(): void {
    // First, open the date-time selection dialog
    const dateTimeDialog = this.dialog.open(DateTimeSelectionDialogComponent, {
      width: '450px',
      data: {
        initialDate: new Date()
      },
      disableClose: false
    });

    dateTimeDialog.afterClosed().subscribe(selectedDateTime => {
      // If no date was selected (dialog was canceled), do nothing
      if (!selectedDateTime) return;
      
      // Open dialog for selecting appointment type with the selected date/time
      const selectionDialog = this.dialog.open(AppointmentTypeSelectionDialogComponent, {
        width: '400px',
        data: {
          date: selectedDateTime,
          doctorId: this.currentDoctorId
        },
        panelClass: 'appointment-type-dialog',
        disableClose: false
      });

      selectionDialog.afterClosed().subscribe(result => {
        if (result === 'unregistered') {
          // For unregistered patients
          console.log('Creating appointment for unregistered patient with doctor ID:', this.currentDoctorId);
          
          // Make sure the doctor ID is set correctly
          if (!this.currentDoctorId) {
            console.error('Doctor ID is missing - attempting to fetch from profile');
            this.profileService.getCurrentProfile().subscribe({
              next: (profile) => {
                console.log('Doctor profile retrieved:', JSON.stringify(profile));
                this.currentDoctorId = profile.id ? Number(profile.id) : null;
                console.log('Updated doctor ID:', this.currentDoctorId);
                
                // Now open the dialog with the doctor ID
                this.openUnregisteredPatientDialog(selectedDateTime);
              },
              error: (error) => {
                console.error('Error fetching doctor profile for unregistered patient:', error);
                this.snackBar.open('Erreur lors de la récupération de votre profil', 'Fermer', { duration: 5000 });
              }
            });
          } else {
            // We already have the doctor ID, proceed directly
            this.openUnregisteredPatientDialog(selectedDateTime);
          }
        } else if (result === 'registered') {
          // For registered patients - use doctor-specific component
          const patientSelectionDialog = this.dialog.open(DoctorPatientSelectionDialogComponent, {
            width: '600px',
            data: {
              selectedDate: selectedDateTime,
              doctorId: this.currentDoctorId
            }
          });

          patientSelectionDialog.afterClosed().subscribe(patient => {
            if (patient) {
              // Use doctor-specific booking dialog
              const dialogRef = this.dialog.open(DoctorBookAppointmentDialogComponent, {
                width: '800px',
                data: {
                  appointmentDate: selectedDateTime,
                  patient: patient,
                  doctorId: this.currentDoctorId
                },
                disableClose: true
              });

              dialogRef.afterClosed().subscribe(result => {
                if (result === true) {
                  // Refresh appointment components
                  this.loadAppointmentStats();
                }
              });
            }
          });
        }
      });
    });
  }

  private openUnregisteredPatientDialog(selectedDateTime: Date) {
    // Make sure the doctor ID is set correctly
    if (!this.currentDoctorId) {
      console.error('Doctor ID is missing - attempting to fetch from profile');
      this.profileService.getCurrentProfile().subscribe({
        next: (profile) => {
          console.log('Doctor profile retrieved:', JSON.stringify(profile));
          this.currentDoctorId = profile.id ? Number(profile.id) : null;
          console.log('Updated doctor ID:', this.currentDoctorId);
          
          // Now proceed with dialog
          this.openUnregisteredPatientDialogWithId(selectedDateTime);
        },
        error: (error) => {
          console.error('Error fetching doctor profile for unregistered patient:', error);
          this.snackBar.open('Erreur lors de la récupération de votre profil', 'Fermer', { duration: 5000 });
        }
      });
    } else {
      // We already have the doctor ID, proceed directly
      this.openUnregisteredPatientDialogWithId(selectedDateTime);
    }
  }
  
  private openUnregisteredPatientDialogWithId(selectedDateTime: Date) {
    console.log('Opening unregistered patient dialog with doctor ID:', this.currentDoctorId);
    
    if (!this.currentDoctorId) {
      console.error('ERROR: Doctor ID is still null or undefined when opening the dialog!');
      this.snackBar.open('Erreur: ID du médecin non disponible', 'Fermer', { duration: 5000 });
      return;
    }
    
    const dialogData = {
      appointmentDateTime: selectedDateTime,
      doctor: { id: this.currentDoctorId }
    };
    
    console.log('Dialog data being passed:', JSON.stringify(dialogData));
    
    const unregisteredDialog = this.dialog.open(UnregisteredPatientAppointmentDialogComponent, {
      width: '800px',
      data: dialogData,
      disableClose: true
    });

    unregisteredDialog.afterClosed().subscribe(result => {
      if (result && (result === true || result.success === true)) {
        // Refresh appointment components
        this.loadAppointmentStats();
      }
    });
  }

  viewPatientDetails(patient: any): void {
    // Find the latest appointment for this patient
    let latestAppointment = null;
    if (this.doctorPatients && patient && patient.id) {
      // Search all appointments for this patient
      // (Assume you have a way to get all appointments, or store them in a property)
      // For now, try to use patient.lastAppointment if available
      latestAppointment = {
        patient: patient,
        appointmentDateTime: patient.lastAppointment || null,
        // Add any other fields the dialog expects, or leave as null/undefined
      };
    }
    this.dialog.open(AppointmentDetailDialogFichePComponent, {
      width: '900px',
      maxWidth: '98vw',
      data: latestAppointment,
      panelClass: 'appointment-dialog'
    });
  }

  showPatients(): void {
    this.activeSection = 'patients';
    this.loadPatients();
  }

  filterPatients(search: string): void {
    if (!search) {
      this.filteredPatients = this.doctorPatients;
    } else {
      const lower = search.toLowerCase();
      this.filteredPatients = this.doctorPatients.filter(
        p => (p.nom && p.nom.toLowerCase().includes(lower)) ||
             (p.prenom && p.prenom.toLowerCase().includes(lower)) ||
             (p.email && p.email.toLowerCase().includes(lower)) ||
             (p.telephone && p.telephone.toLowerCase().includes(lower))
      );
    }
  }

  getPatientProfileImageUrl(patientId: number): string {
    if (!patientId) {
      return 'assets/images/default-avatar.png';
    }
    return `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${patientId}`;
  }

  bookAppointmentForPatient(patient: any): void {
    // TODO: Implement booking logic or leave empty for now
  }

  loadPatients(): void {
    this.loadingPatients = true;
    this.appointmentService.getMyDoctorAppointments().subscribe(
      (appointments: any[]) => {
        // Extract unique patients from appointments
        const patientMap = new Map();
        appointments.forEach(apt => {
          if (apt.patient && apt.patient.id) {
            patientMap.set(apt.patient.id, apt.patient);
          }
        });
        this.doctorPatients = Array.from(patientMap.values());
        this.filteredPatients = this.doctorPatients;
        this.loadingPatients = false;
        // Initialize paginated patients immediately after loading
        this.currentPage = 0; // Reset to first page
        this.updatePaginatedPatients();
      },
      (error: any) => {
        this.loadingPatients = false;
        console.error('Error loading patients:', error);
        this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', { duration: 3000 });
      }
    );
  }

  openEditFicheDialog(patient: any): void {
    const dialogRef = this.dialog.open(EditFicheDialogComponent, {
      width: '700px',
      data: { patientId: patient.id, nom: patient.nom, prenom: patient.prenom },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Rafraîchir la liste des patients si besoin
        if (typeof this.loadPatients === 'function') {
          this.loadPatients();
        }
      }
    });
  }

  get totalPages(): number {
    return Math.ceil((this.filteredPatients?.length || 0) / this.patientsPerPage);
  }

  get paginatedPatients() {
    return this._paginatedPatients;
  }

  setPatientsPerPage(count: number) {
    this.patientsPerPage = count;
    this.currentPage = 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.updatePaginatedPatients();
  }

  updatePaginatedPatients() {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this._paginatedPatients = this.doctorPatients.slice(start, end);
  }

  openBookAppointmentDialogForPatient(patient: any): void {
    console.log('Opening dialog for patient:', patient);
    const dialogRef = this.dialog.open(SecretaryBookAppointmentDialogComponent, {
      width: '600px',
      data: { patient: patient }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPatients();
        this.snackBar.open('Nouveau rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }

  onNavClick(event: Event, section: string, handler: Function) {
    if (!this.isVerified && this.verificationStatusChecked && section !== 'dashboard' && section !== 'profile') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    handler.call(this);
  }
}
