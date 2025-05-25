import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-assigned-secretaries',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    MatSlideToggleModule
  ],
  templateUrl: './assigned-secretaries.component.html',
  styleUrls: ['./assigned-secretaries.component.scss'],
  providers: [DatePipe],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(25px)' }),
          stagger(100, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('0.5s cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' })
        )
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
export class AssignedSecretariesComponent implements OnInit {
  @ViewChild('secretaryDetailsDialog') secretaryDetailsDialog!: TemplateRef<any>;
  
  secretaries: User[] = [];
  loading = true;
  error = false;
  errorMessage: string | null = null;
  apiUrl = environment.apiUrl;
  private dialogRef: MatDialogRef<any> | null = null;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.fetchAssignedSecretaries();
  }

  fetchAssignedSecretaries(): void {
    this.loading = true;
    this.error = false;
    this.errorMessage = null;
    
    this.userService.getAssignedSecretaries().subscribe({
      next: (secretaries) => {
        this.secretaries = secretaries;
        this.loading = false;
        console.log('Secrétaires assignés chargés:', secretaries);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des secrétaires assignés:', error);
        this.error = true;
        this.errorMessage = 'Impossible de charger les secrétaires. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  refreshList(): void {
    this.fetchAssignedSecretaries();
  }

  unassignSecretary(secretaryId: string, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent card click event
    }
    
    const secretary = this.secretaries.find(s => s.id.toString() === secretaryId);
    if (!secretary) return;

    // Confirmation before unassigning
    if (confirm(`Êtes-vous sûr de vouloir retirer ${secretary.prenom} ${secretary.nom} de votre équipe?`)) {
      this.loading = true;
      
      // Call the API to unassign the secretary
      this.userService.removeSecretary(Number(secretaryId)).subscribe({
        next: (response) => {
          console.log('Secrétaire retiré avec succès:', response);
          this.snackBar.open(`${secretary.prenom} ${secretary.nom} a été retiré de votre équipe.`, 'Fermer', {
            duration: 5000
          });
          // Refresh the list after unassigning
          this.refreshList();
        },
        error: (error) => {
          console.error('Erreur lors du retrait du secrétaire:', error);
          this.snackBar.open(`Erreur lors du retrait du secrétaire: ${error.message || 'Erreur inconnue'}`, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }

  openSecretaryDetailsDialog(secretary: User): void {
    // Close any existing dialog
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    
    // Open a new dialog with secretary details
    this.dialogRef = this.dialog.open(this.secretaryDetailsDialog, {
      width: '550px',
      panelClass: 'secretary-details-dialog',
      data: { secretary: secretary },
      autoFocus: false
    });
    
    // Log the dialog opening
    console.log('Dialog ouvert pour le secrétaire:', secretary);
  }

  // Format date for display in the dialog
  formatDate(date: string | undefined): string {
    if (!date) return 'Non spécifié';
    
    try {
      // Try to format the date using the DatePipe
      const formattedDate = this.datePipe.transform(date, 'dd MMMM yyyy', '', 'fr');
      return formattedDate || new Date(date).toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      // Fallback to browser's date formatting
      return new Date(date).toLocaleDateString('fr-FR');
    }
  }

  contactSecretary(secretary: User, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent card click event
    }
    
    // Close any open dialog
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    
    // In a real implementation, you would open a contact dialog or redirect to a messaging feature
    console.log('Contacter le secrétaire:', secretary);
    
    // For now, just show a snackbar
    this.snackBar.open(`Contacter ${secretary.prenom} ${secretary.nom} (${secretary.email})`, 'Fermer', {
      duration: 3000
    });
  }

  toggleSecretaryAccess(secretary: User, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent card click event
    }
    
    const actionText = secretary.accountLocked ? 'activer' : 'désactiver';
    
    if (confirm(`Êtes-vous sûr de vouloir ${actionText} l'accès au tableau de bord pour ${secretary.prenom} ${secretary.nom}?`)) {
      this.loading = true;
      
      this.userService.toggleSecretaryAccess(Number(secretary.id)).subscribe({
        next: (updatedSecretary) => {
          console.log('Accès secrétaire modifié avec succès:', updatedSecretary);
          
          // Update the secretary in the local array
          const index = this.secretaries.findIndex(s => s.id === updatedSecretary.id);
          if (index !== -1) {
            this.secretaries[index] = updatedSecretary;
          }
          
          const statusText = updatedSecretary.accountLocked ? 'désactivé' : 'activé';
          this.snackBar.open(`L'accès de ${updatedSecretary.prenom} ${updatedSecretary.nom} a été ${statusText}.`, 'Fermer', {
            duration: 5000
          });
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la modification de l\'accès du secrétaire:', error);
          this.snackBar.open(`Erreur: ${error.message || 'Une erreur est survenue'}`, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }

  getProfileImageUrl(profilePicturePath: string | null | undefined): string {
    // Temporarily disabling profile picture loading due to authentication issues
    // Uncomment and fix the code below when authentication is resolved
    return 'assets/images/default-avatar.png';
    
    /*
    if (profilePicturePath) {
      try {
        // Use a default image if no profile picture is available
        if (!profilePicturePath.trim()) {
          return 'assets/images/default-avatar.png';
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        // Ensure path is properly formatted with profile-pictures/ prefix if not already included
        const path = profilePicturePath.includes('/') ? 
          profilePicturePath : 
          `profile-pictures/${profilePicturePath}`;
        
        // Use the correct API URL format (without duplicate 'api')
        return `${this.apiUrl}/api/v1/users/profile/picture/${path}?t=${timestamp}`;
      } catch (error) {
        console.error('Erreur lors de la génération de l\'URL de l\'image de profil:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    return 'assets/images/default-avatar.png';
    */
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }
} 