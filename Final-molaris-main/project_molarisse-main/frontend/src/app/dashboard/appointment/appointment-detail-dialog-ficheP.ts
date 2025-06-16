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
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';
import { catchError, of } from 'rxjs';
import { PatientService, FichePatient } from '../../core/services/patient.service';
import { CreateFicheDialogComponent } from './create-fiche-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { EditFicheDialogComponent } from './edit-fiche-dialog.component';

@Component({
  selector: 'app-appointment-detail-dialog-fichep',
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
    <div class="appointment-detail-dialog">
      <h2 mat-dialog-title>
        <div class="dialog-header">
          <div class="appointment-icon">
            <mat-icon [ngClass]="{
              'pending-icon': appointment.status === 'PENDING',
              'accepted-icon': appointment.status === 'ACCEPTED',
              'completed-icon': appointment.status === 'COMPLETED',
              'canceled-icon': appointment.status === 'CANCELED'
            }">event</mat-icon>
          </div>
          <div class="title-content">
            <span class="dialog-title">Fiche Patient</span>
            <span class="appointment-status">{{ getStatusLabel(appointment.status) }}</span>
          </div>
        </div>
        <button mat-icon-button class="close-button" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </h2>

      <mat-dialog-content>
        <div *ngIf="isLoading" class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        
        <div *ngIf="!isLoading">
          <mat-tab-group mat-stretch-tabs="false" mat-align-tabs="start">
            <mat-tab label="Fiche Patient">
              <div class="patient-info">
                <h3>
                  <mat-icon>person</mat-icon>
                  Informations du patient
                </h3>
               
                
              </div>
              
              
              
              <div *ngIf="loadingFiche" class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Chargement de la fiche patient...</p>
              </div>
              
              <div *ngIf="!loadingFiche && ficheError" class="error-container">
                <mat-icon color="warn">error</mat-icon>
                <p>Impossible de charger la fiche patient.</p>
                <div class="button-group">
                  <button mat-raised-button color="primary" (click)="loadFichePatient()">Réessayer</button>
                  <button mat-raised-button color="accent" (click)="openCreateFicheForm()">
                    <mat-icon>add</mat-icon>
                    Créer une fiche patient
                  </button>
                </div>
              </div>
              
              <div *ngIf="!loadingFiche && !ficheError && !fichePatient" class="empty-fiche-container">
                <mat-icon color="primary">info</mat-icon>
                <p>Aucune fiche patient n'existe pour ce patient.</p>
                <button mat-raised-button color="primary" (click)="openCreateFicheForm()">
                  <mat-icon>add</mat-icon>
                  Créer une fiche patient
                </button>
              </div>
              
              <div *ngIf="!loadingFiche && fichePatient" class="fiche-container">
                <div class="fiche-header">
                  <h3>
                    <mat-icon>person</mat-icon> 
                    
                    {{ fichePatient?.prenom || 'Patient' }} {{ fichePatient?.nom || '' }}
                  </h3>
                  <div *ngIf="fichePatient?.updatedAt" class="fiche-date">
                    Mise à jour: {{ formatFicheDate(fichePatient?.updatedAt) }}
                  </div>
                </div>
                
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
                        <span class="fiche-label">Date de naissance:</span>
                        <span class="fiche-value">{{ displayBirthdate() }}</span>
                      </div>
                      <div class="info-item">
                        <span class="fiche-label">Genre:</span>
                        <span class="fiche-value">{{ fichePatient?.sexe === 'M' ? 'Homme' : fichePatient?.sexe === 'F' ? 'Femme' : '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="fiche-label">Profession:</span>
                        <span class="fiche-value">{{ fichePatient?.profession || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="fiche-label">Téléphone:</span>
                        <span class="fiche-value">{{ fichePatient?.telephone || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="fiche-label">Adresse:</span>
                        <span class="fiche-value">{{ fichePatient?.adresse || '-' }}</span>
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
                    
                    <div class="medical-info-grid">
                      <div class="medical-info-item">
                        <div class="medical-info-header">
                          <mat-icon>monitor_heart</mat-icon>
                          <span>État Général</span>
                        </div>
                        <div class="medical-info-content">
                          {{ fichePatient?.etatGeneral || 'Non renseigné' }}
                        </div>
                      </div>
                      
                      <div class="medical-info-item">
                        <div class="medical-info-header">
                          <mat-icon>medical_services</mat-icon>
                          <span>Antécédents Chirurgicaux</span>
                        </div>
                        <div class="medical-info-content">
                          {{ fichePatient?.antecedentsChirurgicaux || 'Aucun antécédent chirurgical' }}
                        </div>
                      </div>
                      
                      <div class="medical-info-item">
                        <div class="medical-info-header">
                          <mat-icon>medication</mat-icon>
                          <span>Prise de Médicaments</span>
                        </div>
                        <div class="medical-info-content">
                          {{ fichePatient?.priseMedicaments || 'Aucune prise de médicaments' }}
                        </div>
                      </div>
                      
                      <div class="medical-info-item">
                        <div class="medical-info-header">
                          <mat-icon>warning</mat-icon>
                          <span>Allergies</span>
                        </div>
                        <div class="medical-info-content">
                          {{ fichePatient?.allergies || 'Aucune allergie connue' }}
                        </div>
                      </div>
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
                      {{ fichePatient?.observationsDentaires || 'Aucune observation dentaire enregistrée' }}
                    </div>
                  </mat-expansion-panel>
                  
                  <mat-expansion-panel *ngIf="fichePatient?.documentPath || (fichePatient?.documents && fichePatient.documents!.length > 0)">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>description</mat-icon>
                        Documents Médicaux
                        <mat-badge *ngIf="fichePatient?.documents && fichePatient.documents!.length" 
                                  [matBadge]="fichePatient.documents!.length"
                                  matBadgeColor="accent"
                                  matBadgeSize="small"
                                  matBadgeOverlap="false"
                                  class="document-badge">
                        </mat-badge>
                      </mat-panel-title>
                    </mat-expansion-panel-header>
                    
                    <!-- Main document -->
                    <div *ngIf="fichePatient?.documentPath" class="document-item">
                      <mat-icon>insert_drive_file</mat-icon>
                      <span class="document-name">{{ fichePatient?.documentName || 'Document' }}</span>
                      <span class="document-date">{{ formatFicheDate(fichePatient?.documentUploadDate || undefined) }}</span>
                      <button 
                        mat-icon-button
                        color="primary"
                        matTooltip="Télécharger le document"
                        (click)="downloadDocument(fichePatient?.documentPath || '')"
                      >
                        <mat-icon>cloud_download</mat-icon>
                      </button>
                    </div>
                    
                    <!-- Additional documents -->
                    <div *ngIf="fichePatient?.documents && fichePatient.documents!.length > 0" class="additional-documents">
                      <div *ngFor="let doc of fichePatient.documents" class="document-item">
                        <mat-icon>{{ getFileIcon(doc.fileType) }}</mat-icon>
                        <span class="document-name">{{ doc.name }}</span>
                        <span class="document-date">{{ formatFicheDate(doc.uploadDate) }}</span>
                        <button 
                          mat-icon-button
                          color="primary"
                          matTooltip="Télécharger le document"
                          (click)="downloadDocument(doc.filePath)"
                        >
                          <mat-icon>cloud_download</mat-icon>
                        </button>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </mat-dialog-content>
      

  `,
  styles: [`
    .appointment-detail-dialog {
      padding: 0;
      max-width: 900px;
      width: 100%;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 0;
    }
    
    mat-dialog-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 24px 32px;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .appointment-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background-color: #f8f9ff;
      box-shadow: 0 4px 12px rgba(78, 94, 235, 0.1);
      transition: all 0.3s ease;
    }
    
    .appointment-icon:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(78, 94, 235, 0.15);
    }
    
    .appointment-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #4e5eeb;
    }
    
    .pending-icon {
      color: #ff9800 !important;
    }
    
    .accepted-icon {
      color: #4e5eeb !important;
    }
    
    .completed-icon {
      color: #00c853 !important;
    }
    
    .canceled-icon {
      color: #ff5252 !important;
    }
    
    .title-content {
      display: flex;
      flex-direction: column;
    }
    
    .dialog-title {
      font-size: 24px;
      font-weight: 600;
      color: #1a237e;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .appointment-status {
      font-size: 15px;
      color: #666;
      margin-top: 6px;
      font-weight: 500;
    }
    
    .close-button {
      color: #666;
      transition: all 0.2s ease;
    }
    
    .close-button:hover {
      color: #1a237e;
      transform: rotate(90deg);
    }
    
    mat-dialog-content {
      max-height: 75vh;
      padding: 0;
      margin: 0;
      overflow-x: hidden;
    }
    
    .patient-info,
    .appointment-info,
    form[formGroup="statusForm"] {
      padding: 24px 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      background-color: #f8f9ff;
      border-radius: 12px;
      transition: all 0.3s ease;
      border: 1px solid rgba(78, 94, 235, 0.1);
    }
    
    .info-item:hover {
      background-color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(78, 94, 235, 0.08);
      border-color: rgba(78, 94, 235, 0.2);
    }
    
    .fiche-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .fiche-value {
      font-size: 16px;
      color: #1a237e;
      font-weight: 500;
    }
    
    h3 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1a237e;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(78, 94, 235, 0.1);
    }
    
    h3 mat-icon {
      color: #4e5eeb;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 16px;
      align-items: flex-start;
    }
    
    .label {
      width: 140px;
      font-weight: 500;
      color: #666;
      font-size: 15px;
    }
    
    .value {
      flex: 1;
      font-size: 15px;
      color: #1a237e;
    }
    
    .value.notes {
      white-space: pre-line;
      line-height: 1.6;
    }
    
    .urgent-case {
      color: #ff5252;
      font-weight: 600;
    }
    
    .control-case {
      color: #4e5eeb;
      font-weight: 600;
    }
    
    .normal-case {
      color: #00c853;
      font-weight: 600;
    }
    
    .loading-spinner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px 20px;
      gap: 20px;
    }
    
    .loading-spinner p {
      color: #666;
      font-size: 16px;
    }
    
    .form-content {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .status-field {
      flex: 1;
    }
    
    .error-container,
    .empty-fiche-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 32px;
      text-align: center;
    }
    
    .error-container mat-icon,
    .empty-fiche-container mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      margin-bottom: 20px;
      color: #4e5eeb;
    }
    
    .button-group {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }
    
    .fiche-container {
      padding: 24px 32px;
    }
    
    .fiche-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid rgba(78, 94, 235, 0.1);
    }
    
    .fiche-date {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    
    .fiche-accordion {
      margin-top: 20px;
    }
    
    ::ng-deep .fiche-accordion .mat-expansion-panel {
      margin-bottom: 20px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
      border: 1px solid rgba(78, 94, 235, 0.1);
    }
    
    ::ng-deep .fiche-accordion .mat-expansion-panel-header {
      padding: 20px 24px;
      height: auto !important;
    }
    
    ::ng-deep .fiche-accordion .mat-expansion-panel-body {
      padding: 20px 24px 24px;
    }
    
    ::ng-deep .fiche-accordion .mat-expansion-panel-header-title {
      color: #1a237e;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    ::ng-deep .fiche-accordion .mat-expansion-panel-header-title mat-icon {
      color: #4e5eeb;
    }
    
    .medical-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      
      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }
    
    .medical-info-item {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(78, 94, 235, 0.1);
    }
    
    .medical-info-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(78, 94, 235, 0.12);
      border-color: rgba(78, 94, 235, 0.2);
    }
    
    .medical-info-header {
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #4e5eeb 0%, #3f51b5 100%);
      color: white;
      padding: 16px 20px;
      font-weight: 500;
    }
    
    .medical-info-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .medical-info-content {
      padding: 20px;
      min-height: 100px;
      line-height: 1.6;
      color: #1a237e;
    }
    
    .mat-tab-group {
      height: 100%;
    }
    
    ::ng-deep .mat-tab-body-wrapper {
      flex: 1;
    }
    
    ::ng-deep .mat-tab-label {
      height: 56px !important;
      padding: 0 32px !important;
      font-weight: 500;
      font-size: 15px;
    }
    
    ::ng-deep .mat-tab-label-active {
      color: #4e5eeb;
      opacity: 1 !important;
    }
    
    ::ng-deep .mat-ink-bar {
      background-color: #4e5eeb !important;
      height: 3px !important;
    }
    
    .document-item {
      display: flex;
      align-items: center;
      background-color: #f8f9ff;
      padding: 16px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(78, 94, 235, 0.1);
    }
    
    .document-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(78, 94, 235, 0.12);
      border-color: rgba(78, 94, 235, 0.2);
    }
    
    .document-name {
      flex: 1;
      margin-left: 16px;
      font-size: 15px;
      color: #1a237e;
      font-weight: 500;
    }
    
    .document-date {
      font-size: 13px;
      color: #666;
      margin: 0 20px;
    }
    
    .additional-documents {
      margin-top: 20px;
      border-top: 2px dashed rgba(78, 94, 235, 0.2);
      padding-top: 20px;
    }
    
    .document-badge {
      margin-left: 8px;
    }
    
    .fiche-tab-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .edit-fiche-button {
      margin-left: 8px;
      width: 32px;
      height: 32px;
      line-height: 32px;
      background-color: rgba(78, 94, 235, 0.1);
      transition: all 0.3s ease;
    }
    
    .edit-fiche-button:hover {
      background-color: rgba(78, 94, 235, 0.2);
      transform: scale(1.1);
    }
    
    .edit-fiche-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4e5eeb;
    }

    /* Custom scrollbar */
    ::ng-deep ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::ng-deep ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    ::ng-deep ::-webkit-scrollbar-thumb {
      background: #4e5eeb;
      border-radius: 4px;
    }

    ::ng-deep ::-webkit-scrollbar-thumb:hover {
      background: #3f51b5;
    }

    .upcoming-appointments-table {
      padding: 24px 32px;
    }
    .upcoming-appointments-table table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(78, 94, 235, 0.06);
      overflow: hidden;
    }
    .upcoming-appointments-table th, .upcoming-appointments-table td {
      padding: 12px 16px;
      text-align: left;
      font-size: 15px;
      color: #1a237e;
      border-bottom: 1px solid #f0f0f5;
      vertical-align: middle;
    }
    .upcoming-appointments-table th {
      background: #f8f9ff;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4e5eeb;
      border-bottom: 2px solid #e0e4f0;
    }
    .upcoming-appointments-table tr:last-child td {
      border-bottom: none;
    }
    .upcoming-appointments-table .table-icon {
      font-size: 18px;
      vertical-align: middle;
      margin-right: 6px;
      color: #4e5eeb;
    }
    .upcoming-appointments-table .pending-icon {
      color: #ff9800 !important;
    }
    .upcoming-appointments-table .accepted-icon {
      color: #4e5eeb !important;
    }
    .upcoming-appointments-table .completed-icon {
      color: #00c853 !important;
    }
    .upcoming-appointments-table .canceled-icon {
      color: #ff5252 !important;
    }
    @media (max-width: 600px) {
      .upcoming-appointments-table table, .upcoming-appointments-table th, .upcoming-appointments-table td {
        font-size: 13px;
        padding: 8px 6px;
      }
    }
  `]
})
export class AppointmentDetailDialogFichePComponent implements OnInit {
  statusForm: FormGroup;
  isLoading = false;
  updating = false;
  
  // Fiche patient
  fichePatient: FichePatient | null = null;
  loadingFiche = false;
  ficheError = false;
  
  // Upcoming appointments for this patient
  upcomingAppointments: Appointment[] = [];
  loadingUpcoming = false;
  
  availableStatuses = [
    { value: AppointmentStatus.ACCEPTED, label: 'Accepté' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELED, label: 'Annulé' }
  ];
  
  constructor(
    public dialogRef: MatDialogRef<AppointmentDetailDialogFichePComponent>,
    @Inject(MAT_DIALOG_DATA) public appointment: Appointment,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private patientService: PatientService,
    private authService: AuthService
  ) {
    console.log('Appointment data received:', appointment);
    console.log('Patient data:', appointment.patient);
    this.statusForm = this.fb.group({
      status: [this.appointment.status, Validators.required]
    });
  }
  
  ngOnInit(): void {
    if (this.appointment.patient && this.appointment.patient.id) {
      this.loadFichePatient();
      this.loadUpcomingAppointments();
    }
  }
  
  loadFichePatient(): void {
    // Make sure the appointment and patient data exist
    if (!this.appointment || !this.appointment.patient || !this.appointment.patient.id) {
      console.error('Patient data is missing:', this.appointment);
      this.ficheError = true;
      this.snackBar.open('Données du patient manquantes ou incomplètes', 'Fermer', { duration: 5000 });
      return;
    }
    
    const patientId = this.appointment.patient.id;
    console.log('Loading fiche for patient ID:', patientId);
    
    this.loadingFiche = true;
    this.ficheError = false;
    
    this.patientService.getPatientFiche(patientId).pipe(
      catchError(error => {
        console.error('Error loading patient fiche:', error);
        this.ficheError = true;
        this.loadingFiche = false;
        
        if (error.status === 404) {
          this.snackBar.open('Aucune fiche trouvée pour ce patient', 'Fermer', { duration: 5000 });
        } else {
          this.snackBar.open('Erreur lors du chargement de la fiche patient', 'Fermer', { duration: 5000 });
        }
        
        return of(null);
      })
    ).subscribe((fiche: FichePatient | null) => {
      this.loadingFiche = false;
      if (fiche) {
        this.fichePatient = fiche;
        console.log('Fiche patient loaded:', this.fichePatient);
      }
    });
  }
  
  openCreateFicheForm(): void {
    if (!this.appointment.patient) {
      this.snackBar.open('Données du patient manquantes', 'Fermer', { duration: 3000 });
      return;
    }
    
    const dialogRef = this.dialog.open(CreateFicheDialogComponent, {
      width: '700px',
      data: {
        patientId: this.appointment.patient.id,
        nom: this.appointment.patient.nom || '',
        prenom: this.appointment.patient.prenom || ''
      },
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Result contains the created fiche
        this.fichePatient = result;
        this.snackBar.open('Fiche patient créée avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }
  
  downloadDocument(documentPath: string | null | undefined): void {
    if (!documentPath || documentPath.trim() === '') {
      this.snackBar.open('Impossible de télécharger ce document', 'Fermer', { duration: 3000 });
      return;
    }
    
    const baseUrl = `${environment.apiUrl}/api/v1/api/documents`;
    const downloadUrl = `${baseUrl}/${documentPath}`;
    
    console.log('Downloading document from URL:', downloadUrl);
    
    window.open(downloadUrl, '_blank');
  }
  
  getFileIcon(fileType: string | undefined): string {
    if (!fileType) return 'insert_drive_file';
    
    if (fileType.includes('pdf')) {
      return 'picture_as_pdf';
    } else if (fileType.includes('image')) {
      return 'image';
    } else if (fileType.includes('video')) {
      return 'videocam';
    } else if (fileType.includes('audio')) {
      return 'audiotrack';
    } else if (fileType.includes('text')) {
      return 'description';
    } else if (fileType.includes('msword') || fileType.includes('wordprocessingml')) {
      return 'article';
    } else if (fileType.includes('spreadsheetml') || fileType.includes('excel')) {
      return 'table_chart';
    } else if (fileType.includes('presentationml') || fileType.includes('powerpoint')) {
      return 'slideshow';
    }
    
    return 'insert_drive_file';
  }
  
  formatFicheDate(date: string | Date | undefined | null): string {
    if (!date) return '-';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.ACCEPTED:
        return 'Accepté';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELED:
        return 'Annulé';
      case AppointmentStatus.REJECTED:
        return 'Rejeté';
      default:
        return status;
    }
  }
  
  getAppointmentTypeLabel(type: string): string {
    switch (type) {
      case AppointmentType.DETARTRAGE:
        return 'Détartrage';
      case AppointmentType.EXTRACTION:
        return 'Extraction';
      case AppointmentType.SOIN:
        return 'Soin';
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
  
  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  
  canUpdateStatus(): boolean {
    return this.appointment.status === AppointmentStatus.PENDING || 
           this.appointment.status === AppointmentStatus.ACCEPTED;
  }
  
  canCancel(): boolean {
    return this.appointment.status === AppointmentStatus.PENDING || 
           this.appointment.status === AppointmentStatus.ACCEPTED;
  }
  
  canEditFiche(): boolean {
    // Only doctors and secretaries can edit the fiche
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token found in localStorage');
      return false;
    }
    
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded token:', decodedToken);
      const roles = decodedToken.authorities || [];
      console.log('User roles:', roles);
      const hasRole = roles.includes('DOCTOR') || roles.includes('SECRETAIRE');
      console.log('Can edit fiche:', hasRole);
      return hasRole;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }
  
  openEditFicheDialog(): void {
    if (!this.canEditFiche()) {
      this.snackBar.open('Vous n\'avez pas les droits pour modifier cette fiche', 'Fermer', { duration: 3000 });
      return;
    }
    
    if (!this.fichePatient) {
      this.snackBar.open('Aucune fiche patient à modifier', 'Fermer', { duration: 3000 });
      return;
    }
    
    // Create a dialog for editing the fiche
    const dialogRef = this.dialog.open(EditFicheDialogComponent, {
      width: '700px',
      data: {
        appointment: this.appointment,
        fichePatient: this.fichePatient
      },
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the fiche patient data
        this.loadFichePatient();
        this.snackBar.open('Fiche patient mise à jour avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }
  
  updateStatus(): void {
    if (this.statusForm.invalid) return;
    
    this.updating = true;
    const newStatus = this.statusForm.value.status;
    
    this.appointmentService.updateMyAppointmentStatus(this.appointment.id, newStatus).subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.updating = false;
        this.snackBar.open('Statut mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(updatedAppointment);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        this.updating = false;
        this.snackBar.open('Erreur lors de la mise à jour du statut', 'Fermer', { duration: 5000 });
      }
    });
  }
  
  cancelAppointment(): void {
    this.updating = true;
    
    this.appointmentService.updateMyAppointmentStatus(this.appointment.id, AppointmentStatus.CANCELED).subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.updating = false;
        this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(updatedAppointment);
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation du rendez-vous:', error);
        this.updating = false;
        this.snackBar.open('Erreur lors de l\'annulation du rendez-vous', 'Fermer', { duration: 5000 });
      }
    });
  }
  
  // Add method to calculate birthdate from age
  calculateBirthdate(age: number | undefined): Date | null {
    if (!age) return null;
    
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return new Date(birthYear, 0, 1); // January 1st of the birth year
  }
  
  // Display the birthdate, either from dateNaissance or calculated from age
  displayBirthdate(): string {
    console.log('Fiche patient in displayBirthdate:', this.fichePatient);
    
    // Check for date_naissance first (coming directly from backend)
    if (this.fichePatient?.date_naissance) {
      console.log('Using date_naissance:', this.fichePatient.date_naissance);
      return this.formatFicheDate(this.fichePatient.date_naissance);
    } 
    // Then check for dateNaissance (might be set from frontend)
    else if (this.fichePatient?.dateNaissance) {
      console.log('Using dateNaissance:', this.fichePatient.dateNaissance);
      return this.formatFicheDate(this.fichePatient.dateNaissance);
    } 
    // Finally, fall back to age-based calculation
    else if (this.fichePatient?.age) {
      console.log('Calculating from age:', this.fichePatient.age);
      const calculatedDate = this.calculateBirthdate(this.fichePatient.age);
      if (calculatedDate) {
        return this.formatFicheDate(calculatedDate) + ' (estimé)';
      }
    } else {
      console.log('No date information available');
    }
    return '-';
  }
  
  loadUpcomingAppointments(): void {
    if (!this.appointment.patient || !this.appointment.patient.id) return;
    this.loadingUpcoming = true;
    this.appointmentService.getMyDoctorAppointments().pipe(
      catchError(error => {
        this.loadingUpcoming = false;
        return of([]);
      })
    ).subscribe((apts: Appointment[]) => {
      const now = new Date();
      this.upcomingAppointments = apts.filter(a =>
        a.patient && a.patient.id === this.appointment.patient.id &&
        (a.status === 'PENDING' || a.status === 'ACCEPTED') &&
        new Date(a.appointmentDateTime) > now
      ).sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
      this.loadingUpcoming = false;
    });
  }
} 