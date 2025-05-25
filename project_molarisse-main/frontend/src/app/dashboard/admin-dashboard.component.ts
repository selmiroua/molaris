import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../services/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { AdminService } from '../services/admin.service';
import { DoctorService, SecretaryRequest } from '../services/doctor.service';
import { MessageBellComponent } from '../shared/message-bell/message-bell.component';
import { NotificationBellComponent } from '../shared/notification-bell/notification-bell.component';
import { MessagingComponent } from '../messaging/messaging.component';
import { DoctorVerificationsAdminComponent } from '../admin/doctor-verifications-admin/doctor-verifications-admin.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    FormsModule,
    ProfileComponent,
    MessageBellComponent,
    NotificationBellComponent,
    MessagingComponent,
    DoctorVerificationsAdminComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('profileDropdown') profileDropdown!: ElementRef;

  isMenuOpen = true;
  activeSection: 'dashboard' | 'profile' | 'settings' | 'verifications' | 'messaging' = 'dashboard';
  searchQuery = '';
  isProfileDropdownOpen = false;
  currentUser: User | null = null;
  notificationCount = 0;
  secretaryRequests: SecretaryRequest[] = [];
  pendingSecretaryRequests: SecretaryRequest[] = [];
  loading = false;
  error: string | null = null;
  isFullscreen = false;
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
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Load initial user data
    this.loadAdminProfile();
    
    // Check if we are on mobile
    this.checkScreenSize();
  }

  ngOnInit(): void {
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
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Loaded user profile:', user);
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error loading admin profile:', error);
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
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-avatar.png';
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
}
