import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Appointment, AppointmentService, AppointmentStatus } from '../core/services/appointment.service';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileService } from '../profile/profile.service';
import { AuthService } from '../auth/auth.service';
import { PatientService, FichePatient } from '../core/services/patient.service';
import { Observable, catchError, of, tap, map } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-appointment-details-dialog',
  template: `
    <div class="appointment-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>event</mat-icon> Détails du rendez-vous
        <button mat-icon-button class="close-button" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </h2>
      
      <mat-divider></mat-divider>
      
      <mat-tabs mat-stretch-tabs="false" mat-align-tabs="start" class="details-tabs">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>event_note</mat-icon>
            <span class="tab-label">Rendez-vous</span>
          </ng-template>
          
          <mat-dialog-content class="dialog-content">
            <div class="patient-profile-section" *ngIf="data.patient">
              <div class="profile-picture" [matTooltip]="data.patient?.prenom + ' ' + data.patient?.nom">
                <div *ngIf="!profileImageUrl" class="profile-initial">
                  {{ data.patient?.prenom?.[0] || '?' }}{{ data.patient?.nom?.[0] || '?' }}
                </div>
                <img *ngIf="profileImageUrl" [src]="profileImageUrl" alt="Patient Profile">
              </div>
              <div class="patient-info">
                <h3>{{ data.patient?.prenom || 'Patient' }} {{ data.patient?.nom || '' }}</h3>
                <p *ngIf="data.patient?.email">{{ data.patient.email }}</p>
                <p *ngIf="data.patient?.phoneNumber">{{ data.patient.phoneNumber }}</p>
              </div>
            </div>

            <div class="patient-profile-section" *ngIf="!data.patient">
              <div class="profile-picture">
                <div class="profile-initial">?</div>
              </div>
              <div class="patient-info">
                <h3>Patient non disponible</h3>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>
            
            <div class="info-section">
              <div class="info-row">
                <div class="info-label"><mat-icon>today</mat-icon> Date & Heure:</div>
                <div class="info-value">{{ formatDate(data.appointmentDateTime) }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label"><mat-icon>flag</mat-icon> Statut:</div>
                <div class="info-value status-section">
                  <mat-chip [ngClass]="getStatusClass(data.status)">{{ data.status }}</mat-chip>
                  
                  <button 
                    mat-icon-button 
                    color="primary" 
                    *ngIf="!changingStatus" 
                    (click)="toggleStatusChange()"
                    matTooltip="Changer le statut"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="info-row status-change-section" *ngIf="changingStatus">
                <div class="status-change-container">
                  <mat-form-field appearance="outline">
                    <mat-label>Changer le statut</mat-label>
                    <mat-select [(ngModel)]="selectedStatus">
                      <mat-option *ngFor="let status of availableStatuses" [value]="status">
                        {{ status }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <div class="status-actions">
                    <button mat-button color="warn" (click)="toggleStatusChange()">Annuler</button>
                    <button 
                      mat-raised-button 
                      color="primary" 
                      (click)="updateStatus()" 
                      [disabled]="updating"
                    >
                      <mat-spinner *ngIf="updating" diameter="20" class="status-spinner"></mat-spinner>
                      <span *ngIf="!updating">Mettre à jour</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label"><mat-icon>medical_services</mat-icon> Type:</div>
                <div class="info-value">{{ data.appointmentType }}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label"><mat-icon>priority_high</mat-icon> Cas:</div>
                <div class="info-value">{{ data.caseType }}</div>
              </div>
              
              <mat-divider class="section-divider"></mat-divider>
              
              <div class="notes-section">
                <div class="notes-header">
                  <mat-icon>notes</mat-icon> Notes:
                </div>
                <div class="notes-content">
                  {{ data.notes || 'Aucune note disponible' }}
                </div>
              </div>
            </div>
          </mat-dialog-content>
        </mat-tab>
        
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>medical_information</mat-icon>
            <span class="tab-label">Fiche Patient</span>
          </ng-template>
          
          <mat-dialog-content class="dialog-content">
            <div *ngIf="loadingFiche" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Chargement de la fiche patient...</p>
            </div>
            
            <div *ngIf="!loadingFiche && ficheError" class="error-container">
              <mat-icon color="warn">error</mat-icon>
              <p>Impossible de charger la fiche patient.</p>
              <button mat-raised-button color="primary" (click)="loadPatientFiche()">Réessayer</button>
            </div>
            
            <div *ngIf="!loadingFiche && !ficheError && !fichePatient" class="empty-fiche-container">
              <mat-icon color="primary">info</mat-icon>
              <p>Aucune fiche patient n'existe pour ce patient.</p>
            </div>
            
            <div *ngIf="!loadingFiche && fichePatient" class="fiche-container">
              <div class="fiche-header">
                <h3>
                  <mat-icon>person</mat-icon>
                  {{ fichePatient.prenom }} {{ fichePatient.nom }}
                </h3>
                <div *ngIf="fichePatient.updatedAt" class="fiche-date">
                  Mise à jour: {{ formatFicheDate(fichePatient.updatedAt) }}
                </div>
              </div>
              
              <mat-divider class="section-divider"></mat-divider>
              
              <mat-accordion class="fiche-accordion">
                <mat-expansion-panel expanded>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>badge</mat-icon>
                      Informations personnelles
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="fiche-label">Âge:</span>
                      <span class="fiche-value">{{ fichePatient.age || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="fiche-label">Genre:</span>
                      <span class="fiche-value">{{ fichePatient.sexe || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="fiche-label">Profession:</span>
                      <span class="fiche-value">{{ fichePatient.profession || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="fiche-label">Téléphone:</span>
                      <span class="fiche-value">{{ fichePatient.telephone || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="fiche-label">Adresse:</span>
                      <span class="fiche-value">{{ fichePatient.adresse || '-' }}</span>
                    </div>
                  </div>
                </mat-expansion-panel>
                
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>health_and_safety</mat-icon>
                      Informations médicales
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="info-group">
                    <div class="fiche-label-header">État Général:</div>
                    <div class="fiche-text-block">{{ fichePatient.etatGeneral || 'Non renseigné' }}</div>
                  </div>
                  
                  <div class="info-group">
                    <div class="fiche-label-header">Antécédents Chirurgicaux:</div>
                    <div class="fiche-text-block">{{ fichePatient.antecedentsChirurgicaux || 'Aucun antécédent chirurgical' }}</div>
                  </div>
                  
                  <div class="info-group">
                    <div class="fiche-label-header">Prise de Médicaments:</div>
                    <div class="fiche-text-block">{{ fichePatient.priseMedicaments || 'Aucune prise de médicaments' }}</div>
                  </div>
                  
                  <div class="info-group">
                    <div class="fiche-label-header">Allergies:</div>
                    <div class="fiche-text-block">{{ fichePatient.allergies || 'Aucune allergie connue' }}</div>
                  </div>
                </mat-expansion-panel>
                
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>medical_services</mat-icon>
                      Observations Dentaires
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="fiche-text-block">
                    {{ fichePatient.observationsDentaires || 'Aucune observation dentaire enregistrée' }}
                  </div>
                </mat-expansion-panel>
                
                <mat-expansion-panel *ngIf="fichePatient.documentPath">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>description</mat-icon>
                      Documents Médicaux
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="document-item">
                    <mat-icon>insert_drive_file</mat-icon>
                    <span class="document-name">{{ fichePatient.documentName }}</span>
                    <span class="document-date">{{ formatFicheDate(fichePatient.documentUploadDate) }}</span>
                    <button 
                      mat-icon-button
                      color="primary"
                      matTooltip="Télécharger le document"
                    >
                      <mat-icon>cloud_download</mat-icon>
                    </button>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </mat-dialog-content>
        </mat-tab>
      </mat-tabs>
      
      <mat-dialog-actions align="end">
        <button mat-raised-button color="accent" mat-dialog-close>Fermer</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      margin-top: 32px;
      padding: 0;
      max-width: 700px;
      width: 100%;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #378392;
      margin-bottom: 0;
      padding: 16px 24px;
      font-size: 22px;
      position: relative;
    }
    
    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    
    .details-tabs {
      margin-top: 8px;
    }
    
    .tab-label {
      margin-left: 8px;
    }
    
    .dialog-content {
      padding: 24px;
      margin: 0;
      max-height: 60vh;
    }
    
    .patient-profile-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .profile-picture {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      background-color: #378392;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
    }
    
    .profile-initial {
      color: white;
      font-size: 28px;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .profile-picture img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .patient-info {
      display: flex;
      flex-direction: column;
    }
    
    .patient-info h3 {
      margin: 0;
      color: #378392;
      font-size: 18px;
    }
    
    .patient-info p {
      margin: 2px 0;
      color: #757575;
      font-size: 14px;
    }
    
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .info-row {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    
    .info-label {
      min-width: 140px;
      font-weight: 500;
      color: #546E7A;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-value {
      flex: 1;
    }
    
    .status-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-change-section {
      padding-left: 140px;
      margin-top: -8px;
    }
    
    .status-change-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: #F5F5F5;
      padding: 12px;
      border-radius: 4px;
      width: 100%;
    }
    
    .status-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .status-spinner {
      margin: 0 8px;
    }
    
    .section-divider {
      margin: 16px 0;
    }
    
    mat-chip.PENDING {
      background-color: #FFB74D;
      color: #fff;
    }
    
    mat-chip.ACCEPTED {
      background-color: #4CAF50;
      color: #fff;
    }
    
    mat-chip.COMPLETED {
      background-color: #2196F3;
      color: #fff;
    }
    
    mat-chip.CANCELED {
      background-color: #F44336;
      color: #fff;
    }
    
    .notes-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .notes-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #546E7A;
    }
    
    .notes-content {
      background-color: #F5F5F5;
      padding: 12px;
      border-radius: 4px;
      color: #333;
      white-space: pre-line;
      font-size: 14px;
    }
    
    .loading-container, .error-container, .empty-fiche-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      gap: 16px;
      text-align: center;
      color: #757575;
    }
    
    .error-container mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    
    .empty-fiche-container mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #BBDEFB;
    }
    
    .fiche-container {
      padding: 0 8px;
    }
    
    .fiche-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
    }
    
    .fiche-header h3 {
      margin: 0;
      color: #378392;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .fiche-date {
      font-size: 12px;
      color: #757575;
    }
    
    .fiche-accordion {
      margin-top: 16px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .fiche-label {
      font-size: 12px;
      color: #757575;
    }
    
    .fiche-value {
      font-size: 16px;
      color: #333;
    }
    
    .info-group {
      margin-bottom: 16px;
    }
    
    .fiche-label-header {
      font-size: 14px;
      font-weight: 500;
      color: #546E7A;
      margin-bottom: 4px;
    }
    
    .fiche-text-block {
      background-color: #F5F5F5;
      padding: 12px;
      border-radius: 4px;
      color: #333;
      white-space: pre-line;
      font-size: 14px;
      margin-bottom: 16px;
    }
    
    .document-item {
      display: flex;
      align-items: center;
      background-color: #F5F5F5;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .document-name {
      flex: 1;
      margin-left: 8px;
      font-size: 14px;
    }
    
    .document-date {
      font-size: 12px;
      color: #757575;
      margin: 0 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatSelectModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatTabsModule,
    MatExpansionModule,
    MatBadgeModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [DatePipe]
})
export class AppointmentDetailsDialogComponent {
  profileImageUrl: string | null = null;
  changingStatus = false;
  updating = false;
  selectedStatus: AppointmentStatus = AppointmentStatus.PENDING;
  availableStatuses = Object.values(AppointmentStatus);
  
  // Fiche patient
  fichePatient: FichePatient | null = null;
  loadingFiche = false;
  ficheError = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Appointment,
    public dialogRef: MatDialogRef<AppointmentDetailsDialogComponent>,
    private datePipe: DatePipe,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private profileService: ProfileService,
    private authService: AuthService,
    private patientService: PatientService
  ) {
    console.log('Appointment data received:', data);
    console.log('Patient data:', data.patient);
    
    // Set initial status
    this.selectedStatus = data.status as AppointmentStatus;
    
    // Try to load the profile image if patient data is available
    if (data.patient) {
      this.tryLoadProfileImage();
    }
    
    // Load patient fiche if patient data is available
    if (data.patient && data.patient.id) {
      this.loadPatientFiche();
    }
  }
  
  formatDate(dateTime: string): string {
    if (!dateTime) return 'Date non disponible';
    const date = new Date(dateTime);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  
  formatFicheDate(date: any): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  getStatusClass(status: string): string {
    return status;
  }
  
  toggleStatusChange(): void {
    this.changingStatus = !this.changingStatus;
    if (!this.changingStatus) {
      // Reset to current status if canceled
      this.selectedStatus = this.data.status as AppointmentStatus;
    }
  }
  
  updateStatus(): void {
    if (this.selectedStatus === this.data.status) {
      this.toggleStatusChange();
      return;
    }
    
    this.updating = true;
    
    // Check user role to determine which update method to use
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user.role === 'DOCTOR') {
          this.updateStatusAsDoctor();
        } else if (user.role === 'SECRETARY') {
          this.updateStatusAsSecretary();
        } else {
          this.snackBar.open('Vous n\'avez pas les permissions pour mettre à jour le statut.', 'Fermer', { duration: 5000 });
          this.updating = false;
        }
      },
      error: (err) => {
        console.error('Error getting current user:', err);
        this.snackBar.open('Erreur lors de la vérification des permissions.', 'Fermer', { duration: 5000 });
        this.updating = false;
      }
    });
  }
  
  private updateStatusAsDoctor(): void {
    this.appointmentService.updateAppointmentStatus(this.data.id, this.selectedStatus).subscribe({
      next: (updatedAppointment) => {
        this.updating = false;
        this.changingStatus = false;
        this.data.status = updatedAppointment.status;
        this.snackBar.open('Statut du rendez-vous mis à jour avec succès', 'Fermer', { duration: 5000 });
      },
      error: (err) => {
        console.error('Error updating appointment status:', err);
        this.updating = false;
        this.snackBar.open('Erreur lors de la mise à jour du statut du rendez-vous', 'Fermer', { duration: 5000 });
      }
    });
  }
  
  private updateStatusAsSecretary(): void {
    // This would include any secretary-specific logic
    this.appointmentService.updateAppointmentStatus(this.data.id, this.selectedStatus).subscribe({
      next: (updatedAppointment) => {
        this.updating = false;
        this.changingStatus = false;
        this.data.status = updatedAppointment.status;
        this.snackBar.open('Statut du rendez-vous mis à jour avec succès', 'Fermer', { duration: 5000 });
      },
      error: (err) => {
        console.error('Error updating appointment status:', err);
        this.updating = false;
        this.snackBar.open('Erreur lors de la mise à jour du statut du rendez-vous', 'Fermer', { duration: 5000 });
      }
    });
  }
  
  loadPatientFiche(): void {
    if (!this.data.patient || !this.data.patient.id) {
      this.ficheError = true;
      this.snackBar.open('Données du patient manquantes ou incomplètes', 'Fermer', { duration: 5000 });
      return;
    }
    
    // Check for auth token before attempting API call
    const { valid, token } = this.checkAuthToken();
    if (!valid || !token) {
      this.snackBar.open('Erreur d\'authentification. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
      this.ficheError = true;
      return;
    }
    
    this.loadingFiche = true;
    this.ficheError = false;
    
    console.log('Loading fiche for patient ID:', this.data.patient.id);
    console.log('Appointment ID:', this.data.id);
    
    // First try to get the fiche through the patient endpoint
    this.patientService.getPatientFiche(this.data.patient.id).pipe(
      tap(fiche => console.log('Fiche patient loaded from patient service:', fiche)),
      map(fiche => this.normalizeFicheData(fiche, 'patient')),
      catchError(patientError => {
        console.error('Error loading patient fiche from patient service:', patientError);
        console.error('Status code:', patientError.status);
        console.error('Status text:', patientError.statusText);
        console.error('Error details:', patientError.error);
        console.error('URL attempted:', `${this.patientService.getApiUrl()}/${this.data.patient.id}/fiche`);
        
        // If the patient service fails, try the appointment service
        console.log('Trying to load fiche through appointment service for appointment ID:', this.data.id);
        return this.appointmentService.getAppointmentFichePatient(this.data.id).pipe(
          tap(fiche => console.log('Fiche patient loaded from appointment service:', fiche)),
          map(fiche => this.normalizeFicheData(fiche, 'appointment')),
          catchError(appointmentError => {
            console.error('Error loading fiche from appointment service:', appointmentError);
            console.error('Status code:', appointmentError.status);
            console.error('Status text:', appointmentError.statusText);
            console.error('Error details:', appointmentError.error);
            console.error('URL attempted:', `${this.appointmentService.getApiUrl()}/${this.data.id}/fiche-patient`);
            
            // Both services failed, handle the error
            this.ficheError = true;
            this.loadingFiche = false;
            
            // Determine which error to display based on which API endpoint returned a more specific error
            if (appointmentError.status === 401 || appointmentError.status === 403 ||
                patientError.status === 401 || patientError.status === 403) {
              this.snackBar.open('Erreur d\'authentification. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
            } else if (appointmentError.status === 404 && patientError.status === 404) {
              this.snackBar.open('Aucune fiche trouvée pour ce patient', 'Fermer', { duration: 5000 });
            } else if (appointmentError.status === 500 && patientError.status === 500) {
              this.snackBar.open('Erreur serveur lors du chargement de la fiche patient: ' + 
                (patientError.error?.message || appointmentError.error?.message || 'Erreur inconnue'), 
                'Fermer', { duration: 5000 });
            } else {
              this.snackBar.open('Erreur lors du chargement de la fiche patient. Veuillez réessayer.', 'Fermer', { duration: 5000 });
            }
            
            return of(null);
          })
        );
      })
    ).subscribe(fiche => {
      if (fiche) {
        this.fichePatient = fiche;
        this.loadingFiche = false;
        console.log('Successfully loaded fiche:', fiche);
      }
    });
  }
  
  // Helper method to normalize fiche data from different sources
  private normalizeFicheData(fiche: any, source: 'patient' | 'appointment'): FichePatient | null {
    if (!fiche) return null;
    
    // If data source is the appointment endpoint, it might have a different structure
    if (source === 'appointment') {
      // Check if the data is nested in a fichePatient property
      if (fiche.fichePatient) {
        return fiche.fichePatient as FichePatient;
      }
      
      // If the response is already a FichePatient object or has compatible properties
      if (fiche.patientId || fiche.id) {
        return fiche as FichePatient;
      }
    }
    
    // For patient service or if data is already in correct format
    return fiche as FichePatient;
  }
  
  tryLoadProfileImage(): void {
    if (!this.data.patient) return;
    
    // Try potential profile image URLs
    const possibleUrls = [
      `/api/v1/api/patients/${this.data.patient.id}/profile-image`,
      `assets/images/avatars/patient-${this.data.patient.id}.jpg`,
      `assets/images/avatars/patient-${this.data.patient.id}.png`,
      `assets/images/avatars/default-${this.data.patient.sexe === 'F' ? 'female' : 'male'}.png`,
    ];
    
    this.testProfilePictureUrls(possibleUrls, 0);
  }
  
  testProfilePictureUrls(urls: string[], index: number): void {
    if (index >= urls.length) {
      // No image found, use generated avatar
      this.useGeneratedAvatar();
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      this.profileImageUrl = urls[index];
    };
    
    img.onerror = () => {
      // Try next URL
      this.testProfilePictureUrls(urls, index + 1);
    };
    
    img.src = urls[index];
  }
  
  useGeneratedAvatar(): void {
    const initials = `${this.data.patient?.prenom?.[0] || ''}${this.data.patient?.nom?.[0] || ''}`.toUpperCase();
    this.profileImageUrl = null;
    // Use the initials instead (implemented via CSS)
  }

  // Check token validity and log token information for debugging
  private checkAuthToken(): { valid: boolean, token: string | null } {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('No token found in localStorage');
      return { valid: false, token: null };
    }
    
    try {
      // Log token expiration and other metadata without exposing the full token
      console.log('Token exists with length:', token.length);
      console.log('Token starts with:', token.substring(0, 15) + '...');
      
      // Try to log expiration time if possible
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const expirationTime = new Date(payload.exp * 1000);
        const issuedTime = new Date(payload.iat * 1000);
        
        console.log('Token issued at:', issuedTime.toLocaleString());
        console.log('Token expires at:', expirationTime.toLocaleString());
        console.log('Token expired:', expirationTime < new Date());
        
        return { valid: expirationTime > new Date(), token };
      } catch (e) {
        console.error('Error parsing token:', e);
        return { valid: true, token }; // Assume valid if we can't parse it
      }
    } catch (e) {
      console.error('Error checking token:', e);
      return { valid: false, token: null };
    }
  }
}
