import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-cv-viewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="cv-viewer-dialog">
      <div class="dialog-header">
        <h2>Visualisation du CV</h2>
        <button mat-icon-button class="close-button" (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="cv-container">
        <div class="pdf-message">
          <mat-icon>description</mat-icon>
          <h3>Le CV est prêt à être visualisé</h3>
          <p>Pour des raisons de sécurité du navigateur, veuillez utiliser le bouton ci-dessous pour ouvrir le document.</p>
        </div>
      </div>
      
      <div class="dialog-actions">
        <a [href]="directUrl" target="_blank" mat-raised-button color="primary" (click)="openInNewTab()">
          <mat-icon>open_in_new</mat-icon>
          Visualiser le CV
        </a>
        <button mat-button color="primary" (click)="closeDialog()">
          Fermer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cv-viewer-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      
      @media (max-width: 768px) {
        padding: 12px 16px;
      }
      
      @media (max-width: 480px) {
        padding: 10px 12px;
      }
    }
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #333;
      
      @media (max-width: 480px) {
        font-size: 18px;
      }
    }
    
    .cv-container {
      flex: 1;
      min-height: 200px;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      @media (max-width: 768px) {
        padding: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 10px;
        min-height: 180px;
      }
    }
    
    .pdf-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 30px;
      border-radius: 8px;
      background-color: #f5f5f5;
      max-width: 600px;
      width: 100%;
      
      @media (max-width: 768px) {
        padding: 20px;
      }
      
      @media (max-width: 480px) {
        padding: 15px;
        border-radius: 6px;
      }
    }
    
    .pdf-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #3f51b5;
      
      @media (max-width: 480px) {
        font-size: 36px;
        width: 36px;
        height: 36px;
        margin-bottom: 12px;
      }
    }
    
    .pdf-message h3 {
      margin: 0 0 8px 0;
      color: #333;
      
      @media (max-width: 480px) {
        font-size: 16px;
        margin-bottom: 6px;
      }
    }
    
    .pdf-message p {
      margin: 0;
      color: #666;
      
      @media (max-width: 480px) {
        font-size: 14px;
      }
    }
    
    .dialog-actions {
      padding: 8px 24px 16px;
      display: flex;
      justify-content: center;
      border-top: 1px solid #e0e0e0;
      gap: 10px;
      
      @media (max-width: 768px) {
        padding: 8px 16px 12px;
      }
      
      @media (max-width: 480px) {
        padding: 8px 12px 10px;
        flex-direction: column;
      }
    }
    
    .dialog-actions a, .dialog-actions button {
      padding: 0 24px;
      font-size: 16px;
      
      @media (max-width: 480px) {
        width: 100%;
        margin: 4px 0;
        padding: 0 16px;
        font-size: 14px;
      }
    }
  `]
})
export class CvViewerDialogComponent implements OnInit {
  directUrl: string = '';

  constructor(
    public dialogRef: MatDialogRef<CvViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.setupUrl();
  }
  
  setupUrl(): void {
    const token = localStorage.getItem('access_token');
    
    // For testing - use the known existing file if no CV path provided
    const existingPdfFile = '9f2081f8-ca21-4b6e-a435-d070101f799d.pdf';
    
    console.log('CV Viewer Data:', this.data);
    
    let filePath = this.data?.cvFilePath || existingPdfFile;
    
    // Remove any 'cvs/' prefix if it exists in the path
    if (filePath.startsWith('cvs/')) {
      filePath = filePath.substring(4); // Remove 'cvs/' prefix
      console.log('Removed cvs/ prefix from path, new path:', filePath);
    }
    
    // Use the direct URL format - exactly like in unassigned-secretaries
    this.directUrl = `${environment.apiUrl}/api/v1/api/users/cv/${filePath}`;
    
    // Add token if available
    if (token) {
      this.directUrl += `?token=${token}`;
    }
    
    console.log('Using CV URL:', this.directUrl);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openInNewTab(): void {
    // Get a fresh token in case it has changed
    const token = localStorage.getItem('access_token');
    
    // Create URL with the updated token
    let url = this.directUrl;
    if (token) {
      if (url.includes('token=')) {
        url = url.replace(/token=[^&]+/, `token=${token}`);
      } else {
        url += `${url.includes('?') ? '&' : '?'}token=${token}`;
      }
    }
    
    window.open(url, '_blank');
  }
}