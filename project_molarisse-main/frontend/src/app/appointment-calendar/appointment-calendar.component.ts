import { Component, OnInit, ViewChild, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarOptions, EventApi, EventDropArg, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AppointmentService, Appointment, AppointmentStatus, AppointmentType, CaseType } from '../core/services/appointment.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService, User } from '../auth/auth.service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Router } from '@angular/router';
import { ConfirmAppointmentDialogComponent } from './confirm-appointment-dialog.component';
import { UnregisteredPatientAppointmentDialogComponent } from './unregistered-patient-appointment-dialog.component';
import { HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import frLocale from '@fullcalendar/core/locales/fr';
import { Observable, of } from 'rxjs';
import { ColorPreferenceService } from '../core/services/color-preference.service';
import { ColorPaletteDialogComponent } from '../dashboard/color-palette-dialog.component';
import { AppointmentDetailDialogComponent } from '../dashboard/appointment/appointment-detail-dialog.component';
import { AppointmentTypeSelectionDialogComponent } from './appointment-type-selection-dialog.component';
import { SecretaryBookAppointmentDialogComponent } from '../dashboard/appointment/secretary-book-appointment-dialog.component';
import { PatientSelectionDialogComponent } from '../dashboard/appointment/patient-selection-dialog.component';
import { CreateFicheDialogComponent } from '../dashboard/appointment/create-fiche-dialog.component';

// Extend the Appointment interface to include isDemo property
declare module '../core/services/appointment.service' {
  interface Appointment {
    isDemo?: boolean;
  }
}

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FullCalendarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    ConfirmAppointmentDialogComponent,
    UnregisteredPatientAppointmentDialogComponent,
    ColorPaletteDialogComponent,
    AppointmentDetailDialogComponent,
    AppointmentTypeSelectionDialogComponent,
    SecretaryBookAppointmentDialogComponent,
    PatientSelectionDialogComponent,
    CreateFicheDialogComponent
  ],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="header-content">
          <div class="header-left">
            <div class="date-navigation">
              <button mat-button class="today-btn" (click)="today()">
                <mat-icon>today</mat-icon>
                Aujourd'hui
              </button>
              <div class="nav-arrows">
                <button mat-icon-button (click)="previous()">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button mat-icon-button (click)="next()">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              <h2 class="current-date">{{ currentDate | date:'EEEE d MMMM yyyy':'':'fr' }}</h2>
            </div>
          </div>
          <div class="header-right">
            <div class="view-buttons">
              <button mat-button [class.active]="currentView === 'timeGridDay'" (click)="changeView('timeGridDay')">
                Jour
              </button>
              <button mat-button [class.active]="currentView === 'timeGridWeek'" (click)="changeView('timeGridWeek')">
                Semaine
              </button>
              <button mat-button [class.active]="currentView === 'dayGridMonth'" (click)="changeView('dayGridMonth')">
                Mois
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="calendar-content">
        <div class="calendar-wrapper">
          <full-calendar #calendar [options]="calendarOptions"></full-calendar>
        </div>
        <div *ngIf="appointments.length === 0" class="no-appointments">
          <mat-icon>event_busy</mat-icon>
          <p>Aucun rendez-vous à afficher</p>
          <button mat-raised-button color="primary" (click)="forceLoadDemoAppointments()">
            <mat-icon>add</mat-icon>
            Charger des rendez-vous de démonstration
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      padding: 16px;
      box-sizing: border-box;
    }

    .calendar-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .calendar-header {
      margin-bottom: 12px;
      background: white;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .date-navigation {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .today-btn {
      background: #4f46e5;
      color: white;
      padding: 0 16px;
      border-radius: 6px;
      height: 36px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .view-buttons {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;

      button {
        padding: 0 16px;
        height: 36px;
        color: #64748b;
        
        &.active {
          background: white;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }
    }
    
    .calendar-wrapper {
      height: 600px;
      min-height: 400px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    
    .no-appointments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        color: #94a3b8;
      }
      
      p {
        color: #64748b;
        margin-bottom: 24px;
      }
    }
    
    /* Add responsive styles for mobile */
    @media (max-width: 768px) {
      :host {
        padding: 8px;
      }
      
      .calendar-header {
        padding: 8px;
      }
      
      .date-navigation {
        gap: 8px;
      }
      
      .calendar-wrapper {
        height: 500px;
      }
      
      .header-content {
        flex-direction: column;
        gap: 12px;
      }
      
      .header-left, .header-right {
        width: 100%;
      }
      
      .view-buttons {
        width: 100%;
        justify-content: space-between;
      }
    }
    
    @media (max-width: 480px) {
      .calendar-wrapper {
        height: 450px;
      }
      
      .date-navigation {
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .current-date {
        width: 100%;
        text-align: center;
        font-size: 14px;
        margin-top: 8px;
      }
      
      .no-appointments {
        padding: 24px;
      }
    }
  `]
})
export class AppointmentCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent: any;
  @Input() userRole: 'patient' | 'doctor' | 'secretaire' = 'doctor';
  currentView: string = 'timeGridWeek';
  currentDate = new Date();
  totalAppointments = 0;
  timeSlots: string[] = [];
  appointments: Appointment[] = [];
  currentUser: User | null = null;
  isUsingCustomColors: boolean = false;
  
  dentists = [
    {
      name: 'Dr. Smith',
      avatar: 'assets/doctor-avatar.png',
      appointmentCount: 4
    },
    {
      name: 'Dr. Johnson',
      avatar: 'assets/doctor-avatar.png',
      appointmentCount: 1
    },
    {
      name: 'Dr. Williams',
      avatar: 'assets/doctor-avatar.png',
      appointmentCount: 0
    }
  ];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: false,
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: false,
    dayMaxEventRows: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    locale: frLocale,
    dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' },
    nowIndicator: true,
    slotEventOverlap: false,
    eventDisplay: 'block',
    expandRows: true,
    height: '100%',
    handleWindowResize: true,
    slotLabelInterval: '01:00',
    slotDuration: '00:30:00',
    views: {
      timeGridDay: {
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      },
      timeGridWeek: {
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
      },
      dayGridMonth: {
        titleFormat: { year: 'numeric', month: 'long' }
      }
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventContent: (arg) => {
      const appointment = arg.event.extendedProps['appointment'] as Appointment;
      if (!appointment) {
        return { html: '<div>Rendez-vous non disponible</div>' };
      }

      const patientName = appointment.patient ? `${appointment.patient.prenom} ${appointment.patient.nom}` : 'Patient inconnu';
      const time = `${this.formatTime(appointment.appointmentDateTime)} - ${this.formatEndTime(appointment.appointmentDateTime)}`;
      const appointmentType = appointment.appointmentType || 'Consultation';
      
      // Get type icon based on appointment type
      let typeIcon = '';
      switch (appointmentType.toLowerCase()) {
        case 'soin':
          typeIcon = '⚕️';
          break;
        case 'extraction':
          typeIcon = '🔄';
          break;
        case 'detartrage':
          typeIcon = '✨';
          break;
        case 'consultation':
          typeIcon = '📋';
          break;
        default:
          typeIcon = '⚕️';
      }

      // Get the status for CSS variable lookup
      const status = appointment.status.toLowerCase();
      const statusText = this.getStatusText(appointment.status);

      // Get status icon and styling based on appointment status
      let statusIcon = '';
      let statusIconStyle = '';
      switch (status) {
        case 'pending':
          statusIcon = '⏳';
          statusIconStyle = 'color: #E69819; font-size: 16px;';
          break;
        case 'accepted':
          statusIcon = '✅';
          statusIconStyle = 'color: #1E88E5; font-size: 16px;';
          break;
        case 'completed':
          statusIcon = '✓';
          statusIconStyle = 'color: #43A047; font-size: 18px; font-weight: bold;';
          break;
        case 'canceled':
          statusIcon = '×';
          statusIconStyle = 'color: #E53935; font-size: 20px; font-weight: bold;';
          break;
        default:
          statusIcon = '○';
          statusIconStyle = 'font-size: 16px;';
      }
      
      // Use CSS variables for colors (these are updated in real-time when color palette changes)
      const backgroundColor = `var(--status-${status}-bg)`;
      const borderColor = `var(--status-${status}-border)`;
      const textColor = `var(--status-${status}-text)`;

      // Create a simplified appointment card with colored background
      return {
        html: `
          <div style="background-color: ${backgroundColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; height: 100%; display: flex; flex-direction: column; padding: 6px; margin: 0; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); min-height: 0; overflow: hidden;">
            <div style="display: flex; min-height: 0; align-items: center; margin-bottom: 3px;">
              <div style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; margin-right: 6px; ${statusIconStyle}" title="Statut: ${statusText}">${statusIcon}</div>
              <div style="font-weight: 600; font-size: 13px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${patientName}</div>
            </div>
            <div style="display: flex; align-items: center; font-size: 11px; opacity: 0.9; margin-left: 28px;">
              <span style="margin-right: 3px;">⏱</span>${time}
            </div>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 3px; margin-left: 28px;">
              <div style="display: inline-block; font-size: 11px; padding: 2px 6px; background: rgba(255,255,255,0.3); border-radius: 3px; font-weight: 500; min-height: 0;">
                <span style="margin-right: 4px; font-size: 14px;" title="Type: ${appointmentType}">${typeIcon}</span>${appointmentType}
              </div>
            </div>
          </div>
        `
      };
    },
    eventClassNames: (arg) => {
      const appointment = arg.event.extendedProps['appointment'] as Appointment;
      if (!appointment) return [];
      return [`status-${appointment.status.toLowerCase()}`];
    },
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    select: this.handleDateSelect.bind(this),
    datesSet: (dateInfo) => {
      // When date range changes (navigation, view change), load real appointments first
      console.log('Calendar dates changed:', dateInfo.startStr, 'to', dateInfo.endStr);
      
      // Load real appointments first, only use demo as fallback
      setTimeout(() => {
        this.loadAppointments();
      }, 200);
    },
    viewDidMount: (arg) => {
      console.log('Calendar view mounted');
      
      // Load real appointments when view changes
      setTimeout(() => {
        this.loadAppointments();
      }, 200);
    }
  };

  constructor(
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
    private colorPreferenceService: ColorPreferenceService
  ) {
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    
    // Load and apply color preferences for appointment display
    this.loadColorPreferences();
    
    // Load real appointments first
    console.log("Loading appointments after initialization...");
    this.loadAppointments();
    
    // Only add demo appointments as fallback if needed
    setTimeout(() => {
      if (this.appointments.length === 0) {
        console.log("No real appointments found, adding demos...");
        this.forceLoadDemoAppointments();
      }
    }, 1000);
  }

  ngAfterViewInit(): void {
    if (this.calendarComponent) {
      // Ensure calendar is rendered properly
      setTimeout(() => {
        if (this.calendarComponent && this.calendarComponent.getApi()) {
          this.calendarComponent.getApi().render();
        }
      }, 500);
    }
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 8; hour <= 18; hour++) {
      this.timeSlots.push(`${hour}:00`);
      this.timeSlots.push(`${hour}:30`);
    }
  }

  loadAppointments(): void {
    console.log('Loading appointments for role:', this.userRole);
    
    // Store reference to event source for later use
    let previousAppointments = [...this.appointments];
    
    // Choose the appropriate service method based on user role
    let appointmentObservable: Observable<Appointment[]>;
    
    switch (this.userRole) {
      case 'doctor':
        console.log('Loading doctor appointments');
        appointmentObservable = this.appointmentService.getMyDoctorAppointments();
        break;
      case 'secretaire':
        console.log('Loading secretary appointments');
        appointmentObservable = this.appointmentService.getMySecretaryAppointments();
        break;
      case 'patient':
        console.log('Loading patient appointments - trying getMyAppointments first');
        // For patient, try both methods sequentially to ensure we get all appointments
        this.appointmentService.getMyAppointments().subscribe({
          next: (appointments: Appointment[]) => {
            console.log('First method appointments loaded successfully:', appointments.length);
            
            // If we got some appointments, process them
            if (appointments.length > 0) {
              this.processAppointments(appointments);
            } else {
              // If no appointments, try second method
              console.log('No appointments found with first method, trying getPatientAppointments');
              this.tryPatientAppointmentsFallback();
            }
          },
          error: (error) => {
            console.error('Error loading appointments with first method:', error);
            // Try second method on error
            this.tryPatientAppointmentsFallback();
          }
        });
        return; // Early return for patient role since we're handling it differently
      default:
        console.warn('Unknown user role:', this.userRole);
        appointmentObservable = of([]);
    }
    
    // For non-patient roles, use the standard approach
    appointmentObservable.subscribe({
      next: (appointments: Appointment[]) => {
        console.log('Appointments loaded successfully:', appointments.length);
        this.processAppointments(appointments);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        // Add test events if there was an error loading real appointments
        this.addTestEvents();
      }
    });
  }

  // Helper method to try the fallback method for patient appointments
  private tryPatientAppointmentsFallback(): void {
    console.log('Trying getPatientAppointments as fallback');
    this.appointmentService.getPatientAppointments().subscribe({
      next: (appointments: Appointment[]) => {
        console.log('Fallback appointments loaded successfully:', appointments.length);
        this.processAppointments(appointments);
      },
      error: (fallbackError) => {
        console.error('Both approaches failed to load appointments:', fallbackError);
        console.log('All API approaches failed, using demo appointments');
        this.forceLoadDemoAppointments();
      }
    });
  }

  // Helper method to process loaded appointments
  private processAppointments(appointments: Appointment[]): void {
    // Store the appointments
    this.appointments = appointments;
    
    // Clear previous events first
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      console.log('Clearing previous events');
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.removeAllEvents();
    }
    
    // If we have actual appointments, add them to the calendar
    if (appointments.length > 0) {
      if (this.calendarComponent && this.calendarComponent.getApi()) {
        console.log('Adding appointments to calendar');
        const events = this.createEventObjectsFromAppointments(appointments);
        const calendarApi = this.calendarComponent.getApi();
        calendarApi.addEventSource(events);
      }
    } else {
      console.log('No appointments found, adding test events');
      // If no appointments were returned, add test events
      this.addTestEvents();
    }
  }

  // Helper method to create event objects from appointments
  private createEventObjectsFromAppointments(appointments: Appointment[]): any[] {
    return appointments.map(appointment => {
      // Calculate event end time (30 min after start by default)
      const startDate = new Date(appointment.appointmentDateTime);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
      
      // Create the event object
      return {
        id: appointment.id.toString(),
        title: appointment.patient ? `${appointment.patient.prenom} ${appointment.patient.nom}` : 'Patient inconnu',
        start: startDate,
        end: endDate,
        extendedProps: {
          appointment: appointment
        },
        display: 'block',
        classNames: [`status-${appointment.status.toLowerCase()}`]
      };
    });
  }

  getStatusIcon(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return '⌛';
      case AppointmentStatus.ACCEPTED:
        return '📅';
      case AppointmentStatus.COMPLETED:
        return '✅';
      case AppointmentStatus.CANCELED:
        return '❌';
      default:
        return '•';
    }
  }

  getStatusText(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.ACCEPTED:
        return 'Confirmé';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELED:
        return 'Annulé';
      default:
        return status;
    }
  }

  calculateEndTime(startTime: string): Date {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 30 * 60000);
    return end;
  }

  handleEventClick(info: any): void {
    const appointment = info.event.extendedProps.appointment;
    if (!appointment) {
      return;
    }

    this.dialog.open(AppointmentDetailDialogComponent, {
      width: '800px',
      data: appointment,
      panelClass: 'appointment-detail-dialog'
    });
  }

  changeView(view: string): void {
    this.currentView = view;
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.changeView(view);
      
      // The viewDidMount callback will handle adding test events if needed
      console.log('Changed view to', view);
    }
  }

  previous(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.prev();
      this.currentDate = calendarApi.getDate();
      
      // The datesSet callback will handle adding test events if needed
      console.log('Navigated to previous date', this.currentDate);
    }
  }

  next(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.next();
      this.currentDate = calendarApi.getDate();
      
      // The datesSet callback will handle adding test events if needed
      console.log('Navigated to next date', this.currentDate);
    }
  }

  today(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.today();
      this.currentDate = calendarApi.getDate();
      
      // The datesSet callback will handle adding test events if needed
      console.log('Navigated to today', this.currentDate);
    }
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    // Vérifier si l'utilisateur est une secrétaire
    if (this.userRole !== 'secretaire') {
      return;
    }

    // Vérifier si la date sélectionnée n'est pas dans le passé
    const now = new Date();
    if (selectInfo.start < now) {
      this.snackBar.open('Impossible de créer un rendez-vous dans le passé', 'Fermer', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Utiliser la date locale sans conversion de fuseau horaire
    const selectedDate = selectInfo.start;
    console.log('Selected date for appointment:', selectedDate);

    // Ouvrir le dialogue de sélection du type de patient (inscrit ou non inscrit)
    const selectionDialog = this.dialog.open(AppointmentTypeSelectionDialogComponent, {
      width: '400px',
      data: {
        date: selectedDate
      },
      panelClass: 'appointment-type-dialog',
      disableClose: false
    });

    selectionDialog.afterClosed().subscribe(result => {
      if (result === 'completed_with_fiche') {
        // Both appointment and fiche have been created, just reload appointments
        this.snackBar.open('Rendez-vous et fiche patient créés avec succès', 'Fermer', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        setTimeout(() => this.loadAppointments(), 500);
      } else if (result === 'unregistered') {
        // Ouvrir le dialogue pour patient non inscrit
        this.openUnregisteredPatientAppointmentDialog(selectedDate);
      } else if (result === 'registered') {
        // Ouvrir d'abord le dialogue de sélection de patient
        const patientSelectionDialog = this.dialog.open(PatientSelectionDialogComponent, {
          width: '600px',
          data: {
            selectedDate: selectedDate
          }
        });

        patientSelectionDialog.afterClosed().subscribe(patient => {
          if (patient) {
            // Le patient a été sélectionné, ouvrir le dialogue de création de rendez-vous
            this.handlePatientAppointmentBooking(patientSelectionDialog, selectedDate, patient);
          }
        });
      }
    });
  }

  handleEventDrop(info: EventDropArg): void {
    const { event } = info;
    const appointmentId = parseInt(event.id);
    
    // Get the date without timezone conversion
    let newDateTime: string | null = null;
    if (event.start) {
      const start = event.start;
      // For existing appointments, don't adjust the time
      
      // Format date in ISO format but without timezone information
      newDateTime = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}T${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}:00`;
      console.log('Formatted date for event drop:', newDateTime);
    }

    if (!appointmentId || !newDateTime) {
      this.snackBar.open('Impossible de mettre à jour le rendez-vous', 'Fermer', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      info.revert();
      return;
    }

    const appointment = event.extendedProps['appointment'];
    if (!appointment) {
      info.revert();
      return;
    }

    // Check if the appointment can be edited (not past, not canceled, etc.)
    if (![AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED].includes(appointment.status)) {
      this.snackBar.open('Impossible de modifier ce rendez-vous en raison de son statut', 'Fermer', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      info.revert();
      return;
    }

    // Format date for display
    const formatDate = new Date(event.start!).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Confirm the change
    if (confirm(`Confirmer le changement du rendez-vous au ${formatDate}?`)) {
      this.updateAppointmentTime(appointmentId, newDateTime, event);
    } else {
      info.revert();
    }
  }

  updateAppointmentTime(appointmentId: number, newDateTime: string, event: EventApi): void {
    // We already adjusted the time in handleEventDrop, so we can use it directly
    const formattedDate = newDateTime;
    
    console.log('Original date:', newDateTime);
    console.log('Formatted date for backend:', formattedDate);
    
    const updateMethod = this.userRole === 'doctor'
      ? this.appointmentService.updateAppointmentTimeByDoctor(appointmentId, formattedDate)
      : this.appointmentService.updateAppointmentTimeBySecretary(appointmentId, formattedDate);

    updateMethod.subscribe({
      next: (updatedAppointment) => {
        // Format date for display
        const formattedDate = new Date(event.start!).toLocaleString('fr-FR', {
          weekday: 'long',
          day: 'numeric', 
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Show success message
        this.snackBar.open(
          `Rendez-vous reprogrammé avec succès pour le ${formattedDate}. Le patient a été notifié.`, 
          'Fermer', 
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        
        // Update the event end time using the same local time approach
        const startDate = this.createLocalDate(newDateTime);
        const endDate = new Date(startDate.getTime() + 30 * 60000);
        event.setEnd(endDate);
      },
      error: (error) => {
        console.error('Error updating appointment', error);
        this.snackBar.open('Erreur lors de la mise à jour du rendez-vous', 'Fermer', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        // Revert the event to its original position
        event.remove();
        this.loadAppointments(); // Reload all appointments
      }
    });
  }

  openUnregisteredPatientAppointmentDialog(appointmentDateTime: Date): void {
    console.log('Opening appointment dialog for date:', appointmentDateTime);
    
    // Create a new date that preserves the exact local time the user selected
    // Format as ISO string with explicit Z timezone indicator removed
    // This ensures the backend receives the exact time selected
    const year = appointmentDateTime.getFullYear();
    const month = String(appointmentDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(appointmentDateTime.getDate()).padStart(2, '0');
    const hours = String(appointmentDateTime.getHours()).padStart(2, '0');
    const minutes = String(appointmentDateTime.getMinutes()).padStart(2, '0');
    
    // Create formatted string in format YYYY-MM-DDTHH:MM:00 (no timezone)
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:00`;
    console.log('Formatted date with preserved local time:', formattedDate);
    
    const dialogRef = this.dialog.open(UnregisteredPatientAppointmentDialogComponent, {
      width: '700px',
      data: {
        appointmentDateTime: appointmentDateTime,
        formattedDateTime: formattedDate
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result:', result);
      if (result && (result === true || result.success === true)) {
        console.log('Reloading appointments after successful creation');
        
        // Forcer un rafraîchissement complet du calendrier
        setTimeout(() => {
          // Utiliser la nouvelle méthode de rechargement complet
          this.loadAppointments();
          
          // Forcer le rendu du calendrier
          setTimeout(() => {
            if (this.calendarComponent && this.calendarComponent.getApi) {
              console.log('Forcing calendar render');
      const calendarApi = this.calendarComponent.getApi();
              calendarApi.render(); // Force le rendu du calendrier
            }
          }, 100);
        }, 500); // Petit délai pour s'assurer que le backend a bien enregistré le rendez-vous
      }
    });
  }

  // Helper method to create a date without timezone conversion
  private createLocalDate(dateString: string): Date {
    // Parse the date string
    const originalDate = new Date(dateString);
    
    // Get local date components
    const year = originalDate.getFullYear();
    const month = originalDate.getMonth();
    const day = originalDate.getDate();
    const hours = originalDate.getHours();
    const minutes = originalDate.getMinutes();
    
    // Create new date with local timezone
    const localDate = new Date();
    localDate.setFullYear(year, month, day);
    localDate.setHours(hours, minutes, 0, 0); // Use original hours
    
    console.log(`Converted date: ${dateString} -> ${localDate.toLocaleString()}`);
    return localDate;
  }

  formatEndTime(startTime: string): string {
    try {
      const date = new Date(startTime);
      date.setMinutes(date.getMinutes() + 30); // Add 30 minutes
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting end time:', error);
      return '--:--';
    }
  }

  formatTime(dateTime: string): string {
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  }

  // Improved test event method
  addTestEvents(): void {
    if (!this.calendarComponent || !this.calendarComponent.getApi()) {
      console.error('Calendar API not available for adding test events');
      setTimeout(() => this.addTestEvents(), 500); // Retry after a delay
      return;
    }

    console.log('Adding test events to calendar');
    const calendarApi = this.calendarComponent.getApi();
    
    // Check if we already have real appointments
    const existingEvents = calendarApi.getEvents();
    const hasRealAppointments = existingEvents.length > 0 && 
                                !existingEvents[0].id.startsWith('demo_');
    
    // Only clear events if we don't have real appointments
    if (!hasRealAppointments) {
      calendarApi.removeAllEvents(); // Clear any existing events
    }
    
    const today = new Date();
    
    // Reset hours to make sure times are correct
    const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Create a set of past appointments (for the last week)
    const pastEvents = [];
    for (let i = 1; i <= 7; i++) {
      // Create a date i days ago
      const pastDate = new Date(todayReset);
      pastDate.setDate(pastDate.getDate() - i);
      
      // Add varying appointment times
      const hour = 8 + (i % 8); // 8am to 3pm
      
      pastEvents.push({
        id: 'demo_past_' + i, // Add 'demo_' prefix to identify demo events
        title: 'Ancien rendez-vous ' + i,
        start: new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate(), hour, 0),
        end: new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate(), hour + 1, 0),
        extendedProps: {
          appointment: {
            id: 100 + i,
            appointmentDateTime: new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate(), hour, 0).toISOString(),
            status: AppointmentStatus.COMPLETED,
            patient: {
              prenom: 'Patient',
              nom: 'Test ' + i
            },
            appointmentType: i % 2 === 0 ? AppointmentType.SOIN : AppointmentType.DETARTRAGE,
            caseType: CaseType.NORMAL,
            doctorId: 1,
            doctorName: 'Dr. Test',
            patientId: 100 + i,
            reason: 'Rendez-vous précédent',
            isDemo: true // Mark as demo appointment
          }
        },
        display: 'block',
        classNames: ['status-completed']
      });
    }
    
    // Create test events that match the examples
    const testEvents = [
      {
        id: 'demo_today_1',
        title: 'Moncef Bensalem',
        start: new Date(todayReset.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        end: new Date(todayReset.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
        extendedProps: {
          appointment: {
            id: 1001,
            appointmentDateTime: new Date(todayReset.getTime() + 8 * 60 * 60 * 1000).toISOString(),
            status: AppointmentStatus.COMPLETED,
            patient: {
              prenom: 'Moncef',
              nom: 'Bensalem'
            },
            appointmentType: AppointmentType.SOIN,
            // Add missing required properties with placeholder values
            caseType: CaseType.NORMAL,
            doctorId: 1,
            doctorName: 'Dr. Test',
            patientId: 1,
            reason: 'Routine checkup',
            isDemo: true
          }
        },
        display: 'block',
        classNames: ['status-completed']
      },
      {
        id: 'demo_today_2',
        title: 'Raghed Krimi',
        start: new Date(todayReset.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
        end: new Date(todayReset.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM
        extendedProps: {
          appointment: {
            id: 1002,
            appointmentDateTime: new Date(todayReset.getTime() + 9 * 60 * 60 * 1000).toISOString(),
            status: AppointmentStatus.PENDING,
            patient: {
              prenom: 'Raghed',
              nom: 'Krimi'
            },
            appointmentType: AppointmentType.DETARTRAGE,
            // Add missing required properties with placeholder values
            caseType: CaseType.NORMAL,
            doctorId: 1,
            doctorName: 'Dr. Test',
            patientId: 2,
            reason: 'Cleaning',
            isDemo: true
          }
        },
        display: 'block',
        classNames: ['status-pending']
      },
      {
        id: 'demo_today_3',
        title: 'Selmi Ines',
        start: new Date(todayReset.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM
        end: new Date(todayReset.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        extendedProps: {
          appointment: {
            id: 1003,
            appointmentDateTime: new Date(todayReset.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
            status: AppointmentStatus.ACCEPTED,
            patient: {
              prenom: 'Selmi',
              nom: 'Ines'
            },
            appointmentType: AppointmentType.EXTRACTION,
            // Add missing required properties with placeholder values
            caseType: CaseType.NORMAL,
            doctorId: 1,
            doctorName: 'Dr. Test',
            patientId: 3,
            reason: 'Tooth extraction',
            isDemo: true
          }
        },
        display: 'block',
        classNames: ['status-accepted']
      }
    ];

    // Add future appointments for next week
    const futureEvents = [];
    for (let i = 1; i <= 5; i++) {
      // Create a date i days in the future
      const futureDate = new Date(todayReset);
      futureDate.setDate(futureDate.getDate() + i);
      
      // Add varying appointment times
      const hour = 9 + (i % 7); // 9am to 3pm
      
      futureEvents.push({
        id: 'demo_future_' + i,
        title: 'Prochain rendez-vous ' + i,
        start: new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), hour, 0),
        end: new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), hour + 1, 0),
        extendedProps: {
          appointment: {
            id: 1200 + i,
            appointmentDateTime: new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), hour, 0).toISOString(),
            status: AppointmentStatus.ACCEPTED,
            patient: {
              prenom: 'Patient',
              nom: 'Futur ' + i
            },
            appointmentType: i % 3 === 0 ? AppointmentType.SOIN : (i % 3 === 1 ? AppointmentType.EXTRACTION : AppointmentType.DETARTRAGE),
            caseType: CaseType.NORMAL,
            doctorId: 1,
            doctorName: 'Dr. Test',
            patientId: 200 + i,
            reason: 'Rendez-vous à venir',
            isDemo: true
          }
        },
        display: 'block',
        classNames: ['status-accepted']
      });
    }

    // Combine all events
    const allEvents = [...pastEvents, ...testEvents, ...futureEvents];

    // Add the test events to the calendar without replacing real ones
    if (hasRealAppointments) {
      // Only add demo events that don't conflict with real ones
      const realEvents = calendarApi.getEvents();
      const realEventDates = realEvents.map((event: EventApi) => event.start?.toISOString());
      
      const nonConflictingEvents = allEvents.filter((event: any) => {
        return !realEventDates.includes(event.start.toISOString());
      });
      
      if (nonConflictingEvents.length > 0) {
        calendarApi.addEventSource(nonConflictingEvents);
        console.log('Added non-conflicting demo events:', nonConflictingEvents.length);
      }
    } else {
      // If no real appointments, add all demo events
      calendarApi.addEventSource(allEvents);
      console.log('Added all demo events:', allEvents.length);
    }
    
    // Update appointments array to include test appointments
    // Only if we don't already have real appointments
    if (!this.appointments.length || this.appointments.every(a => a.isDemo)) {  
      this.appointments = allEvents.map(event => event.extendedProps.appointment as unknown as Appointment);
    } else {
      // Merge demo appointments with real ones, avoiding duplicates
      const demoAppointments = allEvents.map(event => event.extendedProps.appointment as unknown as Appointment);
      
      // Add demo appointments that don't conflict with real ones
      const existingIds = this.appointments.map(a => a.id);
      const newDemoAppointments = demoAppointments.filter(a => !existingIds.includes(a.id));
      
      if (newDemoAppointments.length > 0) {
        this.appointments = [...this.appointments, ...newDemoAppointments];
      }
    }
    
    console.log('Test events added successfully. Total appointments:', this.appointments.length);
  }

  // Improved method to force load demo appointments
  forceLoadDemoAppointments(): void {
    console.log('Force loading demo appointments');
    
    if (this.calendarComponent && this.calendarComponent.getApi) {
      console.log('Calendar API available, adding test events');
      
      // Check if we already have real appointments
      const hasRealAppointments = 
        this.appointments.length > 0 && 
        !this.appointments.every(a => a.isDemo);
      
      // If we already have real appointments, don't replace them
      if (hasRealAppointments) {
        console.log('Real appointments exist, only adding non-conflicting demo appointments');
      }
      
      this.addTestEvents();
    } else {
      console.log('Calendar API not available yet, scheduling retry');
      // Retry with exponential backoff
      setTimeout(() => {
        console.log('Retrying to load demo appointments...');
        if (this.calendarComponent && this.calendarComponent.getApi) {
          this.addTestEvents();
        } else {
          // One more attempt after a longer delay
          setTimeout(() => {
            console.log('Final attempt to load demo appointments');
            if (this.calendarComponent && this.calendarComponent.getApi) {
              this.addTestEvents();
            } else {
              console.error('Could not load calendar API after multiple attempts');
            }
          }, 1000); // Longer delay for final attempt
        }
      }, 500); // Initial retry delay
    }
  }

  /**
   * Load color preferences and apply them to the DOM
   * This ensures the calendar appointments will use the custom colors
   */
  private loadColorPreferences(): void {
    this.colorPreferenceService.getColorPreferences().subscribe(
      colors => {
        this.colorPreferenceService.applyColorPreferencesToDOM(colors);
        this.isUsingCustomColors = true;
      },
      error => {
        console.error('Error loading color preferences:', error);
        // Apply defaults if there was an error
        this.colorPreferenceService.applyColorPreferencesToDOM(this.colorPreferenceService.defaultColors);
        this.isUsingCustomColors = false;
      }
    );
  }

  /**
   * Open the color palette customization dialog
   */
  openColorPalette(): void {
    // First get current color preferences
    this.colorPreferenceService.getColorPreferences().subscribe({
      next: (colors) => {
        // Open dialog with current colors
        const dialogRef = this.dialog.open(ColorPaletteDialogComponent, {
          width: '700px',
          maxWidth: '95vw',
          data: colors,
          panelClass: 'color-palette-dialog-container',
          autoFocus: false,
          hasBackdrop: true
        });
        
        // Handle dialog close event
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Save the new color preferences
            this.colorPreferenceService.saveColorPreferences(result).subscribe({
              next: () => {
                // Apply the new colors to the DOM
                this.colorPreferenceService.applyColorPreferencesToDOM(result);
                this.isUsingCustomColors = true;
                this.snackBar.open('Préférences de couleurs enregistrées', 'OK', {
                  duration: 3000
                });
                
                // Force calendar refresh to show updated colors
                if (this.calendarComponent && this.calendarComponent.getApi) {
                  // Get current events
                  const calendarApi = this.calendarComponent.getApi();
                  const events = calendarApi.getEvents();
                  
                  // Refresh all events to apply new colors
                  events.forEach((event: EventApi) => {
                    // This triggers the eventClassNames callback which applies the CSS classes
                    event.setProp('classNames', event.classNames);
                  });
                  
                  // Force re-render of the calendar
                  calendarApi.render();
                }
              },
              error: (error) => {
                console.error('Error saving color preferences:', error);
                this.snackBar.open('Erreur lors de l\'enregistrement des préférences de couleurs', 'OK', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error fetching color preferences:', error);
        // Open dialog with default colors
        const dialogRef = this.dialog.open(ColorPaletteDialogComponent, {
          width: '700px',
          maxWidth: '95vw',
          data: this.colorPreferenceService.defaultColors,
          panelClass: 'color-palette-dialog-container',
          autoFocus: false,
          hasBackdrop: true
        });
        
        // Handle dialog close event  
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Save the new color preferences
            this.colorPreferenceService.saveColorPreferences(result).subscribe({
              next: () => {
                // Apply the new colors to the DOM
                this.colorPreferenceService.applyColorPreferencesToDOM(result);
                this.isUsingCustomColors = true;
                this.snackBar.open('Préférences de couleurs enregistrées', 'OK', {
                  duration: 3000
                });
                
                // Force calendar refresh to show updated colors
                if (this.calendarComponent && this.calendarComponent.getApi) {
                  // Get current events
                  const calendarApi = this.calendarComponent.getApi();
                  const events = calendarApi.getEvents();
                  
                  // Refresh all events to apply new colors
                  events.forEach((event: EventApi) => {
                    // This triggers the eventClassNames callback which applies the CSS classes
                    event.setProp('classNames', event.classNames);
                  });
                  
                  // Force re-render of the calendar
                  calendarApi.render();
                }
              },
              error: (error) => {
                console.error('Error saving color preferences:', error);
                this.snackBar.open('Erreur lors de l\'enregistrement des préférences de couleurs', 'OK', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
            });
          }
        });
      }
    });
  }

  // When booking for registered patient through SecretaryBookAppointmentDialog,
  // make sure time is passed correctly
  handlePatientAppointmentBooking(patientSelectionDialog: any, selectedDate: Date, patient: any): void {
    // Create a dialog to book an appointment for the selected patient
    const dialogRef = this.dialog.open(SecretaryBookAppointmentDialogComponent, {
      width: '800px',
      data: {
        appointmentDate: selectedDate,
        patient: patient
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Appointment created successfully
        setTimeout(() => this.loadAppointments(), 500);
      }
    });
  }
} 