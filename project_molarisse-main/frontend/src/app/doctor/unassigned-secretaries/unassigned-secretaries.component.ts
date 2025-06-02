import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { User } from '../../core/models/user.model';
import { SecretaryService } from '../../core/services/secretary.service';
import { environment } from '../../../environments/environment';
import { SecretaryDetailDialogComponent } from './secretary-detail-dialog/secretary-detail-dialog.component';

@Component({
  selector: 'app-unassigned-secretaries',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDialogModule,
    MatChipsModule,
    MatBadgeModule,
    SecretaryDetailDialogComponent
  ],
  templateUrl: './unassigned-secretaries.component.html',
  styleUrls: ['./unassigned-secretaries.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardHover', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('0.3s ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      state('hover', style({
        transform: 'translateY(-8px)',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)'
      })),
      transition('* => hover', [
        animate('0.3s cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class UnassignedSecretariesComponent implements OnInit {
  unassignedSecretaries: User[] = [];
  loading = true;
  error: string | null = null;
  apiUrl = environment.apiUrl;
  skills: string[] = ['Prise de rendez-vous', 'Gestion administrative', 'Accueil patients', 'Facturation', 'Logiciel médical'];
  initTimestamp: number;

  constructor(
    private secretaryService: SecretaryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initTimestamp = new Date().getTime();
  }

  ngOnInit(): void {
    this.loadUnassignedSecretaries();
  }

  loadUnassignedSecretaries(): void {
    this.loading = true;
    this.error = null;
    
    this.secretaryService.getUnassignedSecretaries().subscribe({
      next: (secretaries) => {
        this.unassignedSecretaries = secretaries;
        this.loading = false;
        console.log('Secrétaires disponibles chargés:', secretaries);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des secrétaires disponibles:', error);
        this.error = 'Impossible de charger les secrétaires. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  refreshList(): void {
    this.loadUnassignedSecretaries();
  }

  viewSecretaryDetails(secretary: User): void {
    // Add console logging to debug
    console.log('Opening secretary details dialog for:', secretary);
    
    // Open detail dialog for the secretary
    const dialogRef = this.dialog.open(SecretaryDetailDialogComponent, {
      width: '600px',
      data: { secretary }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result && result.assign) {
        this.assignSecretary(secretary);
      }
    });
  }

  assignSecretary(secretary: User): void {
    // Call the backend API to assign the secretary
    this.secretaryService.assignSecretary(secretary.id).subscribe({
      next: (response) => {
        // Remove the assigned secretary from the list
        this.unassignedSecretaries = this.unassignedSecretaries.filter(s => s.id !== secretary.id);
        
        this.snackBar.open(`Secrétaire ${secretary.prenom} ${secretary.nom} assigné avec succès!`, 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar'
        });
      },
      error: (error) => {
        console.error('Error assigning secretary:', error);
        this.snackBar.open('Une erreur est survenue lors de l\'assignation du secrétaire.', 'Fermer', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  getProfileImageUrl(secretary: User): string {
    // Check if we've already generated a URL for this secretary
    if (!secretary._profileImageUrl) {
      if (secretary && secretary.id) {
        // Generate the URL only once per secretary and store it
        // Add a fixed timestamp when the component is initialized instead of a dynamic one
        secretary._profileImageUrl = `${this.apiUrl}/api/v1/api/users/profile/picture-by-id/${secretary.id}?t=${this.initTimestamp}`;
      } else {
        // Fallback to default avatar
        secretary._profileImageUrl = 'assets/images/default-avatar.png';
      }
    }
    
    return secretary._profileImageUrl;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/images/default-avatar.png';
      
      // Find the secretary associated with this image and update its cached URL
      const secretaryId = this.extractSecretaryIdFromUrl(imgElement.src);
      if (secretaryId) {
        const secretary = this.unassignedSecretaries.find(s => s.id === Number(secretaryId));
        if (secretary) {
          secretary._profileImageUrl = 'assets/images/default-avatar.png';
        }
      }
    }
  }

  extractSecretaryIdFromUrl(url: string): string | null {
    // Extract the secretary ID from the profile picture URL
    const match = url.match(/picture-by-id\/(\d+)/);
    return match ? match[1] : null;
  }

  getRandomSkills(): string[] {
    // Return 2-4 random skills for demo purposes
    const shuffled = [...this.skills].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  getRandomExperience(): number {
    // Return random experience years (1-10)
    return Math.floor(Math.random() * 10) + 1;
  }

  getRandomAvailability(): string {
    const options = ['Immédiate', 'Sous 1 semaine', 'Sous 2 semaines'];
    return options[Math.floor(Math.random() * options.length)];
  }

  getBadgeClass(secretary: User): string {
    // For demo purposes, assign random badge colors
    const badges = ['success-badge', 'primary-badge', 'info-badge'];
    const hash = secretary.email.charCodeAt(0) + (secretary.prenom?.charCodeAt(0) || 0);
    return badges[hash % badges.length];
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
} 