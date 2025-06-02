import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="pdf-viewer-container">
      <div *ngIf="loading" class="pdf-loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement du document...</p>
      </div>
      
      <div *ngIf="!loading && error" class="pdf-error">
        <mat-icon>error</mat-icon>
        <p>Impossible de charger le document.</p>
        <button mat-raised-button color="primary" (click)="downloadPdf()">
          <mat-icon>file_download</mat-icon>
          Télécharger le PDF
        </button>
      </div>
      
      <div *ngIf="!loading && !error" class="pdf-actions">
        <button mat-raised-button color="primary" (click)="downloadPdf()">
          <mat-icon>file_download</mat-icon>
          Télécharger le PDF
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      width: 100%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    
    .pdf-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      
      p {
        color: #64748b;
        margin: 0;
      }
    }
    
    .pdf-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      
      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        color: #ef4444;
      }
      
      p {
        color: #64748b;
        margin: 0 0 10px 0;
      }
    }
    
    .pdf-actions {
      margin-top: 20px;
    }
  `]
})
export class PdfViewerComponent implements OnInit {
  @Input() pdfUrl: string = '';
  loading: boolean = true;
  error: boolean = false;
  
  ngOnInit(): void {
    this.checkPdfUrl();
  }
  
  private checkPdfUrl(): void {
    if (!this.pdfUrl) {
      this.error = true;
      this.loading = false;
      return;
    }
    
    // Simulate checking if the PDF exists
    const testRequest = new XMLHttpRequest();
    testRequest.open('HEAD', this.pdfUrl, true);
    testRequest.onload = () => {
      if (testRequest.status >= 200 && testRequest.status < 300) {
        this.loading = false;
      } else {
        this.error = true;
        this.loading = false;
      }
    };
    testRequest.onerror = () => {
      this.error = true;
      this.loading = false;
    };
    testRequest.send();
  }
  
  downloadPdf(): void {
    if (!this.pdfUrl) return;
    
    // Create a temporary anchor element to download the PDF
    const link = document.createElement('a');
    link.href = this.pdfUrl;
    
    // Extract filename from URL
    const filename = this.pdfUrl.substring(this.pdfUrl.lastIndexOf('/') + 1).split('?')[0];
    link.download = filename || 'document.pdf';
    
    // Append to the DOM, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 