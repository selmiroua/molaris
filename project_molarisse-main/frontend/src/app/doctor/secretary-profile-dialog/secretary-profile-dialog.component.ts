import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../core/models/user.model';
import { DoctorApplication } from '../../core/models/doctor-application.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CvViewerDialogComponent } from '../../shared/cv-viewer-dialog/cv-viewer-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

export interface SecretaryProfileData {
  application: DoctorApplication;
  secretary: User;
  secretaryName: string;
  secretaryEmail: string;
  secretaryPhone: string;
  hasCV: boolean;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
  applicationDate: string;
  cvFilePath: string;
}

@Component({
  selector: 'app-secretary-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './secretary-profile-dialog.component.html',
  styleUrl: './secretary-profile-dialog.component.scss'
})
export class SecretaryProfileDialogComponent {
  pdfSrc: SafeResourceUrl | null = null;
  isLoading = false;
  cvUrl: SafeResourceUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<SecretaryProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SecretaryProfileData,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
  ) {
    this.loadCV();
  }

  loadCV(): void {
    if (this.data.cvFilePath) {
      const token = localStorage.getItem('access_token');
      
      // Get the filename without any 'cvs/' prefix
      let filePath = this.data.cvFilePath;
      if (filePath.startsWith('cvs/')) {
        filePath = filePath.substring(4); // Remove 'cvs/' prefix
      }
      
      // Use the direct URL format
      const cvUrl = `/api/v1/api/users/cv/${filePath}?token=${token}`;
      this.cvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cvUrl);
    }
  }

  getCvUrl(): string {
    if (!this.data.cvFilePath) {
      return '';
    }
    const token = localStorage.getItem('access_token');
    
    // Get the filename without any 'cvs/' prefix
    let filePath = this.data.cvFilePath;
    if (filePath.startsWith('cvs/')) {
      filePath = filePath.substring(4); // Remove 'cvs/' prefix
    }
    
    // Use the direct URL format - exactly like in unassigned-secretaries
    return `${environment.apiUrl}/api/v1/api/users/cv/${filePath}?token=${token}`;
  }

  viewCV(): void {
    if (this.data.cvFilePath) {
      // Remove any 'cvs/' prefix from the file path
      let filePath = this.data.cvFilePath;
      if (filePath.startsWith('cvs/')) {
        filePath = filePath.substring(4); // Remove 'cvs/' prefix
      }
      
      this.dialog.open(CvViewerDialogComponent, {
        width: '800px',
        height: '700px',
        data: {
          cvFilePath: filePath
        }
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  approve(): void {
    this.dialogRef.close({ action: 'approve', secretaryId: this.data.secretary.id });
  }

  reject(): void {
    this.dialogRef.close({ action: 'reject', secretaryId: this.data.secretary.id });
  }
}
