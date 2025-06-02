import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SecretaryService } from '../../core/services/secretary.service';
import { environment } from '../../../environments/environment';
import { CvViewerDialogComponent } from '../../shared/cv-viewer-dialog/cv-viewer-dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-secretary-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="secretary-requests">
      <h2>Demandes des secrétaires</h2>
      <div class="requests-container">
        <mat-card *ngFor="let request of secretaryRequests" class="request-card">
          <mat-card-header>
            <div class="header-content">
              <mat-card-title>{{ request.firstName }} {{ request.lastName }}</mat-card-title>
              <mat-card-subtitle>{{ request.email }}</mat-card-subtitle>
              <div class="status-badge" [class.pending]="true">En attente</div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon>phone</mat-icon>
                <div class="info-content">
                  <label>Téléphone</label>
                  <p>{{ request.phone || 'Non spécifié' }}</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>calendar_today</mat-icon>
                <div class="info-content">
                  <label>Date de demande</label>
                  <p>{{ request.requestDate | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
              <div class="info-item" *ngIf="request.message">
                <mat-icon>message</mat-icon>
                <div class="info-content">
                  <label>Message</label>
                  <p>{{ request.message }}</p>
                </div>
              </div>
              <div class="info-item" *ngIf="request.cvFileName">
                <mat-icon>description</mat-icon>
                <div class="info-content">
                  <label>CV</label>
                  <a (click)="viewCV(request.cvFileName)" class="cv-link">
                    <mat-icon>visibility</mat-icon>
                    Consulter le CV
                  </a>
                </div>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="approveRequest(request.id)" class="action-button">
              <mat-icon>check_circle</mat-icon>
              Approuver
            </button>
            <button mat-raised-button color="warn" (click)="rejectRequest(request.id)" class="action-button">
              <mat-icon>cancel</mat-icon>
              Rejeter
            </button>
          </mat-card-actions>
        </mat-card>

        <div *ngIf="secretaryRequests.length === 0" class="no-requests">
          <mat-icon>info</mat-icon>
          <p>Aucune demande en attente</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .secretary-requests {
      padding: 1.5rem;
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
      font-size: 1.8rem;
      font-weight: 500;
    }

    .requests-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .request-card {
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        position: relative;
        padding: 1.5rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #dee2e6;
      }

      mat-card-title {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
      }

      mat-card-subtitle {
        color: #546e7a;
        font-size: 1rem;
      }

      .status-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;

        &.pending {
          background-color: #fff3cd;
          color: #856404;
        }
      }
    }

    .info-grid {
      display: grid;
      gap: 1.2rem;
      padding: 1.5rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;

      mat-icon {
        color: #00acc1;
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
        margin-top: 0.2rem;
      }

      .info-content {
        flex: 1;

        label {
          display: block;
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 0.3rem;
        }

        p {
          margin: 0;
          color: #2c3e50;
          font-size: 1rem;
        }
      }
    }

    .cv-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #00acc1;
      text-decoration: none;
      cursor: pointer;
      padding: 0.3rem 0;

      &:hover {
        color: #007c91;
      }

      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
        color: inherit;
      }
    }

    mat-card-actions {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
    }

    .action-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-weight: 500;

      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
    }

    .no-requests {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      background: #f8f9fa;
      border-radius: 12px;
      color: #546e7a;

      mat-icon {
        font-size: 3.5rem;
        width: 3.5rem;
        height: 3.5rem;
        margin-bottom: 1.5rem;
        color: #00acc1;
      }

      p {
        font-size: 1.2rem;
        margin: 0;
      }
    }
  `]
})
export class SecretaryRequestsComponent implements OnInit {
  secretaryRequests: any[] = [];

  constructor(
    private secretaryService: SecretaryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSecretaryRequests();
  }

  loadSecretaryRequests(): void {
    this.secretaryService.getSecretaryRequests().subscribe({
      next: (requests) => {
        this.secretaryRequests = requests;
      },
      error: (error) => {
        console.error('Error loading secretary requests:', error);
        this.snackBar.open('Erreur lors du chargement des demandes', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  viewCV(fileName: string): void {
    if (fileName) {
      this.dialog.open(CvViewerDialogComponent, {
        width: '800px',
        height: '700px',
        data: {
          cvFilePath: fileName
        }
      });
    }
  }

  approveRequest(requestId: number): void {
    this.secretaryService.approveSecretaryRequest(requestId).subscribe({
      next: () => {
        this.snackBar.open('Demande approuvée avec succès', 'Fermer', {
          duration: 3000
        });
        this.loadSecretaryRequests();
      },
      error: (error) => {
        console.error('Error approving request:', error);
        this.snackBar.open('Erreur lors de l\'approbation de la demande', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  rejectRequest(requestId: number): void {
    this.secretaryService.rejectSecretaryRequest(requestId).subscribe({
      next: () => {
        this.snackBar.open('Demande rejetée', 'Fermer', {
          duration: 3000
        });
        this.loadSecretaryRequests();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.snackBar.open('Erreur lors du rejet de la demande', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
} 