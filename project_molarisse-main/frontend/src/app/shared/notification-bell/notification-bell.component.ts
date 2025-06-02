import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule
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
          <mat-icon>{{ notification.icon }}</mat-icon>
          <div class="notification-content">
            <p>{{ notification.message }}</p>
            <span class="notification-time">{{ notification.time | date:'short' }}</span>
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
        color: #4a6fa5;
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
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }
} 