import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MessagingService } from '../../core/services/messaging.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-message-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule
  ],
  template: `
    <div class="message-bell">
      <button mat-icon-button [matMenuTriggerFor]="messageMenu" aria-label="Messages" class="bell-button">
        <mat-icon
          [matBadge]="unreadCount"
          [matBadgeHidden]="unreadCount === 0"
          matBadgeSize="small"
          matBadgeColor="warn"
          matBadgeOverlap="true">
          email
        </mat-icon>
      </button>
      <mat-menu #messageMenu="matMenu" class="message-menu">
        <div class="message-header">
          <h3>Messages</h3>
          <button mat-button routerLink="/dashboard/messaging">
            Voir tous les messages
          </button>
        </div>
        
        <div class="message-list">
          <div *ngIf="loading" class="message-loading">
            Chargement...
          </div>
          
          <div *ngIf="!loading && conversations.length === 0" class="no-messages">
            <p>Aucun message</p>
            <button mat-button color="primary" routerLink="/dashboard/messaging">
              Démarrer une conversation
            </button>
          </div>
          
          <div *ngFor="let conversation of conversations" 
               class="message-item"
               [class.unread]="conversation.unreadCount > 0"
               (click)="openConversation(conversation)">
            <div class="avatar">
              <img *ngIf="conversation.profilePicture" [src]="conversation.profilePicture" alt="Photo de profil">
              <div *ngIf="!conversation.profilePicture" class="avatar-placeholder">
                {{ conversation.partnerName.charAt(0) }}
              </div>
            </div>
            <div class="message-content">
              <div class="message-sender">
                {{ conversation.partnerName }}
                <span *ngIf="conversation.unreadCount > 0" class="unread-badge">
                  {{ conversation.unreadCount }}
                </span>
              </div>
              <div class="message-preview">
                <span *ngIf="conversation.isLastMessageMine">Vous: </span>
                {{ conversation.lastMessageContent | slice:0:30 }}{{ conversation.lastMessageContent.length > 30 ? '...' : '' }}
              </div>
              <div class="message-time">
                {{ formatDate(conversation.lastMessageTime) }}
              </div>
            </div>
          </div>
        </div>
      </mat-menu>
    </div>
  `,
  styles: [`
    .message-bell {
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
    
    ::ng-deep .message-menu {
      max-width: 350px !important;
      max-height: 500px !important;
      
      .mat-mdc-menu-content {
        padding: 0 !important;
      }
    }
    
    .message-header {
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
    
    .message-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .message-loading, .no-messages {
      padding: 20px;
      text-align: center;
      color: #757575;
      
      p {
        margin: 0 0 10px 0;
      }
      
      button {
        margin: 10px auto 0;
      }
    }
    
    .message-item {
      display: flex;
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
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 12px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        background-color: #378392;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 500;
      }
    }
    
    .message-content {
      flex: 1;
      min-width: 0;
    }
    
    .message-sender {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
    }
    
    .unread-badge {
      background-color: #f44336;
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 8px;
    }
    
    .message-preview {
      font-size: 13px;
      color: #616161;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    
    .message-time {
      font-size: 12px;
      color: #9e9e9e;
    }
  `]
})
export class MessageBellComponent implements OnInit {
  conversations: any[] = [];
  unreadCount = 0;
  loading = true;
  
  constructor(private messagingService: MessagingService) {}
  
  ngOnInit(): void {
    this.loadConversations();
    
    // Subscribe to unread count updates
    this.messagingService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }
  
  loadConversations(): void {
    this.loading = true;
    this.messagingService.getConversations().subscribe({
      next: (conversations) => {
        // Process profile pictures before assigning to the conversations array
        this.conversations = conversations.slice(0, 5).map(conversation => {
          if (conversation.profilePicture) {
            conversation.profilePicture = this.getProfileImageUrl(conversation.profilePicture);
          }
          return conversation;
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loading = false;
      }
    });
  }
  
  openConversation(conversation: any): void {
    // Navigate to the conversation using the router
    if (conversation && conversation.partnerId) {
      window.location.href = `/dashboard/messaging/${conversation.partnerId}`;
    } else {
      window.location.href = `/dashboard/messaging`;
    }
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    if (messageDateOnly.getTime() === today.getTime()) {
      // Today, show time only
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDateOnly.getTime() === yesterday.getTime()) {
      // Yesterday
      return 'Hier';
    } else {
      // Other days, show date only
      return messageDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  }
  
  // Method to get profile image URL
  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Check if it's already a full URL
        if (profilePicturePath.startsWith('http')) {
          return profilePicturePath;
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        // Use environment.apiUrl instead of hardcoding the URL
        return `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    return 'assets/images/default-avatar.png';
  }
}
