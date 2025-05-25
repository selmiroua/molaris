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
        <div *ngIf="fileExists && !isTestingDirectly" class="pdf-message">
          <mat-icon>description</mat-icon>
          <h3>Le CV est prêt à être visualisé</h3>
          <p>Pour des raisons de sécurité du navigateur, veuillez utiliser le bouton ci-dessous pour ouvrir le document.</p>
        </div>
        <div *ngIf="!fileExists && !isTestingDirectly" class="error-message">
          <mat-icon>error</mat-icon>
          <h3>Fichier non trouvé</h3>
          <p>Le CV demandé n'est pas disponible ou n'existe pas.</p>
        </div>
        
        <!-- Test area for direct access -->
        <div *ngIf="isTestingDirectly" class="test-area">
          <h3>Test direct des URLs</h3>
          <div class="test-links">
            <h4>URL avec préfixe profile-pictures</h4>
            <a [href]="testUrlWithPrefix" target="_blank">Tester avec préfixe</a>
            <code>{{testUrlWithPrefix}}</code>
            
            <h4 class="mt-3">URL directe</h4>
            <a [href]="testUrlDirect" target="_blank">Tester sans préfixe</a>
            <code>{{testUrlDirect}}</code>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <a *ngIf="fileExists && !isTestingDirectly" [href]="originalUrl" target="_blank" mat-raised-button color="primary" (click)="openInNewTab()">
          <mat-icon>open_in_new</mat-icon>
          Ouvrir le CV
        </a>
        <button *ngIf="!fileExists && !isTestingDirectly" mat-raised-button color="primary" (click)="closeDialog()">
          Fermer
        </button>
        <button *ngIf="!isTestingDirectly" mat-stroked-button color="primary" (click)="toggleTestMode()">
          Mode test
        </button>
        <button *ngIf="isTestingDirectly" mat-raised-button color="primary" (click)="toggleTestMode()">
          Mode normal
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
    
    .pdf-message, .error-message, .test-area {
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
    
    .test-links {
      width: 100%;
      text-align: left;
    }
    
    .test-links code {
      display: block;
      background: #e0e0e0;
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
      word-break: break-all;
      
      @media (max-width: 480px) {
        padding: 6px;
        font-size: 12px;
      }
    }
    
    .mt-3 {
      margin-top: 1rem;
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
    
    .error-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #f44336;
      
      @media (max-width: 480px) {
        font-size: 36px;
        width: 36px;
        height: 36px;
        margin-bottom: 12px;
      }
    }
    
    .pdf-message h3, .error-message h3 {
      margin: 0 0 8px 0;
      color: #333;
      
      @media (max-width: 480px) {
        font-size: 16px;
        margin-bottom: 6px;
      }
    }
    
    .pdf-message p, .error-message p {
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
  originalUrl: string = '';
  fileExists = true;
  isTestingDirectly = false;
  testUrlWithPrefix: string = '';
  testUrlDirect: string = '';

  constructor(
    public dialogRef: MatDialogRef<CvViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.setupUrls();
  }
  
  setupUrls(): void {
    const token = localStorage.getItem('access_token');
    
    // For testing - use the known existing file
    const existingPdfFile = '60fac6f0-fe37-4c03-9372-e7b88bb9b491.pdf';
    
    console.log('CV Viewer Data:', this.data);
    console.log('Existing PDF file in uploads/cvs:', existingPdfFile);
    
    if ((this.data?.cvFilePath || existingPdfFile) && token) {
      // If no CV path provided, use the test PDF for demo
      const filePath = this.data?.cvFilePath || existingPdfFile;
      
      // Check if the filePath already includes 'cvs/'
      const hasCvsPrefix = filePath.startsWith('cvs/');
      const cvPath = hasCvsPrefix ? filePath : `cvs/${filePath}`;
      
      // Test URLs
      this.testUrlWithPrefix = `${environment.apiUrl}/api/v1/api/users/cv/${cvPath}?token=${token}`;
      this.testUrlDirect = `${environment.apiUrl}/api/v1/api/users/cv/${filePath}?token=${token}`;
      
      // Use correct API path for production
      this.originalUrl = `${environment.apiUrl}/api/v1/api/users/cv/${cvPath}?token=${token}`;
      console.log('Full CV URL:', this.originalUrl);
      
      // Additional validation log
      if (filePath === existingPdfFile) {
        console.log('Using test PDF file because no CV path was provided in the data');
      } else {
        console.log('Using CV path from data:', this.data.cvFilePath);
      }
      
      this.checkFileExists();
    } else {
      this.originalUrl = '';
      this.fileExists = false;
      console.error('Unable to construct CV URL: Missing token or CV path');
    }
  }

  checkFileExists(): void {
    console.log('Checking if file exists at URL:', this.originalUrl);
    
    // Add authorization headers for the HEAD request
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });
    
    // Make a HEAD request to check if the file exists
    this.http.head(this.originalUrl, { headers })
      .pipe(
        catchError(error => {
          console.error('CV file not found:', error);
          console.error('URL that failed:', this.originalUrl);
          this.fileExists = false;
          return of(null);
        })
      )
      .subscribe(response => {
        if (response !== null) {
          console.log('File exists at URL:', this.originalUrl);
          this.fileExists = true;
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openInNewTab(): void {
    // Get a fresh token in case it has changed
    const token = localStorage.getItem('access_token');
    
    // Ensure the URL has the latest token
    let url = this.originalUrl;
    if (url.includes('token=')) {
      url = url.replace(/token=[^&]+/, `token=${token}`);
    } else {
      url += `${url.includes('?') ? '&' : '?'}token=${token}`;
    }
    
    window.open(url, '_blank');
  }
  
  toggleTestMode(): void {
    this.isTestingDirectly = !this.isTestingDirectly;
  }
}