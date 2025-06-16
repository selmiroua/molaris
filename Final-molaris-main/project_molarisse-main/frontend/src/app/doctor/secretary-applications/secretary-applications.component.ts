import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table'; 
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DoctorApplicationService } from '../../core/services/doctor-application.service';
import { DoctorApplication } from '../../core/models/doctor-application.model';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { finalize, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SecretaryProfileDialogComponent, SecretaryProfileData } from '../secretary-profile-dialog/secretary-profile-dialog.component';
import { CvViewerDialogComponent } from '../../shared/cv-viewer-dialog/cv-viewer-dialog.component';

// Add SecretaryStatus enum
enum SecretaryStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

@Component({
  selector: 'app-secretary-applications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './secretary-applications.component.html',
  styleUrl: './secretary-applications.component.scss'
})
export class SecretaryApplicationsComponent implements OnInit {
  loading = true;
  applications: DoctorApplication[] = [];
  secretaryDetailsMap = new Map<number, User>();
  displayedColumns: string[] = ['id', 'secretaryName', 'message', 'createdAt', 'status', 'actions'];

  constructor(
    private applicationService: DoctorApplicationService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    
    // Use the UserService's getSecretaryApplications method instead
    this.userService.getSecretaryApplications()
      .pipe(
        tap(applications => {
          console.log('Applications received:', applications);
          // Convert User objects to DoctorApplication objects if needed
          // This might need adjustment based on the actual API response format
          this.applications = this.mapUsersToDoctorApplications(applications);
          
          // Load secretary details for each application
          this.applications.forEach(app => this.loadSecretaryDetails(app.secretaryId));
        }),
        catchError(error => {
          console.error('Error loading applications:', error);
          this.snackBar.open('Erreur lors du chargement des candidatures. Veuillez réessayer plus tard.', 'Fermer', {
            duration: 5000
          });
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }
  
  // Helper method to map User objects to DoctorApplication objects if needed
  private mapUsersToDoctorApplications(users: User[]): DoctorApplication[] {
    return users.map(user => {
      // Store the full user info in our secretaryDetailsMap for immediate access
      this.secretaryDetailsMap.set(user.id, user);
      
      // Access properties safely with optional chaining and type assertions
      const applicationMessage = (user as any).applicationMessage || '';
      const applicationDate = (user as any).applicationDate || new Date().toISOString();
      
      return {
        id: user.id,
        secretaryId: user.id,
        doctorId: user.assignedDoctor?.id || 0,
        // Use the real application message if available, otherwise a default message
        message: applicationMessage || 'Demande pour rejoindre votre cabinet en tant que secrétaire',
        status: this.convertSecretaryStatusToApplicationStatus(user.secretaryStatus),
        createdAt: applicationDate,
        updatedAt: (user as any).updatedAt || new Date().toISOString(),
        cvFilePath: user.cvFilePath
      };
    });
  }
  
  // Helper method to convert secretary status to application status
  private convertSecretaryStatusToApplicationStatus(status?: string): 'pending' | 'approved' | 'rejected' {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'APPROVED': return 'approved';
      case 'REJECTED': return 'rejected';
      default: return 'pending';
    }
  }
  
  loadSecretaryDetails(secretaryId: number): void {
    // We may not need to explicitly load secretary details since we already have the User objects
    // from the getSecretaryApplications call, but keeping this method in case additional data is needed
    if (secretaryId) {
      this.userService.getUserById(secretaryId)
        .pipe(
          catchError(error => {
            console.error(`Error loading secretary ${secretaryId} details:`, error);
            return of(null);
          })
        )
        .subscribe(secretary => {
          if (secretary) {
            this.secretaryDetailsMap.set(secretaryId, secretary);
          }
        });
    }
  }
  
  getSecretaryName(secretaryId: number): string {
    const secretary = this.secretaryDetailsMap.get(secretaryId);
    if (secretary) {
      return `${secretary.prenom || ''} ${secretary.nom || ''}`.trim();
    }
    
    // Improved fallback that looks more professional
    return 'Secrétaire';
  }
  
  getSecretaryEmail(secretaryId: number): string {
    const secretary = this.secretaryDetailsMap.get(secretaryId);
    return secretary?.email || '';
  }
  
  getSecretaryPhone(secretaryId: number): string {
    const secretary = this.secretaryDetailsMap.get(secretaryId);
    return secretary?.phoneNumber || '';
  }
  
  hasCV(application: DoctorApplication): boolean {
    return !!application.cvFilePath;
  }
  
  updateApplicationStatus(application: DoctorApplication, status: 'APPROVED' | 'REJECTED'): void {
    console.log('Updating status:', { secretaryId: application.secretaryId, action: status });
    
    const requestBody = {
      secretaryId: application.secretaryId,
      action: status
    };

    this.userService.processSecretaryApplication(requestBody.secretaryId, requestBody.action)
      .subscribe({
        next: (updatedUser: User) => {
          console.log('Status updated successfully:', updatedUser);
          const statusText = status === 'APPROVED' ? 'approuvée' : 'rejetée';
          this.snackBar.open(`Candidature ${statusText} avec succès !`, 'Fermer', {
            duration: 3000
          });
          
          // Update the application in the list by reloading all applications
          this.loadApplications();
        },
        error: (error) => {
          console.error('Error updating application status:', error);
          this.snackBar.open('Erreur lors de la mise à jour du statut. Veuillez réessayer.', 'Fermer', {
            duration: 5000
          });
        }
      });
  }
  
  viewCV(application: DoctorApplication): void {
    if (application.cvFilePath) {
      this.dialog.open(CvViewerDialogComponent, {
        width: '800px',
        height: '700px',
        data: {
          cvFilePath: application.cvFilePath
        }
      });
    } else {
      this.snackBar.open('Aucun CV n\'a été fourni pour cette candidature.', 'Fermer', {
        duration: 3000
      });
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  }
  
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'hourglass_empty';
      case 'approved': return 'check_circle';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  }
  
  // Add method to show application details in a dialog
  showApplicationDetails(application: DoctorApplication, event?: MouseEvent): void {
    // Prevent row click from triggering when clicking action buttons
    if (event) {
      const target = event.target as HTMLElement;
      if (target && target.closest('.action-buttons')) {
        event.stopPropagation();
        return;
      }
    }
    
    const secretary = this.secretaryDetailsMap.get(application.secretaryId);
    
    // Create a dialog data object with combined information
    const dialogData: SecretaryProfileData = {
      application: application,
      secretary: secretary!,
      secretaryName: this.getSecretaryName(application.secretaryId),
      secretaryEmail: this.getSecretaryEmail(application.secretaryId),
      secretaryPhone: this.getSecretaryPhone(application.secretaryId),
      hasCV: this.hasCV(application),
      statusLabel: this.getStatusLabel(application.status),
      statusColor: this.getStatusColor(application.status),
      statusIcon: this.getStatusIcon(application.status),
      applicationDate: new Date(application.createdAt).toLocaleDateString('fr-FR'),
      cvFilePath: application.cvFilePath || ''
    };
    
    // Open the detailed dialog
    const dialogRef = this.dialog.open(SecretaryProfileDialogComponent, {
      width: '650px',
      data: dialogData,
      panelClass: 'secretary-profile-dialog'
    });
    
    // Handle dialog close
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'approve') {
          this.updateApplicationStatus(application, 'APPROVED');
        } else if (result.action === 'reject') {
          this.updateApplicationStatus(application, 'REJECTED');
        }
      }
    });
  }
}
