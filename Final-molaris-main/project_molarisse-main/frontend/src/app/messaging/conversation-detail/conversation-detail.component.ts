import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input, OnChanges, SimpleChanges, HostListener, Output, EventEmitter } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MessagingService, Message } from '../../core/services/messaging.service';
import { UserService } from '../../core/services/user.service';
import { Subscription, interval, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user.model';

// Extended message interface that includes the original sentAt value
interface ExtendedMessage extends Message {
  _originalSentAt?: string | Date;
}

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
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <div class="conversation-container" [class.dragging-over]="isDraggingFile">
      <!-- Header -->
      <div class="conversation-header">
        <div class="conversation-partner">
          <div *ngIf="!partnerProfilePicture" class="avatar-placeholder">
            {{ getInitials(partnerName) }}
          </div>
          <img *ngIf="partnerProfilePicture" [src]="cacheProfileImage(partnerProfilePicture)" alt="{{ partnerName }}" (error)="handleImageError($event)">
          <div class="partner-info">
            <h2>{{ getDisplayName() }}</h2>
            
          </div>
        </div>
        <div class="header-actions">
          <button mat-icon-button matTooltip="Options">
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
            
            <!-- Message avatar for partner's messages (shown at the start of message group) -->
            <div *ngIf="!message.isMine && isFirstMessageOfGroup(message, i)" class="message-avatar">
              <div *ngIf="!message.senderProfilePicture" class="avatar-placeholder partner-avatar">
                {{ getInitials(message.senderName || partnerName) }}
              </div>
              <img *ngIf="message.senderProfilePicture" 
                   [src]="cacheProfileImage(message.senderProfilePicture)" 
                   alt="{{ message.senderName || partnerName }}"
                   class="avatar-image"
                   (error)="handleImageError($event)">
            </div>
            
            <!-- Spacer to align messages when no avatar is shown -->
            <div *ngIf="!message.isMine && !isFirstMessageOfGroup(message, i)" class="avatar-spacer"></div>
            
            <div class="message-bubble" [class.my-bubble]="message.isMine">
              <div class="message-sender" *ngIf="!message.isMine && isFirstMessageOfGroup(message, i)">
                {{ message.senderName || partnerName }}
              </div>
              <div class="message-content">
                <!-- Image message -->
                <img *ngIf="message.mediaType === 'IMAGE' && message.mediaPath" 
                     [src]="cacheMediaImage(message.mediaPath)" 
                     alt="Image partagée" 
                     (error)="handleImageError($event)"
                     (click)="openImagePreview(message.mediaPath)"
                     class="message-image">
                
                <!-- Voice message -->
                <div *ngIf="message.mediaType === 'VOICE' && message.mediaPath" class="voice-message">
                  <mat-icon class="voice-icon">mic</mat-icon>
                  <audio controls (error)="handleAudioError($event)" preload="metadata">
                    <source [src]="cacheMediaImage(message.mediaPath)" [type]="getContentType(message.mediaPath)">
                    <span>Votre navigateur ne supporte pas les fichiers audio.</span>
                  </audio>
                  <small *ngIf="message.content" class="audio-caption">{{message.content}}</small>
                  <button mat-button color="primary" class="retry-button" (click)="retryAudioLoad($event, message.mediaPath)">
                    <mat-icon>refresh</mat-icon> Réessayer
                  </button>
                </div>
                
                <!-- Text message -->
                <span *ngIf="!message.mediaType" class="message-text">
                  {{ message.content }}
                  <span *ngIf="message.edited" class="edited-indicator">(modifié)</span>
                </span>
              </div>
              <div class="message-time" [matTooltip]="formatMessageDate(getOriginalDate(message))">
                <!-- Regular display -->
                {{ formatMessageDate(getOriginalDate(message)) }}
                <mat-icon *ngIf="message.isMine && message.isRead" class="read-icon">done_all</mat-icon>
                <mat-icon *ngIf="message.isMine && !message.isRead" class="unread-icon">done</mat-icon>
              </div>
              
              <!-- Message actions -->
              <div *ngIf="message.isMine" class="message-actions">
                <button mat-icon-button [matMenuTriggerFor]="messageMenu" class="message-menu-button">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #messageMenu="matMenu">
                  <button mat-menu-item (click)="startEditingMessage(message)" *ngIf="!message.mediaType">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                  <button mat-menu-item (click)="deleteMessage(message)">
                    <mat-icon>delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </div>
            </div>
            
            <!-- My message avatar (shown at the end of message group) -->
            <div *ngIf="message.isMine && isLastMessageOfGroup(message, i)" class="message-avatar">
              <div *ngIf="!currentUserProfilePicture" class="avatar-placeholder my-avatar">
                {{ getInitials('Moi') }}
              </div>
              <img *ngIf="currentUserProfilePicture" 
                   [src]="cacheProfileImage(currentUserProfilePicture)" 
                   alt="Moi"
                   class="avatar-image"
                   (error)="handleImageError($event)">
            </div>
            
            <!-- Spacer to align messages when no avatar is shown -->
            <div *ngIf="message.isMine && !isLastMessageOfGroup(message, i)" class="avatar-spacer"></div>
          </div>
        </div>
        
        <!-- Message editing overlay -->
        <div *ngIf="editingMessage" class="edit-overlay">
          <div class="edit-container">
            <div class="edit-header">
              <h3>Modifier le message</h3>
              <button mat-icon-button (click)="cancelEditing()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="edit-content">
              <mat-form-field appearance="outline" class="edit-input">
                <textarea matInput [(ngModel)]="editMessageContent" rows="3"></textarea>
              </mat-form-field>
            </div>
            <div class="edit-actions">
              <button mat-button (click)="cancelEditing()">Annuler</button>
              <button mat-raised-button color="primary" (click)="saveEditedMessage()">Enregistrer</button>
            </div>
          </div>
        </div>
        
        <!-- Image lightbox overlay -->
        <div *ngIf="lightboxImage" class="lightbox-overlay" (click)="closeLightbox()">
          <div class="lightbox-container" (click)="$event.stopPropagation()">
            <button mat-icon-button class="lightbox-close" (click)="closeLightbox()">
              <mat-icon>close</mat-icon>
            </button>
            
            <!-- Loading spinner -->
            <div *ngIf="lightboxImageLoading" class="lightbox-loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
            
            <div class="lightbox-controls">
              <button mat-mini-fab color="primary" (click)="zoomIn($event)">
                <mat-icon>zoom_in</mat-icon>
              </button>
              <button mat-mini-fab color="primary" (click)="resetZoom($event)">
                <mat-icon>fit_screen</mat-icon>
              </button>
              <button mat-mini-fab color="primary" (click)="zoomOut($event)">
                <mat-icon>zoom_out</mat-icon>
              </button>
              <button mat-mini-fab color="primary" (click)="toggleFullscreen($event)">
                <mat-icon>fullscreen</mat-icon>
              </button>
            </div>
            
            <div class="image-container">
              <img [src]="lightboxImage" 
                   alt="Image en plein écran" 
                   class="lightbox-image"
                   [style.transform]="'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + zoomLevel + ')'"
                   [style.cursor]="isZoomed ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in'"
                   (mousedown)="startPan($event)"
                   (mousemove)="pan($event)"
                   (mouseup)="endPan()"
                   (mouseleave)="endPan()"
                   (click)="toggleZoom($event)"
                   (load)="onLightboxImageLoaded()">
            </div>
          </div>
        </div>
        
        <!-- File drop overlay -->
        <div *ngIf="isDraggingFile" class="file-drop-overlay">
          <div class="file-drop-content">
            <mat-icon>cloud_upload</mat-icon>
            <p>Déposez votre image ici</p>
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
        
        <!-- Regular message input -->
        <div *ngIf="!isRecording" class="input-row">
          <button 
            mat-icon-button 
            color="primary"
            class="attach-button"
            (click)="fileInput.click()"
            [disabled]="imagePreview !== null">
            <mat-icon>attachment</mat-icon>
          </button>
          
          <input 
            #fileInput
            type="file" 
            hidden
            accept="image/*"
            (change)="onFileSelected($event)">
          
          <mat-form-field appearance="outline" class="message-field">
            <input 
              #messageInput
              matInput 
              placeholder="Tapez votre message..." 
              [(ngModel)]="newMessage"
              (keydown)="handleKeyDown($event)">
            
            <button 
              *ngIf="newMessage" 
              matSuffix 
              mat-icon-button 
              aria-label="Clear" 
              (click)="newMessage = ''">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
          
          <button 
            *ngIf="!newMessage && !imagePreview"
            mat-icon-button 
            color="primary"
            class="voice-button"
            (click)="startRecording()">
            <mat-icon>mic</mat-icon>
          </button>
          
          <button 
            *ngIf="newMessage || imagePreview"
            mat-mini-fab 
            color="primary"
            class="send-button"
            (click)="sendMessage()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
        
        <!-- Image preview -->
        <div *ngIf="imagePreview" class="image-preview-container">
          <div class="image-preview">
            <img [src]="imagePreview" alt="Image à envoyer">
            <button 
              mat-mini-fab 
              color="warn"
              class="remove-image-button"
              (click)="clearImagePreview()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .conversation-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #f5f7fa;
      position: relative;
    }
    
    /* Header Styling */
    .conversation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background-color: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      z-index: 2;
    }
    
    .conversation-partner {
      display: flex;
      align-items: center;
      flex: 1;
    }
    
    .conversation-partner .avatar-placeholder,
    .conversation-partner img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 12px;
      background-color: #4361ee;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .conversation-partner img {
      object-fit: cover;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .partner-info {
      display: flex;
      flex-direction: column;
    }
    
    .partner-info h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .partner-status {
      font-size: 13px;
      color: #6c757d;
      margin-top: 2px;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      background-color: #f1f1f1;
    }
    
    .partner-status.doctor {
      background-color: #e3f2fd;
      color: #0d47a1;
    }
    
    .partner-status.patient {
      background-color: #e8f5e9;
      color: #1b5e20;
    }
    
    .partner-status.secretary {
      background-color: #fff3e0;
      color: #e65100;
    }
    
    .partner-status.admin {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }
    
    .header-actions {
      display: flex;
    }
    
    /* Messages Container */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      position: relative;
      max-height: calc(100vh - 220px); /* header + input + some margin */
      min-height: 200px;
    }
    
    @media (max-width: 900px) {
      .messages-container {
        max-height: calc(100vh - 180px);
      }
    }
    
    @media (max-width: 600px) {
      .messages-container {
        max-height: calc(100vh - 140px);
        min-height: 120px;
      }
    }
    
    /* Message Styling */
    .messages-list {
      display: flex;
      flex-direction: column;
    }
    
    .message-wrapper {
      display: flex;
      margin-bottom: 4px;
      position: relative;
      align-items: flex-end;
    }
    
    .message-wrapper.my-message {
      flex-direction: row-reverse;
    }
    
    .message-wrapper.last-of-group {
      margin-bottom: 16px;
    }
    
    /* Message Avatar */
    .message-avatar {
      width: 36px;
      height: 36px;
      margin: 0 8px;
      flex-shrink: 0;
    }
    
    .avatar-spacer {
      width: 36px;
      margin: 0 8px;
      flex-shrink: 0;
    }
    
    .avatar-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #4361ee;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
    }
    
    .my-avatar {
      background-color: #7c4dff;
    }
    
    .partner-avatar {
      background-color: #4361ee;
    }
    
    .avatar-image {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    /* Message Bubbles */
    .message-bubble {
      background-color: white;
      border-radius: 18px;
      padding: 8px 12px;
      max-width: 70%;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    
    .my-bubble {
      background-color: #e3f2fd;
      border-top-right-radius: 4px;
    }
    
    .message-wrapper:not(.my-message) .message-bubble {
      border-top-left-radius: 4px;
    }
    
    .message-sender {
      font-size: 12px;
      font-weight: 500;
      color: #6c757d;
      margin-bottom: 4px;
    }
    
    .message-content {
      position: relative;
    }
    
    .message-text {
      font-size: 14px;
      line-height: 1.4;
      word-break: break-word;
      white-space: pre-wrap;
    }
    
    .message-time {
      font-size: 11px;
      color: #9e9e9e;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    
    .read-icon, .unread-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-left: 4px;
    }
    
    .read-icon {
      color: #4fc3f7;
    }
    
    .unread-icon {
      color: #9e9e9e;
    }
    
    .edited-indicator {
      font-size: 11px;
      color: #9e9e9e;
      margin-left: 4px;
    }
    
    /* Message Actions */
    .message-actions {
      opacity: 0;
      position: absolute;
      top: 0;
      right: -28px;
      transition: opacity 0.2s;
    }
    
    .message-wrapper:not(.my-message) .message-actions {
      right: auto;
      left: -28px;
    }
    
    .message-bubble:hover .message-actions {
      opacity: 1;
    }
    
    .message-menu-button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }
    
    .message-menu-button .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    /* Image Messages */
    .message-image {
      max-width: 100%;
      max-height: 300px;
      border-radius: 12px;
      cursor: pointer;
      display: block;
    }
    
    /* Audio Messages */
    .voice-message {
      display: flex;
      flex-direction: column;
      padding: 8px;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 12px;
      margin: 4px 0;
    }
    
    .voice-message audio {
      width: 100%;
      margin-top: 8px;
    }
    
    .voice-icon {
      color: #f44336;
      margin-right: 8px;
    }
    
    .audio-caption {
      margin-top: 4px;
      color: #757575;
    }
    
    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #9e9e9e;
      text-align: center;
      padding: 32px;
    }
    
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #e0e0e0;
    }
    
    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .empty-subtitle {
      font-size: 14px;
      font-weight: normal;
    }
    
    /* Loading */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 32px;
    }
    
    /* Message Input */
    .message-input-container {
      padding: 12px 16px;
      background-color: white;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      z-index: 2;
    }
    
    .input-row {
      display: flex;
      align-items: center;
    }
    
    .message-field {
      flex: 1;
      margin: 0 8px;
    }
    
    .send-button {
      margin-left: 8px;
    }
    
    /* Image Preview */
    .image-preview-container {
      margin-top: 12px;
    }
    
    .image-preview {
      position: relative;
      display: inline-block;
      max-width: 100%;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .image-preview img {
      max-width: 100%;
      max-height: 200px;
      display: block;
    }
    
    .remove-image-button {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      line-height: 24px;
    }
    
    .remove-image-button .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }
    
    /* Voice Recording */
    .recording-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #fff3e0;
      padding: 12px 16px;
      border-radius: 24px;
    }
    
    .recording-indicator {
      display: flex;
      align-items: center;
      color: #e65100;
      font-weight: 500;
    }
    
    .recording-indicator mat-icon {
      margin-right: 8px;
      color: #f44336;
    }
    
    .recording-blob {
      width: 12px;
      height: 12px;
      background-color: #f44336;
      border-radius: 50%;
      margin-left: 12px;
      animation: pulse 1.5s infinite;
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
    
    /* Scroll to bottom button */
    .scroll-bottom-button {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 3;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    /* Lightbox */
    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .lightbox-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .lightbox-close {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1001;
      color: white;
    }
    
    .lightbox-controls {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      z-index: 1001;
    }
    
    .image-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .lightbox-image {
      max-width: 90%;
      max-height: 90%;
      transition: transform 0.3s ease;
      transform-origin: center center;
    }
    
    .lightbox-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1001;
    }
    
    /* File drop overlay */
    .file-drop-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px dashed #4361ee;
    }
    
    .file-drop-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #4361ee;
    }
    
    .file-drop-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    /* Message editing overlay */
    .edit-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .edit-container {
      background-color: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      overflow: auto;
    }
    
    // Modify the lightbox-image styles even more
    .lightbox-image {
      max-width: 95vw; /* Start with a large initial size */
      max-height: 95vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transform-origin: center;
      transition: transform 0.3s ease;
    }
    
    .image-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
  `]
})
export class ConversationDetailComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
  @Input() userId: number | null = null;
  partnerId: number = 0;
  partnerName: string = '';
  partnerRole: string = '';
  partnerProfilePicture: string = '';
  messages: ExtendedMessage[] = [];
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
  
  // Add the Output event for partnerInfoLoaded
  @Output() partnerInfoLoaded = new EventEmitter<any>();
  
  editingMessage: Message | null = null;
  editMessageContent: string = '';
  
  // Add properties for image preview and lightbox
  imagePreview: string | null = null;
  lightboxImage: string | null = null;
  isDraggingFile: boolean = false;
  
  // Add these properties to the component class
  isZoomed: boolean = false;
  zoomLevel: number = 1;
  
  // Add these properties and methods to the component
  maxZoomLevel: number = 5.0; // Increase max zoom
  minZoomLevel: number = 0.5;
  zoomStep: number = 0.5;
  
  // Add another property to track loading state
  lightboxImageLoading: boolean = false;
  
  // Add these variables to the component class
  isPanning: boolean = false;
  startX: number = 0;
  startY: number = 0;
  translateX: number = 0;
  translateY: number = 0;
  
  // Propriété pour stocker la photo de profil de l'utilisateur courant
  currentUserProfilePicture: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private messagingService: MessagingService,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    // Cache for pre-processed image URLs to prevent re-rendering
    this.imageUrlCache = new Map();
    
    // Récupérer les informations de l'utilisateur courant
    this.userService.getUserByEmail('current@user.com').subscribe({
      next: (user: User) => {
        if (user && user.profilePicturePath) {
          this.currentUserProfilePicture = user.profilePicturePath;
        } else if (user && user.profileImageUrl) {
          this.currentUserProfilePicture = user.profileImageUrl;
        }
        console.log('Current user profile picture:', this.currentUserProfilePicture);
      },
      error: (error: any) => {
        console.error('Error fetching current user info:', error);
      }
    });
    
    // Enable test mode for debugging
    this.testMode = true; // Setting to true for debugging
    this.setupConversation();
    
    // Debug media paths after messages are loaded
    this.messagingService.getMessages(this.partnerId).subscribe(messages => {
      // Find messages with media
      const mediaMessages = messages.filter(msg => msg.mediaType && msg.mediaPath);
      if (mediaMessages.length > 0) {
        console.log('Found messages with media:', mediaMessages.length);
        mediaMessages.forEach(msg => this.debugMessageMedia(msg));
      } else {
        console.log('No messages with media found');
      }
    });
  }
  
  // Image URL cache to prevent re-rendering the same URL
  private imageUrlCache: Map<string, string> = new Map();
  
  // Cache profile images to prevent redundant requests
  cacheProfileImage(path: string): string {
    const cacheKey = `profile:${path}`;
    if (!this.imageUrlCache.has(cacheKey)) {
      const url = this.getProfileImageUrl(path);
      this.imageUrlCache.set(cacheKey, url);
    }
    return this.imageUrlCache.get(cacheKey) || '';
  }
  
  // Cache media images to prevent redundant requests
  cacheMediaImage(path: string): string {
    if (!path) return '';
    
    const cacheKey = `media:${path}`;
    if (!this.imageUrlCache.has(cacheKey)) {
      try {
        // Get the base URL first
        const baseUrl = this.getMediaUrl(path);
        
        // Add the token parameter for server-side authentication
        const token = this.getAuthToken();
        const tokenParam = token ? `&token=${token}` : '';
        
        // Store the complete URL (with token) in the cache
        const fullUrl = `${baseUrl}${tokenParam}`;
        this.imageUrlCache.set(cacheKey, fullUrl);
        
        // Debug info - log what we're caching
        console.log('Cached media image URL:', {
          path: path,
          cacheKey: cacheKey
        });
        
        return fullUrl;
      } catch (error) {
        console.error('Error caching media image:', error);
        return '';
      }
    } else {
      // Return the cached URL directly
      return this.imageUrlCache.get(cacheKey) || '';
    }
  }
  
  // Add a public method to reload the conversation
  public reloadConversation(userId?: number): void {
    console.log('Reloading conversation with user ID:', userId || this.userId);
    
    // Update userId if provided
    if (userId !== undefined) {
      this.userId = userId;
    }
    
    // Clear existing messages
    this.messages = [];
    this.loading = true;
    
    // Setup the conversation again
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
  
  public setupConversation(): void {
    if (!this.userId) {
      console.warn('No user ID provided for conversation');
      return;
    }

    this.partnerId = this.userId;
    
    // Check if we already have the name cached
    const cachedName = this.getPersistedPartnerName(this.partnerId);
    if (cachedName) {
      this.partnerName = cachedName;
      console.log('Using cached partner name:', this.partnerName);
      
      // Emit the partner info right away with the cached name
      this.partnerInfoLoaded.emit({
        id: this.partnerId,
        name: this.partnerName,
        role: this.partnerRole || 'User',
        profilePicture: this.partnerProfilePicture || String(this.partnerId)
      });
    } else {
      // Default name until we get the real one - avoid showing User ID
      this.partnerName = `Conversation`;
    }
    
    // First try to get user info from the user service
    this.userService.getUserInfo(this.partnerId).subscribe({
      next: (user: User) => {
        console.log('Partner info loaded from UserService:', user);
        
        // Update partner information
        let newName = '';
        if (user.prenom && user.nom) {
          newName = `${user.prenom} ${user.nom}`;
        } else if (user.nom) {
          newName = user.nom;
        } else if (user.name) {
          newName = user.name;
        } else {
          // Fall back to something besides User ID
          newName = user.email || `Conversation`;
        }
        
        // Only update if we got a better name (not a placeholder)
        if (newName && !newName.startsWith('User ') && !newName.startsWith('Utilisateur ')) {
          this.partnerName = newName;
          // Store it permanently
          this.setPartnerNamePermanently(this.partnerName, this.partnerId);
        }
        
        // Set role
        if (typeof user.role === 'string') {
          this.partnerRole = this.getRoleBadge(user.role);
        } else if (user.role && typeof user.role === 'object' && 'nom' in user.role) {
          this.partnerRole = this.getRoleBadge(user.role.nom);
        } else {
          this.partnerRole = 'Utilisateur';
        }
        
        // Set profile picture - use ID directly for the profile picture endpoint
        this.partnerProfilePicture = String(user.id);
        
        // Emit the partner info to the parent component
        this.partnerInfoLoaded.emit({
          id: user.id,
          name: this.partnerName,
          role: this.partnerRole,
          profilePicture: this.partnerProfilePicture,
          // Include original user properties for compatibility
          prenom: user.prenom,
          nom: user.nom,
          email: user.email
        });
        
        // Now load the conversation
        this.loadConversation();
        this.setupAutoRefresh();
      },
      error: (error: any) => {
        console.error('Error loading partner info from UserService:', error);
        
        // Fallback to messaging service
        this.loadConversation();
        this.setupAutoRefresh();
      }
    });
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
    // Refresh messages every 30 seconds (increased from 10 seconds)
    // Use debounceTime to prevent excessive calls if multiple triggers happen
    this.refreshSubscription = interval(30000).pipe(
      // Only refresh if we're not currently loading
      switchMap(() => {
        if (this.loading) {
          return of(null);
        }
        console.log('Auto-refreshing conversation messages');
        return this.messagingService.getMessages(this.partnerId);
      }),
      // Filter out null results from the loading check
      catchError(error => {
        console.error('Error during auto-refresh:', error);
        return of(null);
      })
    ).subscribe(messages => {
      if (messages && messages.length > 0) {
        // Only update if there are messages to show
        console.log('Updating messages from auto-refresh');
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
        let foundBetterName = false;
        
        if (partnerInfo.nom && partnerInfo.prenom) {
          this.partnerName = `${partnerInfo.prenom} ${partnerInfo.nom}`;
          console.log('Using nom/prenom fields for name:', this.partnerName);
          foundBetterName = true;
        } else if (partnerInfo.name && !partnerInfo.name.startsWith('User ')) {
          this.partnerName = partnerInfo.name;
          console.log('Using name field:', this.partnerName);
          foundBetterName = true;
        } else if ((partnerInfo as any).firstName && (partnerInfo as any).lastName) {
          this.partnerName = `${(partnerInfo as any).firstName} ${(partnerInfo as any).lastName}`;
          console.log('Using firstName/lastName fields for name:', this.partnerName);
          foundBetterName = true;
        } else if ((partnerInfo as any).partnerName && !(partnerInfo as any).partnerName.startsWith('User ')) {
          this.partnerName = (partnerInfo as any).partnerName;
          console.log('Using partnerName field:', this.partnerName);
          foundBetterName = true;
        } else if ((partnerInfo as any).username) {
          this.partnerName = (partnerInfo as any).username;
          console.log('Using username field:', this.partnerName);
          foundBetterName = true;
        } else {
          // Fallback to user ID but try to fetch user info from another endpoint
          console.log('Incomplete name information, trying to fetch additional user data');
          
          // Try to get more info about this user from the userService
          this.userService.getUserInfo(this.partnerId).subscribe({
            next: (userDetails) => {
              if (userDetails && (userDetails.nom || userDetails.prenom)) {
                this.partnerName = `${userDetails.prenom || ''} ${userDetails.nom || ''}`.trim();
                console.log('Retrieved name from userService:', this.partnerName);
                
                // Permanently store the name we found
                this.setPartnerNamePermanently(this.partnerName, this.partnerId);
              }
            },
            error: (userError) => {
              console.error('Error fetching additional user details:', userError);
            }
          });
          
          // Check if we already have a better name cached
          const cachedName = this.getPersistedPartnerName(this.partnerId);
          if (cachedName) {
            this.partnerName = cachedName;
            console.log('Using cached partner name:', this.partnerName);
            foundBetterName = true;
          }
          // If we don't have a name yet, use a placeholder until the getUserInfo call resolves
          else if (!this.partnerName || this.partnerName.startsWith('User ')) {
            this.partnerName = `Utilisateur ${this.partnerId}`;
            console.log('Using placeholder name until details arrive:', this.partnerName);
          }
        }
        
        // If we found a better name, store it permanently
        if (foundBetterName) {
          this.setPartnerNamePermanently(this.partnerName, this.partnerId);
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
        
        // Set the profile picture to the partner's ID
        this.partnerProfilePicture = String(this.partnerId);
        
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
        
        // Check if we already have a better name cached
        const cachedName = this.getPersistedPartnerName(this.partnerId);
        if (cachedName) {
          this.partnerName = cachedName;
          console.log('Using cached partner name after error:', this.partnerName);
        }
        
        // Try to get more info about this user from the userService as a fallback
        this.userService.getUserInfo(this.partnerId).subscribe({
          next: (userDetails) => {
            if (userDetails && (userDetails.nom || userDetails.prenom)) {
              this.partnerName = `${userDetails.prenom || ''} ${userDetails.nom || ''}`.trim();
              console.log('Retrieved name from userService in error handler:', this.partnerName);
              
              // Permanently store the name we found
              this.setPartnerNamePermanently(this.partnerName, this.partnerId);
              
              // Set role from user details
              if (typeof userDetails.role === 'string') {
                this.partnerRole = this.getRoleBadge(userDetails.role);
              } else if (userDetails.role && typeof userDetails.role === 'object' && 'nom' in userDetails.role) {
                this.partnerRole = this.getRoleBadge(userDetails.role.nom);
              }
              
              // Set profile picture to user ID
              this.partnerProfilePicture = String(userDetails.id);
            } else {
              // Only use placeholder if we don't have a better name
              if (!this.partnerName || this.partnerName.startsWith('User ')) {
                this.partnerName = `Utilisateur ${this.partnerId}`;
              }
              this.partnerRole = 'User';
              this.partnerProfilePicture = String(this.partnerId);
            }
          },
          error: (userError) => {
            console.error('Error fetching additional user details in error handler:', userError);
            
            // Only use placeholder if we don't have a better name
            if (!this.partnerName || this.partnerName.startsWith('User ')) {
              this.partnerName = `Utilisateur ${this.partnerId}`;
            }
            this.partnerRole = 'User';
            this.partnerProfilePicture = String(this.partnerId);
          },
          complete: () => {
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
    });
  }
  
  updateMessages(messages: Message[]): void {
    if (!messages || !messages.length) {
      this.messages = [];
      return;
    }
    
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
        } else if (!(msg.sentAt instanceof Date)) {
          // If sentAt is not a string and not a Date, create a new Date
          console.warn(`Message ${msg.id} has sentAt that is not a string or Date:`, msg.sentAt);
          if (msg.sentAt) {
            try {
              // Try to convert to date if it's a timestamp or other convertible format
              msg.sentAt = new Date(msg.sentAt);
            } catch (e) {
              console.error(`Failed to convert sentAt to Date for message ${msg.id}:`, e);
              msg.sentAt = new Date(); // Fallback to current date
            }
          } else {
            msg.sentAt = new Date(); // Fallback to current date
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
        
        // Pre-cache all media images to prevent rendering issues
        if (msg.mediaPath) {
          this.cacheMediaImage(msg.mediaPath);
        }
        
        // Pre-cache all profile pictures to prevent rendering issues
        if (msg.senderProfilePicture) {
          this.cacheProfileImage(msg.senderProfilePicture);
        }
        
        return msg;
      } catch (error) {
        console.error('Error processing message date:', error);
        // Use current date as fallback
        msg.sentAt = new Date();
        return msg;
      }
    });
    
    // Sort messages by date (oldest to newest) - Reverse order if backend returns newest first
    this.messages = messages.sort((a, b) => {
      // Ensure both dates are valid for comparison
      const dateA = a.sentAt instanceof Date ? a.sentAt.getTime() : 0;
      const dateB = b.sentAt instanceof Date ? b.sentAt.getTime() : 0;
      
      return dateB - dateA; // Reverse sort: newest to oldest
    });

    // Now reverse the array to get proper order for display (oldest at top, newest at bottom)
    this.messages = this.messages.reverse();
    
    // Remove any duplicate messages based on ID
    this.messages = this.messages.filter((message, index, self) =>
      index === self.findIndex((m) => m.id === message.id)
    );
    
    // Mark unread messages as read
    this.markAsRead(this.messages.filter(m => !m.isMine && !m.isRead));
    
    // Fetch sender info for messages
    this.fetchUserInfo(this.messages);
    
    // Debug: Log the dates of a few messages to verify they're correct
    if (this.messages.length > 0) {
      console.log('DEBUG: First 3 message dates after processing:');
      this.messages.slice(0, 3).forEach((msg, i) => {
        console.log(`Message ${i}: ${msg.id} - sentAt:`, 
          msg.sentAt instanceof Date ? msg.sentAt.toISOString() : msg.sentAt);
      });
    }
    
    // Wait a moment before scrolling to bottom to allow rendering to complete
    setTimeout(() => {
      if (this.isScrolledToBottom) {
        this.scrollToBottom(true);
      }
    // Check if we need to show scroll button
      else if (this.messages.length > 0) {
      this.showScrollButton = true;
    }
    }, 200);
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
    
    this.userService.getUserInfo(userId).subscribe({
      next: (user) => {
        // Get full name from user object
        let fullName = `User ${userId}`;
        if (user.prenom && user.nom) {
          fullName = `${user.prenom} ${user.nom}`;
        } else if (user.nom) {
          fullName = user.nom;
        } else if (user.name) {
          fullName = user.name;
        }
        
        this.userNameCache.set(userId, fullName);
        
        // Update messages with this sender
        this.messages = this.messages.map(message => {
          if (message.senderId === userId && !message.senderName) {
            const updatedMessage = { ...message, senderName: fullName };
            
            // Set sender profile picture to user ID
            updatedMessage.senderProfilePicture = String(userId);
            
            return updatedMessage;
          }
          return message;
        });
      },
      error: (error) => {
        console.error(`Error fetching user info for user ${userId}:`, error);
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
      
      // Create preview for image
      if (this.selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }
  
  clearImagePreview(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
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
    
    // Add debug logging
    console.log('Getting media URL for path:', path);
    
    // Check if it's already a full URL
    if (path.startsWith('http')) {
      return path;
    }
    
    // Use a fixed timestamp per session
    const timestamp = this.getCacheKey();
    
    // Extract just the filename - strip any path information
    const fileName = path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : path;
    
    // Use a simple, consistent URL pattern that matches what the backend expects
    const url = `${environment.apiUrl}/api/v1/api/messages/media/${fileName}?t=${timestamp}`;
    
    console.log('Generated media URL:', url);
    return url;
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
    
    console.log('Opening image preview with path:', mediaPath);
    
    // Show loading indicator
    this.lightboxImageLoading = true;
    
    // Use the cached URL directly to avoid creating a new one
    this.lightboxImage = this.cacheMediaImage(mediaPath);
    
    // Reset zoom state
    this.isZoomed = false;
    this.zoomLevel = 1;
    
    console.log('Opening lightbox with image URL:', this.lightboxImage);
  }
  
  closeLightbox(): void {
    this.lightboxImage = null;
    this.zoomLevel = 1.0;
    this.isZoomed = false;
    this.translateX = 0;
    this.translateY = 0;
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
          this.imagePreview = null;
          this.fileInput.nativeElement.value = '';
          
          // Reload conversation to see the new message
          this.messagingService.getMessages(this.partnerId).subscribe(messages => {
            console.log('New image message received, checking dates:', messages[0]);
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
            console.log('New voice message received, checking dates:', messages[0]);
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
            console.log('New text message received, checking dates:', messages[0]);
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
        } else {
          messageDate = new Date(date);
        }
        
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
      
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      
      return messageDate.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting full date:', error);
      return '';
    }
  }
  
  formatMessageDate(date: any): string {
    if (!date) return '';
    try {
      let messageDate: Date;

      // Handle array format: [year, month, day, hour, minute, second]
      if (Array.isArray(date) && date.length >= 3) {
        messageDate = new Date(
          date[0], // year
          date[1] - 1, // month (0-based)
          date[2], // day
          date[3] || 0, // hour
          date[4] || 0, // minute
          date[5] || 0  // second
        );
      } else if (typeof date === 'string') {
        const mysqlDateRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.?\d*/;
        const match = date.match(mysqlDateRegex);
        if (match) {
          messageDate = new Date(
            parseInt(match[1]),
            parseInt(match[2]) - 1,
            parseInt(match[3]),
            parseInt(match[4]),
            parseInt(match[5]),
            parseInt(match[6])
          );
        } else {
          messageDate = new Date(date);
        }
      } else if (date instanceof Date) {
        messageDate = date;
      } else if (typeof date === 'object' && date.year && date.month && date.day) {
        messageDate = new Date(
          date.year,
          date.month - 1,
          date.day,
          date.hour || 0,
          date.minute || 0,
          date.second || 0
        );
      } else {
        return String(date);
      }

      if (isNaN(messageDate.getTime())) return String(date);

      // Format: DD/MM/YYYY HH:mm
      return messageDate.toLocaleDateString('fr-FR') + ' ' + messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return String(date);
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
  
  getRoleBadgeClass(role: string): string {
    const roleLower = role?.toLowerCase() || '';
    
    if (roleLower.includes('doctor') || roleLower.includes('médecin') || roleLower.includes('medecin')) {
      return 'doctor';
    } else if (roleLower.includes('patient')) {
      return 'patient';
    } else if (roleLower.includes('secretary') || roleLower.includes('secrétaire') || roleLower.includes('secretaire')) {
      return 'secretary';
    } else if (roleLower.includes('admin') || roleLower.includes('administrator') || roleLower.includes('administrateur')) {
      return 'admin';
    }
    
    return '';
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  getProfileImageUrl(profilePicturePath?: string): string {
    if (!profilePicturePath) return '/assets/images/default-avatar.png';
    
    // Check if it's a full URL
    if (profilePicturePath.startsWith('http')) {
      return profilePicturePath;
    }
    
    // Check if it's a relative path to assets
    if (profilePicturePath.startsWith('/assets')) {
      return profilePicturePath;
    }
    
    // Use a fixed timestamp per session rather than regenerating on every call
    const timestamp = this.getCacheKey();
    
    // Handle numeric IDs - these are user IDs
    if (/^\d+$/.test(profilePicturePath)) {
      return `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${profilePicturePath}?t=${timestamp}`;
    }
    
    // For path-based images with correct format
    if (profilePicturePath.startsWith('profile-pictures/')) {
      return `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
    }
    
    // If it has a path but not the right prefix
    if (profilePicturePath.includes('/')) {
      return `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
    }
    
    // It's just a filename, add the profile-pictures/ prefix
    return `${environment.apiUrl}/api/v1/api/users/profile/picture/profile-pictures/${profilePicturePath}?t=${timestamp}`;
  }
  
  handleImageError(event: any): void {
    console.warn('Image failed to load:', event.target.src);
    
    const imgElement = event.target;
    const originalSrc = imgElement.src;
    
    // Prevent infinite loop of error events
    imgElement.onerror = null;
    
    // Add a data attribute to mark this element as having failed
    imgElement.setAttribute('data-load-failed', 'true');
    
    // Check if this is a profile image (avatar)
    const isProfileImage = imgElement.parentElement?.classList.contains('avatar-placeholder') || 
                          imgElement.parentElement?.classList.contains('conversation-avatar') ||
                          imgElement.closest('.conversation-partner') !== null;
                          
    if (isProfileImage) {
      // Replace with default avatar for profile images
      imgElement.src = '/assets/images/default-avatar.png';
      console.log('Replaced profile image with default avatar');
    } else {
      // For message images
      // Create error placeholder directly in place
      const errorDiv = document.createElement('div');
      errorDiv.className = 'image-error';
      errorDiv.style.display = 'flex';
      errorDiv.style.flexDirection = 'column';
      errorDiv.style.alignItems = 'center';
      errorDiv.style.justifyContent = 'center';
      errorDiv.style.padding = '20px';
      errorDiv.style.backgroundColor = '#f8f9fa';
      errorDiv.style.borderRadius = '8px';
      errorDiv.style.color = '#dc3545';
      errorDiv.style.fontSize = '14px';
      errorDiv.style.textAlign = 'center';
      
      // Add icon text since we can't use mat-icon directly in JS
      const iconSpan = document.createElement('span');
      iconSpan.textContent = '🖼️';
      iconSpan.style.fontSize = '24px';
      iconSpan.style.marginBottom = '8px';
      
      const textSpan = document.createElement('span');
      textSpan.textContent = 'Image non disponible';
      
      errorDiv.appendChild(iconSpan);
      errorDiv.appendChild(textSpan);
      
      // Replace the image with the error div
      if (imgElement.parentElement && !imgElement.parentElement.querySelector('.image-error')) {
        imgElement.parentElement.replaceChild(errorDiv, imgElement);
        console.log('Replaced message image with error placeholder');
      }
    }
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
    
    // First, clear the cache for this path to force a fresh URL
    const cacheKey = `media:${mediaPath}`;
    this.imageUrlCache.delete(cacheKey);
    
    // Get a fresh URL with auth token
    const freshUrl = this.cacheMediaImage(mediaPath);
    
    // Get the audio element and update the source
    const audio = (event.target as HTMLElement).closest('.voice-message')?.querySelector('audio');
    if (audio) {
      const source = audio.querySelector('source');
      if (source) {
        source.src = freshUrl;
        audio.load();
        audio.play();
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
      return `Date: ${date.toISOString()}`;
    } else if (typeof date === 'string') {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return `String→Date: ${date} → ${parsedDate.toISOString()}`;
        }
        return `String: ${date}`;
      } catch (e) {
        return `String (invalid): ${date}`;
      }
    } else if (typeof date === 'number') {
      try {
        const parsedDate = new Date(date);
        return `Number→Date: ${date} → ${parsedDate.toISOString()}`;
      } catch (e) {
        return `Number: ${date}`;
      }
    } else {
      return `Unknown: ${typeof date} - ${JSON.stringify(date)}`;
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
  
  startEditingMessage(message: Message): void {
    this.editingMessage = message;
    this.editMessageContent = message.content;
  }
  
  cancelEditing(): void {
    this.editingMessage = null;
    this.editMessageContent = '';
  }
  
  saveEditedMessage(): void {
    if (this.editingMessage && this.editMessageContent.trim()) {
      this.messagingService.editMessage(this.editingMessage.id, this.editMessageContent.trim())
        .subscribe({
          next: (updatedMessage) => {
            console.log('Message updated successfully:', updatedMessage);
            
            // Update the message in the local array
            const index = this.messages.findIndex(m => m.id === this.editingMessage?.id);
            if (index !== -1) {
              this.messages[index] = {
                ...this.messages[index],
                content: updatedMessage.content,
                edited: true,
                editedAt: updatedMessage.editedAt
              };
            }
            
            // Reset editing state
            this.editingMessage = null;
            this.editMessageContent = '';
          },
          error: (error) => {
            console.error('Error updating message:', error);
            alert('Erreur lors de la modification du message. Veuillez réessayer.');
          }
        });
    }
  }
  
  deleteMessage(message: Message): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      this.messagingService.deleteMessage(message.id)
        .subscribe({
          next: () => {
            console.log('Message deleted successfully');
            
            // Remove the message from the local array
            this.messages = this.messages.filter(m => m.id !== message.id);
          },
          error: (error) => {
            console.error('Error deleting message:', error);
            alert('Erreur lors de la suppression du message. Veuillez réessayer.');
          }
        });
    }
  }
  
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = true;
  }
  
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
  }
  
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Seules les images sont acceptées. Veuillez sélectionner une image.');
      }
    }
  }

  // Create a session cache key for image URLs - only generated once per component instance
  private sessionTimestamp: string | null = null;
  private getCacheKey(): string {
    if (!this.sessionTimestamp) {
      this.sessionTimestamp = new Date().getTime().toString();
    }
    return this.sessionTimestamp;
  }

  getOriginalDate(message: ExtendedMessage): any {
    // Try to access the original date if available, otherwise use the processed date
    if (message._originalSentAt) {
      return message._originalSentAt;
    }
    
    // If we don't have the original date but have a message ID, fetch it from the API
    if (message.id && !message._originalSentAt && typeof message.sentAt === 'object') {
      // Store a temporary value to avoid multiple API calls
      message._originalSentAt = message.sentAt;
      
      // Fetch the original date from the API
      this.messagingService.getMessageDate(message.id).subscribe(originalDate => {
        if (originalDate) {
          message._originalSentAt = originalDate;
          console.log(`Updated original date for message ${message.id}:`, originalDate);
        }
      });
    }
    
    return message._originalSentAt || message.sentAt;
  }

  // Add this method to help with debugging
  debugMessageMedia(message: Message): void {
    if (message.mediaPath) {
      console.log('Message Media Debug:', {
        messageId: message.id,
        mediaType: message.mediaType,
        mediaPath: message.mediaPath,
        mediaUrl: this.getMediaUrl(message.mediaPath),
        cachedUrl: this.cacheMediaImage(message.mediaPath)
      });
    }
  }

  // Add a method to explicitly get the token for debug purposes
  getAuthToken(): string {
    const token = localStorage.getItem('access_token');
    return token || '';
  }

  // This gets a URL for the message template that works with our image element
  getMediaSrc(message: Message): string {
    if (!message || !message.mediaPath) return '';
    
    // Get the base URL first
    const baseUrl = this.getMediaUrl(message.mediaPath);
    
    // Add the token parameter for server-side authentication
    const token = this.getAuthToken();
    const tokenParam = token ? `&token=${token}` : '';
    
    // Use a fixed timestamp per component lifetime rather than constantly changing one
    // This prevents constant re-rendering and request loops
    return `${baseUrl}${tokenParam}`;
  }

  // Add a method to toggle zoom
  toggleZoom(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the lightbox from closing
    
    this.isZoomed = !this.isZoomed;
    
    if (this.isZoomed) {
      // Zoom in - increase zoom level
      this.zoomLevel = 3.5; // Even larger initial zoom when clicking
    } else {
      // Zoom out - reset zoom level
      this.zoomLevel = 1.0;
      this.translateX = 0;
      this.translateY = 0;
    }
  }

  // Method to increase zoom
  zoomIn(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the lightbox from closing
    
    if (this.zoomLevel < this.maxZoomLevel) {
      this.zoomLevel = Math.min(this.maxZoomLevel, this.zoomLevel + this.zoomStep);
      this.isZoomed = this.zoomLevel > 1.0;
    }
  }

  // Method to decrease zoom
  zoomOut(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the lightbox from closing
    
    if (this.zoomLevel > this.minZoomLevel) {
      this.zoomLevel = Math.max(this.minZoomLevel, this.zoomLevel - this.zoomStep);
      this.isZoomed = this.zoomLevel > 1.0;
    }
  }

  // Method to reset zoom
  resetZoom(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the lightbox from closing
    this.zoomLevel = 1.0;
    this.isZoomed = false;
  }

  // Add method to handle image load completed
  onLightboxImageLoaded(): void {
    this.lightboxImageLoading = false;
  }

  // Add method to toggle fullscreen
  toggleFullscreen(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the lightbox from closing
    
    const container = document.querySelector('.lightbox-container') as HTMLElement;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen();
    }
  }

  // Add these new pan methods
  startPan(event: MouseEvent): void {
    if (this.isZoomed) {
      event.preventDefault();
      event.stopPropagation();
      this.isPanning = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
    }
  }

  pan(event: MouseEvent): void {
    if (this.isPanning) {
      event.preventDefault();
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      this.translateX += deltaX;
      this.translateY += deltaY;
      this.startX = event.clientX;
      this.startY = event.clientY;
    }
  }

  endPan(): void {
    this.isPanning = false;
  }

  // Méthode pour formater le nom du destinataire en fonction de son rôle
  formatPartnerName(name: string, role: string): string {
    if (!name) return 'Conversation';
    
    // Don't display User ID format names
    if (name.startsWith('User ') || name.startsWith('Utilisateur ')) {
      return 'Conversation';
    }
    
    const roleLower = role?.toLowerCase() || '';
    
    if (roleLower.includes('doctor') || roleLower.includes('médecin') || roleLower.includes('medecin')) {
      // Only add Dr. prefix if not already there
      return name.startsWith('Dr. ') ? name : `Dr. ${name}`;
    }
    
    return name;
  }

  // After the class declaration, add a new method to persist the partner name and ensure it's not reset
  private setPartnerNamePermanently(name: string, partnerId: number): void {
    if (!name || name.startsWith('User ') || name.startsWith('Utilisateur ')) {
      return; // Don't cache placeholder names
    }
    
    // Store in the local cache
    this.userNameCache.set(partnerId, name);
    
    // Also try to persist it in sessionStorage to survive refreshes
    try {
      const cacheKey = `partner_name_${partnerId}`;
      sessionStorage.setItem(cacheKey, name);
      console.log(`Permanently stored partner name for ${partnerId}: ${name}`);
    } catch (e) {
      console.warn('Could not store partner name in sessionStorage:', e);
    }
  }

  private getPersistedPartnerName(partnerId: number): string | null {
    // First check our local cache
    if (this.userNameCache.has(partnerId)) {
      return this.userNameCache.get(partnerId) || null;
    }
    
    // Then try sessionStorage
    try {
      const cacheKey = `partner_name_${partnerId}`;
      const name = sessionStorage.getItem(cacheKey);
      if (name) {
        // Sync back to local cache
        this.userNameCache.set(partnerId, name);
        return name;
      }
    } catch (e) {
      console.warn('Could not retrieve partner name from sessionStorage:', e);
    }
    
    return null;
  }

  // Add this method to ensure displayed name is never in User ID format
  getDisplayName(): string {
    // First try to get a cached proper name
    const cachedName = this.getPersistedPartnerName(this.partnerId);
    if (cachedName) {
      return this.formatPartnerName(cachedName, this.partnerRole);
    }
    
    // If current name is not a User ID format, use it
    if (this.partnerName && !this.partnerName.startsWith('User ') && !this.partnerName.includes(this.partnerId.toString())) {
      return this.formatPartnerName(this.partnerName, this.partnerRole);
    }
    
    // Fallback to a friendly generic name instead of User ID
    return this.formatPartnerName(`Utilisateur ${this.partnerId}`, this.partnerRole);
  }
} 