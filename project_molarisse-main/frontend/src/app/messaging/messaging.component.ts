import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { ConversationListComponent } from './conversation-list/conversation-list.component';
import { ConversationDetailComponent } from './conversation-detail/conversation-detail.component';
import { UserSearchComponent } from './user-search/user-search.component';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTabsModule,
    ConversationListComponent,
    ConversationDetailComponent,
    UserSearchComponent
  ],
  template: `
    <div class="messaging-container">
      <div class="messaging-layout">
        <!-- Left side - Conversations and User Search -->
        <div class="conversation-sidebar">
          <div class="search-container">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input type="text" placeholder="Search...">
            </div>
          </div>
          <mat-tab-group>
            <mat-tab label="Conversations">
              <app-conversation-list (conversationSelected)="onConversationStarted($event)"></app-conversation-list>
            </mat-tab>
            <mat-tab label="Collègues">
              <app-user-search (conversationStarted)="onConversationStarted($event)"></app-user-search>
            </mat-tab>
          </mat-tab-group>
        </div>
        
        <!-- Right side - Conversation Detail -->
        <div class="conversation-detail">
          <div *ngIf="!selectedUserId" class="empty-conversation">
            <div class="empty-state">
              <mat-icon>chat</mat-icon>
              <p>Sélectionnez une conversation pour commencer à discuter</p>
            </div>
          </div>
          
          <div *ngIf="selectedUserId" class="conversation-detail-container">
            <app-conversation-detail [userId]="selectedUserId"></app-conversation-detail>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messaging-container {
      height: 100%;
      overflow: hidden;
      background: linear-gradient(135deg, #e6f2fe 0%, #e9ecff 100%);
    }
    
    .messaging-layout {
      height: 100%;
      display: flex;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
      
      @media (max-width: 768px) {
        padding: 10px;
      }
    }
    
    .conversation-sidebar {
      width: 350px;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-right: 20px;
      display: flex;
      flex-direction: column;
      
      @media (max-width: 480px) {
        margin-right: 0;
        width: 100%;
      }
    }
    
    .search-container {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      
      @media (max-width: 768px) {
        padding: 12px;
      }
      
      @media (max-width: 480px) {
        padding: 10px;
      }
    }
    
    .search-box {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 24px;
      padding: 8px 16px;
      
      @media (max-width: 480px) {
        padding: 6px 12px;
      }
    }
    
    .search-box mat-icon {
      color: #888;
      margin-right: 8px;
    }
    
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 14px;
    }
    
    ::ng-deep .conversation-sidebar .mat-tab-labels {
      background-color: #fff;
      justify-content: center;
    }
    
    ::ng-deep .conversation-sidebar .mat-tab-body-wrapper {
      height: calc(100% - 110px);
      overflow: hidden;
    }
    
    /* Add these lines for tab indicator color */
    ::ng-deep .conversation-sidebar .mat-ink-bar {
      background-color: #4361ee !important;
    }
    
    ::ng-deep .conversation-sidebar .mat-tab-label-active {
      color: #4361ee;
      font-weight: 500;
    }
    
    .conversation-detail {
      flex-grow: 1;
      height: 100%;
      overflow: hidden;
      position: relative;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
    }
    
    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
      color: rgba(0, 0, 0, 0.2);
      
      @media (max-width: 480px) {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin-bottom: 15px;
      }
    }
    
    .empty-state p {
      color: rgba(0, 0, 0, 0.5);
      font-size: 18px;
      margin: 0;
      
      @media (max-width: 480px) {
        font-size: 16px;
      }
    }
    
    .conversation-detail-container {
      height: 100%;
    }
    
    /* Enhanced mobile responsiveness */
    @media (max-width: 900px) {
      .messaging-layout {
        flex-direction: column;
        padding: 10px;
      }
      
      .conversation-sidebar {
        width: 100%;
        height: 350px;
        margin-right: 0;
        margin-bottom: 20px;
      }
      
      ::ng-deep .conversation-sidebar .mat-tab-body-wrapper {
        height: calc(350px - 110px);
      }
      
      .conversation-detail {
        height: calc(100% - 370px);
      }
    }
    
    @media (max-width: 480px) {
      .messaging-layout {
        padding: 5px;
      }
      
      .conversation-sidebar {
        height: 300px;
        margin-bottom: 10px;
        border-radius: 8px;
      }
      
      ::ng-deep .conversation-sidebar .mat-tab-body-wrapper {
        height: calc(300px - 100px);
      }
      
      .conversation-detail {
        height: calc(100% - 310px);
        border-radius: 8px;
      }
      
      ::ng-deep .mat-tab-label {
        height: 40px !important;
        min-width: 100px !important;
        padding: 0 12px !important;
      }
    }
  `]
})
export class MessagingComponent implements OnInit {
  selectedUserId: number | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Subscribe to route changes to update the selected conversation
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.selectedUserId = parseInt(idParam, 10);
      }
    });
  }
  
  // Handle conversation selection from UserSearchComponent
  onConversationStarted(userId: number): void {
    this.selectedUserId = userId;
    // Don't navigate, just update the selected user
  }
} 