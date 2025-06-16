import { Component, OnInit, HostListener, ElementRef, ViewChild, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { MessageBellComponent } from '../shared/message-bell/message-bell.component';
import { ProfileService, UserProfile } from '../profile/profile.service';
import { ProfileComponent } from '../profile/profile.component';
import { MessagingComponent } from '../messaging/messaging.component';
import { DoctorVerificationsAdminComponent } from '../admin/doctor-verifications-admin/doctor-verifications-admin.component';
import { AdminStatisticsComponent } from '../admin/statistics/admin-statistics.component';
import { UserManagementComponent } from '../admin/user-management/user-management.component';
import { DoctorService, SecretaryRequest } from '../services/doctor.service';
import { AdminService } from '../services/admin.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    FormsModule,
    MessageBellComponent,
    NotificationBellComponent,
    MessagingComponent,
    DoctorVerificationsAdminComponent,
    AdminStatisticsComponent,
    UserManagementComponent,
    ProfileComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('profileDropdown') profileDropdown!: ElementRef;

  isMenuOpen = true;
  activeSection: 'dashboard' | 'profile' | 'settings' | 'verifications' | 'messaging' | 'statistics' | 'users' = 'dashboard';
  searchQuery = '';
  isProfileDropdownOpen = false;
  currentUser: User | null = null;
  notificationCount = 0;
  secretaryRequests: SecretaryRequest[] = [];
  pendingSecretaryRequests: SecretaryRequest[] = [];
  loading = false;
  error: string | null = null;
  isFullscreen = false;
  profileImageUrl: string = '/assets/images/default-avatar.png';
  apiUrl = environment.apiUrl;
  stats: {
    pendingVerifications: number;
    totalDoctors: number;
    totalPatients: number;
    totalUsers: number;
    totalAppointments: number;
  } = {
    pendingVerifications: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalUsers: 0,
    totalAppointments: 0
  };
  isMobile: boolean = false;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private doctorService: DoctorService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Load initial user data
    this.loadAdminProfile();
    
    // Check if we are on mobile
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Log API URL for debugging
    console.log('API URL from environment:', this.apiUrl);
    console.log('Full profile picture URL example:', `${this.apiUrl}/api/v1/api/users/profile/picture-by-id/1`);
    
    // Check for query parameters
    this.router.routerState.root.queryParams.subscribe(params => {
      if (params['section']) {
        this.activeSection = params['section'] as any;
        console.log('Setting active section from query params:', this.activeSection);
      }
    });
    
    // Load from both sources like patient dashboard
    this.loadAdminProfile();
    
    // Also fetch profile data from profile service
    this.profileService.getCurrentProfile().subscribe(profile => {
      console.log('Loaded profile from ProfileService:', profile);
      
      // Update the profile image using profile data
      if (profile && profile.id) {
        this.profileImageUrl = this.getProfileImageByUserId(profile.id);
        console.log('Updated profile image using profile ID:', this.profileImageUrl);
        this.cdr.detectChanges();
      }
    });
    
    this.loadStats();
    this.loadNotifications();
    this.loadSecretaryRequests();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close profile dropdown when clicking outside
    const profileElement = (event.target as HTMLElement).closest('.user-profile');
    if (!profileElement && this.isProfileDropdownOpen) {
      this.isProfileDropdownOpen = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    
    // Auto-close menu on mobile
    if (this.isMobile) {
      this.isMenuOpen = false;
    } else {
      this.isMenuOpen = true;
    }
  }

  loadAdminProfile(): void {
    console.log('Loading admin profile...');
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Loaded user profile:', JSON.stringify(user));
        
        // Store the user data
        this.currentUser = user;
        
        // Log user details to help with debugging
        console.log('User ID:', user?.id);
        console.log('User firstName:', user?.firstName);
        console.log('User lastName:', user?.lastName);
        console.log('User profileImage:', user?.profileImage);
        console.log('User profilePicturePath:', user?.profilePicturePath);
        
        // If profileImage is already set by authService, use it directly
        if (user?.profileImage && user.profileImage.startsWith('http')) {
          this.profileImageUrl = user.profileImage;
          console.log('Using profileImage directly from authService:', this.profileImageUrl);
        }
        // Otherwise set the profile image URL from user data
        else if (user && user.id) {
          // Get profile image by user ID - same as patient dashboard
          this.profileImageUrl = this.getProfileImageByUserId(user.id);
          console.log('Set profileImageUrl by ID method:', this.profileImageUrl);
        } else {
          console.log('No user ID available, using default avatar');
          this.profileImageUrl = '/assets/images/default-avatar.png';
        }
        
        // Force Angular to detect changes
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading admin profile:', error);
        this.profileImageUrl = '/assets/images/default-avatar.png';
      }
    });
  }

  showDashboard(): void {
    this.activeSection = 'dashboard';
  }

  showProfile(): void {
    this.activeSection = 'profile';
    this.isProfileDropdownOpen = false;
  }

  showSettings(): void {
    this.activeSection = 'settings';
    this.isProfileDropdownOpen = false;
  }

  showVerifications(): void {
    this.activeSection = 'verifications';
    this.isProfileDropdownOpen = false;
  }

  showMessaging(): void {
    this.activeSection = 'messaging';
    this.isProfileDropdownOpen = false;
    this.router.navigate(['/dashboard/admin'], { queryParams: { section: 'messaging' } });
  }

  showStatistics(): void {
    this.activeSection = 'statistics';
    this.isProfileDropdownOpen = false;
  }

  showUsers(): void {
    this.activeSection = 'users';
    this.isProfileDropdownOpen = false;
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

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  toggleNotifications(): void {
    // Toggle notifications panel
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  resetColorPreferences(): void {
    // Reset theme colors to default
    localStorage.removeItem('theme_preferences');
    this.snackBar.open('Préférences de couleurs réinitialisées', 'Fermer', { duration: 3000 });
    this.isProfileDropdownOpen = false;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    // Implement search functionality
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const failedUrl = imgElement.src;
    console.log('Image loading error, using default avatar');
    console.log('Failed image URL:', failedUrl);
    
    // Set to default avatar immediately
    imgElement.src = '/assets/images/default-avatar.png';
    
    // Update the profileImageUrl property
    this.profileImageUrl = '/assets/images/default-avatar.png';
    
    if (imgElement.classList.contains('profile-image')) {
      console.log('Profile image failed to load');
      
      // Try to reload with a new timestamp to avoid cache issues
      setTimeout(() => {
        // Only retry if we're still on the page and the element exists
        if (document.contains(imgElement) && this.currentUser?.id) {
          // Generate a new URL with a different timestamp
          const timestamp = new Date().getTime();
          let newUrl;
          
          // Try a different approach - always use the ID-based URL for reliability
          newUrl = `${this.apiUrl}/api/v1/api/users/profile/picture-by-id/${this.currentUser.id}?t=${timestamp}`;
          console.log('Retrying with ID-based URL:', newUrl);
          
          // Set the new URL
          this.profileImageUrl = newUrl;
          
          // Update the image source
          imgElement.src = newUrl;
          
          // Force Angular to detect changes
          this.cdr.detectChanges();
        }
      }, 1000);
    }
  }

  loadStats(): void {
    // Simulate loading stats (should be replaced with actual API calls)
    setTimeout(() => {
      this.stats = {
        pendingVerifications: Math.floor(Math.random() * 10),
        totalDoctors: Math.floor(Math.random() * 100) + 50,
        totalPatients: Math.floor(Math.random() * 500) + 200,
        totalUsers: Math.floor(Math.random() * 1000) + 500,
        totalAppointments: Math.floor(Math.random() * 2000) + 1000
      };
    }, 1000);
  }

  loadNotifications(): void {
    this.adminService.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationCount = notifications.filter(n => !n.read).length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  loadSecretaryRequests(): void {
    console.log('Starting to load secretary requests...');
    this.loading = true;
    this.error = null;
    
    this.doctorService.getSecretaryRequests().subscribe({
      next: (requests) => {
        console.log('Received secretary requests:', requests);
        this.secretaryRequests = requests;
        this.pendingSecretaryRequests = requests.filter(r => r.status === 'PENDING');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading secretary requests:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.error = `Une erreur est survenue lors du chargement des demandes. (${err.status}: ${err.error?.message || err.message})`;
        this.loading = false;
      }
    });
  }

  approveSecretaryRequest(requestId: number): void {
    this.doctorService.approveSecretaryRequest(requestId).subscribe({
      next: () => {
        this.snackBar.open('Demande approuvée avec succès', 'Fermer', { duration: 3000 });
        this.loadSecretaryRequests(); // Reload the list
      },
      error: (err) => {
        console.error('Error approving request:', err);
        this.snackBar.open('Erreur lors de l\'approbation de la demande', 'Fermer', { duration: 3000 });
      }
    });
  }

  rejectSecretaryRequest(requestId: number): void {
    this.doctorService.rejectSecretaryRequest(requestId).subscribe({
      next: () => {
        this.snackBar.open('Demande rejetée', 'Fermer', { duration: 3000 });
        this.loadSecretaryRequests(); // Reload the list
      },
      error: (err) => {
        console.error('Error rejecting request:', err);
        this.snackBar.open('Erreur lors du rejet de la demande', 'Fermer', { duration: 3000 });
      }
    });
  }

  logout(): void {
    // Clear all storage first
    localStorage.clear();
    sessionStorage.clear();
    
    // Call auth service to notify server (non-blocking)
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if the server request fails, navigate to login
        this.router.navigate(['/login']);
      }
    });
  }

  // Method to get the admin profile picture (deprecated - keeping for backwards compatibility)
  getAdminProfilePicture(): string {
    return this.getProfileImageByUserId(this.currentUser?.id || 0);
  }
  
  // Helper method to get the full profile image URL - copied from profile component
  getProfileImageUrl(profilePicturePath?: string | null): string {
    if (profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${this.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
        console.log('Profile picture URL:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return '/assets/images/default-avatar.png';
      }
    } else if (this.currentUser && this.currentUser.id) {
      // Fall back to ID-based URL if no profilePicturePath
      return this.getProfileImageByUserId(this.currentUser.id);
    }
    console.log('Using default avatar');
    return '/assets/images/default-avatar.png';
  }
  
  // Method to get profile image by user ID - copied from patient dashboard
  getProfileImageByUserId(userId: number): string {
    if (userId) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = Date.now();
        // Use the picture-by-id endpoint
        const url = `${this.apiUrl}/api/v1/api/users/profile/picture-by-id/${userId}?t=${timestamp}`;
        console.log('Profile picture URL by ID:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL by ID:', error);
        return '/assets/images/default-avatar.png';
      }
    }
    console.log('Using default avatar (no user ID)');
    return '/assets/images/default-avatar.png';
  }
  
  // Getter for profile image URL
  get profileImage(): string {
    console.log('profileImage getter called');
    
    // First, use the explicitly set profileImageUrl if it exists
    if (this.profileImageUrl) {
      console.log('Using explicitly set profileImageUrl:', this.profileImageUrl);
      return this.profileImageUrl;
    }
    
    // Second, try to get from the currentUser if it exists
    if (this.currentUser?.profileImage) {
      console.log('Using user.profileImage:', this.currentUser.profileImage);
      return this.currentUser.profileImage;
    }
    
    // Last resort - generate a URL directly with timestamp to prevent caching
    if (this.currentUser?.profilePicturePath) {
      return this.getProfileImageUrl(this.currentUser.profilePicturePath);
    } else if (this.currentUser?.id) {
      return this.getProfileImageByUserId(this.currentUser.id);
    }
    
    console.log('No user data for profile image, using default');
    return '/assets/images/default-avatar.png';
  }
}
