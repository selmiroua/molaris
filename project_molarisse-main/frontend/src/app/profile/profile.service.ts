import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

export interface UserProfile {
  profession: any;
  dateNaissance: any;
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  address: string;
  phoneNumber: string;
  profilePicturePath: string;
  cvFilePath?: string;
  // Doctor professional info fields
  specialities?: string[];
  orderNumber?: string;
  cabinetAdresse?: string;
  ville?: string;
  welcomeSeen?: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/users`;

  constructor(private http: HttpClient) {
    console.log('ProfileService initialized with API URL:', this.apiUrl);
    console.log('Environment API URL:', environment.apiUrl);
  }

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

  private getMultipartHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCurrentProfile(): Observable<UserProfile> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/profile`;
    console.log('Getting current profile from:', url);
    console.log('With headers:', headers);
    return this.http.get<UserProfile>(url, { headers }).pipe(
      tap(profile => {
        console.log('Raw profile data from API:', profile);
        console.log('Date of birth from API:', profile.dateNaissance, 'Type:', typeof profile.dateNaissance);
      })
    );
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    const headers = this.getHeaders();
    console.log('Updating profile with data:', profileData);
    console.log('Sending request to:', `${this.apiUrl}/profile`);
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData, { headers });
  }

  uploadProfilePicture(file: File): Observable<HttpEvent<any>> {
    const headers = this.getMultipartHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/profile/picture`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  changePassword(passwordData: PasswordChangeRequest): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/password`, passwordData, { headers });
  }

  uploadCV(file: File): Observable<HttpEvent<any>> {
    const headers = this.getMultipartHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload-cv`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }
}
