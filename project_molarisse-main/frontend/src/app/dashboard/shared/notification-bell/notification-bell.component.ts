import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notificationMenu" aria-label="Notifications">
      <mat-icon [matBadge]="unreadCount > 0 ? unreadCount : null" matBadgeColor="warn">notifications</mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header">
        <h3>Notifications</h3>
        <button mat-button (click)="markAllAsRead()" *ngIf="unreadCount > 0">Tout marquer comme lu</button>
      </div>
      <mat-divider></mat-divider>
      
      <div class="notification-list">
        <div *ngIf="notifications.length === 0" class="no-notifications">
          Pas de notifications
        </div>
        
        <div *ngFor="let notification of notifications" 
             class="notification-item" 
             [class.unread]="!notification.read"
             (click)="handleNotificationClick(notification)">
          <div class="notification-content">
            <mat-icon [ngClass]="getIconClass(notification)">{{ getIcon(notification) }}</mat-icon>
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>
          <mat-divider></mat-divider>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [`
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
    }
    
    .notification-header h3 {
      margin: 0;
    }
    
    .notification-list {
      max-height: 350px;
      overflow-y: auto;
    }
    
    .notification-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .notification-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .notification-item.unread {
      background-color: rgba(33, 150, 243, 0.08);
    }
    
    .notification-content {
      display: flex;
      align-items: flex-start;
    }
    
    .notification-content mat-icon {
      margin-right: 12px;
      margin-top: 2px;
    }
    
    .notification-message {
      flex: 1;
      font-size: 14px;
    }
    
    .notification-time {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      margin-left: 8px;
      white-space: nowrap;
    }
    
    .no-notifications {
      padding: 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .new-appointment-icon {
      color: #4caf50;
    }
    
    .updated-appointment-icon {
      color: #2196f3;
    }
    
    .canceled-appointment-icon {
      color: #f44336;
    }
    
    .secretary-application-icon {
      color: #9c27b0;
    }
    
    .secretary-response-icon {
      color: #3f51b5;
    }
    
    .secretary-removed-icon {
      color: #ff9800;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  private refreshSubscription: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initial load
    this.loadNotifications();
    
    // Refresh notifications every 30 seconds
    this.refreshSubscription = interval(30000).pipe(
      switchMap(() => this.notificationService.getUnreadCount())
    ).subscribe(count => {
      if (count !== this.unreadCount) {
        this.loadNotifications();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.notificationService.getUnreadNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.length;
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
    });
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.unreadCount--;
      });
    }
    
    // Navigate to the appropriate page based on the link
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  getIcon(notification: Notification): string {
    switch (notification.type) {
      case 'NEW_APPOINTMENT':
        return 'event_available';
      case 'APPOINTMENT_UPDATED':
        return 'event_note';
      case 'APPOINTMENT_CANCELED':
        return 'event_busy';
      case 'SECRETARY_APPLICATION':
        return 'person_add';
      case 'SECRETARY_APPLICATION_RESPONSE':
        return 'how_to_reg';
      case 'SECRETARY_REMOVED':
        return 'person_remove';
      default:
        return 'notifications';
    }
  }

  getIconClass(notification: Notification): string {
    switch (notification.type) {
      case 'NEW_APPOINTMENT':
        return 'new-appointment-icon';
      case 'APPOINTMENT_UPDATED':
        return 'updated-appointment-icon';
      case 'APPOINTMENT_CANCELED':
        return 'canceled-appointment-icon';
      case 'SECRETARY_APPLICATION':
        return 'secretary-application-icon';
      case 'SECRETARY_APPLICATION_RESPONSE':
        return 'secretary-response-icon';
      case 'SECRETARY_REMOVED':
        return 'secretary-removed-icon';
      default:
        return '';
    }
  }

  formatTime(time: any): string {
    if (!time) return '';
    
    // Handle array format from backend [year, month, day, hour, minute, second]
    if (Array.isArray(time)) {
      const [year, month, day, hour, minute] = time;
      const date = new Date(year, month - 1, day, hour, minute);
      return this.getRelativeTime(date);
    }
    
    // Handle ISO string
    return this.getRelativeTime(new Date(time));
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    return date.toLocaleDateString();
  }
} 