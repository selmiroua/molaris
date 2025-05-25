import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

export interface AdminStats {
  pendingVerifications: number;
  totalDoctors: number;
  totalPatients: number;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/v1/admin`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse, operation = 'operation') {
    console.error(`${operation} failed:`, error);
    return throwError(() => new Error(`${operation} failed: ${error.message}`));
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/statistics`).pipe(
      tap(stats => console.log('Fetched admin stats:', stats)),
      catchError(error => this.handleError(error, 'getStats'))
    );
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`).pipe(
      tap(notifications => console.log('Fetched notifications:', notifications)),
      catchError(error => this.handleError(error, 'getNotifications'))
    );
  }

  getVerifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verifications`).pipe(
      tap(verifications => console.log('Fetched verifications:', verifications)),
      catchError(error => this.handleError(error, 'getVerifications'))
    );
  }

  getRecentVerifications(limit: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/verifications/recent`, {
      params: { limit: limit.toString() }
    }).pipe(
      tap(verifications => console.log('Fetched recent verifications:', verifications)),
      catchError(error => this.handleError(error, 'getRecentVerifications'))
    );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData).pipe(
      tap(response => console.log('Profile updated:', response)),
      catchError(error => this.handleError(error, 'updateProfile'))
    );
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, settings).pipe(
      tap(response => console.log('Settings updated:', response)),
      catchError(error => this.handleError(error, 'updateSettings'))
    );
  }
} 