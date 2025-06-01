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
import { trigger, transition, style, animate } from '@angular/animations';
import { DentalChartComponent } from './dental-chart.component';
import { MedicalCheckupStepperComponent } from './medical-checkup-stepper.component';
import { BilanMedicalService } from '../../core/services/bilan-medical.service';

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  host: {
    '[class.expanded]': 'activeTab !== "main" && activeTab !== "medical-checkup"',
    '[class.show-medical-stepper]': 'showMedicalStepper'
  },
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
    MatTooltipModule,
    DentalChartComponent,
    MedicalCheckupStepperComponent
  ],
  providers: [PatientService],
  template: `
    <div class="appointment-flex-container">
      <div class="medical-stepper-panel" *ngIf="showMedicalStepper">
        <app-medical-checkup-stepper [open]="showMedicalStepper" [fichePatient]="fichePatient" (cancel)="showMedicalStepper = false"></app-medical-checkup-stepper>
      </div>
      <div *ngIf="activeTab === 'history'" class="history-side-panel">
        <h2 style="margin: 24px 0 16px 24px; font-size: 20px; color: #2e3d54;">Historique des actions</h2>
        <div class="timeline-container-modern">
          <div *ngFor="let event of timeline" class="timeline-event-modern">
            <div class="timeline-date-modern">
              <div class="date-abbr">{{ event.date | date:'MMM' | uppercase }}</div>
              <div class="date-day">{{ event.date | date:'dd' }}</div>
            </div>
            <div class="timeline-line-modern"></div>
            <div class="timeline-card-modern">
              <div class="timeline-card-header">
                <div class="timeline-title-modern">{{ event.label }}</div>
                <span class="timeline-status-tag" [ngClass]="{'done': event.done, 'not-done': !event.done}">
                  <mat-icon *ngIf="event.done" class="status-icon">check_circle</mat-icon>
                  <mat-icon *ngIf="!event.done" class="status-icon">radio_button_unchecked</mat-icon>
                  {{ event.done ? 'Fait' : 'Non fait' }}
                </span>
              </div>
              <div class="timeline-card-date">{{ event.date | date:'dd/MM/yyyy HH:mm' }}</div>
              <ng-container *ngIf="event.details">
                <div class="timeline-details-row">
                  <div><b>Condition:</b> {{ event.details.condition }}</div>
                  <div><b>Traitement:</b> {{ event.details.treatment }}</div>
                  <div><b>Note:</b> {{ event.details.note }}</div>
                </div>
              </ng-container>
            </div>
          </div>
          <div *ngIf="timeline.length === 0" style="color:#888;margin:24px;">Aucune action enregistrée pour cette consultation.</div>
        </div>
      </div>
      <div class="main-dialog-panel">
        <div class="side-panel-container">
          <!-- Sidebar Icons -->
          <div class="sidebar-icons">
            <button mat-icon-button class="sidebar-icon" (click)="activeTab = activeTab === 'history' ? 'main' : 'history'" [class.active]="activeTab === 'history'">
              <mat-icon>history</mat-icon>
            </button>
            <button mat-icon-button class="sidebar-icon" (click)="activeTab = 'main'" [class.active]="activeTab === 'main'">
              <mat-icon>person_outline</mat-icon>
            </button>
            <button mat-icon-button class="sidebar-icon" (click)="openPatientFiche()" [class.active]="activeTab === 'fiche'">
              <mat-icon>medical_services</mat-icon>
            </button>
            <button mat-icon-button class="sidebar-icon" (click)="openDocuments()" [class.active]="activeTab === 'documents'">
              <mat-icon>folder_outline</mat-icon>
            </button>
          </div>
          <div class="content-container">
            <div class="main-panel" [class.hidden-panel]="activeTab !== 'main'">
              <div class="panel-header" [class.header-female]="fichePatient?.sexe === 'F'" [class.header-male]="fichePatient?.sexe === 'M'">
                <div class="header-content">
                  <div class="reservation-info">
                    <div class="id-section">
                      <span class="reservation-id">Reservation ID #{{ appointment.id }}</span>
                      <span class="appointment-type">RENDEZ-VOUS MANUEL</span>
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

              <div class="panel-content">
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

                  <!-- Payment Section -->
                  <div class="payment-section">
                    <div class="payment-row">
                      <div class="payment-info">
                        <span class="payment-label">Payment</span>
                        <span class="bill-number">Bill #{{ getBillNumber() || 'N/A' }}</span>
                        <span *ngIf="remainingToPay !== null && remainingToPay <= 0" class="payment-status paid-status" style="background:#e6f9ed;color:#22c55e;padding:4px 12px;border-radius:8px;font-weight:600;">PAID</span>
                        <span *ngIf="remainingToPay === null || remainingToPay > 0" class="payment-status unpaid-status" style="background:#fde8e8;color:#ef4444;padding:4px 12px;border-radius:8px;font-weight:600;">UNPAID</span>
                        <span *ngIf="remainingToPay !== null && remainingToPay > 0" class="reste-a-payer" style="margin-left:12px;color:#d32f2f;font-weight:600;">Reste à payer: {{ remainingToPay | number:'1.2-2' }} DT</span>
                      </div>
                      <button mat-button class="reminder-button" (click)="sendReminder()">
                        <mat-icon>notifications_none</mat-icon>
                        Send Reminder
                      </button>
                    </div>
                  </div>

                  <div class="separator"></div>

                  <!-- Patient Information -->
                  <div class="section-title">Information du Patient</div>
                  
                  <div class="patient-info-grid">
                    <div class="info-field">
                      <mat-icon class="info-icon">call</mat-icon>
                      <div class="field-content">
                        <div class="field-label">TÉLÉPHONE</div>
                        <div class="field-value">{{ fichePatient?.telephone || '-' }}</div>
                      </div>
                    </div>
                      
                    <div class="info-field">
                      <mat-icon class="info-icon">mail_outline</mat-icon>
                      <div class="field-content">
                        <div class="field-label">EMAIL</div>
                        <div class="field-value">{{ appointment.patient?.email || '-' }}</div>
                      </div>
                    </div>
                      
                    <div class="info-field">
                      <mat-icon class="info-icon">event</mat-icon>
                      <div class="field-content">
                        <div class="field-label">DATE DE NAISSANCE</div>
                        <div class="field-value">{{ formatSimpleDate(fichePatient?.dateNaissance) }}</div>
                      </div>
                    </div>
                        
                    <div class="info-field">
                      <mat-icon class="info-icon">person_outline</mat-icon>
                      <div class="field-content">
                        <div class="field-label">SEXE</div>
                        <div class="field-value">{{ fichePatient?.sexe === 'M' ? 'Homme' : fichePatient?.sexe === 'F' ? 'Femme' : '-' }}</div>
                      </div>
                    </div>

                    <div class="info-field full-width">
                      <mat-icon class="info-icon">home_outline</mat-icon>
                      <div class="field-content">
                        <div class="field-label">ADRESSE</div>
                        <div class="field-value">{{ fichePatient?.adresse || '-' }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Medical Buttons -->
                  <div class="medical-buttons-simple">
                    <button class="edit-checkup-btn-simple" (click)="editMedicalCheckup()">
                      <span class="custom-medical-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="14" height="12" rx="2" stroke="white" stroke-width="2"/>
                          <path d="M7 10.5C8.5 12 10.5 12 12 10.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                          <rect x="15.5" y="15.5" width="5" height="3" rx="0.5" transform="rotate(-45 15.5 15.5)" fill="white"/>
                          <rect x="17" y="17" width="2" height="1" rx="0.5" transform="rotate(-45 17 17)" fill="#059669" stroke="white" stroke-width="1"/>
                        </svg>
                      </span>
                      <span class="btn-text-simple">Modifier Bilan Médical</span>
                    </button>
                    <button class="add-record-btn-simple" (click)="addMedicalRecord()">
                      <mat-icon>description</mat-icon>
                      <span class="btn-text-simple">Ajouter Dossier Médical</span>
                    </button>
                  </div>

                  <button mat-flat-button class="finish-btn-exact" [disabled]="!canFinish()" (click)="finishTreatment()">
                    Terminer
                  </button>
                  <div class="finish-note-exact" *ngIf="!canFinish()">
                    <mat-icon>info</mat-icon>
                    <span>Veuillez ajouter un bilan médical & un dossier médical pour terminer le traitement</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="additional-panel" *ngIf="activeTab !== 'main' && activeTab !== 'history'" [@slideInOut]>
              <ng-container *ngIf="activeTab === 'fiche'">
                <!-- Content for Fiche tab (likely the MedicalCheckupStepperComponent summary) -->
                <app-medical-checkup-stepper
                  [open]="activeTab === 'fiche'"
                  [fichePatient]="fichePatient">
                </app-medical-checkup-stepper>
              </ng-container>
              <ng-container *ngIf="activeTab === 'dental'">
                <!-- Content for Dental Chart tab -->
                <app-dental-chart [patientId]="appointment.patient?.id" (problemSaved)="handleToothProblemSaved($event)"></app-dental-chart>
              </ng-container>
              <ng-container *ngIf="activeTab === 'documents'">
                <!-- Content for Documents tab -->
                <div class="documents-panel">
                  <h2>Documents</h2>
                  <!-- Add document list and upload functionality here -->
                  <p>Document list and upload form goes here.</p>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 16px;
      right: 16px;
      bottom: 16px;
      width: 650px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;

      &.expanded {
        width: 1000px;
      }
    }

    .side-panel-container {
      display: flex;
      height: 100%;
    }

    .content-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      flex-direction: row;
    }

    .main-panel {
      width: 100%;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      border-right: none;
    }

    .additional-panel {
      display: none;
    }

    .additional-content {
      height: 100%;
      overflow-y: auto;

      h2 {
        font-size: 20px;
        color: #2e3d54;
        margin-bottom: 24px;
        font-weight: 500;
      }
    }

    .panel-header {
      padding: 40px 20px 16px 20px;
      background: white;
      border-bottom: 1px solid #eee;
    }

    .header-female {
      background-color: #FFF0F5;
    }

    .header-male {
      background-color: #F0F8FF;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .reservation-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .id-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .reservation-id {
      color: #666;
      font-size: 14px;
      font-weight: 400;
    }

    .appointment-type {
      color: #4e5eeb;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      background: rgba(78, 94, 235, 0.1);
      border-radius: 4px;
    }

    .patient-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
    }

    .patient-brief {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .patient-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      color: white;
      font-size: 18px;
    }

    .avatar-female {
      background: #FF69B4;
    }

    .avatar-male {
      background: #4169E1;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .patient-label {
      font-size: 12px;
      color: #666;
      font-weight: 400;
    }

    .patient-name {
      font-size: 18px;
      color: #2e3d54;
      font-weight: 500;
    }

    .panel-content {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      background: white;
    }
    
    .content-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-section {
      padding: 0;
    }

    .info-row {
      display: flex;
      gap: 32px;
    }

    .info-field {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
    }

    .info-icon {
      color: #4e5eeb;
      opacity: 0.8;
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .field-content {
      flex: 1;
    }

    .field-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      margin-bottom: 2px;
      text-transform: uppercase;
    }

    .field-value {
      font-size: 14px;
      color: #2e3d54;
      font-weight: 500;
    }

    .section-title {
      font-size: 16px;
      color: #2e3d54;
      font-weight: 500;
      margin: 0 0 16px;
    }

    .patient-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .case-type {
      display: inline-block;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 16px;
      margin-left: 8px;
      background: #e8eaff;
      color: #4e5eeb;
    }

    .close-button {
      color: #666;
      position: absolute;
      top: 16px;
      right: 16px;
    }

    .status-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-label {
      color: #666;
      font-size: 14px;
      font-weight: 400;
    }

    .status-button-wrapper {
      background: white;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      display: inline-block;
    }

    .status-form {
      margin: 0;
    }

    .status-select {
      width: 140px;
    }

    ::ng-deep .status-select {
      .mat-form-field-wrapper {
        margin: 0;
        padding: 0;
      }

      .mat-form-field-flex {
        background: white !important;
        padding: 4px 8px !important;
        margin: 0 !important;
        border-radius: 8px;
      }

      .mat-form-field-outline {
        display: none;
      }

      .mat-form-field-infix {
        padding: 0 !important;
        border-top: 0;
        width: auto !important;
      }

      .mat-form-field-underline {
        display: none;
      }

      .mat-select-value-text {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot-pending {
      background: #FFA726;
    }

    .dot-accepted {
      background: #66BB6A;
    }

    .dot-completed {
      background: #42A5F5;
    }

    .dot-canceled {
      background: #EF5350;
    }

    .dropdown-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #666;
      margin-left: 4px;
    }

    ::ng-deep .status-panel {
      margin-top: 4px !important;
      border-radius: 8px !important;
      
      .mat-option {
        font-size: 14px;
        min-height: 36px;
        padding: 8px 12px;
      }
    }

    .payment-section {
      padding: 0;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .payment-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .payment-label {
      color: #666;
      font-size: 14px;
    }

    .bill-number {
      color: #2e3d54;
      font-weight: 500;
    }

    .payment-status {
      color: #ef5350;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      background: rgba(239, 83, 80, 0.1);
      border-radius: 4px;
    }

    .reminder-button {
      color: #4e5eeb;
      background: rgba(78, 94, 235, 0.1);
      border-radius: 8px;
      padding: 0 16px;
      height: 36px;
      font-weight: 500;

      mat-icon {
        margin-right: 8px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: rgba(78, 94, 235, 0.2);
      }
    }

    .sidebar-icons {
      display: flex;
      flex-direction: column;
      padding: 16px 12px;
      background: #f8f9fa;
      border-right: 1px solid #eee;
      gap: 16px;
    }

    .sidebar-icon {
      color: #666;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &:hover {
        background: rgba(78, 94, 235, 0.1);
        color: #4e5eeb;
      }

      &.active {
        background: #4e5eeb;
        color: white;
      }
    }

    .separator {
      height: 1px;
      background-color: #E0E0E0;
      margin: 16px 0;
    }

    .fiche-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .fiche-section {
      h3 {
        font-size: 16px;
        color: #2e3d54;
        margin-bottom: 16px;
        font-weight: 500;
      }
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

      &.full-width {
        grid-column: 1 / -1;
      }
    }

    .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: #2e3d54;
      font-weight: 500;
    }

    .medical-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .medical-item {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
    }

    .medical-label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
      display: block;
      margin-bottom: 8px;
    }

    .medical-value {
      font-size: 14px;
      color: #2e3d54;
      margin: 0;
      line-height: 1.5;
    }

    .dental-notes {
      font-size: 14px;
      color: #2e3d54;
      line-height: 1.6;
      margin: 0;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .loading-state,
    .error-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #666;
      }

      p {
        font-size: 16px;
        color: #666;
        margin: 0;
      }

      button {
        margin-top: 8px;
      }
    }

    .medical-buttons-simple {
      display: flex;
      gap: 16px;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    .edit-checkup-btn-simple {
      background: #059669;
      color: #fff;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      min-width: 200px;
      height: 44px;
      box-shadow: none;
      display: flex;
      align-items: center;
      border: none;
      padding: 0 20px;
      cursor: pointer;
      gap: 8px;
      transition: background 0.2s;
    }
    .edit-checkup-btn-simple:hover {
      background: #047857;
    }
    .edit-checkup-btn-simple .mat-icon {
      font-size: 20px;
      color: #fff;
      margin-right: 6px;
    }
    .btn-text-simple {
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.1px;
      display: inline-block;
    }
    .add-record-btn-simple {
      background: #fff;
      color: #2563eb;
      border: 2px dashed #2563eb;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      min-width: 200px;
      height: 44px;
      box-shadow: none;
      display: flex;
      align-items: center;
      padding: 0 20px;
      cursor: pointer;
      gap: 8px;
      transition: border-color 0.2s, color 0.2s;
    }
    .add-record-btn-simple:hover {
      border-color: #1d4ed8;
      color: #1d4ed8;
    }
    .add-record-btn-simple .mat-icon {
      font-size: 20px;
      color: #2563eb;
      margin-right: 6px;
    }
    .finish-btn-exact {
      width: 100%;
      margin-top: 8px;
      background: #e5e7eb !important;
      color: #a3a3a3 !important;
      border-radius: 8px;
      font-weight: 500;
      height: 40px;
      box-shadow: none;
    }
    .finish-btn-exact[disabled] {
      background: #e5e7eb !important;
      color: #a3a3a3 !important;
    }
    .finish-note-exact {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 15px;
      margin-top: 8px;
      margin-bottom: 0;
    }
    .finish-note-exact .mat-icon {
      color: #6b7280;
      font-size: 20px;
    }
    .custom-medical-icon {
      display: flex;
      align-items: center;
      margin-right: 6px;
    }
    .custom-medical-icon svg {
      width: 22px;
      height: 22px;
      display: block;
    }
    .appointment-flex-container {
      display: flex;
      flex-direction: row;
      height: 100vh;
    }
    .history-side-panel {
      width: 900px;
      min-width: 340px;
      max-width: 520px;
      background: #fff;
      border-right: 1.5px solid #e0e7ef;
      box-shadow: 2px 0 12px rgba(37,99,235,0.04);
      z-index: 20;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .main-dialog-panel {
      flex: 1;
      min-width: 0;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
    }
    .fiche-info-row {
      margin-bottom: 8px;
      font-size: 15px;
    }

    .main-dialog-panel.hidden-panel {
       width: 650px; /* Fixed width for the main panel */
       flex-shrink: 0; /* Prevent shrinking */
    }

    .medical-stepper-panel {
      flex-shrink: 0;
      width: 0;
      overflow: hidden;
      transition: width 0.4s ease-in-out;
      order: -1; /* This ensures it appears first (leftmost) */
    }

    :host.show-medical-stepper .medical-stepper-panel {
      width: 650px;
    }

    :host.show-medical-stepper {
      width: 1300px;
    }

    .main-dialog-panel {
      flex: 1;
      min-width: 0;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
    }

    .history-side-panel {
      width: 420px;
      min-width: 340px;
      max-width: 520px;
      background: #fff;
      border-right: 1.5px solid #e0e7ef;
      box-shadow: 2px 0 12px rgba(37,99,235,0.04);
      z-index: 20;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .timeline-container-modern {
      margin: 24px;
      padding-left: 0;
      display: flex;
      flex-direction: column;
      gap: 32px;
      position: relative;
    }
    .timeline-event-modern {
      display: flex;
      align-items: flex-start;
      position: relative;
      min-height: 80px;
    }
    .timeline-date-modern {
      width: 56px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      margin-right: 0;
      z-index: 2;
    }
    .date-abbr {
      font-size: 13px;
      font-weight: 700;
      color: #4e5eeb;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .date-day {
      font-size: 22px;
      font-weight: 700;
      color: #222;
      line-height: 1;
    }
    .timeline-line-modern {
      position: absolute;
      left: 28px;
      top: 36px;
      width: 2.5px;
      height: calc(100% - 36px);
      background: #e0e7ef;
      z-index: 1;
    }
    .timeline-card-modern {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(37,99,235,0.07);
      padding: 18px 22px 14px 22px;
      margin-left: 16px;
      min-width: 320px;
      max-width: 420px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .timeline-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .timeline-title-modern {
      font-size: 16px;
      font-weight: 600;
      color: #222;
    }
    .timeline-status-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 8px;
      background: #e6f9ed;
      color: #22c55e;
    }
    .timeline-status-tag.not-done {
      background: #fde8e8;
      color: #ef4444;
    }
    .status-icon {
      font-size: 18px;
      vertical-align: middle;
    }
    .timeline-card-date {
      font-size: 13px;
      color: #888;
      margin-bottom: 2px;
    }
    .timeline-details-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 14px;
      color: #444;
    }
    .timeline-event-modern:last-child {
      margin-bottom: 32px;
    }
  `],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})
