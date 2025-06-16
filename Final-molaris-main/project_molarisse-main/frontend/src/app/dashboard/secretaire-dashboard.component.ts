import { Component, OnInit, HostListener, ViewChild, ViewChildren, QueryList, AfterViewInit, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentListComponent } from './appointment/appointment-list.component';
import { AppointmentTabsComponent } from './appointment/appointment-tabs.component';
import { AppointmentCalendarComponent } from '../appointment-calendar/appointment-calendar.component';
import { ProfileComponent } from '../profile/profile.component';
import { ValidateAccountComponent } from '../validate-account/validate-account.component';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { MessageBellComponent } from '../shared/message-bell/message-bell.component';
import { DoctorApplicationComponent } from '../secretary/doctor-application/doctor-application.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from '../core/services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SecretaryService } from '../core/services/secretary.service';
import { RouterModule } from '@angular/router';
import { SecretaryAppointmentListComponent } from './appointment/secretary-appointment-list.component';
import { VerifiedDoctorsComponent } from '../secretary/verified-doctors/verified-doctors.component';
import { ProfileService, UserProfile } from '../profile/profile.service';
import { environment } from '../../environments/environment';
import { filter } from 'rxjs/operators';
import { AppointmentService } from '../core/services/appointment.service';
import { DirectAppointmentsComponent } from './appointment/direct-appointments.component';
import { MessagingComponent } from '../messaging/messaging.component';
import { MatDialog } from '@angular/material/dialog';
import { UnregisteredPatientDialogComponent } from '../dashboard/secretary/unregistered-patient-dialog.component';
import { AppointmentTypeSelectionDialogComponent } from '../appointment-calendar/appointment-type-selection-dialog.component';
import { UnregisteredPatientAppointmentDialogComponent } from '../appointment-calendar/unregistered-patient-appointment-dialog.component';
import { PatientSelectionDialogComponent } from '../dashboard/appointment/patient-selection-dialog.component';
import { SecretaryBookAppointmentDialogComponent } from '../dashboard/appointment/secretary-book-appointment-dialog.component';
import { DateTimeSelectionDialogComponent } from './appointment/date-time-selection-dialog.component';
import { CreatePatientDialogComponent } from './secretary/create-patient-dialog.component';
import { BannedUserService } from '../shared/services/banned-user.service';
import { SecretaryWelcomeDialogComponent } from '../secretary/welcome-dialog/secretary-welcome-dialog.component';
import { User } from '../core/models/user.model';
import { Statistics } from '../core/models/statistics.model';

@Component({
  selector: 'app-secretaire-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatCardModule,
    MatProgressSpinnerModule,
    AppointmentListComponent,
    AppointmentTabsComponent,
    AppointmentCalendarComponent,
    SecretaryAppointmentListComponent,
    ProfileComponent,
    DoctorApplicationComponent,
    VerifiedDoctorsComponent,
    NotificationBellComponent,
    MessageBellComponent,
    ValidateAccountComponent,
    DirectAppointmentsComponent,
    MessagingComponent,
    DateTimeSelectionDialogComponent,
    AppointmentTypeSelectionDialogComponent,
    UnregisteredPatientAppointmentDialogComponent,
    PatientSelectionDialogComponent,
    SecretaryBookAppointmentDialogComponent,
    CreatePatientDialogComponent,
    SecretaryWelcomeDialogComponent
  ],
  templateUrl: './secretaire-dashboard.component.html',
  styleUrls: ['./secretaire-dashboard.component.scss']
})
export class SecretaireDashboardComponent implements OnInit, AfterViewInit {
  isMenuOpen = true;
  activeSection = 'dashboard';
  unreadNotifications = 0;
  isAssignedToDoctor = true;
  profileImageUrl: string | null = null;
  secretaryName = '';
  isProfileDropdownOpen = false;
  showFallbackAppointments = false;
  isBaseRoute = true;
  isFullscreen: boolean = false;
  isMobile: boolean = false;
  accountLocked: boolean = false;
  isBanned: boolean = false;
  currentUser?: User;
  hasShownWelcomeDialog = false;
  currentUserProfile?: UserProfile;
  
  // Statistics variables
  appointmentsToday: number = 0;
  pendingAppointments: number = 0;
  totalAppointments: number = 0;
  statisticsLoaded: boolean = false;

