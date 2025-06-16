import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

export interface AdminStats {
  pendingVerifications: number;
  totalDoctors: number;
  totalPatients: number;
  totalUsers: number;
  totalAppointments: number;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
}

export interface StatCount {
  name: string;
  value: number;
}

export interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: {
    id: number;
    nom: string;
  };
  phoneNumber?: string;
  accountLocked: boolean;
  enabled: boolean;
  banned: boolean;
  creationDate: string;
  modificationDate?: string;
  // Frontend computed properties
  fullName?: string;
  status?: string;
  isVerified?: boolean;
  // Profile picture properties
  profilePicturePath?: string | null;
  hasProfilePicture?: boolean;
  hasProfilePictureChecked?: boolean;
  gender?: string;
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
    return this.http.get<AdminStats>(`${environment.apiUrl}/api/v1/api/admin/statistics`).pipe(
      tap(stats => console.log('Fetched admin stats:', stats)),
      catchError(error => this.handleError(error, 'getStats'))
    );
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/api/v1/api/notifications`).pipe(
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
    return this.http.put(`${environment.apiUrl}/api/admin/settings`, settings).pipe(
      tap(response => console.log('Settings updated:', response)),
      catchError(error => this.handleError(error, 'updateSettings'))
    );
  }

  // New methods for statistics
  getUserTypeDistribution(): Observable<StatCount[]> {
    return this.http.get<StatCount[]>(`${environment.apiUrl}/api/v1/api/users/statistics/user-types`).pipe(
      tap(data => console.log('Fetched user type distribution:', data)),
      catchError(error => {
        console.error('Error fetching user type distribution:', error);
        // Return mock data for development
        return of([
          { name: 'Médecins', value: 66 },
          { name: 'Patients', value: 1250 },
          { name: 'Secrétaires', value: 45 },
          { name: 'Administrateurs', value: 5 }
        ]);
      })
    );
  }

  getVerificationStatusDistribution(): Observable<StatCount[]> {
    return this.http.get<StatCount[]>(`${environment.apiUrl}/api/v1/api/doctor-verifications/statistics/verification-status`).pipe(
      tap(data => console.log('Fetched verification status distribution:', data)),
      catchError(error => {
        console.error('Error fetching verification status distribution:', error);
        // Return mock data for development
        return of([
          { name: 'En attente', value: 12 },
          { name: 'Approuvées', value: 58 },
          { name: 'Rejetées', value: 8 }
        ]);
      })
    );
  }

  getRegistrationTimeline(days: number = 30): Observable<ChartData[]> {
    return this.http.get<ChartData[]>(`${environment.apiUrl}/api/v1/api/users/statistics/registrations`, {
      params: { days: days.toString() }
    }).pipe(
      tap(data => console.log('Fetched registration timeline:', data)),
      catchError(error => {
        console.error('Error fetching registration timeline:', error);
        // Return mock data will be generated in the component
        return of([]);
      })
    );
  }

  getAppointmentsByDayOfWeek(): Observable<StatCount[]> {
    return this.http.get<StatCount[]>(`${environment.apiUrl}/api/v1/api/appointments/statistics/appointments-by-day`).pipe(
      tap(data => console.log('Fetched appointments by day of week:', data)),
      catchError(error => {
        console.error('Error fetching appointments by day of week:', error);
        // Return mock data for development
        return of([
          { name: 'Lundi', value: 45 },
          { name: 'Mardi', value: 52 },
          { name: 'Mercredi', value: 38 },
          { name: 'Jeudi', value: 42 },
          { name: 'Vendredi', value: 56 },
          { name: 'Samedi', value: 30 },
          { name: 'Dimanche', value: 0 }
        ]);
      })
    );
  }

  getUsers(page: number = 1, limit: number = 10, filter?: string): Observable<{users: User[], total: number}> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    
    if (filter) {
      params.filter = filter;
    }
    
    return this.http.get<{users: User[], total: number}>(`${environment.apiUrl}/api/v1/api/users/admin/users`, { params }).pipe(
      tap(data => console.log('Fetched users:', data)),
      catchError(error => {
        console.error('Error fetching users:', error);
        // Return mock data for development
        const mockUsers = Array(limit).fill(0).map((_, index) => {
          const user: User = {
            id: index + 1 + (page - 1) * limit,
            email: `user${index + 1 + (page - 1) * limit}@example.com`,
            nom: `User${index + 1 + (page - 1) * limit}`,
            prenom: `Test`,
            role: {
              id: Math.floor(Math.random() * 4) + 1,
              nom: ['patient', 'doctor', 'secretaire', 'admin'][Math.floor(Math.random() * 4)]
            },
            phoneNumber: Math.random() > 0.2 ? `+216 ${Math.floor(Math.random() * 10000000) + 20000000}` : undefined,
            accountLocked: Math.random() > 0.8,
            enabled: Math.random() > 0.1,
            banned: Math.random() > 0.8,
            creationDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
            modificationDate: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString() : undefined
          };
          
          // Add computed properties
          user.fullName = `${user.prenom} ${user.nom}`;
          user.status = user.banned ? 'banned' : (user.accountLocked ? 'suspended' : (user.enabled ? 'active' : 'inactive'));
          user.isVerified = Math.random() > 0.2;
          
          return user;
        });
        
        return of({
          users: mockUsers,
          total: 1366
        });
      })
    );
  }

  banUser(userId: number, banned: boolean): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/v1/api/users/admin/users/${userId}/ban?banned=${banned}`, {}).pipe(
      tap(response => console.log(`User ${banned ? 'banned' : 'unbanned'}:`, response)),
      catchError(error => this.handleError(error, banned ? 'banUser' : 'unbanUser'))
    );
  }
} 