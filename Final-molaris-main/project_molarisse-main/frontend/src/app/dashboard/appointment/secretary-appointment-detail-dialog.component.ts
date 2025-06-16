import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService, Appointment, AppointmentStatus, AppointmentType, CaseType } from '../../core/services/appointment.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';
import { PatientService, FichePatient } from '../../core/services/patient.service';

@Component({
  selector: 'app-secretary-appointment-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    MatTabsModule,
    MatExpansionModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  providers: [PatientService],
  template: `
    <div class="appointment-dialog-container">
      <mat-tab-group>
        <mat-tab label="Détails du rendez-vous">
          <div class="dialog-header" [class.header-female]="fichePatient?.sexe === 'F'" [class.header-male]="fichePatient?.sexe === 'M'">
            <div class="header-content">
              <div class="reservation-info">
                <div class="id-section">
                  <span class="reservation-id">Reservation ID #{{ appointment.id }}</span>
                  <span class="appointment-type">{{ getAppointmentTypeLabel(appointment.appointmentType) }}</span>
                </div>
                <button mat-icon-button class="close-button" (click)="dialogRef.close()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="patient-section">
                <div class="patient-brief">
                  <div class="patient-avatar" [class.avatar-female]="fichePatient?.sexe === 'F'" [class.avatar-male]="fichePatient?.sexe === 'M'">
                    {{ getInitials(appointment.patient?.prenom, appointment.patient?.nom) }}
                  </div>
                  <div class="patient-info">
                    <span class="patient-label">Patient name</span>
                    <div class="patient-name">
                      {{ appointment.patient?.prenom }} {{ appointment.patient?.nom }}
                    </div>
                  </div>
                </div>
                <div class="status-section">
                  <span class="status-label">Change Status</span>
                  <div class="status-button-wrapper">
                    <form [formGroup]="statusForm" (ngSubmit)="updateStatus()" class="status-form">
                      <mat-form-field appearance="outline" class="status-select">
                        <mat-select formControlName="status" panelClass="status-panel">
                          <mat-select-trigger>
                            <span class="status-dot" [class]="'dot-' + statusForm.value.status.toLowerCase()"></span>
                            {{ getStatusLabel(statusForm.value.status) }}
                            <mat-icon class="dropdown-icon">expand_more</mat-icon>
                          </mat-select-trigger>
                          <mat-option *ngFor="let status of availableStatuses" [value]="status.value">
                            <span class="status-dot" [class]="'dot-' + status.value.toLowerCase()"></span>
                            {{ status.label }}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-content">
            <div *ngIf="isLoading" class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            <div *ngIf="!isLoading" class="content-wrapper">
              <!-- Basic Info Section -->
              <div class="info-section">
                <div class="info-row">
                  <div class="info-field">
                    <mat-icon class="info-icon">schedule</mat-icon>
                    <div class="field-content">
                      <div class="field-label">DATE ET HEURE</div>
                      <div class="field-value">{{ formatAppointmentDate(appointment.appointmentDateTime) }}</div>
                    </div>
                  </div>
                  <div class="info-field">
                    <mat-icon class="info-icon">medical_services</mat-icon>
                    <div class="field-content">
                      <div class="field-label">TRAITEMENT</div>
                      <div class="field-value">
                        {{ getAppointmentTypeLabel(appointment.appointmentType) }}
                        <span class="case-type" [class]="'case-' + appointment.caseType.toLowerCase()">
                          {{ getCaseTypeLabel(appointment.caseType) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="separator"></div>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Fiche Patient">
          <div class="dialog-content">
            <div *ngIf="loadingFiche" class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            <div *ngIf="ficheError" class="error-message">
              Erreur lors du chargement de la fiche patient.
            </div>
            <div *ngIf="!loadingFiche && fichePatient">
              <div class="section-title">Fiche Patient Complète</div>
              <div class="patient-info-grid">
                <div class="info-field">
                  <mat-icon class="info-icon">badge</mat-icon>
                  <div class="field-content">
                    <div class="field-label">Nom complet</div>
                    <div class="field-value">{{ fichePatient?.prenom }} {{ fichePatient?.nom }}</div>
                  </div>
                </div>
                <div class="info-field">
                  <mat-icon class="info-icon">call</mat-icon>
                  <div class="field-content">
                    <div class="field-label">Téléphone</div>
                    <div class="field-value">{{ fichePatient?.telephone || '-' }}</div>
                  </div>
                </div>
                <div class="info-field">
                  <mat-icon class="info-icon">mail_outline</mat-icon>
                  <div class="field-content">
                    <div class="field-label">Email</div>
                    <div class="field-value">{{ appointment.patient?.email || '-' }}</div>
                  </div>
                </div>
                <div class="info-field">
                  <mat-icon class="info-icon">event</mat-icon>
                  <div class="field-content">
                    <div class="field-label">Date de naissance</div>
                    <div class="field-value">{{ formatSimpleDate(fichePatient?.dateNaissance) }}</div>
                  </div>
                </div>
                <div class="info-field">
                  <mat-icon class="info-icon">person_outline</mat-icon>
                  <div class="field-content">
                    <div class="field-label">Sexe</div>
                    <div class="field-value">{{ fichePatient?.sexe === 'M' ? 'Homme' : fichePatient?.sexe === 'F' ? 'Femme' : '-' }}</div>
                  </div>
                </div>
                <div class="info-field full-width">
                  <mat-icon class="info-icon">home_outline</mat-icon>
                  <div class="field-content">
                    <div class="field-label">Adresse</div>
                    <div class="field-value">{{ fichePatient?.adresse || '-' }}</div>
                  </div>
                </div>
                <!-- Add more fields as needed -->
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .appointment-dialog-container {
      width: 100%;
      max-width: 800px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .dialog-header {
      padding: 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-female {
      background: #fdf2f8;
    }

    .header-male {
      background: #eff6ff;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .reservation-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .id-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .reservation-id {
      font-size: 14px;
      color: #64748b;
    }

    .appointment-type {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .patient-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .patient-brief {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .patient-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .avatar-female {
      background: #ec4899;
    }

    .avatar-male {
      background: #3b82f6;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .patient-label {
      font-size: 14px;
      color: #64748b;
    }

    .patient-name {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .status-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-label {
      font-size: 14px;
      color: #64748b;
    }

    .status-select {
      width: 200px;
    }

    .dialog-content {
      padding: 24px;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .info-section {
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
      gap: 24px;
    }

    .info-field {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .info-icon {
      color: #64748b;
    }

    .field-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
    }

    .field-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 500;
    }

    .separator {
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }

    .patient-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .error-message {
      color: #ef4444;
      text-align: center;
    }
  `]
})
export class SecretaryAppointmentDetailDialogComponent implements OnInit {
  statusForm: FormGroup;
  isLoading = false;
  fichePatient: FichePatient | null = null;
  loadingFiche = false;
  ficheError = false;

