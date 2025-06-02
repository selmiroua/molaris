import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

export interface SecretaryRequest {
  id: number;
  userId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  cvUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = environment.apiUrl;  // Base URL

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse, operation = 'operation') {
    console.error(`${operation} failed:`, error);
    return throwError(() => new Error(`${operation} failed: ${error.message}`));
  }

  // Secretary request methods
  getSecretaryRequests(): Observable<SecretaryRequest[]> {
    console.log('Calling:', `${this.apiUrl}/api/v1/api/users/doctor/secretary-applications`);
    return this.http.get<SecretaryRequest[]>(`${this.apiUrl}/api/v1/api/users/doctor/secretary-applications`).pipe(
      tap(requests => console.log('Fetched secretary requests:', requests)),
      catchError(error => {
        console.error('Error fetching secretary requests:', error);
        return of([]);
      })
    );
  }

  approveSecretaryRequest(secretaryId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/api/users/doctor/process-secretary`, {
      secretaryId: secretaryId,
      action: 'APPROVED'
    }).pipe(
      tap(response => console.log('Secretary request approved:', response)),
      catchError(error => this.handleError(error, 'approveSecretaryRequest'))
    );
  }

  rejectSecretaryRequest(secretaryId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/api/users/doctor/process-secretary`, {
      secretaryId: secretaryId,
      action: 'REJECTED'
    }).pipe(
      tap(response => console.log('Secretary request rejected:', response)),
      catchError(error => this.handleError(error, 'rejectSecretaryRequest'))
    );
  }

  getSecretaryRequestById(requestId: number): Observable<SecretaryRequest> {
    return this.http.get<SecretaryRequest>(`${this.apiUrl}/api/v1/api/users/doctor/secretary-applications/${requestId}`).pipe(
      tap(request => console.log('Fetched secretary request:', request)),
      catchError(error => this.handleError(error, 'getSecretaryRequestById'))
    );
  }

  downloadSecretaryCV(requestId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/v1/api/users/doctor/secretary-applications/${requestId}/cv`, {
      responseType: 'blob'
    }).pipe(
      tap(() => console.log('CV download initiated for request:', requestId)),
      catchError(error => this.handleError(error, 'downloadSecretaryCV'))
    );
  }
} 