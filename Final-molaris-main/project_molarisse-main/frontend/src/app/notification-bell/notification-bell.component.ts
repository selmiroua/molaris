import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../core/services/notification.service';
import { TimeAgoPipe } from '../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    TimeAgoPipe
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notificationMenu" class="notification-button">
      <mat-icon [matBadge]="unreadCount" [matBadgeHidden]="unreadCount === 0" matBadgeColor="warn">
        notifications
      </mat-icon>
    </button>
    <mat-menu #notificationMenu="matMenu" class="notifications-menu">
      <div class="notifications-header">
        <h3>Notifications</h3>
      </div>
      <div class="notifications-list">
        <div *ngFor="let notification of notifications" class="notification-item">
          <mat-icon [ngClass]="getIconClass(notification)">{{ getIcon(notification) }}</mat-icon>
          <div class="notification-content">
            <p>{{ notification.message }}</p>
            <span class="notification-time">{{ notification.time | timeAgo }}</span>
          </div>
          <div *ngIf="!notification.read" class="notification-status"></div>
        </div>
        <div *ngIf="notifications.length === 0" class="no-notifications">
          <p>Aucune notification</p>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [`
    .notification-button {
      position: relative;
    }

    .notifications-menu {
      min-width: 300px;
      max-width: 350px;
    }

    .notifications-header {
      padding: 15px;
      border-bottom: 1px solid #eee;

      h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.3s ease;
      position: relative;

      &:hover {
        background-color: #f5f6fa;
      }

      mat-icon {
        margin-right: 12px;
        margin-top: 2px;
      }

      .notification-content {
        flex: 1;

        p {
          margin: 0 0 5px;
          font-size: 14px;
          color: #333;
        }

        .notification-time {
          font-size: 12px;
          color: #666;
        }
      }

      .notification-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4a6fa5;
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    .no-notifications {
      padding: 20px;
      text-align: center;
      color: #666;
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
    
    .user-icon {
      color: #00bcd4;
    }
    
    .default-icon {
      color: #4a6fa5;
    }
  `]
})
export class NotificationBellComponent implements OnInit {
  unreadCount = 0;
  notifications: any[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications: any[]) => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
      }
    });
  }
  
  getIcon(notification: any): string {
    if (notification.icon) return notification.icon;
    if (!notification.type) return 'notifications';
    
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
      case 'USER_REGISTERED':
        return 'person';
      case 'USER_VERIFIED':
        return 'verified_user';
      default:
        return 'notifications';
    }
  }
  
  getIconClass(notification: any): string {
    if (!notification.type) return 'default-icon';
    
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
      case 'USER_REGISTERED':
      case 'USER_VERIFIED':
        return 'user-icon';
      default:
        return 'default-icon';
    }
  }
} 