  availableStatuses = [
    { value: AppointmentStatus.PENDING, label: 'En attente' },
    { value: AppointmentStatus.ACCEPTED, label: 'Accepté' },
    { value: AppointmentStatus.REJECTED, label: 'Rejeté' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' }
  ];

  constructor(
    public dialogRef: MatDialogRef<SecretaryAppointmentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public appointment: Appointment,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private patientService: PatientService
  ) {
    this.statusForm = this.fb.group({
      status: [appointment.status, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFichePatient();
  }

  loadFichePatient(): void {
    if (this.appointment.patient?.id) {
      this.loadingFiche = true;
      this.patientService.getPatientFiche(this.appointment.patient.id).subscribe({
        next: (fiche: FichePatient) => {
          this.fichePatient = fiche;
          this.loadingFiche = false;
        },
        error: (error: any) => {
          console.error('Error loading fiche patient:', error);
          this.ficheError = true;
          this.loadingFiche = false;
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const statusObj = this.availableStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getAppointmentTypeLabel(type: string): string {
    switch (type) {
      case AppointmentType.DETARTRAGE:
        return 'Détartrage';
      case AppointmentType.SOIN:
        return 'Soin';
      case AppointmentType.EXTRACTION:
        return 'Extraction';
      case AppointmentType.BLANCHIMENT:
        return 'Blanchiment';
      case AppointmentType.ORTHODONTIE:
        return 'Orthodontie';
      default:
        return type;
    }
  }

  getCaseTypeLabel(type: string): string {
    switch (type) {
      case CaseType.URGENT:
        return 'Urgent';
      case CaseType.CONTROL:
        return 'Contrôle';
      case CaseType.NORMAL:
        return 'Normal';
      default:
        return type;
    }
  }

  formatAppointmentDate(dateTime: string | undefined | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSimpleDate(dateInput: string | Date | undefined | null): string {
    if (!dateInput) return '-';
    const date = new Date(dateInput);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return '?';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  }

  updateStatus(): void {
    if (this.statusForm.valid) {
      const newStatus = this.statusForm.value.status;
      this.appointmentService.updateAppointmentStatus(this.appointment.id, newStatus).subscribe({
        next: (updatedAppointment) => {
          this.appointment = updatedAppointment;
          this.snackBar.open('Statut du rendez-vous mis à jour avec succès', 'Fermer', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error updating appointment status:', error);
          this.snackBar.open('Erreur lors de la mise à jour du statut', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }
} 