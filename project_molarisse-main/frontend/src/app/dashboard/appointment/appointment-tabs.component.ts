import { Component, OnInit, Input, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { BookAppointmentComponent } from './book-appointment.component';
import { environment } from '../../../environments/environment';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-appointment-tabs',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatBadgeModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    DatePipe,
    ReactiveFormsModule,
    HttpClientModule
  ],
  template: `
    <div class="appointments-container">
      <div class="header">
        <h1>Gestion des Rendez-vous</h1>
        <div class="header-actions">
          <p>{{ userRole === 'secretaire' ? 'Consultez et gérez les rendez-vous du médecin' : 'Consultez et gérez tous vos rendez-vous' }}</p>
          <div>
            <span class="debug-info">Role: {{ userRole }} | {{ appointments.length }} appointment(s) | Tab: {{ activeTab }}</span>
            <button mat-icon-button color="primary" (click)="loadAppointments()" title="Rafraîchir les rendez-vous">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <mat-tab-group 
        mat-stretch-tabs="false" 
        mat-align-tabs="start" 
        animationDuration="200ms" 
        class="appointment-tabs" 
        (selectedIndexChange)="onTabChange($event)"
        [selectedIndex]="activeTab === 'upcoming' ? 0 : activeTab === 'canceled' ? 1 : 2"
      >
        <mat-tab>
          <ng-template mat-tab-label>
            <div class="tab-label">
              <mat-icon>upcoming</mat-icon>
              <span>À venir</span>
              <mat-badge *ngIf="upcomingAppointments.length > 0" [matBadge]="upcomingAppointments.length" matBadgeColor="accent"></mat-badge>
            </div>
          </ng-template>
          
          <div class="tab-content">
            <!-- Debug info -->
            <div style="background: #f0f8ff; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
              <h4>Debug Info</h4>
              <p>Total appointments: {{appointments.length}}</p>
              <p>Upcoming appointments: {{upcomingAppointments.length}}</p>
              <p>First appointment status: {{appointments[0]?.status}}</p>
            </div>
            
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <!-- Add basic appointment display when debugging -->
            <div style="padding: 15px; background: #f5f5f5; border-radius: 8px; margin-bottom: 15px;" *ngIf="appointments.length > 0">
              <h3>Appointment Details:</h3>
              <p><strong>Date:</strong> {{appointments[0]?.appointmentDateTime | date:'dd/MM/yyyy à HH:mm'}}</p>
              <p><strong>Status:</strong> {{appointments[0]?.status}}</p>
              <p><strong>Type:</strong> {{appointments[0]?.appointmentType}}</p>
              <p><strong>Doctor:</strong> Dr. {{appointments[0]?.doctor?.nom}} {{appointments[0]?.doctor?.prenom}}</p>
            </div>
            
            <div *ngIf="!loading && upcomingAppointments.length === 0" class="no-data">
              <mat-icon color="primary">calendar_today</mat-icon>
              <p>Vous n'avez pas de rendez-vous à venir</p>
              <button *ngIf="userRole === 'patient'" mat-raised-button color="primary" (click)="bookNewAppointment()">
                Prendre un rendez-vous
              </button>
              <button *ngIf="userRole !== 'patient'" mat-raised-button color="primary" (click)="loadAppointments()">
                Rafraîchir
              </button>
            </div>
            <div class="cards-container" *ngIf="!loading && upcomingAppointments.length > 0">
              <div class="appointment-card" *ngFor="let appointment of upcomingAppointments">
                <div class="appointment-header">
                  <div class="appointment-avatar">
                    <img 
                      [src]="getProfileImage(userRole === 'patient' ? appointment.doctor : appointment.patient)" 
                      [alt]="getPersonName(userRole === 'patient' ? appointment.doctor : appointment.patient)"
                      (error)="handleImageError($event)"
                    >
                  </div>
                  <div class="appointment-info">
                    <h3>Dr. {{ appointment.doctor?.nom }} {{ appointment.doctor?.prenom }}</h3>
                    <div class="appointment-date">
                      <mat-icon>event</mat-icon>
                      <span>{{ appointment.appointmentDateTime | date:'dd/MM/yyyy à HH:mm' }}</span>
                    </div>
                    <div class="appointment-type">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ translateAppointmentType(appointment.appointmentType) }}</span>
                    </div>
                  </div>
                </div>
                
                <mat-divider></mat-divider>
                
                <div class="appointment-details">
                  <div class="detail-item">
                    <mat-icon>mail</mat-icon>
                    <span>{{ userRole === 'patient' ? appointment.doctor?.email : appointment.patient?.email }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>phone</mat-icon>
                    <span>{{ userRole === 'patient' ? appointment.doctor?.phoneNumber : appointment.patient?.phoneNumber }}</span>
                  </div>
                </div>
                
                <div class="appointment-actions">
                  <button mat-button color="primary" (click)="viewAppointmentDetails(appointment)">
                    <mat-icon>info</mat-icon>
                    Détails
                  </button>
                  <button mat-button color="warn" *ngIf="canCancel(appointment)" (click)="cancelAppointment(appointment)">
                    <mat-icon>cancel</mat-icon>
                    Annuler
                  </button>
                  <button mat-button color="accent" *ngIf="canReschedule(appointment)" (click)="rescheduleAppointment(appointment)">
                    <mat-icon>edit_calendar</mat-icon>
                    Reprogrammer
                  </button>
                  <button 
                    mat-button 
                    color="primary" 
                    *ngIf="canManageStatus(appointment)" 
                    [matMenuTriggerFor]="statusMenu"
                  >
                    <mat-icon>more_vert</mat-icon>
                    Gérer
                  </button>
                  <mat-menu #statusMenu="matMenu">
                    <button mat-menu-item *ngIf="appointment.status !== 'ACCEPTED'" (click)="updateStatus(appointment, 'ACCEPTED')">
                      <mat-icon>check_circle</mat-icon>
                      <span>Accepter</span>
                    </button>
                    <button mat-menu-item *ngIf="appointment.status !== 'REJECTED'" (click)="updateStatus(appointment, 'REJECTED')">
                      <mat-icon>cancel</mat-icon>
                      <span>Rejeter</span>
                    </button>
                    <button mat-menu-item *ngIf="appointment.status !== 'COMPLETED'" (click)="updateStatus(appointment, 'COMPLETED')">
                      <mat-icon>task_alt</mat-icon>
                      <span>Marquer comme terminé</span>
                    </button>
                  </mat-menu>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab>
          <ng-template mat-tab-label>
            <div class="tab-label">
              <mat-icon>event_busy</mat-icon>
              <span>Annulés</span>
              <mat-badge *ngIf="canceledAppointments.length > 0" [matBadge]="canceledAppointments.length" matBadgeColor="warn"></mat-badge>
            </div>
          </ng-template>
          
          <div class="tab-content">
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!loading && canceledAppointments.length === 0" class="no-data">
              <mat-icon color="warn">event_busy</mat-icon>
              <p>Vous n'avez pas de rendez-vous annulés</p>
              <button mat-raised-button color="primary" (click)="loadAppointments()">
                Rafraîchir
              </button>
            </div>
            
            <div class="cards-container" *ngIf="!loading && canceledAppointments.length > 0">
              <div class="appointment-card canceled" *ngFor="let appointment of canceledAppointments">
                <div class="appointment-header">
                  <div class="appointment-avatar">
                    <img 
                      [src]="getProfileImage(userRole === 'patient' ? appointment.doctor : appointment.patient)" 
                      [alt]="getPersonName(userRole === 'patient' ? appointment.doctor : appointment.patient)"
                      (error)="handleImageError($event)"
                    >
                  </div>
                  <div class="appointment-info">
                    <h3>{{ userRole === 'patient' ? 'Dr. ' + appointment.doctor?.nom + ' ' + appointment.doctor?.prenom : appointment.patient?.nom + ' ' + appointment.patient?.prenom }}</h3>
                    <div class="appointment-date">
                      <mat-icon>event</mat-icon>
                      <span>{{ appointment.appointmentDateTime | date:'dd/MM/yyyy à HH:mm' }}</span>
                    </div>
                    <div class="appointment-type">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ translateAppointmentType(appointment.appointmentType) }}</span>
                    </div>
                  </div>
                </div>
                
                <mat-divider></mat-divider>
                
                <div class="appointment-details">
                  <div class="detail-item">
                    <mat-icon>mail</mat-icon>
                    <span>{{ userRole === 'patient' ? appointment.doctor?.email : appointment.patient?.email }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>phone</mat-icon>
                    <span>{{ userRole === 'patient' ? appointment.doctor?.phoneNumber : appointment.patient?.phoneNumber }}</span>
                  </div>
                </div>
                
                <div class="appointment-actions">
                  <button mat-button color="primary" (click)="viewAppointmentDetails(appointment)">
                    <mat-icon>info</mat-icon>
                    Détails
                  </button>
                  <button mat-button color="primary" *ngIf="userRole === 'patient'" (click)="bookNewAppointment()">
                    <mat-icon>replay</mat-icon>
                    Reprendre RDV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab>
          <ng-template mat-tab-label>
            <div class="tab-label">
              <mat-icon>task_alt</mat-icon>
              <span>Terminés</span>
              <mat-badge *ngIf="completedAppointments.length > 0" [matBadge]="completedAppointments.length" matBadgeColor="primary"></mat-badge>
            </div>
          </ng-template>
          
          <div class="tab-content">
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div *ngIf="!loading && completedAppointments.length === 0" class="no-data">
              <mat-icon color="primary">history</mat-icon>
              <p>Vous n'avez pas encore de rendez-vous terminés</p>
              <button mat-raised-button color="primary" (click)="loadAppointments()">
                Rafraîchir
              </button>
            </div>
            
            <div class="cards-container" *ngIf="!loading && completedAppointments.length > 0">
              <div class="appointment-card completed" *ngFor="let appointment of completedAppointments">
                <div class="appointment-header">
                  <div class="appointment-avatar">
                    <img 
                      [src]="getProfileImage(userRole === 'patient' ? appointment.doctor : appointment.patient)" 
                      [alt]="getPersonName(userRole === 'patient' ? appointment.doctor : appointment.patient)"
                      (error)="handleImageError($event)"
                    >
                  </div>
                  <div class="appointment-info">
                    <h3>{{ userRole === 'patient' ? 'Dr. ' + appointment.doctor?.nom + ' ' + appointment.doctor?.prenom : appointment.patient?.nom + ' ' + appointment.patient?.prenom }}</h3>
                    <div class="appointment-date">
                      <mat-icon>event</mat-icon>
                      <span>{{ appointment.appointmentDateTime | date:'dd/MM/yyyy à HH:mm' }}</span>
                    </div>
                    <div class="appointment-type">
                      <mat-icon>medical_services</mat-icon>
                      <span>{{ translateAppointmentType(appointment.appointmentType) }}</span>
                    </div>
                  </div>
                </div>
                
                <mat-divider></mat-divider>
                
                <div class="appointment-details">
                  <div class="detail-item">
                    <mat-icon>mail</mat-icon>
                    <span>{{ userRole === 'patient' ? appointment.doctor?.email : appointment.patient?.email }}</span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>phone</mat-icon>
                    <span>{{ userRole === 'patient' ? appointment.doctor?.phoneNumber : appointment.patient?.phoneNumber }}</span>
                  </div>
                </div>
                
                <div class="appointment-actions">
                  <button mat-button color="primary" (click)="viewAppointmentDetails(appointment)">
                    <mat-icon>info</mat-icon>
                    Détails
                  </button>
                  <button mat-button color="primary" *ngIf="userRole === 'patient'" (click)="bookNewAppointment()">
                    <mat-icon>add</mat-icon>
                    Nouveau RDV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .appointments-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      min-height: 500px;
      display: block; /* Force display as block element */
      visibility: visible; /* Ensure visibility */
    }
    
    .debug-info {
      font-size: 12px;
      color: #666;
      margin-right: 10px;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .header {
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: #1976d2;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .header p {
      color: #757575;
      font-size: 16px;
      margin: 0 0 10px 0;
    }
    
    .appointment-tabs {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: visible; /* Change from hidden to visible */
      min-height: 400px; /* Add min-height */
      display: block; /* Add display block */
    }
    
    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tab-content {
      padding: 20px;
      min-height: 400px; /* Increase min height */
      display: block !important; /* Force display */
    }
    
    .no-data {
      text-align: center;
      padding: 40px 20px;
      background: #f9f9f9;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .no-data mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
    
    .no-data p {
      font-size: 16px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
    
    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 20px;
      position: relative; /* Add position relative */
      z-index: 10; /* Add z-index to ensure it's on top */
      background: white; /* Add background */
      padding: 15px; /* Add padding */
      border-radius: 8px; /* Add border radius */
    }
    
    .appointment-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
      border-top: 4px solid #2196f3;  /* Default blue for upcoming */
      position: relative; /* Add position relative */
      z-index: 5; /* Add z-index */
    }
    
    .appointment-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);
    }
    
    .appointment-card.canceled {
      border-top-color: #f44336;  /* Red for canceled */
    }
    
    .appointment-card.completed {
      border-top-color: #4caf50;  /* Green for completed */
    }
    
    .appointment-header {
      display: flex;
      padding: 20px 20px 15px;
      gap: 15px;
    }
    
    .appointment-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      background-color: #e0e0e0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .appointment-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .appointment-info {
      flex: 1;
    }
    
    .appointment-info h3 {
      margin: 0 0 10px;
      font-size: 18px;
      color: #333;
    }
    
    .appointment-date, .appointment-type {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
      color: #616161;
      font-size: 14px;
    }
    
    .appointment-date mat-icon, .appointment-type mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .appointment-details {
      padding: 15px 20px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      color: #616161;
      font-size: 14px;
    }
    
    .detail-item mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: #757575;
    }
    
    .appointment-actions {
      display: flex;
      justify-content: flex-end;
      padding: 10px 15px;
      gap: 8px;
      background-color: #f5f5f5;
    }
    
    .canceled .appointment-info h3, 
    .canceled .appointment-date, 
    .canceled .appointment-type {
      text-decoration: line-through;
      opacity: 0.7;
    }
    
    @media (max-width: 768px) {
      .cards-container {
        grid-template-columns: 1fr;
      }
      
      .appointment-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      
      .appointment-actions {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `]
})
export class AppointmentTabsComponent implements OnInit, OnChanges {
  @Input() userRole: 'patient' | 'doctor' | 'secretaire' = 'doctor';
  @Input() appointments: Appointment[] = [];
  
