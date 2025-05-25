import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessagingService, Message } from '../../core/services/messaging.service';
import { UserService } from '../../core/services/user.service';
import { Subscription, interval, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-conversation-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="conversation-container">
      <!-- Header -->
      <div class="conversation-header">
        <div class="conversation-partner">
          <div *ngIf="!partnerProfilePicture" class="avatar-placeholder">
            {{ getInitials(partnerName) }}
          </div>
          <img *ngIf="partnerProfilePicture" [src]="getProfileImageUrl(partnerProfilePicture)" alt="{{ partnerName }}" (error)="handleImageError($event)">
          <div class="partner-info">
            <h2>{{ partnerName }}</h2>
            <span class="partner-status">{{ partnerRole }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-icon-button>
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
      </div>
      
      <!-- Messages -->
      <div class="messages-container" #messagesContainer (scroll)="onScroll()">
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        
        <div *ngIf="!loading && messages.length === 0" class="empty-state">
          <mat-icon>chat</mat-icon>
          <p>Aucun message</p>
          <p class="empty-subtitle">Commencez la conversation dès maintenant</p>
        </div>
        
        <div *ngIf="!loading && messages.length > 0" class="messages-list">
          <div *ngFor="let message of messages; let i = index" 
               class="message-wrapper"
               [class.my-message]="message.isMine"
               [class.first-of-group]="isFirstMessageOfGroup(message, i)"
               [class.last-of-group]="isLastMessageOfGroup(message, i)">
            
            <div class="message-bubble" [class.my-bubble]="message.isMine">
              <div class="message-sender" *ngIf="!message.isMine && isFirstMessageOfGroup(message, i)">
                {{ message.senderName || partnerName }}
              </div>
              <div class="message-content">
                <!-- Image message -->
                <img *ngIf="message.mediaType === 'IMAGE' && message.mediaPath" 
                     [src]="getMediaUrl(message.mediaPath)" 
                     alt="Image partagée" 
                     (error)="handleImageError($event)"
                     (click)="openImagePreview(message.mediaPath)"
                     class="message-image">
                
                <!-- Voice message -->
                <div *ngIf="message.mediaType === 'VOICE' && message.mediaPath" class="voice-message">
                  <mat-icon class="voice-icon">mic</mat-icon>
                  <audio controls (error)="handleAudioError($event)" preload="metadata">
                    <source [src]="getMediaUrl(message.mediaPath)" [type]="getContentType(message.mediaPath)">
                    <span>Votre navigateur ne supporte pas les fichiers audio.</span>
                  </audio>
                  <small *ngIf="message.content" class="audio-caption">{{message.content}}</small>
                  <button mat-button color="primary" class="retry-button" (click)="retryAudioLoad($event, message.mediaPath)">
                    <mat-icon>refresh</mat-icon> Réessayer
                  </button>
                </div>
                
                <!-- Text message -->
                <span *ngIf="!message.mediaType" class="message-text">{{ message.content }}</span>
              </div>
              <div class="message-time" [matTooltip]="formatFullDate(message.sentAt)">
                <!-- Debug date info -->
                <span *ngIf="testMode" class="debug-date">
                  {{getDateDebugInfo(message.sentAt)}}
                </span>
                <!-- Regular display -->
                {{ formatMessageDate(message.sentAt) }}
                <mat-icon *ngIf="message.isMine && message.isRead" class="read-icon">done_all</mat-icon>
                <mat-icon *ngIf="message.isMine && !message.isRead" class="unread-icon">done</mat-icon>
              </div>
            </div>
            
            <div *ngIf="message.isMine" class="avatar-placeholder my-avatar" [style.visibility]="isLastMessageOfGroup(message, i) ? 'visible' : 'hidden'">
              <div *ngIf="isLastMessageOfGroup(message, i)">{{ getInitials('Moi') }}</div>
            </div>
            
            <div *ngIf="!message.isMine" class="avatar-placeholder partner-avatar" [style.visibility]="isLastMessageOfGroup(message, i) ? 'visible' : 'hidden'">
              <div *ngIf="isLastMessageOfGroup(message, i) && !message.senderProfilePicture">
                {{ getInitials(message.senderName || partnerName) }}
              </div>
              <img *ngIf="isLastMessageOfGroup(message, i) && message.senderProfilePicture" 
                   [src]="getProfileImageUrl(message.senderProfilePicture)" 
                   alt="{{ message.senderName || partnerName }}"
                   (error)="handleImageError($event)">
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scroll to bottom button -->
      <button 
        *ngIf="showScrollButton" 
        mat-mini-fab 
        class="scroll-bottom-button"
        (click)="scrollToBottom(true)">
        <mat-icon>keyboard_arrow_down</mat-icon>
      </button>
      
      <!-- Message Input -->
      <div class="message-input-container">
        <!-- Voice recording section -->
        <div *ngIf="isRecording" class="recording-container">
          <div class="recording-indicator">
            <mat-icon>mic</mat-icon>
            <span>{{ recordingDuration }}</span>
            <div class="recording-blob"></div>
          </div>
          <button 
            mat-mini-fab 
            color="warn" 
            class="recording-button"
            (click)="stopRecording()">
            <mat-icon>stop</mat-icon>
          </button>
        </div>

        <!-- Normal input section -->
        <div *ngIf="!isRecording" class="normal-input-container">
          <button 
            mat-icon-button 
            class="attachment-button" 
            (click)="fileInput.click()">
            <mat-icon>attach_file</mat-icon>
          </button>
          <input 
            #fileInput 
            type="file" 
            hidden 
            accept="image/*" 
            (change)="onFileSelected($event)">
          
          <button 
            mat-icon-button 
            class="mic-button" 
            (click)="startRecording()">
            <mat-icon>mic</mat-icon>
          </button>
          
          <div class="message-input-field">
            <textarea 
              [(ngModel)]="newMessage" 
              placeholder="Tapez votre message..." 
              [rows]="1"
              (keydown)="handleKeyDown($event)"
              #messageInput></textarea>
          </div>
          
          <button 
            mat-mini-fab
            color="primary" 
            class="send-button" 
            [disabled]="!newMessage?.trim() && !selectedFile && !audioBlob" 
            (click)="sendMessage()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .conversation-container {
      height: calc(100vh - 64px); /* Fixed height minus header */
      display: flex;
      flex-direction: column;
      background-color: #fff;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      
      @media (max-width: 768px) {
        height: calc(100vh - 40px);
        border-radius: 8px;
      }
    }
    
    .conversation-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #4361ee;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 2;
      height: 72px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      
      @media (max-width: 768px) {
        padding: 12px;
        height: 64px;
      }
      
      @media (max-width: 480px) {
        padding: 10px;
        height: 56px;
      }
    }
    
    .conversation-partner {
      display: flex;
      align-items: center;
    }
    
    .partner-info {
      margin-left: 12px;
      
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
        
        @media (max-width: 480px) {
          font-size: 16px;
        }
      }
      
      .partner-status {
        font-size: 13px;
        opacity: 0.8;
        
        @media (max-width: 480px) {
          font-size: 12px;
        }
      }
    }
    
    .avatar-placeholder, img {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      color: #fff;
      font-size: 16px;
      background-color: #64748b;
      flex-shrink: 0;
      
      @media (max-width: 480px) {
        width: 36px;
        height: 36px;
        font-size: 14px;
      }
    }
    
    .header-actions {
      display: flex;
    }
    
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background-color: #f8fafc;
      position: relative;
      
      @media (max-width: 768px) {
        padding: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 10px;
      }
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
      text-align: center;
      
      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin-bottom: 16px;
        
        @media (max-width: 480px) {
          font-size: 36px;
          height: 36px;
          width: 36px;
        }
      }
      
      p {
        margin: 0;
        font-size: 18px;
        
        @media (max-width: 480px) {
          font-size: 16px;
        }
        
        &.empty-subtitle {
          margin-top: 8px;
          font-size: 14px;
          opacity: 0.7;
          
          @media (max-width: 480px) {
            font-size: 12px;
          }
        }
      }
    }
    
    .message-wrapper {
      display: flex;
      margin-bottom: 8px;
      position: relative;
      
      &.my-message {
        justify-content: flex-end;
      }
      
      &.first-of-group {
        margin-top: 16px;
        
        @media (max-width: 480px) {
          margin-top: 12px;
        }
      }
      
      &.last-of-group {
        margin-bottom: 16px;
        
        @media (max-width: 480px) {
          margin-bottom: 12px;
        }
      }
    }
    
    .message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      background-color: #e2e8f0;
      position: relative;
      
      @media (max-width: 768px) {
        max-width: 85%;
        padding: 10px 14px;
      }
      
      @media (max-width: 480px) {
        max-width: 90%;
        padding: 8px 12px;
        border-radius: 14px;
      }
      
      &.my-bubble {
        background-color: #4361ee;
        color: white;
        
        .message-time {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }
    
    .message-sender {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
      color: #64748b;
      
      @media (max-width: 480px) {
        font-size: 12px;
        margin-bottom: 2px;
      }
    }
    
    .message-text {
      word-break: break-word;
      white-space: pre-line;
      font-size: 15px;
      
      @media (max-width: 480px) {
        font-size: 14px;
      }
    }
    
    .message-time {
      display: flex;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
      justify-content: flex-end;
      
      .read-icon, .unread-icon {
        font-size: 14px;
        height: 14px;
        width: 14px;
        margin-left: 4px;
      }
      
      .read-icon {
        color: #38bdf8;
      }
      
      .unread-icon {
        opacity: 0.6;
      }
    }
    
    .debug-date {
      font-size: 9px;
      font-family: monospace;
      margin-right: 6px;
      color: #f472b6;
    }
    
    .my-avatar {
      margin-left: 8px;
      background-color: #4361ee;
      
      @media (max-width: 480px) {
        margin-left: 6px;
      }
    }
    
    .partner-avatar {
      margin-right: 8px;
      
      @media (max-width: 480px) {
        margin-right: 6px;
      }
    }
    
    .message-input-container {
      padding: 16px;
      background-color: #fff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      
      @media (max-width: 768px) {
        padding: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 8px;
      }
    }
    
    .normal-input-container {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 8px;
      
      @media (max-width: 480px) {
        gap: 6px;
      }
    }
    
    .message-input-field {
      flex: 1;
      background-color: #f5f5f5;
      border-radius: 24px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      
      @media (max-width: 480px) {
        padding: 6px 12px;
      }
      
      textarea {
        width: 100%;
        border: none;
        background: transparent;
        resize: none;
        outline: none;
        max-height: 120px;
        font-size: 15px;
        
        @media (max-width: 480px) {
          font-size: 14px;
        }
      }
    }
    
    .send-button {
      width: 40px;
      height: 40px;
      min-width: 40px;
      
      @media (max-width: 480px) {
        width: 36px;
        height: 36px;
        min-width: 36px;
        
        mat-icon {
          font-size: 18px;
          height: 18px;
          width: 18px;
          line-height: 18px;
        }
      }
    }
    
    .message-image {
      max-width: 240px;
      max-height: 240px;
      border-radius: 12px;
      cursor: pointer;
      
      @media (max-width: 768px) {
        max-width: 200px;
        max-height: 200px;
      }
      
      @media (max-width: 480px) {
        max-width: 160px;
        max-height: 160px;
      }
    }
    
    .recording-container {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 16px;
      
      @media (max-width: 480px) {
        gap: 8px;
      }
    }
    
    .recording-indicator {
      flex: 1;
      display: flex;
      align-items: center;
      background-color: #fee2e2;
      color: #ef4444;
      padding: 12px 16px;
      border-radius: 24px;
      
      @media (max-width: 480px) {
        padding: 8px 12px;
      }
      
      mat-icon {
        margin-right: 8px;
      }
      
      .recording-blob {
        width: 12px;
        height: 12px;
        background-color: #ef4444;
        border-radius: 50%;
        margin-left: auto;
        animation: pulse 1s infinite;
      }
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
      100% {
        transform: scale(0.8);
        opacity: 0.8;
      }
    }
    
    .voice-message {
      display: flex;
      flex-direction: column;
      width: 100%;
      
      .voice-icon {
        color: #64748b;
        margin-right: 8px;
      }
      
      audio {
        width: 100%;
        max-width: 250px;
        height: 36px;
        margin: 4px 0;
        
        @media (max-width: 480px) {
          height: 32px;
        }
      }
      
      .audio-caption {
        color: #64748b;
        font-size: 12px;
      }
      
      .retry-button {
        margin-top: 4px;
        max-width: 120px;
        line-height: 28px;
        
        @media (max-width: 480px) {
          line-height: 24px;
          font-size: 12px;
        }
      }
    }
    
    .scroll-bottom-button {
      position: absolute;
      right: 16px;
      bottom: 80px;
      z-index: 5;
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      
      @media (max-width: 768px) {
        right: 12px;
        bottom: 70px;
        width: 36px;
        height: 36px;
        min-width: 36px;
        
        mat-icon {
          font-size: 20px;
          height: 20px;
          width: 20px;
          line-height: 20px;
        }
      }
      
      @media (max-width: 480px) {
        right: 10px;
        bottom: 60px;
        width: 32px;
        height: 32px;
        min-width: 32px;
        
        mat-icon {
          font-size: 18px;
          height: 18px;
          width: 18px;
          line-height: 18px;
        }
      }
    }
  `]
})
export class ConversationDetailComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
[x: string]: any;
  @Input() userId: number | null = null;
  partnerId: number = 0;
  partnerName: string = '';
  partnerRole: string = '';
  partnerProfilePicture: string = '';
  messages: Message[] = [];
  loading: boolean = true;
  newMessage: string = '';
  
  selectedFile: File | null = null;
  isRecording: boolean = false;
  recordingDuration: string = '00:00';
  audioBlob: Blob | null = null;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  recordingTimer: any;
  recordingStartTime: number = 0;
  
  // Add test mode flag for debugging
  testMode: boolean = true;
  
  private refreshSubscription: Subscription | undefined;
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;
  
  showScrollButton: boolean = false;
  isScrolledToBottom: boolean = true;
  
  // Add a user cache to avoid repeated API calls
  private userNameCache: Map<number, string> = new Map();
  
  constructor(
    private route: ActivatedRoute,
    private messagingService: MessagingService,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    // Enable test mode for debugging
    this.testMode = true;
    this.setupConversation();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && changes['userId'].currentValue) {
      // Clear existing data
      this.messages = [];
      this.loading = true;
      
      // Load the conversation with the new user
      this.setupConversation();
    }
  }
  
  private setupConversation(): void {
    if (this.userId) {
      this.partnerId = this.userId;
      this.loadConversation();
      this.setupAutoRefresh();
    } else {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.partnerId = parseInt(id, 10);
          this.loadConversation();
          this.setupAutoRefresh();
        }
      });
    }
  }
  
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  ngAfterViewChecked(): void {
    // Only auto-scroll if we were already at the bottom
    if (this.isScrolledToBottom) {
      this.scrollToBottom(false);
    }
  }
  
  private setupAutoRefresh(): void {
    // Refresh messages every 10 seconds (increased from 5 seconds)
    this.refreshSubscription = interval(10000).pipe(
      switchMap(() => this.messagingService.getMessages(this.partnerId))
    ).subscribe(messages => {
      if (messages && messages.length > 0) {
        this.updateMessages(messages);
      }
    });
  }
  
  loadConversation(): void {
    this.loading = true;
    
    // First get partner info
    this.messagingService.getPartnerInfo(this.partnerId).subscribe({
      next: (partnerInfo) => {
        // Log the partner info to see what we're getting from the API
        console.log('Partner info received:', JSON.stringify(partnerInfo, null, 2));
        
        // Extract the name from the backend User entity, trying different possible field names
        if (partnerInfo.nom && partnerInfo.prenom) {
          this.partnerName = `${partnerInfo.prenom} ${partnerInfo.nom}`;
          console.log('Using nom/prenom fields for name:', this.partnerName);
        } else if (partnerInfo.name && !partnerInfo.name.startsWith('User ')) {
          this.partnerName = partnerInfo.name;
          console.log('Using name field:', this.partnerName);
        } else if ((partnerInfo as any).firstName && (partnerInfo as any).lastName) {
          this.partnerName = `${(partnerInfo as any).firstName} ${(partnerInfo as any).lastName}`;
          console.log('Using firstName/lastName fields for name:', this.partnerName);
        } else if ((partnerInfo as any).partnerName && !(partnerInfo as any).partnerName.startsWith('User ')) {
          this.partnerName = (partnerInfo as any).partnerName;
          console.log('Using partnerName field:', this.partnerName);
        } else if ((partnerInfo as any).username) {
          this.partnerName = (partnerInfo as any).username;
          console.log('Using username field:', this.partnerName);
        } else {
          // Fallback to user ID but try to fetch user info from another endpoint
          console.log('Name format includes "User", trying to fetch additional user data');
          
          // Try to get more info about this user from the userService
          this.userService.getUserById(this.partnerId).subscribe({
            next: (userDetails) => {
              if (userDetails && (userDetails.nom || userDetails.prenom)) {
                this.partnerName = `${userDetails.prenom || ''} ${userDetails.nom || ''}`.trim();
                console.log('Retrieved name from userService:', this.partnerName);
                
                // Update the cache with the new name
                this.userNameCache.set(this.partnerId, this.partnerName);
              }
            },
            error: (userError) => {
              console.error('Error fetching additional user details:', userError);
            }
          });
          
          // Keep the User ID format as fallback
          this.partnerName = `User ${this.partnerId}`;
          console.log('Falling back to User ID:', this.partnerName);
        }
        
        // Set the partner role
        this.partnerRole = 'User';
        if (partnerInfo.role) {
          // Check if role is an object with a nom property (backend structure)
          if (typeof partnerInfo.role === 'object' && partnerInfo.role.nom) {
            this.partnerRole = this.getRoleBadge(partnerInfo.role.nom);
            console.log('Using role.nom for role:', this.partnerRole);
          } else {
            // Cast the role to string to fix TypeScript error
            this.partnerRole = this.getRoleBadge(partnerInfo.role as string);
            console.log('Using role string for role:', this.partnerRole);
          }
        } else if ((partnerInfo as any).partnerRole) {
          this.partnerRole = this.getRoleBadge((partnerInfo as any).partnerRole);
          console.log('Using partnerRole field:', this.partnerRole);
        } else if ((partnerInfo as any).userRole) {
          this.partnerRole = this.getRoleBadge((partnerInfo as any).userRole);
          console.log('Using userRole field:', this.partnerRole);
        } else {
          console.log('Falling back to default role:', this.partnerRole);
        }
        
        if (partnerInfo.profilePicture || partnerInfo.profilePicturePath) {
          try {
            this.partnerProfilePicture = this.getProfileImageUrl(partnerInfo.profilePicture || partnerInfo.profilePicturePath);
          } catch (error) {
            console.error('Error setting partner profile picture:', error);
            this.partnerProfilePicture = '';
          }
        }
        
        // Cache the partner name
        this.userNameCache.set(this.partnerId, this.partnerName);
        
        // Then get messages
        this.messagingService.getMessages(this.partnerId).subscribe({
          next: (messages) => {
            this.updateMessages(messages);
            this.loading = false;
            // Scroll to bottom after initial load
            setTimeout(() => this.scrollToBottom(true), 100);
          },
          error: (error) => {
            console.error('Error loading messages:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading partner info:', error);
        this.partnerName = `User ${this.partnerId}`;
        this.partnerRole = 'User';
        this.userNameCache.set(this.partnerId, this.partnerName);
        
        // Try to get more info about this user from the userService as a fallback
        this.userService.getUserById(this.partnerId).subscribe({
          next: (userDetails) => {
            if (userDetails && (userDetails.nom || userDetails.prenom)) {
              this.partnerName = `${userDetails.prenom || ''} ${userDetails.nom || ''}`.trim();
              console.log('Retrieved name from userService in error handler:', this.partnerName);
              
              // Update the cache with the new name
              this.userNameCache.set(this.partnerId, this.partnerName);
            }
          },
          error: (userError) => {
            console.error('Error fetching additional user details in error handler:', userError);
          }
        });
        
        this.messagingService.getMessages(this.partnerId).subscribe({
          next: (messages) => {
            this.updateMessages(messages);
            this.loading = false;
            // Scroll to bottom after initial load
            setTimeout(() => this.scrollToBottom(true), 100);
          },
          error: (error) => {
            console.error('Error loading messages:', error);
            this.loading = false;
          }
        });
      }
    });
  }
  
  updateMessages(messages: Message[]): void {
    if (!messages || !messages.length) {
      this.messages = [];
      return;
    }
    
    // Log raw date format for first message
    this.logMessageDates(messages);
    
    // First log one message to see the format
    if (messages.length > 0) {
      console.log('Sample message date from component:', {
        sentAtType: typeof messages[0].sentAt, 
        sentAtValue: messages[0].sentAt,
        rawMessage: messages[0]
      });
    }
    
    // Make sure all dates are valid
    messages = messages.map(msg => {
      try {
        if (typeof msg.sentAt === 'string') {
          // The backend sends MySQL datetime format: "2025-05-05 23:19:02.000000"
          // Need special handling for this format
          const dateString = msg.sentAt as string;
          
          // Parse MySQL datetime format specifically
          const mysqlDateRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.?(\d*)/;
          const match = dateString.match(mysqlDateRegex);
          
          if (match) {
            // Extract date components - match[1] is year, match[2] is month, etc.
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // 0-based month in JS
            const day = parseInt(match[3]);
            const hour = parseInt(match[4]);
            const minute = parseInt(match[5]);
            const second = parseInt(match[6]);
            
            // Create date object directly from components
            const parsedDate = new Date(year, month, day, hour, minute, second);
            console.log(`Parsed MySQL date from '${dateString}': ${parsedDate.toISOString()}`);
            msg.sentAt = parsedDate;
          } else {
            // Fallback for other string formats
            // Add 'Z' to treat as UTC if the string doesn't already have timezone info
            const dateWithTz = !dateString.includes('Z') && !dateString.includes('+') 
              ? dateString + 'Z' 
              : dateString;
              
            msg.sentAt = new Date(dateWithTz);
          }
          
          // Verify the date is valid
          if (isNaN((msg.sentAt as Date).getTime())) {
            console.warn(`Invalid sentAt date for message ${msg.id}, using current date instead`, dateString);
            msg.sentAt = new Date();
          }
        }
        
        // Same check for readAt
        if (msg.readAt) {
          if (typeof msg.readAt === 'string') {
            const readAtString = msg.readAt as string;
            
            // Parse MySQL datetime format specifically
            const mysqlDateRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.?(\d*)/;
            const match = readAtString.match(mysqlDateRegex);
            
            if (match) {
              // Extract date components
              const year = parseInt(match[1]);
              const month = parseInt(match[2]) - 1; // 0-based month
              const day = parseInt(match[3]);
              const hour = parseInt(match[4]);
              const minute = parseInt(match[5]);
              const second = parseInt(match[6]);
              
              // Create date object directly from components
              const parsedDate = new Date(year, month, day, hour, minute, second);
              msg.readAt = parsedDate;
            } else {
              // Fallback for other formats
              // Add 'Z' to treat as UTC if the string doesn't already have timezone info
              const readAtWithTz = !readAtString.includes('Z') && !readAtString.includes('+')
                ? readAtString + 'Z'
                : readAtString;
                
              msg.readAt = new Date(readAtWithTz);
            }
            
            if (isNaN((msg.readAt as Date).getTime())) {
              console.warn(`Invalid readAt date for message ${msg.id}, using null instead`, readAtString);
              msg.readAt = null;
            }
          }
        }
        return msg;
      } catch (error) {
        console.error('Error processing message date:', error);
        // Use current date as fallback
        msg.sentAt = new Date();
        return msg;
      }
    });
    
    // Debug the messages array after date parsing
    console.log('After initial date parsing:', messages.map(m => ({
      id: m.id, 
      sentAtType: typeof m.sentAt, 
      sentAt: m.sentAt instanceof Date ? m.sentAt.toISOString() : m.sentAt,
      content: m.content && m.content.substring(0, 20)
    })));
    
    // Sort messages by date (oldest to newest) - Reverse order if backend returns newest first
    this.messages = messages.sort((a, b) => {
      // Ensure both dates are valid for comparison
      const dateA = a.sentAt instanceof Date ? a.sentAt.getTime() : 0;
      const dateB = b.sentAt instanceof Date ? b.sentAt.getTime() : 0;
      
      console.log(`Comparing dates: ${a.id}=${dateA} vs ${b.id}=${dateB}`);
      
      return dateB - dateA; // Reverse sort: newest to oldest
    });

    // Now reverse the array to get proper order for display (oldest at top, newest at bottom)
    this.messages = this.messages.reverse();
    
    // Debug after sorting
    console.log('After sorting:', this.messages.map(m => ({
      id: m.id, 
      sentAtType: typeof m.sentAt, 
      sentAt: m.sentAt instanceof Date ? m.sentAt.toISOString() : m.sentAt,
      content: m.content && m.content.substring(0, 20)
    })));

    // Log final date values
    this.logMessageDates(this.messages);
    
    // Remove any duplicate messages based on ID
    this.messages = this.messages.filter((message, index, self) =>
      index === self.findIndex((m) => m.id === message.id)
    );
    
    // Mark unread messages as read
    this.markAsRead(this.messages.filter(m => !m.isMine && !m.isRead));
    
    // Fetch sender info for messages
    this.fetchUserInfo(this.messages);
    
    // Always scroll to bottom after updating messages to show newest messages
    setTimeout(() => this.scrollToBottom(true), 100);
    
    // Check if we need to show scroll button
    if (this.messages.length > 0 && !this.isScrolledToBottom) {
      this.showScrollButton = true;
    }
  }
  
  private fetchUserInfo(messages: Message[]): void {
    const userIds = new Set<number>();
    
    // Collect unique user IDs from messages
    messages.forEach(message => {
      if (!message.isMine && message.senderId && !this.userNameCache.has(message.senderId)) {
        userIds.add(message.senderId);
      }
    });
    
    // Fetch info for each sender
    userIds.forEach(userId => {
      this.fetchSenderInfo(userId);
    });
  }
  
  private fetchSenderInfo(userId: number): void {
    if (this.userNameCache.has(userId)) {
      return; // Already fetched
    }
    
    this.messagingService.getPartnerInfo(userId).subscribe({
      next: (partnerInfo) => {
        // Extract the name from the backend User entity (which uses nom and prenom fields)
        let fullName = `User ${userId}`;
        if (partnerInfo.nom && partnerInfo.prenom) {
          fullName = `${partnerInfo.prenom} ${partnerInfo.nom}`;
        } else if (partnerInfo.name) {
          fullName = partnerInfo.name;
        }
        
        this.userNameCache.set(userId, fullName);
        
        // Update messages with this sender
        this.messages = this.messages.map(message => {
          if (message.senderId === userId && !message.senderName) {
            const updatedMessage = { ...message, senderName: fullName };
            
            // Handle profile picture if available
            if (partnerInfo.profilePicture || partnerInfo.profilePicturePath) {
              updatedMessage.senderProfilePicture = (partnerInfo.profilePicture || partnerInfo.profilePicturePath) as string;
            }
            
            return updatedMessage;
          }
          return message;
        });
      },
      error: (error) => {
        console.error(`Error fetching partner info for user ${userId}:`, error);
        this.userNameCache.set(userId, `User ${userId}`);
      }
    });
  }
  
  getUserName(userId: number): string {
    // First check if it's the current message sender
    if (userId === this.partnerId) {
      return this.partnerName;
    }
    
    // Otherwise check the cache
    return this.userNameCache.get(userId) || `User ${userId}`;
  }
  
  private markAsRead(messages: Message[]): void {
    if (!messages || messages.length === 0) return;
    
    const unreadNotMine = messages.filter(m => !m.isMine && !m.isRead);
    if (unreadNotMine.length > 0) {
      const messageIds = unreadNotMine.map(m => m.id).filter(id => id !== undefined) as number[];
      
      if (messageIds.length > 0) {
        this.messagingService.markAsRead(messageIds).subscribe({
          next: () => {
            // Update local message status
            unreadNotMine.forEach(message => message.isRead = true);
          },
          error: (error) => {
            console.error('Error marking messages as read:', error);
          }
        });
      }
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Auto send the message with the file
      this.sendMessage();
    }
  }
  
  startRecording(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.isRecording = true;
          this.recordedChunks = [];
          this.recordingStartTime = Date.now();
          
          this.mediaRecorder = new MediaRecorder(stream);
          
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.recordedChunks.push(event.data);
            }
          };
          
          this.mediaRecorder.onstop = () => {
            this.audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            
            // Auto send the recorded message
            this.sendMessage();
            
            // Stop all tracks in the stream to release the microphone
            stream.getTracks().forEach(track => track.stop());
          };
          
          this.mediaRecorder.start();
          
          // Update recording duration
          this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            this.recordingDuration = `${minutes}:${seconds}`;
          }, 1000);
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          alert('Impossible d\'accéder au microphone. Veuillez vérifier les permissions de votre navigateur.');
        });
    } else {
      alert('Votre navigateur ne supporte pas l\'enregistrement audio.');
    }
  }
  
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingTimer);
    }
  }
  
  getMediaUrl(path: string | undefined): string {
    if (!path) return '';
    
    // Check if it's already a full URL
    if (path.startsWith('http')) {
      return path;
    }
    
    // Append a timestamp to bypass browser cache
    const timestamp = new Date().getTime();
    return `${environment.apiUrl}${path}?t=${timestamp}`;
  }
  
  getContentType(path: string | undefined): string {
    if (!path) return 'audio/webm';
    
    if (path.toLowerCase().endsWith('.mp3')) {
      return 'audio/mpeg';
    } else if (path.toLowerCase().endsWith('.wav')) {
      return 'audio/wav';
    } else if (path.toLowerCase().endsWith('.ogg')) {
      return 'audio/ogg';
    } else if (path.toLowerCase().endsWith('.m4a')) {
      return 'audio/mp4';
    } else if (path.toLowerCase().endsWith('.webm')) {
      return 'audio/webm';
    }
    
    // Default
    return 'audio/webm';
  }
  
  openImagePreview(mediaPath: string): void {
    if (!mediaPath) return;
    
    // Open the image in a new tab
    window.open(this.getMediaUrl(mediaPath), '_blank');
  }
  
  sendMessage(event?: any): void {
    // Don't submit the form if Enter was pressed with shift key or if empty
    if (event && event.keyCode === 13 && (event.shiftKey || !this.newMessage.trim())) {
      return;
    }
    
    if (this.isRecording) {
      this.stopRecording();
      return;
    }
    
    // Check if there's text, a file, or audio to send
    if (!this.newMessage?.trim() && !this.selectedFile && !this.audioBlob) {
      return;
    }
    
    if (this.selectedFile) {
      // Send image message
      this.messagingService.sendImageMessage(this.partnerId, this.selectedFile, this.newMessage.trim()).subscribe({
        next: (response) => {
          // Clear inputs after sending
          this.newMessage = '';
          this.selectedFile = null;
          this.fileInput.nativeElement.value = '';
          
          // Reload conversation to see the new message
          this.messagingService.getMessages(this.partnerId).subscribe(messages => {
            this.updateMessages(messages);
            setTimeout(() => this.scrollToBottom(true), 100);
          });
        },
        error: (error) => {
          console.error('Error sending image message:', error);
          alert('Erreur lors de l\'envoi de l\'image. Veuillez réessayer.');
        }
      });
    } else if (this.audioBlob) {
      // Send voice message
      this.messagingService.sendVoiceMessage(this.partnerId, this.audioBlob, this.newMessage.trim()).subscribe({
        next: (response) => {
          // Clear inputs after sending
          this.newMessage = '';
          this.audioBlob = null;
          
          // Reload conversation to see the new message
          this.messagingService.getMessages(this.partnerId).subscribe(messages => {
            this.updateMessages(messages);
            setTimeout(() => this.scrollToBottom(true), 100);
          });
        },
        error: (error) => {
          console.error('Error sending voice message:', error);
          alert('Erreur lors de l\'envoi du message vocal. Veuillez réessayer.');
        }
      });
    } else {
      // Send text message
      this.messagingService.sendMessage(this.partnerId, this.newMessage.trim()).subscribe({
        next: (response) => {
          // Clear input after sending
          this.newMessage = '';
          
          // Reload conversation to see the new message
          this.messagingService.getMessages(this.partnerId).subscribe(messages => {
            this.updateMessages(messages);
            setTimeout(() => this.scrollToBottom(true), 100);
          });
        },
        error: (error) => {
          console.error('Error sending message:', error);
          alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
        }
      });
    }
  }
  
  scrollToBottom(forced: boolean = false): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
        
        if (forced) {
          this.isScrolledToBottom = true;
          this.showScrollButton = false;
        }
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
  
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.split(' ');
    if (parts.length === 1) {
      return name.charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  formatTime(date: any): string {
    if (!date) return '';
    
    try {
      // Add detailed console logging
      console.log('formatTime input:', {
        type: typeof date,
        value: date,
        isDateObj: date instanceof Date,
        toISOString: date instanceof Date ? date.toISOString() : null
      });
      
      // Handle ISO date string format
      if (typeof date === 'string') {
        // Add 'Z' to treat as UTC if the string doesn't already have timezone info
        const dateWithTz = !date.includes('Z') && !date.includes('+') 
          ? date + 'Z' 
          : date;
          
        const messageDate = new Date(dateWithTz);
        
        if (!isNaN(messageDate.getTime())) {
          console.log('Parsed time result:', messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
      
      // Handle Date object
      if (date instanceof Date && !isNaN(date.getTime())) {
        console.log('Date object time result:', date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      console.warn('Unable to format time from:', date);
      return '';
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  }
  
  formatFullDate(date: any): string {
    if (!date) return '';
    
    try {
      let messageDate: Date;
      
      // Handle ISO date string format
      if (typeof date === 'string') {
        messageDate = new Date(date);
        if (isNaN(messageDate.getTime())) {
          console.warn('Invalid date string format:', date);
          return '';
        }
      } 
      // Handle Date object
      else if (date instanceof Date) {
        if (isNaN(date.getTime())) {
          console.warn('Invalid Date object:', date);
          return '';
        }
        messageDate = date;
      } else {
        console.warn('Unsupported date format:', date);
        return '';
      }
      
      return messageDate.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting full date:', error);
      return '';
    }
  }
  
  formatMessageDate(date: any): string {
    if (!date) return '';
    
    try {
      // Add detailed console logging for debugging
      console.log('formatMessageDate input:', {
        type: typeof date,
        value: date instanceof Date ? date.toISOString() : date,
        isDateObj: date instanceof Date
      });
      
      let messageDate: Date;
      
      // Handle different date formats
      if (typeof date === 'string') {
        // Check if it's a MySQL datetime format: "2025-05-05 23:19:02.000000"
        const mysqlDateRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.?(\d*)/;
        const match = date.match(mysqlDateRegex);
        
        if (match) {
          // Extract date components
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // 0-based month
          const day = parseInt(match[3]);
          const hour = parseInt(match[4]);
          const minute = parseInt(match[5]);
          const second = parseInt(match[6]);
          
          // Create date object directly from components
          messageDate = new Date(year, month, day, hour, minute, second);
          console.log(`Parsed MySQL date from '${date}': ${messageDate.toISOString()}`);
        } else {
          // Fallback for other formats
          const dateWithTz = !date.includes('Z') && !date.includes('+') 
            ? date + 'Z' 
            : date;
            
          messageDate = new Date(dateWithTz);
        }
        
        // Check if valid
        if (isNaN(messageDate.getTime())) {
          console.warn('Invalid date string format:', date);
          return '';
        }
      } else if (date instanceof Date) {
        if (isNaN(date.getTime())) {
          console.warn('Invalid Date object:', date);
          return '';
        }
        messageDate = date;
      } else {
        console.warn('Unsupported date format:', date);
        return '';
      }
      
      // Force display the actual date and time from the date object, not the current date
      return messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting message date:', error);
      return '';
    }
  }
  
  isFirstMessageOfGroup(message: Message, index: number): boolean {
    if (index === 0) return true;
    const prevMessage = this.messages[index - 1];
    return prevMessage.isMine !== message.isMine;
  }
  
  isLastMessageOfGroup(message: Message, index: number): boolean {
    if (index === this.messages.length - 1) return true;
    const nextMessage = this.messages[index + 1];
    return nextMessage.isMine !== message.isMine;
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
  
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
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
  
  handleImageError(event: any): void {
    event.target.style.display = 'none';
  }
  
  handleAudioError(event: any): void {
    console.error('Audio error:', event);
    const audioElement = event.target;
    const errorElement = document.createElement('div');
    errorElement.className = 'audio-error';
    errorElement.textContent = 'Erreur lors du chargement de l\'audio';
    audioElement.parentNode.appendChild(errorElement);
  }
  
  retryAudioLoad(event: Event, mediaPath?: string): void {
    if (!mediaPath) return;
    event.stopPropagation();
    
    const parent = (event.currentTarget as HTMLElement).closest('.voice-message');
    if (parent) {
      const audioElement = parent.querySelector('audio');
    if (audioElement) {
        const source = audioElement.querySelector('source');
        if (source) {
          // Add a timestamp to force reload
          const timestamp = new Date().getTime();
          source.src = `${this.getMediaUrl(mediaPath)}&retry=${timestamp}`;
      audioElement.load();
        }
      }
    }
  }
  
  onScroll(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      const scrollPosition = container.scrollTop + container.clientHeight;
      const scrollHeight = container.scrollHeight;
      
      // Check if user is at bottom (with a small threshold for floating point differences)
      this.isScrolledToBottom = scrollHeight - scrollPosition < 20;
      
      // Show scroll button only when not at bottom and there are messages
      this.showScrollButton = !this.isScrolledToBottom && this.messages.length > 0;
    }
  }
  
  // Helper method for debugging dates in the template
  getDateDebugInfo(date: any): string {
    if (date instanceof Date) {
      return date.toISOString();
    } else if (typeof date === 'string') {
      return `String: ${date}`;
    } else {
      return `Unknown: ${typeof date}`;
    }
  }
  
  // Helper method to log date information from messages
  private logMessageDates(messages: Message[]): void {
    if (!messages || messages.length === 0) return;
    
    console.log('=== MESSAGE DATES DEBUG ===');
    messages.forEach((msg, index) => {
      let dateInfo = 'Unknown date format';
      if (msg.sentAt instanceof Date) {
        dateInfo = `Date object: ${msg.sentAt.toISOString()}`;
      }
      
      console.log(`Message ${index} (ID: ${msg.id}): ${dateInfo} - "${msg.content.substring(0, 20)}..."`);
    });
    console.log('=== END DATE DEBUG ===');
  }
} 