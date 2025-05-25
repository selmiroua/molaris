import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: number;
  userId: number;
  message: string;
  type: 'NEW_APPOINTMENT' | 'APPOINTMENT_UPDATED' | 'APPOINTMENT_CANCELED' | 
         'SECRETARY_APPLICATION' | 'SECRETARY_APPLICATION_RESPONSE' | 'SECRETARY_REMOVED';
  read: boolean;
  createdAt: any;
  link: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/notifications`;

  constructor(private http: HttpClient) {
    console.log('NotificationService initialized with API URL:', this.apiUrl);
  }

  // Get all notifications for the current user
  getAllNotifications(): Observable<Notification[]> {
    console.log('Getting all notifications from:', this.apiUrl);
    return this.http.get<Notification[]>(this.apiUrl);
  }

  // Alias for getAllNotifications, used by the notification bell component
  getNotifications(): Observable<Notification[]> {
    return this.getAllNotifications();
  }

  // Get unread notifications for the current user
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/unread`);
  }

  // Get count of unread notifications
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  // Mark a notification as read
  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-read/${notificationId}`, {});
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {});
  }
} 