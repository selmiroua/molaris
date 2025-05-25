import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MessagingService, Conversation } from '../../core/services/messaging.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  template: `
    <div class="conversations-container">
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading && conversations.length === 0" class="empty-state">
        <mat-icon>forum</mat-icon>
        <p>Aucune conversation</p>
        <p class="empty-subtitle">Commencez une nouvelle conversation avec un utilisateur</p>
      </div>
      
      <div *ngIf="!loading && conversations.length > 0" class="conversation-list">
        <div *ngFor="let conversation of conversations"
             (click)="selectConversation(conversation.partnerId)"
             [attr.data-partner-id]="conversation.partnerId"
             class="conversation-item"
             [class.unread]="conversation.unreadCount > 0"
             [class.active]="conversation.partnerId === activeConversationId">
          
          <div class="conversation-avatar">
            <div class="user-initial" *ngIf="!conversation.profilePicture">
              {{ getInitials(conversation.partnerName) }}
            </div>
            <img *ngIf="conversation.profilePicture" [src]="getProfileImageUrl(conversation.profilePicture)" alt="{{ conversation.partnerName }}">
            
            <div class="online-status" [class.online]="true"></div>
          </div>
          
          <div class="conversation-content">
            <div class="conversation-header">
              <span class="conversation-name">{{ conversation.partnerName }}</span>
              <span class="conversation-time">{{ formatTime(conversation.lastMessageTime) }}</span>
            </div>
            
            <div class="conversation-preview">
              <span *ngIf="conversation.isLastMessageMine" class="sent-indicator">
                <mat-icon>done</mat-icon>
              </span>
              <span class="message-preview" [class.unread-preview]="conversation.unreadCount > 0">
                {{ truncateMessage(conversation.lastMessageContent) }}
              </span>
              
              <div *ngIf="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount > 9 ? '9+' : conversation.unreadCount }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="refresh-button">
        <button mat-mini-fab color="primary" (click)="loadConversations()">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .conversations-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      height: 100%;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.2);
    }
    
    .empty-state p {
      margin: 0;
      color: rgba(0, 0, 0, 0.5);
      font-size: 18px;
    }
    
    .empty-subtitle {
      font-size: 14px !important;
      color: rgba(0, 0, 0, 0.4) !important;
      margin-top: 8px !important;
    }
    
    .conversation-list {
      overflow-y: auto;
      flex-grow: 1;
      padding: 0 6px;
    }
    
    .conversation-item {
      display: flex;
      padding: 12px 16px;
      margin: 4px 0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .conversation-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .conversation-item.active {
      background-color: rgba(67, 97, 238, 0.08);
    }
    
    .conversation-item.unread {
      background-color: rgba(67, 97, 238, 0.05);
    }
    
    .conversation-avatar {
      position: relative;
      margin-right: 14px;
      flex-shrink: 0;
    }
    
    .user-initial {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #4361ee;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 18px;
    }
    
    .conversation-avatar img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .online-status {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ccc;
      bottom: 2px;
      right: 2px;
      border: 2px solid white;
    }
    
    .online-status.online {
      background-color: #43a047;
    }
    
    .conversation-content {
      flex-grow: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .conversation-name {
      font-weight: 500;
      font-size: 15px;
      color: rgba(0, 0, 0, 0.85);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .conversation-time {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      white-space: nowrap;
    }
    
    .conversation-preview {
      display: flex;
      align-items: center;
      position: relative;
      min-width: 0;
    }
    
    .sent-indicator {
      margin-right: 4px;
      display: flex;
      align-items: center;
    }
    
    .sent-indicator mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      color: rgba(0, 0, 0, 0.4);
    }
    
    .message-preview {
      color: rgba(0, 0, 0, 0.55);
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
      padding-right: 25px;
    }
    
    .unread-preview {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.75);
    }
    
    .unread-badge {
      position: absolute;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      border-radius: 10px;
      background-color: #4361ee;
      color: white;
      font-size: 11px;
      padding: 0 5px;
    }
    
    .refresh-button {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 10;
    }
  `]
})
export class ConversationListComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  loading = true;
  private refreshSubscription: Subscription | undefined;
  activeConversationId: number | null = null;
  
  @Output() conversationSelected = new EventEmitter<number>();
  
  constructor(
    private messagingService: MessagingService,
    public router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadConversations();
    
    // Check for active conversation from URL
    const urlParts = this.router.url.split('/');
    const potentialId = urlParts[urlParts.length - 1];
    if (potentialId && !isNaN(Number(potentialId))) {
      this.activeConversationId = Number(potentialId);
    }
    
    // Refresh conversations every 15 seconds
    this.refreshSubscription = interval(15000)
      .pipe(switchMap(() => this.messagingService.getConversations()))
      .subscribe(conversations => {
        this.conversations = this.sortConversations(conversations);
      });
  }
  
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  loadConversations(): void {
    this.loading = true;
    this.messagingService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = this.sortConversations(conversations);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loading = false;
      }
    });
  }
  
  sortConversations(conversations: Conversation[]): Conversation[] {
    return conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }
  
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.split(' ');
    if (parts.length === 1) {
      return name.charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  formatTime(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'maintenant';
    } else if (diffMins < 60) {
      return `${diffMins} min`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays === 1) {
      return 'hier';
    } else if (diffDays < 7) {
      return `${diffDays}j`;
    } else {
      // Format as date for older messages
      return `${messageDate.getDate()}/${messageDate.getMonth() + 1}`;
    }
  }
  
  truncateMessage(message: string): string {
    if (!message) return '';
    return message.length > 30 ? message.substring(0, 30) + '...' : message;
  }
  
  getRoleBadge(role: string): string {
    switch (role?.toLowerCase()) {
      case 'doctor':
      case 'medecin':
      case 'docteur':
        return 'Médecin';
      case 'patient':
        return 'Patient';
      case 'secretaire':
      case 'secretary':
        return 'Secrétaire';
      case 'admin':
        return 'Admin';
      default:
        return role || 'Utilisateur';
    }
  }
  
  getProfileImageUrl(profilePicturePath?: string): string {
    if (!profilePicturePath) return '';
    
    // Check if it's a full URL
    if (profilePicturePath.startsWith('http')) {
      return profilePicturePath;
    }
    
    // Check if it's a relative path to assets
    if (profilePicturePath.startsWith('/assets')) {
      return profilePicturePath;
    }
    
    // Otherwise, prepend the API URL
    return `${environment.apiUrl}${profilePicturePath}`;
  }
  
  selectConversation(partnerId: number): void {
    this.activeConversationId = partnerId;
    this.conversationSelected.emit(partnerId);
  }
} 