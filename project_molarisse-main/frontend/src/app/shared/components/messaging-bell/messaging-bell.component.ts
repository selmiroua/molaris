import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { MessagingService } from '../../../core/services/messaging.service';

@Component({
  selector: 'app-messaging-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule
  ],
  template: `
    <div class="messaging-bell">
      <button mat-icon-button (click)="navigateToMessages()" aria-label="Messages" class="bell-button">
        <mat-icon
          [matBadge]="unreadCount"
          [matBadgeHidden]="unreadCount === 0"
          matBadgeSize="small"
          matBadgeColor="warn"
          matBadgeOverlap="true">
          message
        </mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .messaging-bell {
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
  `]
})
export class MessagingBellComponent implements OnInit {
  unreadCount = 0;
  
  constructor(
    private messagingService: MessagingService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Subscribe to the unread count from the messaging service
    this.messagingService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    // Load the initial unread count
    this.messagingService.getUnreadMessageCount().subscribe();
  }
  
  navigateToMessages(): void {
    this.router.navigate(['/messaging']);
  }
} 