  @ViewChild(AppointmentTabsComponent) appointmentTabsComponent: AppointmentTabsComponent | undefined;
  @ViewChildren(DirectAppointmentsComponent) directAppointmentComponents!: QueryList<DirectAppointmentsComponent>;
  @ViewChild('profileComponent') profileComponent: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userService: UserService,
    private secretaryService: SecretaryService,
    private snackBar: MatSnackBar,
    private profileService: ProfileService,
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    public bannedUserService: BannedUserService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/secretary';
    });
    
    // Check if we are on mobile
    this.checkScreenSize();
  }

  ngOnInit(): void {
    console.clear(); // Clear console for fresh debugging
    console.log('Initializing SecretaireDashboardComponent');
    
    // Check if account is locked or banned
    this.checkAccountStatus();
    
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
        switch (params['section']) {
          case 'profile':
            this.activeSection = 'profile';
            break;
          case 'appointments':
            this.activeSection = 'appointments';
            break;
          case 'calendar':
            this.activeSection = 'calendar';
            break;
          case 'doctor-application':
            this.activeSection = 'doctor-application';
            break;
          case 'messaging':
            this.activeSection = 'messaging';
            break;
          default:
            // Keep default value
        }
      }
    });
    
    console.log('Initial active section:', this.activeSection);
    
    // Load notifications, secretary profile, and appointment statistics
    this.loadNotifications();
    this.loadSecretaryProfile();
    this.loadAppointmentStatistics();
  }

  ngAfterViewInit(): void {
    console.log('View initialized');
    
    // We need to wait a bit to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.checkForCVAndShowWelcomeDialog();
    }, 1000);
  }

  // Convert UserProfile to User
  private convertProfileToUser(profile: UserProfile): User {
    return {
      id: profile.id || 0,
      nom: profile.nom,
      prenom: profile.prenom,
      email: profile.email,
      role: 'SECRETAIRE', // Default role for secretary
      enabled: true, // Default to true since they're logged in
      accountLocked: false, // Default to false since they're logged in
      phoneNumber: profile.phoneNumber,
      address: profile.address,
      dateNaissance: profile.dateNaissance,
      profilePicturePath: profile.profilePicturePath,
      cvFilePath: profile.cvFilePath
    };
  }

  checkForCVAndShowWelcomeDialog(): void {
    // Don't show the dialog if already shown in this session
    if (this.hasShownWelcomeDialog) {
      return;
    }

    // Don't show the dialog for banned users
    if (this.isBanned) {
      return;
    }

    // Check if the user has a CV
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        this.currentUserProfile = profile;
        
        // If the user doesn't have a CV, show the welcome dialog
        if (!profile.cvFilePath) {
          console.log('Secretary has no CV, showing welcome dialog');
          this.openWelcomeDialog(this.convertProfileToUser(profile));
        }
      },
      error: (error) => {
        console.error('Error checking for CV:', error);
      }
    });
  }

  openWelcomeDialog(user: User): void {
    this.hasShownWelcomeDialog = true;
    
    const dialogRef = this.dialog.open(SecretaryWelcomeDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: true, // User cannot close by clicking outside
      panelClass: 'secretary-welcome-dialog',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh user data after successful profile update
        this.loadSecretaryProfile();
        this.snackBar.open('Profil complété avec succès !', 'Fermer', {
          duration: 5000
        });
      }
    });
  }

  // Simplified method - we still call the API for data but don't restrict UI
  checkDoctorAssignment(): void {
    console.log('Starting doctor assignment check...');
    
    this.secretaryService.getSecretaryStatus().subscribe({
      next: (response) => {
        console.log('Secretary status response:', response);
        // We get the status but don't use it to restrict the UI
      },
      error: (error) => {
        console.error('Error checking secretary status:', error);
      }
    });
  }

  loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadNotifications = count;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications', error);
      }
    });
  }

  loadSecretaryProfile() {
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Profile loaded:', profile);
        this.currentUserProfile = profile;
        const capitalizedNom = profile.nom.charAt(0).toUpperCase() + profile.nom.slice(1);
        const capitalizedPrenom = profile.prenom.charAt(0).toUpperCase() + profile.prenom.slice(1);
        this.secretaryName = `${capitalizedNom} ${capitalizedPrenom}`;
        this.profileImageUrl = this.getProfileImageUrl(profile.profilePicturePath);
        
        // Check for CV if not already done
        if (!this.hasShownWelcomeDialog && !profile.cvFilePath && !this.isBanned) {
          this.openWelcomeDialog(this.convertProfileToUser(profile));
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.setDefaultValues();
      }
    });
  }

  private setDefaultValues(): void {
    this.secretaryName = '';
    this.profileImageUrl = null;
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        const timestamp = new Date().getTime();
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
    this.isProfileDropdownOpen = false;
    // Refresh statistics when showing dashboard
    this.loadAppointmentStatistics();
  }

  showProfile(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'profile')) return;
    this.activeSection = 'profile';
  }

  showValidateAccount(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'validate-account')) return;
    this.activeSection = 'validate';
  }

  showAppointments(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'appointments')) return;
    this.activeSection = 'appointments';
  }

  showCalendar(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'calendar')) return;
    this.activeSection = 'calendar';
  }

  showDoctorApplication(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'doctor-application')) return;
    this.activeSection = 'doctor-application';
  }

  showSettings(): void {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'settings')) return;
    this.activeSection = 'settings';
  }

  showNotifications() {
    if (this.bannedUserService.handleLinkClick(new Event('click'), 'notifications')) return;
    console.log('Show notifications clicked');
    this.activeSection = 'notifications';
  }

  logout(): void {
    // Clear all storage first
    localStorage.clear();
    sessionStorage.clear();
    
    // Call auth service to notify server (non-blocking)
    this.authService.logout();
    
    // Force a complete page reload and redirect
    window.location.replace('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileElement = (event.target as HTMLElement).closest('.user-profile');
    if (!profileElement) {
      this.isProfileDropdownOpen = false;
    }
  }

  refreshAppointments(): void {
    console.log('Manual refresh of appointments triggered');
    
    // First, make sure the fallback is shown if we've been having problems
    if (!this.appointmentTabsComponent && !document.querySelector('app-appointment-tabs')) {
      console.log('No appointment tabs component found, showing fallback');
      this.showFallbackAppointments = true;
    }
    
    if (this.appointmentTabsComponent) {
      console.log('Found appointment tabs component through ViewChild, refreshing');
      // Call the loadAppointments method directly on the component instance
      this.appointmentTabsComponent.loadAppointments();
      
      // Show confirmation message
      this.snackBar.open('Actualisation des rendez-vous en cours...', 'OK', {
        duration: 3000
      });
    } else {
      console.log('Trying to find component in the DOM as fallback');
      // Try to find the component in the DOM as a fallback
      setTimeout(() => {
        const appointmentTabsElement = document.querySelector('app-appointment-tabs');
        if (appointmentTabsElement) {
          console.log('Found appointment tabs component via DOM, triggering refresh event');
          
          try {
            // Create and dispatch refresh event
            const refreshEvent = new Event('refresh');
            appointmentTabsElement.dispatchEvent(refreshEvent);
            
            this.snackBar.open('Actualisation des rendez-vous en cours...', 'OK', {
              duration: 3000
            });
          } catch (error) {
            console.error('Error dispatching refresh event:', error);
            this.snackBar.open('Erreur lors de l\'actualisation', 'OK', {
              duration: 3000
            });
          }
        } else {
          console.error('Appointment tabs component not found in the DOM');
          this.snackBar.open('Impossible de rafraîchir les rendez-vous. Veuillez recharger la page.', 'OK', {
            duration: 3000
          });
        }
      }, 500); // Longer timeout to ensure DOM is ready
    }
  }

  forceLoadAppointments(): void {
    console.log('Forcing appointments refresh');
    
    // Try to use any DirectAppointmentsComponent instances
    if (this.directAppointmentComponents && this.directAppointmentComponents.length > 0) {
      console.log(`Found ${this.directAppointmentComponents.length} DirectAppointmentsComponent instances, triggering refresh on all`);
      this.directAppointmentComponents.forEach(component => {
        if (component && typeof component.refreshData === 'function') {
          component.refreshData();
        }
      });
      return;
    }
    
    // Fall back to the old implementation
    console.log('Directly calling appointment service to load appointments');
    this.snackBar.open('Chargement des rendez-vous en cours...', 'OK', {
      duration: 2000
    });
    
    this.appointmentService.getMySecretaryAppointments().subscribe({
      next: (appointments) => {
        console.log(`Loaded ${appointments.length} appointments directly:`, appointments);
        this.snackBar.open(`${appointments.length} rendez-vous chargés avec succès`, 'OK', {
          duration: 3000
        });
        
        // Force refresh of component if it exists
        if (this.appointmentTabsComponent) {
          this.appointmentTabsComponent.appointments = appointments;
          this.appointmentTabsComponent.loading = false;
          this.appointmentTabsComponent.activeTab = 'upcoming';
        } else {
          console.error('Cannot update appointments display - component not found');
          // Activate fallback view
          this.showFallbackAppointments = true;
        }
      },
      error: (error) => {
        console.error('Error loading appointments directly:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', {
          duration: 5000
        });
        // Show fallback on error
        this.showFallbackAppointments = true;
      }
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

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  showMessaging(): void {
    // Messaging is always allowed even for banned users
    this.activeSection = 'messaging';
    this.router.navigate(['/dashboard/secretary'], { queryParams: { section: 'messaging' } });
  }

  openUnregisteredPatientDialog(): void {
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
          date: selectedDateTime
        },
        panelClass: 'appointment-type-dialog',
        disableClose: false
      });

      selectionDialog.afterClosed().subscribe(result => {
        if (result === 'unregistered') {
          // For unregistered patients
          const dialogRef = this.dialog.open(UnregisteredPatientAppointmentDialogComponent, {
            width: '700px',
            data: {
              appointmentDateTime: selectedDateTime,
              formattedDateTime: this.formatDateForAppointment(selectedDateTime)
            },
            disableClose: true
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
              // Si c'est true, un rendez-vous a été créé avec succès
              // Actualiser les composants qui affichent les rendez-vous
              if (this.appointmentTabsComponent) {
                this.appointmentTabsComponent.loadAppointments();
              }
              
              if (this.directAppointmentComponents && this.directAppointmentComponents.length > 0) {
                this.directAppointmentComponents.forEach(component => {
                  component.refreshData();
                });
              }
            }
          });
        } else if (result === 'registered') {
          // For registered patients
          const patientSelectionDialog = this.dialog.open(PatientSelectionDialogComponent, {
            width: '600px',
            data: {
              selectedDate: selectedDateTime
            }
          });

          patientSelectionDialog.afterClosed().subscribe(patient => {
            if (patient) {
              const dialogRef = this.dialog.open(SecretaryBookAppointmentDialogComponent, {
                width: '800px',
                data: {
                  appointmentDate: selectedDateTime,
                  patient: patient
                },
                disableClose: true
              });

              dialogRef.afterClosed().subscribe(result => {
                if (result === true) {
                  // Refresh appointment components
                  if (this.appointmentTabsComponent) {
                    this.appointmentTabsComponent.loadAppointments();
                  }
                  
                  if (this.directAppointmentComponents && this.directAppointmentComponents.length > 0) {
                    this.directAppointmentComponents.forEach(component => {
                      component.refreshData();
                    });
                  }
                }
              });
            }
          });
        }
      });
    });
  }

  // Helper method to format date for appointment
  private formatDateForAppointment(date: Date): string {
    // Do not adjust hours, use the exact time the user selected
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
  }

  saveProfileChanges(): void {
    const profile = document.querySelector('app-profile');
    if (profile) {
      // Access the Angular component instance using __ngContext__
      // @ts-ignore: This is a workaround to access the component instance
      const componentInstance = profile['__ngContext__']?.find(item => item && item.onSubmit);
      
      if (componentInstance && typeof componentInstance.onSubmit === 'function') {
        console.log('Calling profile component onSubmit method directly');
        componentInstance.onSubmit();
      } else {
        console.error('Could not access profile component onSubmit method');
        // Fallback to the old method
        const saveButton = profile.querySelector('button[color="primary"]:not(.mat-button-disabled)');
        if (saveButton) {
          console.log('Clicking save button in profile component');
          (saveButton as HTMLElement).click();
        } else {
          console.error('No enabled save button found in profile component');
          this.snackBar.open('Impossible de sauvegarder le profil. Veuillez cliquer directement sur le bouton Enregistrer.', 'Fermer', {
            duration: 5000
          });
        }
      }
    } else {
      console.error('Profile component not found in the DOM');
      this.snackBar.open('Impossible de sauvegarder le profil. Composant non trouvé.', 'Fermer', {
        duration: 3000
      });
    }
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

  // Add method to check account status
  checkAccountStatus(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.accountLocked = user.accountLocked || false;
        console.log('Account locked status:', this.accountLocked);
      },
      error: (error) => {
        console.error('Error checking account status:', error);
      }
    });
  }

  // Load appointment statistics from the assigned doctor
  loadAppointmentStatistics(): void {
    if (this.accountLocked || this.isBanned) {
      return;
    }

    this.secretaryService.getAppointmentStatistics().subscribe({
      next: (stats: Statistics) => {
        console.log('Appointment statistics loaded:', stats);
        this.appointmentsToday = stats.appointmentsToday || 0;
        this.pendingAppointments = stats.pendingAppointments || 0;
        this.totalAppointments = stats.totalAppointments || 0;
        this.statisticsLoaded = true;
      },
      error: (error) => {
        console.error('Error loading appointment statistics:', error);
        // Set default values in case of error
        this.appointmentsToday = 0;
        this.pendingAppointments = 0;
        this.totalAppointments = 0;
        this.statisticsLoaded = true;
      }
    });
  }

  // Method to refresh the statistics (can be called periodically)
  refreshStatistics(): void {
    if (this.activeSection === 'dashboard' && !this.accountLocked && !this.isBanned) {
      this.loadAppointmentStatistics();
    }
  }
}
