import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentCalendarComponent } from '../appointment-calendar/appointment-calendar.component';
import { AppointmentListComponent } from './appointment/appointment-list.component';
import { ProfileComponent } from '../profile/profile.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { MessageBellComponent } from '../shared/message-bell/message-bell.component';
import { MessagingComponent } from '../messaging/messaging.component';

@Component({
  selector: 'app-secretary-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    AppointmentCalendarComponent,
    AppointmentListComponent,
    ProfileComponent,
    NotificationBellComponent,
    MessageBellComponent,
    MessagingComponent
  ],
  templateUrl: './secretary-dashboard.component.html',
  styles: [`
    /* Add any necessary styles here */
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  `]
})
export class SecretaryDashboardComponent implements OnInit {
  isMenuOpen = true;
  activeSection = 'dashboard';
  isFullscreen = false;
  isProfileDropdownOpen = false;
  secretaryName = 'Secretary';
  profileImage = 'assets/images/default-avatar.png';
  
  // Stats counters
  todayAppointments = 0;
  pendingAppointments = 0;
  totalAppointments = 0;
  
  constructor() {}
  
  ngOnInit(): void {
    // Load initial data
  }
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }
  
  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }
  
  showDashboard(): void {
    this.activeSection = 'dashboard';
  }
  
  showProfile(): void {
    this.activeSection = 'profile';
  }
  
  showAppointments(): void {
    this.activeSection = 'appointments';
  }
  
  showMessaging(): void {
    this.activeSection = 'messaging';
  }
  
  logout(): void {
    // Implement logout
  }
} 