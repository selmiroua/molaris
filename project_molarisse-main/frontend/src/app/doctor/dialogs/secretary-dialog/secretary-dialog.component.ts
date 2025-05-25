import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Secretary } from '../../../shared/models/secretary.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-secretary-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="secretary-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ viewOnly ? 'Détails du secrétaire' : 'Assigner ce secrétaire?' }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content>
        <div *ngIf="data?.secretary; else noData" class="secretary-profile">
          <div class="profile-image">
            <img [src]="getProfileImageUrl()" alt="{{ data.secretary?.prenom || '' }} {{ data.secretary?.nom || '' }}" (error)="handleImageError($event)">
          </div>
          
          <div class="profile-info">
            <h3>{{ data.secretary?.prenom || '' }} {{ data.secretary?.nom || '' }}</h3>
            <p *ngIf="data.secretary?.email">
              <mat-icon>email</mat-icon> {{ data.secretary.email }}
            </p>
            <p *ngIf="data.secretary?.phoneNumber">
              <mat-icon>phone</mat-icon> {{ data.secretary.phoneNumber }}
            </p>
            <p *ngIf="data.secretary?.address">
              <mat-icon>location_on</mat-icon> {{ data.secretary.address }}
            </p>
          </div>
        </div>
        
        <ng-template #noData>
          <div class="error-message">
            <mat-icon color="warn">error</mat-icon>
            <p>Aucune donnée disponible pour ce secrétaire.</p>
          </div>
        </ng-template>
        
        <mat-divider *ngIf="data?.secretary"></mat-divider>
        
        <div class="secretary-details" *ngIf="viewOnly && data?.secretary">
          <h4>Informations supplémentaires</h4>
          
          <div *ngIf="data.secretary?.cvFilePath" class="cv-section">
            <a [href]="getCvUrl()" target="_blank" class="cv-link">
              <mat-icon>description</mat-icon> Voir CV
            </a>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">
          {{ viewOnly ? 'Fermer' : 'Annuler' }}
        </button>
        <button *ngIf="!viewOnly && data?.secretary" mat-raised-button color="primary" (click)="confirm()">
          <mat-icon>person_add</mat-icon> Assigner
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .secretary-dialog {
      padding: 0;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
    }
    
    mat-dialog-content {
      min-height: 250px;
      max-height: 80vh;
    }
    
    .secretary-profile {
      display: flex;
      margin-bottom: 24px;
      
      .profile-image {
        flex: 0 0 100px;
        height: 100px;
        margin-right: 24px;
        overflow: hidden;
        border-radius: 50%;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .profile-info {
        flex: 1;
        
        h3 {
          margin: 0 0 12px;
          font-weight: 500;
        }
        
        p {
          display: flex;
          align-items: center;
          margin: 8px 0;
          
          mat-icon {
            margin-right: 8px;
            color: #666;
          }
        }
      }
    }
    
    .secretary-details {
      margin-top: 24px;
      
      h4 {
        font-weight: 500;
        margin-bottom: 16px;
      }
      
      .cv-section {
        margin-top: 12px;
        
        .cv-link {
          display: flex;
          align-items: center;
          color: #3f51b5;
          text-decoration: none;
          
          &:hover {
            text-decoration: underline;
          }
          
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    }
    
    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      
      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin-bottom: 16px;
        color: #f44336;
      }
      
      p {
        margin: 0;
        color: #666;
        font-size: 16px;
      }
    }
  `]
})
export class SecretaryDialogComponent {
  viewOnly: boolean;
  apiUrl = environment.apiUrl;
  
  constructor(
    public dialogRef: MatDialogRef<SecretaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      secretary: Secretary, 
      viewOnly?: boolean 
    }
  ) {
    console.log('Secretary dialog data:', data);
    this.viewOnly = data.viewOnly || false;
    
    // Data validation
    if (!data || !data.secretary) {
      console.error('No secretary data provided to dialog');
    }
  }
  
  close(): void {
    this.dialogRef.close();
  }
  
  confirm(): void {
    this.dialogRef.close(true);
  }
  
  getProfileImageUrl(): string {
    if (this.data?.secretary?.profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        return `${this.apiUrl}/api/v1/api/users/profile/picture/${this.data.secretary.profilePicturePath}?t=${timestamp}`;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    return 'assets/images/default-avatar.png';
  }
  
  getCvUrl(): string {
    if (!this.data?.secretary?.cvFilePath) {
      return '';
    }
    const token = localStorage.getItem('access_token');
    
    // Check if the path already includes 'cvs/'
    const cvFilePath = this.data.secretary.cvFilePath;
    const hasCvsPrefix = cvFilePath.startsWith('cvs/');
    const cvPath = hasCvsPrefix ? cvFilePath : `cvs/${cvFilePath}`;
    
    return `${this.apiUrl}/api/v1/api/users/cv/${cvPath}?token=${token}`;
  }
  
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/images/default-avatar.png';
    }
  }
}