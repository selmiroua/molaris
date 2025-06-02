import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  phoneNumber?: string;
  profilePicturePath?: string;
  assignedDoctor?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getCurrentProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, {
      headers: this.getHeaders()
    }).pipe(
      map(profile => {
        console.log('Raw profile response:', profile);
        return profile;
      }),
      catchError(error => {
        console.error('Error getting current profile:', error);
        return throwError(() => new Error('Failed to get profile'));
      })
    );
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(() => new Error('Failed to update profile'));
      })
    );
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/profile/picture`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      })
    }).pipe(
      catchError(error => {
        console.error('Error uploading profile picture:', error);
        return throwError(() => new Error('Failed to upload profile picture'));
      })
    );
  }
} 