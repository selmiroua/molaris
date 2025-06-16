import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MessagingService, Conversation } from '../../core/services/messaging.service';
import { Subscription, interval, Subject } from 'rxjs';
import { switchMap, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="conversations-container">
      <div *ngIf="loading && !conversations.length" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading && filteredConversations.length === 0" class="empty-state">
        <mat-icon>forum</mat-icon>
        <p>{{ searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation' }}</p>
        <p class="empty-subtitle">
          {{ searchQuery ? 'Essayez une autre recherche' : 'Commencez une nouvelle conversation avec un collègue' }}
        </p>
      </div>
      
      <div *ngIf="refreshing" class="refresh-indicator">
        <mat-spinner diameter="24"></mat-spinner>
        <span>Actualisation...</span>
      </div>
      
      <div class="conversation-list">
        <div *ngFor="let conversation of filteredConversations"
             class="conversation-item"
             [class.unread]="conversation.unreadCount > 0"
             [class.active]="conversation.partnerId === activeConversationId">
          
          <div class="conversation-avatar">
            <div class="user-initial" *ngIf="!conversation.profilePicture">
              {{ getInitials(conversation.partnerName) }}
            </div>
            <img *ngIf="conversation.profilePicture" 
                 [src]="cacheProfileImage(conversation.profilePicture)" 
                 alt="{{ conversation.partnerName }}"
                 (error)="handleImageError($event)">
            
            <div class="online-status" [class.online]="isUserOnline(conversation.partnerId)"></div>
          </div>
          
          <div class="conversation-content" (click)="handleConversationClick($event, conversation.partnerId)">
            <div class="conversation-header">
              <div class="conversation-name-container">
                <span class="conversation-name">{{ conversation.partnerName }}</span>
                <span class="role-badge" [class]="getRoleBadge(conversation.partnerRole)">
                  {{ formatRole(conversation.partnerRole) }}
                </span>
              </div>
              <span class="conversation-time">{{ formatTime(conversation.lastMessageTime) }}</span>
            </div>
            
            <div class="conversation-preview">
              <span *ngIf="conversation.isLastMessageMine" class="sent-indicator">
                <mat-icon [class.read]="true">done_all</mat-icon>
              </span>
              <span class="message-preview" [class.unread-preview]="conversation.unreadCount > 0">
                {{ truncateMessage(conversation.lastMessageContent) }}
              </span>
              
              <div *ngIf="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount > 9 ? '9+' : conversation.unreadCount }}
              </div>
            </div>
          </div>
          
          <button 
            mat-icon-button 
            color="primary"
            class="open-chat-button"
            matTooltip="Ouvrir la conversation"
            (click)="openConversationDirectly($event, conversation.partnerId)">
            <mat-icon>chat</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="refresh-button" *ngIf="!refreshing">
        <button mat-mini-fab color="primary" (click)="loadConversations(true)" matTooltip="Actualiser">
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
    
    .refresh-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background-color: rgba(67, 97, 238, 0.05);
      border-radius: 8px;
      margin: 8px;
      gap: 8px;
    }
    
    .refresh-indicator span {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .conversation-list {
      overflow-y: auto;
      flex-grow: 1;
      padding: 4px 8px;
    }
    
    .conversation-item {
      display: flex;
      padding: 12px 16px;
      margin: 4px 0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      align-items: center;
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
      cursor: pointer;
    }
    
    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .conversation-name-container {
      display: flex;
      align-items: center;
      min-width: 0;
      flex: 1;
    }
    
    .conversation-name {
      font-weight: 500;
      font-size: 15px;
      color: rgba(0, 0, 0, 0.85);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 8px;
    }
    
    .role-badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: 500;
      text-transform: uppercase;
      white-space: nowrap;
    }
    
    .role-badge.doctor {
      background-color: rgba(25, 118, 210, 0.1);
      color: #1976d2;
    }
    
    .role-badge.patient {
      background-color: rgba(67, 160, 71, 0.1);
      color: #43a047;
    }
    
    .role-badge.secretary {
      background-color: rgba(245, 124, 0, 0.1);
      color: #f57c00;
    }
    
    .role-badge.admin {
      background-color: rgba(156, 39, 176, 0.1);
      color: #9c27b0;
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
    
    .sent-indicator mat-icon.read {
      color: #4361ee;
    }
    
    .message-preview {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
    
    .message-preview.unread-preview {
      color: rgba(0, 0, 0, 0.8);
      font-weight: 500;
    }
    
    .unread-badge {
      background-color: #4361ee;
      color: white;
      border-radius: 12px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      font-size: 11px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
    }
    
    .refresh-button {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 10;
    }
    
    .open-chat-button {
      margin-left: 8px;
      color: #4361ee;
    }
    
    .open-chat-button:hover {
      background-color: rgba(67, 97, 238, 0.1);
    }
    
    @media (max-width: 768px) {
      .conversation-item {
        padding: 10px 12px;
      }
      
      .user-initial, .conversation-avatar img {
        width: 40px;
        height: 40px;
      }
      
      .conversation-name {
        font-size: 14px;
      }
      
      .message-preview {
        font-size: 12px;
      }
      
      .refresh-button {
        bottom: 12px;
        right: 12px;
      }
    }
  `]
})
export class ConversationListComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  loading = true;
  refreshing = false;
  private refreshSubscription: Subscription | undefined;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  // Add cache for profile images
  private imageUrlCache: Map<string, string> = new Map();
  private sessionTimestamp: string | null = null;
  
  @Input() activeConversationId: number | null = null;
  @Input() set searchQuery(value: string) {
    this._searchQuery = value;
    this.searchSubject.next(value);
  }
  get searchQuery(): string {
    return this._searchQuery;
  }
  private _searchQuery: string = '';
  
  @Output() conversationSelected = new EventEmitter<number>();
  
  constructor(
    private messagingService: MessagingService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadConversations();
    this.setupAutoRefresh();
    this.setupSearchFilter();
    
    // Listen for manual refresh events
    window.addEventListener('refresh-conversations', () => {
      this.loadConversations(true);
    });
  }
  
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    
    window.removeEventListener('refresh-conversations', () => {
      this.loadConversations(true);
    });
  }
  
  private setupSearchFilter(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterConversations(query);
    });
  }
  
  private setupAutoRefresh(): void {
    // Auto refresh every 30 seconds
    this.refreshSubscription = interval(30000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        // Only refresh in background if not already refreshing
        if (!this.refreshing) {
          return this.messagingService.getConversations();
        }
        return [];
      })
    ).subscribe(conversations => {
      if (conversations.length > 0) {
        this.updateConversations(conversations);
      }
    });
  }
  
  loadConversations(showRefreshing: boolean = false): void {
    if (showRefreshing) {
      this.refreshing = true;
    } else if (!this.conversations.length) {
      this.loading = true;
    }
    
    this.messagingService.getConversations().subscribe({
      next: (conversations) => {
        this.updateConversations(conversations);
        // Use setTimeout to push these state changes to the next change detection cycle
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
        });
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        // Use setTimeout to push these state changes to the next change detection cycle
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
        });
      }
    });
  }
  
  private updateConversations(conversations: Conversation[]): void {
    this.conversations = this.sortConversations(conversations);
    this.filterConversations(this.searchQuery);
  }
  
  private filterConversations(query: string): void {
    if (!query || query.trim() === '') {
      this.filteredConversations = [...this.conversations];
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    this.filteredConversations = this.conversations.filter(conv => 
      conv.partnerName.toLowerCase().includes(lowerQuery) || 
      conv.lastMessageContent.toLowerCase().includes(lowerQuery)
    );
  }
  
  sortConversations(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => {
      // First sort by unread count
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Then sort by last message time
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }
  
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  
  formatTime(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(messageDate.getTime())) {
      console.warn('Invalid date:', date);
      return '';
    }
    
    // Same day
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    
    // This week (within 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 6);
    if (messageDate >= oneWeekAgo) {
      const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
      return messageDate.toLocaleDateString(undefined, options);
    }
    
    // This year
    if (messageDate.getFullYear() === now.getFullYear()) {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return messageDate.toLocaleDateString(undefined, options);
    }
    
    // Different year
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return messageDate.toLocaleDateString(undefined, options);
  }
  
  truncateMessage(message: string): string {
    if (!message) return 'Nouvelle conversation';
    
    // If message is already short enough
    if (message.length <= 35) return message;
    
    // Truncate and add ellipsis
    return message.substring(0, 32) + '...';
  }
  
  formatRole(role: string): string {
    if (!role) return '';
    
    // Handle both string and object role formats
    let roleName = typeof role === 'string' ? role : (role as any).nom || '';
    roleName = roleName.toLowerCase();
    
    switch (roleName) {
      case 'doctor':
      case 'médecin':
      case 'medecin':
        return 'Médecin';
      case 'patient':
        return 'Patient';
      case 'secretary':
      case 'secrétaire':
      case 'secretaire':
        return 'Secrétaire';
      case 'admin':
      case 'administrator':
      case 'administrateur':
        return 'Admin';
      default:
        return roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
  }
  
  getRoleBadge(role: string): string {
    if (!role) return '';
    
    // Handle both string and object role formats
    let roleName = typeof role === 'string' ? role : (role as any).nom || '';
    roleName = roleName.toLowerCase();
    
    if (roleName.includes('doctor') || roleName.includes('médecin') || roleName.includes('medecin')) {
      return 'doctor';
    } else if (roleName.includes('patient')) {
      return 'patient';
    } else if (roleName.includes('secretary') || roleName.includes('secrétaire') || roleName.includes('secretaire')) {
      return 'secretary';
    } else if (roleName.includes('admin') || roleName.includes('administrator') || roleName.includes('administrateur')) {
      return 'admin';
    }
    
    return '';
  }
  
  // Get a stable timestamp for the session
  private getCacheKey(): string {
    if (!this.sessionTimestamp) {
      this.sessionTimestamp = new Date().getTime().toString();
    }
    return this.sessionTimestamp;
  }
  
  // Cache profile images to prevent redundant requests
  cacheProfileImage(path: string): string {
    const cacheKey = `profile:${path}`;
    if (!this.imageUrlCache.has(cacheKey)) {
      const url = this.getProfileImageUrl(path);
      this.imageUrlCache.set(cacheKey, url);
    }
    return this.imageUrlCache.get(cacheKey) || '';
  }
  
  getProfileImageUrl(profilePicturePath?: string): string {
    if (!profilePicturePath) return '/assets/images/default-avatar.png';
    
    // Check if the path is a full URL
    if (profilePicturePath.startsWith('http')) {
      return profilePicturePath;
    }
    
    // Use a fixed timestamp per session
    const timestamp = this.getCacheKey();
    
    // Handle different path formats
    if (profilePicturePath.includes('/')) {
      // It's already a path
      return `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
    } else {
      // It's just a filename
      return `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${profilePicturePath}?t=${timestamp}`;
    }
  }
  
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-avatar.png';
  }
  
  isUserOnline(userId: number): boolean {
    // For now, return false until we implement real online status
    return false;
  }
  
  handleConversationClick(event: Event, partnerId: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!partnerId) {
      console.error('Invalid partner ID:', partnerId);
      return;
    }
    
    console.log('Conversation clicked with partner ID:', partnerId);
    this.activeConversationId = partnerId;
    this.conversationSelected.emit(partnerId);
    this.cdr.detectChanges();
  }
  
  selectConversation(partnerId: number): void {
    if (!partnerId) {
      console.error('Invalid partner ID:', partnerId);
      return;
    }
    
    console.log('Selecting conversation with partner ID:', partnerId);
    this.activeConversationId = partnerId;
    this.conversationSelected.emit(partnerId);
    this.cdr.detectChanges();
  }
  
  openConversationDirectly(event: Event, partnerId: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!partnerId) {
      console.error('Invalid partner ID:', partnerId);
      return;
    }
    
    console.log('Opening conversation directly with partner ID:', partnerId);
    this.activeConversationId = partnerId;
    
    // Emit the event to the parent component
    this.conversationSelected.emit(partnerId);
    
    // Ensure the conversation is visible by directly manipulating the DOM
    // This is a fallback in case the parent component doesn't handle the event correctly
    setTimeout(() => {
      // Try to find and show the conversation detail container
      const conversationDetailContainer = document.querySelector('.conversation-detail-container');
      if (conversationDetailContainer) {
        (conversationDetailContainer as HTMLElement).style.display = 'block';
      }
      
      // Try to hide the empty state
      const emptyConversation = document.querySelector('.empty-conversation');
      if (emptyConversation) {
        (emptyConversation as HTMLElement).style.display = 'none';
      }
    }, 100);
  }
} 