export class AppointmentDetailDialogComponent implements OnInit {
  statusForm: FormGroup;
  isLoading = false;
  updating = false;
  
  // Fiche patient
  fichePatient: FichePatient | null = null;
  loadingFiche = false;
  ficheError = false;
  
  availableStatuses = [
    { value: AppointmentStatus.ACCEPTED, label: 'Accepté' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELED, label: 'Annulé' }
  ];
  
  activeTab: 'main' | 'fiche' | 'dental' | 'documents' | 'history' = 'main';
  
  showMedicalStepper = false;
  
  amountToPay: number | null = null;
  amountPaid: number | null = null;
  remainingToPay: number | null = null;
  
  timeline: any[] = [];
  toothData: { [key: number]: any } = {};
  
  constructor(
    public dialogRef: MatDialogRef<AppointmentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public appointment: Appointment,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private patientService: PatientService,
    private bilanMedicalService: BilanMedicalService
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
    }
    this.buildTimeline();
  }
  
  buildTimeline() {
    // Start with the first event
    this.timeline = [
      { label: 'Rendez-vous créé', date: new Date(this.appointment.appointmentDateTime), done: true }
    ];
    // Add tooth-specific events next
    for (const toothNum in this.toothData) {
      const data = this.toothData[toothNum];
      this.timeline.push({
        label: `Dent ${toothNum}`,
        date: data.lastUpdate || this.appointment.appointmentDateTime,
        done: !!data.treatment,
        details: {
          condition: data.condition,
          treatment: data.treatment,
          note: data.note
        }
      });
    }
    // Then add the remaining events
    this.timeline.push(
      { label: 'Traitement effectué', date: new Date(this.appointment.appointmentDateTime), done: this.appointment.status === 'COMPLETED' },
      { label: 'Paiement effectué', date: new Date(this.appointment.appointmentDateTime), done: this.remainingToPay !== null && this.remainingToPay <= 0 },
      { label: 'Paiement restant', date: new Date(this.appointment.appointmentDateTime), done: this.remainingToPay !== null && this.remainingToPay <= 0 }
    );
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
        // Fetch BilanMedical payment fields after fichePatient is loaded
        if (this.fichePatient && this.fichePatient.id) {
          this.bilanMedicalService.getBilanMedicalByFichePatientId(this.fichePatient.id).subscribe({
            next: (bilan) => {
              if (bilan) {
                this.amountToPay = bilan.amountToPay ?? null;
                this.amountPaid = bilan.amountPaid ?? null;
                this.remainingToPay = bilan.remainingToPay ?? null;
                // Parse and store toothData
                if (bilan.toothData) {
                  try {
                    this.toothData = JSON.parse(bilan.toothData);
                  } catch (e) {
                    this.toothData = {};
                  }
                } else {
                  this.toothData = {};
                }
                this.buildTimeline();
              }
            },
            error: (err) => {
              this.amountToPay = null;
              this.amountPaid = null;
              this.remainingToPay = null;
              this.toothData = {};
              this.buildTimeline();
            }
          });
        }
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
        return 'Soin dentaire';
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
    return this.formatDateNumbers(new Date(dateTime));
  }

  formatTime(input: string | Date): string {
    const date = input instanceof Date ? input : new Date(input);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatAppointmentDate(dateTime: string | undefined | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return `${this.formatDateNumbers(date)} ${this.formatTime(date)}`;
  }

  formatDateNumbers(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatSimpleDate(dateInput: string | Date | undefined | null): string {
    if (!dateInput) return '-';
    
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(date.getTime())) return '-';
      return `${date.getDate()} ${this.getMonthName(date.getMonth())} ${date.getFullYear()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  }

  getMonthName(month: number): string {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[month];
  }
  
  canUpdateStatus(): boolean {
    return this.appointment.status === AppointmentStatus.PENDING || 
           this.appointment.status === AppointmentStatus.ACCEPTED;
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

  getInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return '?';
    
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    
    return (firstInitial + lastInitial) || '?';
  }

  hasPaymentInfo(): boolean {
    return !!this.appointment?.payment;
  }

  getBillNumber(): string {
    return this.appointment?.payment?.billNumber || '';
  }

  getPaymentStatus(): string {
    return this.appointment?.payment?.status || 'UNPAID';
  }

  isUnpaid(): boolean {
    return this.appointment?.payment?.status === 'UNPAID';
  }

  sendReminder(): void {
    this.snackBar.open('Payment reminder sent successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  openPatientFiche() {
    this.activeTab = 'fiche';
  }

  openDentalChart() {
    this.activeTab = 'dental';
  }

  openDocuments() {
    this.activeTab = 'documents';
  }

  handleToothProblemSaved(problem: any) {
    console.log('Tooth problem saved:', problem);
    this.snackBar.open('Tooth problem saved successfully', 'Close', {
      duration: 3000
    });
  }

  editMedicalCheckup() {
    this.showMedicalStepper = !this.showMedicalStepper;
  }

  addMedicalRecord() {
    if (!this.appointment.patient?.id) {
      this.snackBar.open('ID du patient manquant', 'Fermer', { duration: 3000 });
      return;
    }

    this.dialog.open(CreateFicheDialogComponent, {
      width: '700px',
      data: {
        patientId: this.appointment.patient.id,
        nom: this.appointment.patient.nom,
        prenom: this.appointment.patient.prenom,
        isEdit: false
      },
      disableClose: true
    }).afterClosed().subscribe(result => {
      if (result) {
        this.fichePatient = result;
        this.snackBar.open('Dossier médical créé avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }

  finishTreatment() {
    if (!this.canFinish()) {
      this.snackBar.open('Veuillez compléter le bilan médical et le dossier médical', 'Fermer', { duration: 3000 });
      return;
    }

    // Update appointment status to completed
    this.statusForm.patchValue({ status: AppointmentStatus.COMPLETED });
    this.updateStatus();
  }

  canFinish(): boolean {
    // Check if both medical checkup and record exist
    return !!this.fichePatient;
  }
} 