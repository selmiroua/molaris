import { Component, OnInit, ViewChild, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarOptions, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { AppointmentDetailDialogComponent } from './appointment-detail-dialog.component';

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
    HttpClientModule,
    AppointmentDetailDialogComponent
  ],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <div class="header-content">
          <div class="date-info">
            <h2>{{ currentDate | date:'EEEE d MMMM yyyy':'':'fr' }}</h2>
            <span class="timezone">GMT +07:00</span>
          </div>
          <div class="view-controls">
            <div class="view-buttons">
              <button mat-button [class.active]="currentView === 'dayGridMonth'" (click)="changeView('dayGridMonth')">
                Mois
              </button>
              <button mat-button [class.active]="currentView === 'timeGridWeek'" (click)="changeView('timeGridWeek')">
                Semaine
              </button>
              <button mat-button [class.active]="currentView === 'timeGridDay'" (click)="changeView('timeGridDay')">
                Jour
              </button>
            </div>
            <div class="navigation">
              <button mat-icon-button (click)="previous()">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <button mat-stroked-button class="today-btn" (click)="today()">
                Aujourd'hui
              </button>
              <button mat-icon-button (click)="next()">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="calendar-content">
        <full-calendar #calendar [options]="calendarOptions"></full-calendar>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .calendar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .calendar-header {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 20px;
      flex-shrink: 0;
    }
    
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .date-info h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .timezone {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
      display: block;
    }

    .view-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .view-buttons {
      display: flex;
      gap: 8px;

      button {
        color: #64748b;
        
        &.active {
          color: #0ea5e9;
          background: #f0f9ff;
        }
      }
    }

    .navigation {
      display: flex;
      align-items: center;
      gap: 12px;

      .today-btn {
        border-color: #e2e8f0;
        color: #64748b;
        font-weight: 500;
      }
    }

    .calendar-content {
      flex: 1;
      min-height: 0;
      padding: 20px;
      
      ::ng-deep {
        .fc {
          height: 100%;
          
          .fc-view {
            height: 100% !important;
          }
          
          .fc-header-toolbar {
            display: none;
          }
          
          .fc-view-harness {
            height: 100% !important;
          }
          
          .fc-scrollgrid {
            border: 1px solid #e2e8f0;
          }
          
          .fc-scrollgrid-section > * {
            border: none;
          }
          
          .fc-col-header-cell {
            padding: 12px 0;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            font-weight: 500;
          }
          
          .fc-timegrid-slot {
            height: 48px !important;
            border-color: #e2e8f0;
          }
          
          .fc-timegrid-axis {
            padding: 8px;
            font-size: 0.875rem;
            color: #64748b;
          }
          
          .fc-event {
            border-radius: 6px;
            padding: 4px 8px;
            margin: 2px 0;
            border: none;
            font-size: .85em;
            line-height: 1.4;
            cursor: pointer;
            
            &.status-pending {
              background: #fff7ed;
              border: 1px solid #fdba74;
              color: #9a3412;
            }
            
            &.status-accepted {
              background: #f0f9ff;
              border: 1px solid #7dd3fc;
              color: #0369a1;
            }
            
            &.status-completed {
              background: #f0fdf4;
              border: 1px solid #86efac;
              color: #166534;
            }
            
            &.status-canceled {
              background: #fef2f2;
              border: 1px solid #fca5a5;
              color: #991b1b;
              opacity: 0.8;
            }
          }
          
          .fc-timegrid-now-indicator-line {
            border-color: #e11d48;
          }
          
          .fc-timegrid-now-indicator-arrow {
            border-color: #e11d48;
            border-right-color: transparent;
            border-bottom-color: transparent;
            border-left-color: transparent;
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .calendar-header {
        padding: 16px;
      }

      .date-info h2 {
        font-size: 20px;
      }

      .view-controls {
        flex-direction: column;
        align-items: stretch;
      }
      
      .calendar-content {
        padding: 12px;
      }
    }
  `]
})
export class AppointmentCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent: any;
  @Input() userRole: 'patient' | 'doctor' | 'secretaire' = 'doctor';
  currentView: string = 'timeGridWeek';
  currentDate = new Date();
  
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: false,
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    locale: 'fr',
    nowIndicator: true,
    slotEventOverlap: false,
    expandRows: true,
    height: '100%',
    dayHeaderFormat: { weekday: 'long', day: 'numeric', month: 'long' }
  };
  
  constructor(
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }
  
  loadAppointments(): void {
    const appointmentObservable = this.userRole === 'doctor' 
      ? this.appointmentService.getMyDoctorAppointments()
      : this.appointmentService.getMySecretaryAppointments();
    
    appointmentObservable.subscribe({
      next: (appointments) => {
        const events = appointments.map(appointment => ({
          id: appointment.id.toString(),
          title: this.createEventTitle(appointment),
          start: new Date(appointment.appointmentDateTime),
          end: this.calculateEndTime(appointment.appointmentDateTime),
          className: `status-${appointment.status.toLowerCase()}`,
          extendedProps: {
            appointment: appointment
          }
        }));
        
        if (this.calendarComponent) {
          const calendarApi = this.calendarComponent.getApi();
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open('Error loading appointments', 'Close', { duration: 3000 });
      }
    });
  }

  createEventTitle(appointment: Appointment): string {
    const patientName = appointment.patient 
      ? `${appointment.patient.prenom} ${appointment.patient.nom}`
      : 'Patient inconnu';
    return `${patientName}\n${appointment.appointmentType || ''}`;
  }

  calculateEndTime(startTime: string): Date {
    const start = new Date(startTime);
    return new Date(start.getTime() + 30 * 60000); // Add 30 minutes
  }

  handleEventClick(info: { event: EventApi }): void {
    const appointment = info.event.extendedProps['appointment'];
    if (appointment) {
      this.dialog.open(AppointmentDetailDialogComponent, {
        width: '500px',
        data: appointment
      });
    }
  }

  changeView(view: string): void {
    this.currentView = view;
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.changeView(view);
    }
  }

  previous(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.prev();
      this.currentDate = calendarApi.getDate();
    }
  }

  next(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.next();
      this.currentDate = calendarApi.getDate();
    }
  }

  today(): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      calendarApi.today();
      this.currentDate = calendarApi.getDate();
    }
  }
} 