  loading = true;
  activeTab = 'upcoming';
  
  constructor(
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}
  
  ngOnInit(): void {
    console.log('AppointmentTabsComponent initialized with userRole:', this.userRole);
    if (!this.userRole) {
      console.warn('User role is undefined, defaulting to patient');
      this.userRole = 'patient';
    }
    this.activeTab = 'upcoming';
    
    // Check if we already have appointments from input binding
    if (this.appointments.length > 0) {
      console.log('Already have appointments from parent on init:', this.appointments.length);
      this.loading = false;
    } else {
      // Only load if we don't have appointments from parent
      this.loadAppointments();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userRole']) {
      console.log('User role changed, reloading appointments');
      this.activeTab = 'upcoming';
      this.loadAppointments();
    }
    
    if (changes['appointments'] && changes['appointments'].currentValue) {
      console.log('Appointments input changed, updating with new data', changes['appointments'].currentValue);
      // Only update if we got actual appointments from the parent
      if (changes['appointments'].currentValue.length > 0) {
        this.appointments = changes['appointments'].currentValue;
        this.loading = false;
      }
    }
  }
  
  @HostListener('refresh')
  onRefresh(): void {
    console.log('Refresh event received in appointment tabs component!');
    this.loadAppointments();
  }
  
  loadAppointments(): void {
    // If we already have appointments provided by parent component, don't load again
    if (this.appointments.length > 0 && !this.loading) {
      console.log('Using appointments provided by parent component:', this.appointments);
      return;
    }
    
    this.loading = true;
    this.activeTab = 'upcoming';
    console.log('Loading appointments for role:', this.userRole);
    
    let observable;
    if (this.userRole === 'patient') {
      console.log('Using getPatientAppointments method');
      observable = this.appointmentService.getPatientAppointments();
    } else if (this.userRole === 'doctor') {
      console.log('Using getMyDoctorAppointments method');
      observable = this.appointmentService.getMyDoctorAppointments();
    } else if (this.userRole === 'secretaire') {
      console.log('Using getMySecretaryAppointments method for secretary');
      console.log('API URL should be: /api/v1/api/appointments/my-secretary-appointments');
      observable = this.appointmentService.getMySecretaryAppointments().pipe(
        catchError(error => {
          console.error('Error in secretary appointments:', error);
          // Return empty array on error to prevent the app from breaking
          this.snackBar.open('Erreur lors du chargement des rendez-vous. Veuillez réessayer.', 'Fermer', { duration: 5000 });
          return of([]);
        })
      );
    } else {
      console.error('Unknown user role:', this.userRole);
      this.loading = false;
      this.snackBar.open('Role utilisateur inconnu', 'Fermer', { duration: 3000 });
      return;
    }
        
    observable.subscribe({
      next: (appointments) => {
        console.log(`Received ${appointments.length} appointments for ${this.userRole}:`, appointments);
        this.appointments = appointments;
        this.loading = false;
        
        // Display a message if no appointments are found
        if (appointments.length === 0) {
          this.snackBar.open('Aucun rendez-vous trouvé.', 'Fermer', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error(`Error loading appointments for ${this.userRole}:`, error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
        this.loading = false;
        this.appointments = []; // Initialize with empty array on error
      }
    });
  }
  
  get upcomingAppointments(): Appointment[] {
    console.log('Calculating upcoming appointments from', this.appointments.length, 'appointments');
    console.log('Appointment statuses:', this.appointments.map(apt => apt.status));
    
    // If there's only one appointment (like in your case), just show it in upcoming regardless of status
    if (this.appointments.length === 1) {
      console.log('Only one appointment, showing it in upcoming tab');
      return this.appointments;
    }
    
    const upcoming = this.appointments.filter(apt => 
      apt.status === AppointmentStatus.PENDING || 
      apt.status === AppointmentStatus.ACCEPTED
    );
    
    console.log('Found', upcoming.length, 'upcoming appointments');
    return upcoming;
  }
  
  get canceledAppointments(): Appointment[] {
    console.log('Calculating canceled appointments');
    const canceled = this.appointments.filter(apt => 
      apt.status === AppointmentStatus.CANCELED || 
      apt.status === AppointmentStatus.REJECTED
    );
    console.log('Found', canceled.length, 'canceled appointments');
    return canceled;
  }
  
  get completedAppointments(): Appointment[] {
    console.log('Calculating completed appointments');
    const completed = this.appointments.filter(apt => 
      apt.status === AppointmentStatus.COMPLETED
    );
    console.log('Found', completed.length, 'completed appointments');
    return completed;
  }
  
  bookNewAppointment(): void {
    const dialogRef = this.dialog.open(BookAppointmentComponent, {
      width: '100%',
      maxWidth: '1200px',
      height: '90vh',
      panelClass: 'full-screen-dialog'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAppointments();
      }
    });
  }
  
  viewAppointmentDetails(appointment: Appointment): void {
    this.dialog.open(BookAppointmentComponent, {
      width: '600px',
      data: {
        isView: true,
        appointment: appointment
      }
    });
  }
  
  rescheduleAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(BookAppointmentComponent, {
      width: '600px',
      data: {
        isEdit: true,
        appointment: appointment
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAppointments();
        this.snackBar.open('Rendez-vous reprogrammé avec succès', 'Fermer', { duration: 3000 });
      }
    });
  }
  
  cancelAppointment(appointment: Appointment): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous?')) {
      this.appointmentService.cancelAppointment(appointment.id).subscribe({
        next: () => {
          this.loadAppointments();
          this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error canceling appointment:', error);
          this.snackBar.open('Erreur lors de l\'annulation du rendez-vous', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
  
  updateStatus(appointment: Appointment, status: string): void {
    const appointmentStatus = status as AppointmentStatus;
    this.appointmentService.updateAppointmentStatus(appointment.id, appointmentStatus).subscribe({
      next: () => {
        this.loadAppointments();
        const statusText = status === 'ACCEPTED' ? 'accepté' : status === 'REJECTED' ? 'rejeté' : 'terminé';
        this.snackBar.open(`Rendez-vous ${statusText} avec succès`, 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        this.snackBar.open('Erreur lors de la mise à jour du statut', 'Fermer', { duration: 3000 });
      }
    });
  }
  
  canCancel(appointment: Appointment): boolean {
    // Only PENDING or ACCEPTED appointments can be canceled
    return appointment.status === AppointmentStatus.PENDING || 
           appointment.status === AppointmentStatus.ACCEPTED;
  }
  
  canReschedule(appointment: Appointment): boolean {
    // Only PENDING appointments can be rescheduled (by patients)
    return appointment.status === AppointmentStatus.PENDING && this.userRole === 'patient';
  }
  
  canManageStatus(appointment: Appointment): boolean {
    // Only doctor or secretary can manage statuses
    return (this.userRole === 'doctor' || this.userRole === 'secretaire') && 
           (appointment.status === AppointmentStatus.PENDING || 
            appointment.status === AppointmentStatus.ACCEPTED);
  }
  
  translateAppointmentType(type: string): string {
    switch (type) {
      case 'DETARTRAGE':
        return 'Détartrage';
      case 'SOIN':
        return 'Soin';
      case 'EXTRACTION':
        return 'Extraction';
      case 'BLANCHIMENT':
        return 'Blanchiment';
      case 'ORTHODONTIE':
        return 'Orthodontie';
      default:
        return type;
    }
  }
  
  getProfileImage(person: any): string {
    if (!person) return 'assets/images/default-avatar.png';
    
    if (person.profilePicturePath) {
      return `${environment.apiUrl}/api/v1/api/users/profile/picture/${person.profilePicturePath}`;
    } else {
      // Return gender-specific default avatar if gender is available
      if (person.gender === 'MALE') {
        return 'assets/images/default-male-avatar.png';
      } else if (person.gender === 'FEMALE') {
        return 'assets/images/default-female-avatar.png';
      } else {
        return 'assets/images/default-avatar.png';
      }
    }
  }
  
  getPersonName(person: any): string {
    if (!person) return 'Utilisateur';
    return `${person.nom} ${person.prenom}`;
  }
  
  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }
  
  onTabChange(index: number): void {
    console.log('Tab changed to index:', index);
    this.activeTab = ['upcoming', 'canceled', 'completed'][index];
    console.log('Active tab set to:', this.activeTab);
  }
} 