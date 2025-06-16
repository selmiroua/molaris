import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { DoctorVerificationService } from '../../core/services/doctor-verification.service';
import { DoctorVerification } from '../../core/models/doctor-verification.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { DoctorDetailDialogComponent } from './doctor-detail-dialog.component';

@Component({
  selector: 'app-doctor-verifications-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTableModule,
    FormsModule
  ],
  template: `
    <div class="doctor-verification-page" style="
      padding: 20px;
    ">
      <div class="page-header">
        <div class="header-title">
          <h1>Demandes de vérification</h1>
          <p>Vérifiez et approuvez les demandes de vérification des médecins.</p>
        </div>
        
        <!-- Status filter controls -->
       
      
      

        <!-- List View -->
        <div class="verifications-table" *ngIf="filteredVerifications.length > 0">
          <table class="verification-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Médecin</th>
                <th>Informations</th>
                <th>Spécialités</th>
                <th>Documents</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let verification of filteredVerifications">
                <td class="id-cell">{{ verification.doctorId }}</td>
                <td class="doctor-cell">
                  <div class="doctor-cell-content">
                    <div class="doctor-avatar">
                      <img [src]="getDoctorProfileImageUrl(verification.doctorId)" 
                           alt="Photo de profil" 
                           (error)="handleProfileImageError($event)">
                    </div>
                    <div class="doctor-info">
                      <div class="doctor-email">{{ verification.email }}</div>
                      <div class="doctor-phone">{{ verification.phoneNumber || 'Pas de téléphone' }}</div>
                    </div>
                  </div>
                </td>
                <td class="info-cell">
                  <div class="info-item">
                    <mat-icon>business</mat-icon>
                    <span>{{ verification.cabinetName || 'Non spécifié' }}</span>
                  </div>
                  <div class="info-item">
                    <mat-icon>place</mat-icon>
                    <span>{{ verification.cabinetAddress || 'Non spécifiée' }}</span>
                  </div>
                  <div class="info-item">
                    <mat-icon>star</mat-icon>
                    <span>{{ verification.yearsOfExperience || '0' }} ans</span>
                  </div>
                </td>
                <td class="specialties-cell">
                  <div class="table-chips-container" *ngIf="verification.specialties?.length">
                    <span class="table-chip" *ngFor="let specialty of verification.specialties.slice(0, 2)">
                      {{ specialty }}
                    </span>
                    <span class="more-chip" *ngIf="verification.specialties.length > 2">
                      +{{ verification.specialties.length - 2 }}
                    </span>
                  </div>
                  <div *ngIf="!verification.specialties?.length">
                    <span class="no-specialties">Aucune spécialité</span>
                  </div>
                </td>
                <td class="documents-cell">
                  <div class="document-badges">
                    <span class="document-badge cabinet" *ngIf="verification.cabinetPhotoPath" 
                          matTooltip="Photo du cabinet" (click)="viewDocumentDetails(verification)">
                      <mat-icon>business</mat-icon>
                    </span>
                    <span class="document-badge diploma" *ngIf="verification.diplomaPhotoPath"
                          matTooltip="Diplôme" (click)="viewDocumentDetails(verification)">
                      <mat-icon>school</mat-icon>
                    </span>
                    <span class="no-docs" *ngIf="!verification.cabinetPhotoPath && !verification.diplomaPhotoPath">
                      <mat-icon>no_photography</mat-icon>
                    </span>
                  </div>
                </td>
                <td class="status-cell">
                  <div class="status-badge" [ngClass]="verification.status">
                    {{ getStatusLabel(verification.status) }}
                  </div>
                </td>
                <td class="actions-cell">
                  <button mat-icon-button color="primary" matTooltip="Voir les détails" 
                          (click)="viewDocumentDetails(verification)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="primary" matTooltip="Approuver"
                          (click)="openApproveDialog(verification)">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" matTooltip="Refuser"
                          (click)="openRejectDialog(verification)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./doctor-verifications-admin.component.scss']
})
export class DoctorVerificationsAdminComponent implements OnInit {
  // Renamed from pendingVerifications to allVerifications to better reflect its contents
  pendingVerifications: DoctorVerification[] = [];
  filteredVerifications: DoctorVerification[] = [];
  loading = true;
  statusFilter: string = 'all'; // 'all', 'pending', 'approved', 'rejected'
  private validImages: Map<string, boolean> = new Map();
  
  constructor(
    private verificationService: DoctorVerificationService,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingVerifications();
    // Set default filter to 'pending' to match original behavior
    this.statusFilter = 'pending';
    this.applyStatusFilter();
  }
  
  loadPendingVerifications(): void {
    this.loading = true;
    this.verificationService.getPendingVerifications()
      .subscribe({
        next: verifications => {
          console.log('Received verifications:', verifications);
          // Show all verifications including approved and rejected
          this.pendingVerifications = verifications
            .map(verification => {
              // Extract name parts from email if available
              const emailName = verification.email ? verification.email.split('@')[0] : '';
              const nameParts = emailName.split('.');
              
              return {
                ...verification,
                // Add name information for avatar generation
                firstName: nameParts.length > 0 ? nameParts[0] : '',
                lastName: nameParts.length > 1 ? nameParts[1] : '',
                // Initialize profile picture tracking
                hasProfilePictureChecked: false,
                hasProfilePicture: true
              };
            });
          
          // Initialize filtered verifications with all items
          this.applyStatusFilter();
          this.loading = false;
        },
        error: error => {
          console.error('Error loading verifications:', error);
          this.loading = false;
          this.handleLoadError('Erreur lors du chargement des vérifications');
        }
      });
  }
  
  tryAlternativeEndpoints(): void {
    // Define multiple possible API endpoints
    const possibleEndpoints = [
      `${environment.apiUrl}/api/v1/admin/doctor-verifications/pending`,
      `${environment.apiUrl}/admin/verifications`,
      `${environment.apiUrl}/api/admin/doctor-verifications`
    ];
    
    // Try each endpoint sequentially
    this.tryEndpoint(possibleEndpoints, 0);
  }
  
  tryEndpoint(endpoints: string[], index: number): void {
    if (index >= endpoints.length) {
      this.handleLoadError('Tous les endpoints ont échoué');
      return;
    }
    
    const endpoint = endpoints[index];
    console.log(`Trying endpoint (${index + 1}/${endpoints.length}): ${endpoint}`);
    
    this.http.get<DoctorVerification[]>(endpoint).subscribe({
      next: (verifications) => {
        this.pendingVerifications = verifications;
        this.loading = false;
      },
      error: (error) => {
        console.error(`Endpoint ${index + 1} failed:`, error);
        // Try the next endpoint
        this.tryEndpoint(endpoints, index + 1);
      }
    });
  }
  
  handleLoadError(message: string): void {
    console.error(message);
    this.snackBar.open('Erreur lors du chargement des vérifications', 'Fermer', {
      duration: 5000
    });
    this.loading = false;
    this.pendingVerifications = [];
  }
  
  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status || 'Inconnu';
    }
  }
  
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-unknown';
    }
  }
  
  applyStatusFilter(): void {
    if (this.statusFilter === 'all') {
      this.filteredVerifications = [...this.pendingVerifications];
    } else {
      this.filteredVerifications = this.pendingVerifications.filter(v => 
        v.status?.toLowerCase() === this.statusFilter);
    }
  }
  
  changeStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyStatusFilter();
  }
  
  getDocumentUrl(path: string): string {
    if (!path) return 'assets/images/image-not-available.png';
    
    // Get the base URL without any API path
    const baseUrl = environment.apiUrl; 
    
    // Add authorization token to the URL as a query parameter
    const token = this.getAuthToken();
    const authParam = token ? `?token=${encodeURIComponent(token)}` : '';
    
    // Log for debugging
    console.log(`Building URL for path: ${path}`);
    
    // Create the full document URL
    let documentUrl;
    
    // Check if the path already includes the full structure
    if (path.includes('/')) {
      // It already has a directory structure, use as is
      documentUrl = `${baseUrl}/api/v1/api/users/documents/${path}${authParam}`;
    } 
    // Check file extension to determine document type
    else if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png')) {
      // It's a cabinet photo
      documentUrl = `${baseUrl}/api/v1/api/users/documents/cabinet_photos/${path}${authParam}`;
    } 
    else if (path.endsWith('.pdf')) {
      // It's a diploma document
      documentUrl = `${baseUrl}/api/v1/api/users/documents/diploma_docs/${path}${authParam}`;
    } 
    else {
      // Default case
      documentUrl = `${baseUrl}/api/v1/api/users/documents/${path}${authParam}`;
    }
    
    console.log(`Final document URL: ${documentUrl}`);
    return documentUrl;
  }
  
  private getAuthToken(): string | null {
    // Try to get the token from localStorage with multiple possible keys
    let token = localStorage.getItem('access_token');
    
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    if (!token) {
      // Log this for troubleshooting
      console.error('No authentication token found in localStorage');
    } else {
      console.log('Found token:', token.substring(0, 20) + '...');
    }
    
    return token;
  }
  
  handleImageError(event: any): void {
    console.log('Image loading error:', event);
    
    // Extract the path from the src URL
    const src = event.target.src;
    const urlObj = new URL(src);
    const pathMatch = urlObj.pathname.match(/\/api\/.*\/documents\/(.+)$/);
    
    if (pathMatch && pathMatch[1]) {
      // Mark this image path as invalid
      this.validImages.set(pathMatch[1], false);
    }
    
    // Hide the broken image
    event.target.style.display = 'none';
  }
  
  viewDocumentDetails(verification: DoctorVerification): void {
    this.dialog.open(DoctorDetailDialogComponent, {
      data: verification,
      width: '800px',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'doctor-detail-dialog-container'
    });
  }
  
  openApproveDialog(verification: DoctorVerification): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        action: 'approve',
        doctorInfo: `ID: ${verification.doctorId} - ${verification.email}`
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.approveVerification(verification);
      }
    });
  }
  
  openRejectDialog(verification: DoctorVerification): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        action: 'reject',
        doctorInfo: `ID: ${verification.doctorId} - ${verification.email}`
      }
    });
    
    dialogRef.afterClosed().subscribe(message => {
      // Only reject if message is not null (Cancel button returns null)
      if (message !== null && message !== undefined) {
        this.rejectVerification(verification, message);
      }
    });
  }
  
  approveVerification(verification: DoctorVerification): void {
    if (!verification.id) {
      this.snackBar.open('ID de vérification manquant', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.snackBar.open('Approbation en cours...', '', { duration: 2000 });
    
    this.verificationService.updateVerificationStatus(verification.id, 'approved')
      .subscribe({
        next: (response) => {
          this.snackBar.open('Vérification approuvée avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadPendingVerifications();
        },
        error: (error) => {
          console.error('Error approving verification:', error);
          this.snackBar.open('Erreur lors de l\'approbation', 'Fermer', {
            duration: 5000
          });
        }
      });
  }
  
  rejectVerification(verification: DoctorVerification, message: string): void {
    if (!verification.id) {
      this.snackBar.open('ID de vérification manquant', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.snackBar.open('Refus en cours...', '', { duration: 2000 });
    
    this.verificationService.updateVerificationStatus(verification.id, 'rejected', message)
      .subscribe({
        next: (response) => {
          this.snackBar.open('Vérification refusée avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadPendingVerifications();
        },
        error: (error) => {
          console.error('Error rejecting verification:', error);
          this.snackBar.open('Erreur lors du refus', 'Fermer', {
            duration: 5000
          });
        }
      });
  }
  
  checkImageValid(path: string): boolean {
    if (!path) return false;
    
    // Return cached result if available
    if (this.validImages.has(path)) {
      return this.validImages.get(path)!;
    }
    
    // Default to true and let error handling update if needed
    this.validImages.set(path, true);
    return true;
  }
  
  isPdf(path: string): boolean {
    return path ? path.toLowerCase().endsWith('.pdf') : false;
  }
  
  getDoctorProfileImageUrl(userId: number): string {
    if (!userId) {
      return 'assets/images/default-avatar.png';
    }
    
    // Check if we've already determined this doctor doesn't have a profile picture
    const doctor = this.pendingVerifications.find(v => v.doctorId === userId);
    if (doctor && doctor.hasProfilePictureChecked === true && doctor.hasProfilePicture === false) {
      // Extract name parts from email if not available directly
      const emailName = doctor.email ? doctor.email.split('@')[0] : '';
      const nameParts = emailName.split('.');
      const firstName = doctor.firstName || (nameParts.length > 0 ? nameParts[0] : '');
      const lastName = doctor.lastName || (nameParts.length > 1 ? nameParts[1] : '');
      
      return this.getDefaultAvatar(firstName, lastName);
    }
    
    const baseUrl = environment.apiUrl;
    const token = this.getAuthToken();
    const timestamp = new Date().getTime(); // Add timestamp to prevent caching
    
    // Add authorization token and timestamp to the URL as query parameters
    let url = `${baseUrl}/api/v1/api/users/profile/picture-by-id/${userId}?t=${timestamp}`;
    
    // Add token if available
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    return url;
  }
  
  getDefaultAvatar(firstName: string | undefined | null, lastName: string | undefined | null): string {
    if (!firstName && !lastName) return 'assets/images/default-avatar.png';
    
    // Get initials for the avatar
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    const initials = (firstInitial + lastInitial) || '?';
    
    // Generate a consistent color based on the name
    const colors = ['007bff', '28a745', 'dc3545', 'fd7e14', '6f42c1', '20c997', '17a2b8', '6c757d'];
    const colorIndex = Math.abs(firstName?.charCodeAt(0) || 0) % colors.length;
    const background = colors[colorIndex];
    
    // Use UI Avatars service for a nice default avatar with initials
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${background}&color=fff&size=128&bold=true`;
  }
  
  handleProfileImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    
    // Find the doctor ID from the image URL or data attribute
    const doctorIdMatch = imgElement.src.match(/\/picture-by-id\/(\d+)/);
    const doctorId = doctorIdMatch ? parseInt(doctorIdMatch[1]) : null;
    
    if (doctorId) {
      // Find the verification object for this doctor
      const doctor = this.pendingVerifications.find(v => v.doctorId === doctorId);
      
      if (doctor) {
        // Mark this doctor as not having a profile picture to avoid future API calls
        doctor.hasProfilePictureChecked = true;
        doctor.hasProfilePicture = false;
        
        // Extract name parts from email if not available directly
        const emailName = doctor.email ? doctor.email.split('@')[0] : '';
        const nameParts = emailName.split('.');
        const firstName = doctor.firstName || (nameParts.length > 0 ? nameParts[0] : '');
        const lastName = doctor.lastName || (nameParts.length > 1 ? nameParts[1] : '');
        
        // Use UI Avatars service for a fallback avatar with initials
        const fallbackAvatar = this.getDefaultAvatar(firstName, lastName);
        imgElement.src = fallbackAvatar;
        return;
      }
    }
    
    // Fallback if we couldn't match the doctor
    imgElement.src = 'assets/images/default-avatar.png';
    
    // If the default image also fails, show initials
    imgElement.onerror = function() {
      this.style.display = 'none';
      const parent = this.parentElement;
      if (parent && !parent.querySelector('.initials')) {
        const initialsElement = document.createElement('span');
        initialsElement.classList.add('initials');
        initialsElement.style.width = '32px';
        initialsElement.style.height = '32px';
        initialsElement.style.borderRadius = '50%';
        initialsElement.style.backgroundColor = '#6c757d';
        initialsElement.style.color = '#fff';
        initialsElement.style.display = 'inline-flex';
        initialsElement.style.justifyContent = 'center';
        initialsElement.style.alignItems = 'center';
        initialsElement.style.fontSize = '14px';
        initialsElement.style.fontWeight = 'bold';
        initialsElement.textContent = '?';
        parent.appendChild(initialsElement);
      }
    };
  }
} 