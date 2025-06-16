import { Component, OnInit, ViewChild, ElementRef, HostListener, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { ConversationDetailComponent } from './conversation-detail/conversation-detail.component';
import { MessagingService } from '../core/services/messaging.service';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    ConversationListComponent,
    ConversationDetailComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="messaging-container">
      <!-- Mobile Header (only visible on small screens) -->
      <div class="mobile-header" *ngIf="isMobile">
        <button mat-icon-button *ngIf="selectedUserId && showConversation" (click)="backToList()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="mobile-title">
          {{ selectedUserId && showConversation ? partnerName || 'Conversation' : 'Messages' }}
        </h1>
        <button mat-icon-button [matMenuTriggerFor]="mobileMenu">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #mobileMenu="matMenu">
          <button mat-menu-item (click)="toggleLayout()">
            <mat-icon>{{ compactView ? 'fullscreen' : 'fullscreen_exit' }}</mat-icon>
            <span>{{ compactView ? 'Vue étendue' : 'Vue compacte' }}</span>
          </button>
          <button mat-menu-item (click)="refreshConversations()">
            <mat-icon>refresh</mat-icon>
            <span>Actualiser</span>
          </button>
          <mat-divider></mat-divider>
          
        </mat-menu>
      </div>

      <div class="messaging-layout" [class.compact-view]="compactView">
        <!-- Left side - Conversations and User Search -->
        <div class="conversation-sidebar" [class.hidden-mobile]="isMobile && selectedUserId && showConversation">
          <!-- Desktop Header (only visible on larger screens) -->
          <div class="sidebar-header" *ngIf="!isMobile">
            <h1>Messages</h1>
            <div class="header-actions">
              <button mat-icon-button matTooltip="Actualiser" (click)="refreshConversations()">
                <mat-icon>refresh</mat-icon>
              </button>
              
              
            </div>
          </div>

          <div class="search-container">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input type="text" placeholder="Rechercher..." [(ngModel)]="searchQuery">
              <button mat-icon-button *ngIf="searchQuery" (click)="searchQuery = ''">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
          
          <mat-tab-group animationDuration="200ms" (selectedTabChange)="onTabChange($event)">
            <mat-tab>
              <ng-template mat-tab-label>
                <div class="tab-label">
                  <mat-icon>chat</mat-icon>
                  <span>Conversations</span>
                </div>
              </ng-template>
              <app-conversation-list 
                (conversationSelected)="onConversationStarted($event)"
                [searchQuery]="searchQuery"
                [activeConversationId]="selectedUserId">
              </app-conversation-list>
            </mat-tab>
            <mat-tab>
              <ng-template mat-tab-label>
                <div class="tab-label">
                  <mat-icon>people</mat-icon>
                  <span>Tableau des connexions</span>
                </div>
              </ng-template>
              <app-user-search 
                (conversationStarted)="onConversationStarted($event)"
                [searchQuery]="searchQuery">
              </app-user-search>
            </mat-tab>
          </mat-tab-group>
        </div>
        
        <!-- Right side - Conversation Detail -->
        <div class="conversation-detail" [class.hidden-mobile]="isMobile && (!selectedUserId || !showConversation)">
          <div *ngIf="!selectedUserId" class="empty-conversation">
            <div class="empty-state">
              <div class="empty-icon">
              <mat-icon>chat</mat-icon>
              </div>
              <h2>Bienvenue dans votre messagerie</h2>
              <p>Sélectionnez une conversation pour commencer à discuter</p>
              <button mat-raised-button color="primary" (click)="switchToColleaguesTab()">
                <mat-icon>person_add</mat-icon>
                Consulter le tableau des connexions
              </button>
            </div>
          </div>
          
          <div *ngIf="selectedUserId" class="conversation-detail-container">
            <app-conversation-detail 
              #conversationDetail
              [userId]="selectedUserId"
              (partnerInfoLoaded)="updatePartnerInfo($event)">
            </app-conversation-detail>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messaging-container {
      height: 100%;
      overflow: hidden;
      background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
      display: flex;
      flex-direction: column;
    }
    
    .mobile-header {
      display: none;
      height: 56px;
      background-color: #4361ee;
      color: white;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }
    
    .mobile-title {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    
    .messaging-layout {
      display: flex;
      height: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
      gap: 20px;
    }
      
    .messaging-layout.compact-view {
        padding: 10px;
      gap: 10px;
    }
    
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px 8px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .sidebar-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: #333;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .conversation-sidebar {
      width: 360px;
      background-color: white;
      border-radius: 16px;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    }
    
    .search-container {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .search-box {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 24px;
      padding: 8px 16px;
      transition: all 0.2s ease;
    }
    
    .search-box:focus-within {
      background-color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .search-box mat-icon {
      color: #666;
      margin-right: 8px;
    }
    
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 15px;
      color: #333;
    }
    
    .tab-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    ::ng-deep .conversation-sidebar .mat-mdc-tab-header {
      background-color: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    ::ng-deep .conversation-sidebar .mat-mdc-tab-body-wrapper {
      flex-grow: 1;
      overflow: hidden;
    }
    
    ::ng-deep .conversation-sidebar .mdc-tab--active {
      color: #4361ee;
    }
    
    ::ng-deep .conversation-sidebar .mdc-tab-indicator__content--underline {
      border-color: #4361ee !important;
    }
    
    .conversation-detail {
      flex-grow: 1;
      height: 100%;
      overflow: hidden;
      position: relative;
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }
    
    .empty-conversation {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: transparent;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px;
      max-width: 400px;
    }
    
    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: rgba(67, 97, 238, 0.1);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .empty-icon mat-icon {
      font-size: 40px;
      height: 40px;
      width: 40px;
      color: #4361ee;
    }
    
    .empty-state h2 {
      color: #333;
      font-size: 20px;
      margin: 0 0 12px 0;
    }
    
    .empty-state p {
      color: rgba(0, 0, 0, 0.6);
        font-size: 16px;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    
    .conversation-detail-container {
      height: 100%;
    }
    
    /* Enhanced mobile responsiveness */
    @media (max-width: 900px) {
      .messaging-layout {
        padding: 10px;
        flex-direction: column;
        gap: 10px;
      }
      
      .mobile-header {
        display: flex;
      }
      
      .conversation-sidebar {
        width: 100%;
        height: calc(100% - 56px);
        border-radius: 12px;
      }
      
      .conversation-detail {
        height: calc(100% - 56px);
        border-radius: 12px;
      }
      
      .hidden-mobile {
        display: none;
      }
      
      .sidebar-header {
        display: none;
      }
    }
    
    @media (max-width: 480px) {
      .messaging-layout {
        padding: 8px;
        gap: 8px;
      }
      
      .conversation-sidebar, 
      .conversation-detail {
        border-radius: 8px;
      }
      
      .search-container {
        padding: 12px;
      }
      
      .search-box {
        padding: 6px 12px;
      }
      
      .empty-icon {
        width: 60px;
        height: 60px;
      }
      
      .empty-icon mat-icon {
        font-size: 30px;
        height: 30px;
        width: 30px;
      }
      
      .empty-state h2 {
        font-size: 18px;
      }
      
      .empty-state p {
        font-size: 14px;
      }
    }
  `]
})
export class MessagingComponent implements OnInit, AfterViewInit {
  selectedUserId: number | null = null;
  searchQuery: string = '';
  compactView: boolean = false;
  isMobile: boolean = false;
  showConversation: boolean = false;
  partnerName: string = '';
  
  @ViewChild('conversationDetail') conversationDetail?: ConversationDetailComponent;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messagingService: MessagingService
  ) {}
  
  ngOnInit(): void {
    // Log the current URL to help with debugging
    console.log('Current URL:', window.location.pathname);
    
    // Check if we're on the doctor dashboard
    const isDoctorDashboard = window.location.pathname.includes('/dashboard/doctor');
    console.log('Is doctor dashboard:', isDoctorDashboard);
    
    // Check if a specific conversation was requested via URL
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.selectedUserId = +params['id'];
        this.showConversation = true;
        console.log('Conversation ID from URL params:', this.selectedUserId);
      }
    });
    
    // Also check for query parameters in case the route is using them
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.selectedUserId = +params['id'];
        this.showConversation = true;
        console.log('Conversation ID from query params:', this.selectedUserId);
      }
    });
    
    // Check screen size on init
    this.checkScreenSize();
  }
  
  ngAfterViewInit(): void {
    console.log('ConversationDetail component reference:', this.conversationDetail);
  }
  
  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 900;
    
    // If switching to mobile and we have a selected conversation, show it
    if (this.isMobile && this.selectedUserId) {
      this.showConversation = true;
    }
  }
  
  onConversationStarted(userId: any): void {
    this.openConversationDirectly(userId as number);
  }
  
  backToList(): void {
    this.showConversation = false;
  }
  
  toggleLayout(): void {
    this.compactView = !this.compactView;
  }
  
  refreshConversations(): void {
    // This will be handled by the conversation-list component
    // We just need to trigger an event that the list component can listen to
    const event = new CustomEvent('refresh-conversations');
    window.dispatchEvent(event);
  }
  
  onTabChange(event: any): void {
    // Clear search when changing tabs
    this.searchQuery = '';
  }
  
  switchToColleaguesTab(): void {
    const tabGroup = document.querySelector('mat-tab-group');
    if (tabGroup) {
      // Select the second tab (index 1)
      (tabGroup as any)._tabs.get(1).isActive = true;
    }
  }
  
  updatePartnerInfo(info: any): void {
    console.log('Partner info received:', info);
    
    if (info) {
      // If we already have the formatted name from the conversation detail component
      if (info.name && !info.name.startsWith('User ') && !info.name.startsWith('Utilisateur ')) {
        this.partnerName = info.name;
      }
      // Otherwise try to format it from the raw user data
      else if (info.prenom && info.nom) {
        this.partnerName = `${info.prenom} ${info.nom}`;
      } else if (info.firstName && info.lastName) {
        this.partnerName = `${info.firstName} ${info.lastName}`;
      } else if (info.email) {
        // Use email as a fallback rather than user ID
        this.partnerName = info.email;
      } else {
        // Only use this generic format if nothing better is available
        this.partnerName = `Conversation`;
      }
      
      // Format doctor names
      if (info.role && 
          (String(info.role).toLowerCase().includes('doctor') || 
           String(info.role).toLowerCase().includes('médecin') || 
           String(info.role).toLowerCase().includes('medecin'))) {
        if (!this.partnerName.startsWith('Dr. ')) {
          this.partnerName = `Dr. ${this.partnerName}`;
        }
      }
      
      console.log('Partner name set to:', this.partnerName);
    }
  }
  
  // Add a method to directly open a conversation
  openConversationDirectly(userId: number): void {
    console.log('Opening conversation directly with user ID:', userId);
    
    // Set the selected user ID
    this.selectedUserId = userId;
    
    // Show the conversation
    this.showConversation = true;
    
    // If we have a reference to the conversation detail component, update it
    if (this.conversationDetail) {
      // Force a refresh of the conversation detail component
      setTimeout(() => {
        if (this.conversationDetail) {
          console.log('Refreshing conversation detail component for user:', userId);
          // Use the public reloadConversation method
          this.conversationDetail.reloadConversation(userId);
        }
      }, 0);
    }
  }
} 