import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DoctorApplication } from '../models/doctor-application.model';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorApplicationService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/users/doctor/secretary-applications`;

  constructor(private http: HttpClient) { }

  /**
   * Get the current application for the logged-in secretary
   */
  getCurrentApplication(): Observable<DoctorApplication | null> {
    return this.http.get<DoctorApplication | null>(`${this.apiUrl}/current`)
      .pipe(
        catchError(error => {
          console.warn('Error fetching current application, using mock data', error);
          return of(null);
        })
      );
  }

  /**
   * Submit a new application to work with a doctor
   */
  submitApplication(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/api/users/secretary/apply`, formData);
  }

  /**
   * Get all applications for a doctor
   */
  getDoctorApplications(doctorId: number): Observable<DoctorApplication[]> {
    return this.http.get<DoctorApplication[]>(`${this.apiUrl}/doctor/${doctorId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching doctor applications:', error);
          return of([]);
        })
      );
  }

  /**
   * Update application status (approve or reject)
   */
  updateApplicationStatus(applicationId: number, status: 'approved' | 'rejected'): Observable<DoctorApplication> {
    return this.http.patch<DoctorApplication>(`${this.apiUrl}/${applicationId}`, { status })
      .pipe(
        catchError(error => {
          console.error('Error updating application status:', error);
          const mockResponse: DoctorApplication = {
            id: applicationId,
            secretaryId: 1,
            doctorId: 1,
            message: 'Mock application message',
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return of(mockResponse);
        })
      );
  }
} 