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
    MatTooltipModule
  ],
  template: `
    <div class="doctor-verification-page">
      <div class="page-header">
        <h1>Demandes de vérification</h1>
        <p>Vérifiez et approuvez les demandes de vérification des médecins.</p>
      </div>
      
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des demandes de vérification...</p>
      </div>
      
      <div class="verifications-container" *ngIf="!loading">
        <div *ngIf="pendingVerifications.length === 0" class="no-verifications">
          <mat-icon>check_circle</mat-icon>
          <h3>Aucune demande en attente</h3>
          <p>Toutes les demandes de vérification ont été traitées.</p>
        </div>
        
        <div class="verifications-grid" *ngIf="pendingVerifications.length > 0">
          <mat-card *ngFor="let verification of pendingVerifications" class="verification-card">
            <mat-card-header>
              <div class="header-content">
                <div class="avatar-placeholder">
                  <mat-icon>person</mat-icon>
                </div>
                <div class="doctor-info">
                  <div class="doctor-name">ID: {{ verification.doctorId }}</div>
                  <div class="doctor-email">{{ verification.email }}</div>
                  <div class="doctor-phone">{{ verification.phoneNumber || 'Pas de téléphone' }}</div>
                </div>
                <div class="status-badge" [ngClass]="verification.status">
                  {{ getStatusLabel(verification.status) }}
                </div>
              </div>
            </mat-card-header>
            
            <mat-card-content>
              <div class="verification-details">
                <div class="detail-row">
                  <mat-icon>business</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Cabinet</span>
                    <span class="detail-value">{{ verification.cabinetName || 'Non spécifié' }}</span>
                  </div>
                </div>
                
                <div class="detail-row">
                  <mat-icon>place</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Adresse</span>
                    <span class="detail-value">{{ verification.cabinetAddress || 'Non spécifiée' }}</span>
                  </div>
                </div>
                
                <div class="detail-row">
                  <mat-icon>star</mat-icon>
                  <div class="detail-content">
                    <span class="detail-label">Expérience</span>
                    <span class="detail-value">{{ verification.yearsOfExperience || '0' }} ans</span>
                  </div>
                </div>
                
                <div class="chips-container" *ngIf="verification.specialties?.length">
                  <span class="chip" *ngFor="let specialty of verification.specialties.slice(0, 3)">
                    {{ specialty }}
                  </span>
                  <span class="more-chip" *ngIf="verification.specialties.length > 3">
                    +{{ verification.specialties.length - 3 }}
                  </span>
                </div>
              </div>
              
              <div class="documents-preview">
                <div class="document-thumbnail" *ngIf="verification.cabinetPhotoPath" (click)="viewDocumentDetails(verification)">
                  <div class="thumbnail-overlay">
                    <mat-icon>visibility</mat-icon>
                  </div>
                  <ng-container *ngIf="isPdf(verification.cabinetPhotoPath); else cabinetImage">
                    <div class="pdf-thumbnail">
                      <mat-icon>picture_as_pdf</mat-icon>
                      <span>PDF</span>
                    </div>
                  </ng-container>
                  <ng-template #cabinetImage>
                    <ng-container *ngIf="checkImageValid(verification.cabinetPhotoPath); else cabinetPlaceholder">
                      <img [src]="getDocumentUrl(verification.cabinetPhotoPath)" alt="Cabinet" 
                           (error)="handleImageError($event)" 
                           onerror="this.style.display='none'">
                    </ng-container>
                  </ng-template>
                  <ng-template #cabinetPlaceholder>
                    <div class="image-placeholder">
                      <mat-icon>image_not_supported</mat-icon>
                      <span>Image non disponible</span>
                    </div>
                  </ng-template>
                  <span class="thumbnail-label">Cabinet</span>
                </div>
                
                <div class="document-thumbnail" *ngIf="verification.diplomaPhotoPath" (click)="viewDocumentDetails(verification)">
                  <div class="thumbnail-overlay">
                    <mat-icon>visibility</mat-icon>
                  </div>
                  <ng-container *ngIf="isPdf(verification.diplomaPhotoPath); else diplomaImage">
                    <div class="pdf-thumbnail">
                      <mat-icon>picture_as_pdf</mat-icon>
                      <span>PDF</span>
                    </div>
                  </ng-container>
                  <ng-template #diplomaImage>
                    <ng-container *ngIf="checkImageValid(verification.diplomaPhotoPath); else diplomaPlaceholder">
                      <img [src]="getDocumentUrl(verification.diplomaPhotoPath)" alt="Diplôme" 
                           (error)="handleImageError($event)"
                           onerror="this.style.display='none'">
                    </ng-container>
                  </ng-template>
                  <ng-template #diplomaPlaceholder>
                    <div class="image-placeholder">
                      <mat-icon>image_not_supported</mat-icon>
                      <span>Image non disponible</span>
                    </div>
                  </ng-template>
                  <span class="thumbnail-label">Diplôme</span>
                </div>
                
                <div class="no-documents" *ngIf="!verification.cabinetPhotoPath && !verification.diplomaPhotoPath">
                  <mat-icon>no_photography</mat-icon>
                  <span>Aucun document</span>
                </div>
              </div>
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-stroked-button color="primary" (click)="viewDocumentDetails(verification)">
                <mat-icon>visibility</mat-icon>
                <span>Détails</span>
              </button>
              
              <div class="action-buttons">
                <button mat-raised-button color="primary" (click)="openApproveDialog(verification)">
                  <mat-icon>check_circle</mat-icon>
                  <span>Approuver</span>
                </button>
                
                <button mat-raised-button color="warn" (click)="openRejectDialog(verification)">
                  <mat-icon>cancel</mat-icon>
                  <span>Refuser</span>
                </button>
              </div>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doctor-verification-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      overflow-y: auto;
      height: 100%;
    }
    
    .page-header {
      margin-bottom: 2rem;
      
      h1 {
        font-size: 1.75rem;
        color: #1e293b;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      
      p {
        color: #64748b;
        font-size: 1rem;
        margin: 0;
      }
    }
    
    .verifications-container {
      overflow-y: auto;
      height: calc(100% - 80px);
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      
      p {
        margin-top: 1.5rem;
        color: #64748b;
      }
    }
    
    .no-verifications {
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 4rem 2rem;
      text-align: center;
      
      mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #10b981;
        margin-bottom: 1.5rem;
      }
      
      h3 {
        font-size: 1.5rem;
        color: #1e293b;
        margin-bottom: 0.75rem;
        font-weight: 500;
      }
      
      p {
        color: #64748b;
        font-size: 1rem;
        max-width: 400px;
        margin: 0 auto;
      }
    }
    
    .verifications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }
    
    .verification-card {
      border-radius: 0.75rem;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      
      mat-card-header {
        padding: 0;
        
        .header-content {
          width: 100%;
          padding: 1.25rem;
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          display: flex;
          align-items: center;
          position: relative;
          
          .avatar-placeholder {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            
            mat-icon {
              color: #94a3b8;
            }
          }
          
          .doctor-info {
            .doctor-name {
              font-weight: 500;
              color: #1e293b;
              font-size: 1rem;
              margin-bottom: 0.25rem;
            }
            
            .doctor-email, .doctor-phone {
              color: #64748b;
              font-size: 0.875rem;
            }
          }
          
          .status-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
            
            &.pending {
              background-color: #fff3cd;
              color: #856404;
            }
            
            &.approved {
              background-color: #d1e7dd;
              color: #0f5132;
            }
            
            &.rejected {
              background-color: #f8d7da;
              color: #842029;
            }
          }
        }
      }
      
      mat-card-content {
        padding: 1.25rem;
        
        .verification-details {
          margin-bottom: 1.25rem;
          
          .detail-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 0.75rem;
            
            mat-icon {
              color: #0ea5e9;
              margin-right: 0.75rem;
              font-size: 1.25rem;
              width: 1.25rem;
              height: 1.25rem;
            }
            
            .detail-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              
              .detail-label {
                font-size: 0.75rem;
                color: #64748b;
                margin-bottom: 0.125rem;
              }
              
              .detail-value {
                color: #334155;
                font-size: 0.875rem;
                line-height: 1.25;
              }
            }
          }
          
          .chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.75rem;
            
            .chip, .more-chip {
              padding: 0.25rem 0.75rem;
              border-radius: 16px;
              font-size: 0.75rem;
              background-color: #f1f5f9;
              color: #475569;
            }
          }
        }
        
        .documents-preview {
          display: flex;
          gap: 1rem;
          
          .document-thumbnail {
            width: calc(50% - 0.5rem);
            height: 120px;
            border-radius: 0.5rem;
            overflow: hidden;
            position: relative;
            cursor: pointer;
            
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            
            .thumbnail-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transition: opacity 0.2s;
              
              mat-icon {
                color: white;
                font-size: 2rem;
                width: 2rem;
                height: 2rem;
              }
            }
            
            .thumbnail-label {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 0.5rem;
              background-color: rgba(0, 0, 0, 0.6);
              color: white;
              font-size: 0.75rem;
              text-align: center;
            }
            
            &:hover .thumbnail-overlay {
              opacity: 1;
            }
          }
          
          .no-documents {
            width: 100%;
            height: 120px;
            border-radius: 0.5rem;
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            
            mat-icon {
              color: #cbd5e1;
              margin-bottom: 0.5rem;
            }
            
            span {
              color: #94a3b8;
              font-size: 0.875rem;
            }
          }
        }
      }
      
      mat-card-actions {
        padding: 1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
        
        button {
          display: flex;
          align-items: center;
          
          mat-icon {
            margin-right: 0.5rem;
          }
        }
        
        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }
      }
    }
    
    .pdf-thumbnail {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      width: 100%;
      height: 100%;
      min-height: 80px;
      border-radius: 0.375rem;
      
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #ef4444;
      }
      
      span {
        font-size: 12px;
        margin-top: 4px;
        font-weight: 500;
      }
    }
  `]
})
export class DoctorVerificationsAdminComponent implements OnInit {
  pendingVerifications: DoctorVerification[] = [];
  loading = true;
  private validImages: Map<string, boolean> = new Map();
  
  constructor(
    private verificationService: DoctorVerificationService,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingVerifications();
  }
  
  loadPendingVerifications(): void {
    this.loading = true;
    
    // First try using the service method
    this.verificationService.getPendingVerifications().subscribe({
      next: (verifications) => {
        this.pendingVerifications = verifications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error from service method:', error);
        // Fallback to direct API call with multiple endpoints
        this.tryAlternativeEndpoints();
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
    switch (status.toLowerCase()) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Refusé';
      default: return status;
    }
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
      if (message !== undefined) {
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
} 