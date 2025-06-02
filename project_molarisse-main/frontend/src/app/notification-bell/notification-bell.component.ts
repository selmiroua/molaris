import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../core/services/notification.service';
import { Router } from '@angular/router';

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
    <div class="notification-bell">
      <button mat-icon-button [matMenuTriggerFor]="notificationMenu" aria-label="Notifications" class="bell-button">
        <mat-icon
          [matBadge]="unreadCount"
          [matBadgeHidden]="unreadCount === 0"
          matBadgeSize="small"
          matBadgeColor="warn"
          matBadgeOverlap="true">
          notifications
        </mat-icon>
      </button>
      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="notification-header">
          <h3>Notifications</h3>
          <button mat-button *ngIf="notifications.length > 0 && hasUnread" 
                  (click)="markAllAsRead(); $event.stopPropagation()">
            Tout marquer comme lu
          </button>
        </div>
        
        <div class="notification-list">
          <div *ngIf="loading" class="notification-loading">
            Chargement...
          </div>
          
          <div *ngIf="!loading && notifications.length === 0" class="no-notifications">
            Aucune notification
          </div>
          
          <div *ngFor="let notification of notifications" 
               class="notification-item"
               [class.unread]="!notification.read"
               (click)="openNotification(notification)">
            <div class="notification-content">
              <div class="notification-message">
                {{ notification.message }}
              </div>
              <div class="notification-time">
                {{ formatDate(notification.createdAt) }}
              </div>
            </div>
            <button mat-icon-button
                    class="mark-read-button"
                    *ngIf="!notification.read"
                    (click)="markAsRead(notification); $event.stopPropagation()"
                    title="Marquer comme lu">
              <mat-icon>done</mat-icon>
            </button>
          </div>
        </div>
      </mat-menu>
    </div>
  `,
  styles: [`
    .notification-bell {
      display: inline-block;
      position: relative;
    }
    
    .bell-button {
      color: #378392;
      transition: all 0.2s ease;
      
      &:hover {
        color: #205a63;
      }
      
      .mat-icon {
        font-size: 24px;
        height: 24px;
        width: 24px;
      }
    }
    
    ::ng-deep .notification-menu {
      max-width: 350px !important;
      max-height: 500px !important;
      
      .mat-mdc-menu-content {
        padding: 0 !important;
      }
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #e0e0e0;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    }
    
    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .notification-loading, .no-notifications {
      padding: 20px;
      text-align: center;
      color: #757575;
    }
    
    .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      &.unread {
        background-color: #e3f2fd;
        
        &:hover {
          background-color: #bbdefb;
        }
      }
    }
    
    .notification-content {
      flex: 1;
      min-width: 0;
    }
    
    .notification-message {
      font-size: 14px;
      margin-bottom: 4px;
      white-space: normal;
      word-break: break-word;
    }
    
    .notification-time {
      font-size: 12px;
      color: #757575;
    }
    
    .mark-read-button {
      margin-left: 8px;
      
      .mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit {
  notifications: any[] = [];
  unreadCount = 0;
  loading = true;
  hasUnread = false;
  
  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadNotifications();
  }
  
  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
        this.hasUnread = this.unreadCount > 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });
  }
  
  markAsRead(notification: any): void {
    if (notification.read) return;
    
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.hasUnread = this.unreadCount > 0;
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }
  
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.hasUnread = false;
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }
  
  openNotification(notification: any): void {
    // Mark as read
    this.markAsRead(notification);
    
    // Navigate to the link if provided
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }
}
