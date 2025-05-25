import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { tap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/users`;
  currentUser: any = null;

  constructor(private http: HttpClient) {
    // Try to get the current user from localStorage if available
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
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

  // Get all enabled doctors
  getAllEnabledDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctors`, { headers: this.getHeaders() });
  }

  // Apply as a secretary to work with a doctor
  applyAsSecretary(doctorId: number, message?: string, cvFile?: File): Observable<User> {
    const formData = new FormData();
    formData.append('doctorId', doctorId.toString());
    
    if (message) {
      formData.append('message', message);
    }
    
    if (cvFile) {
      formData.append('file', cvFile);
    }
    
    return this.http.post<User>(`${this.apiUrl}/secretary/apply`, formData, { 
      headers: this.getHeaders() 
    });
  }

  // Get assigned doctor (for secretary)
  getAssignedDoctor(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/secretary/doctor`, { 
      headers: this.getHeaders() 
    });
  }

  // Get secretary applications (for doctor)
  getSecretaryApplications(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/doctor/secretary-applications`, {
      headers: this.getHeaders()
    });
  }

  // Get assigned secretaries (for doctor)
  getAssignedSecretaries(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctor/secretaries`, { 
      headers: this.getHeaders() 
    });
  }

  // Process secretary application (for doctor)
  processSecretaryApplication(secretaryId: number, action: 'APPROVED' | 'REJECTED', message?: string): Observable<User> {
    const requestBody = {
      secretaryId,
      action
    };
    
    return this.http.post<User>(`${this.apiUrl}/doctor/process-secretary`, requestBody, { 
      headers: this.getHeaders() 
    });
  }

  // Remove secretary (for doctor)
  removeSecretary(secretaryId: number): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/doctor/secretary/${secretaryId}`, { 
      headers: this.getHeaders() 
    });
  }

  // Toggle secretary access (for doctor)
  toggleSecretaryAccess(secretaryId: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/doctor/secretary/${secretaryId}/toggle-access`, {}, {
      headers: this.getHeaders()
    });
  }

  // Get user by email
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { 
      headers: this.getHeaders() 
    });
  }

  // Get user by ID
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`, { 
      headers: this.getHeaders() 
    });
  }

  // Obtenir la liste des patients du médecin assigné à la secrétaire
  getDoctorPatients(): Observable<any[]> {
    const token = localStorage.getItem('access_token');
    return this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/users/secretary/doctor-patients`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(patients => console.log(`${patients.length} patients récupérés`)),
      catchError(error => {
        console.error('Error fetching doctor\'s patients', error);
        return throwError(() => new Error('Impossible de récupérer les patients du médecin'));
      })
    );
  }
} 