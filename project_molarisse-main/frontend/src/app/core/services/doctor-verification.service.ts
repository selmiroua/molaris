import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { DoctorVerification } from '../models/doctor-verification.model';
import { environment } from '../../../environments/environment';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorVerificationService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/doctor-verifications`;
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient) {
    console.log('DoctorVerificationService initialized with URL:', this.apiUrl);
  }

  private getHeaders(isFormData: boolean = false): HttpHeaders {
    let token = localStorage.getItem(this.TOKEN_KEY);
    
    // Try alternate token key if not found
    if (!token) {
      token = localStorage.getItem('access_token');
      console.log('Using alternate token key: auth_token');
    }
    
    console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    let headers = new HttpHeaders();
    
    // Always add Authorization header with Bearer token
    headers = headers.set('Authorization', `Bearer ${token}`);
    
    // Add Content-Type only for JSON requests
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }

    console.log('Generated headers:', headers);
    return headers;
  }

  // Get the API URL for external use
  getApiUrl(): string {
    return this.apiUrl;
  }

  // Get all verifications
  getAllVerifications(): Observable<DoctorVerification[]> {
    return this.http.get<DoctorVerification[]>(this.apiUrl, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  // Get all approved verifications
  getApprovedVerifications(): Observable<DoctorVerification[]> {
    return this.http.get<DoctorVerification[]>(`${this.apiUrl}/approved`, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  // Get all pending verifications for admin
  getPendingVerifications(): Observable<DoctorVerification[]> {
    console.log('Getting pending verifications from:', `${this.apiUrl}/pending`);
    const headers = this.getHeaders();
    console.log('With headers:', headers);
    return this.http.get<DoctorVerification[]>(`${this.apiUrl}/pending`, { headers });
  }

  // Update verification status (approve/reject)
  updateVerificationStatus(verificationId: number, status: 'approved' | 'rejected', message?: string): Observable<DoctorVerification> {
    // Get token, try both possible token keys
    let token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }
    
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    
    const statusRequest = {
      status: status.toUpperCase(),
      message: message || null
    };
    
    console.log('Status request:', statusRequest);
    console.log(`Trying to update verification status for ID: ${verificationId}`);
    
    // Create an array of possible API endpoints to try
    const endpoints = [
      `${environment.apiUrl}/api/v1/api/doctor-verifications/${verificationId}/status`,
      `${environment.apiUrl}/api/v1/admin/doctor-verifications/${verificationId}/status`,
      `${this.apiUrl}/${verificationId}/status`,
      `${environment.apiUrl}/api/v1/users/doctor-verifications/${verificationId}/status`
    ];
    
    // Try each endpoint in sequence until one works
    return this.tryEndpoints(endpoints, 0, statusRequest, headers);
  }
  
  // Helper method to try multiple endpoints in sequence
  private tryEndpoints(endpoints: string[], index: number, data: any, headers: HttpHeaders): Observable<any> {
    if (index >= endpoints.length) {
      return throwError(() => new Error('All API endpoints failed'));
    }
    
    const endpoint = endpoints[index];
    console.log(`Trying endpoint (${index + 1}/${endpoints.length}): ${endpoint}`);
    
    return this.http.put(endpoint, data, { headers }).pipe(
      tap(response => console.log(`Endpoint ${index + 1} successful:`, response)),
      catchError(error => {
        console.error(`Endpoint ${index + 1} failed:`, error);
        // Try the next endpoint
        return this.tryEndpoints(endpoints, index + 1, data, headers);
      })
    );
  }

  // Submit verification
  submitVerification(data: any): Observable<DoctorVerification> {
    console.log('Submitting verification to:', this.apiUrl);
    console.log('With data:', data);
    
    const verificationData = {
      doctorId: data.doctorId,
      address: data.address || '',
      cabinetAddress: data.cabinetAddress || '',
      yearsOfExperience: data.yearsOfExperience || 0,
      specialties: Array.isArray(data.specialties) ? data.specialties : [data.specialties],
      postalCode: data.postalCode || '',
      email: data.email || '',
      cabinetName: data.cabinetName || '',
      phoneNumber: data.phoneNumber || '',
      message: data.message || ''
    };

    return this.http.post<DoctorVerification>(this.apiUrl, verificationData, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Verification submitted successfully:', response)),
      catchError(error => {
        console.error('Error submitting verification:', error);
        throw error;
      })
    );
  }

  // Submit verification with files
  submitVerificationWithFiles(formData: FormData): Observable<DoctorVerification> {
    console.log('Submitting verification with files...');
    const headers = this.getHeaders(true);
    
    // Log FormData contents for debugging
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`FormData field - ${key}:`, value.name);
      } else {
        console.log(`FormData field - ${key}:`, value);
      }
    });

    return this.http.post<DoctorVerification>(this.apiUrl, formData, { 
      headers,
      withCredentials: true // Add this to ensure cookies are sent
    }).pipe(
      tap(response => console.log('Verification submitted successfully:', response)),
      catchError(error => {
        console.error('Error submitting verification:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        throw error;
      })
    );
  }

  // Submit a simplified verification
  submitVerificationSimple(data: any): Observable<DoctorVerification> {
    try {
      console.log('Submitting simplified verification to:', this.apiUrl);
      const headers = this.getHeaders();
      
      const simplifiedData = {
        doctorId: data.doctorId,
        address: data.address || '',
        cabinetAddress: data.cabinetAddress || '',
        yearsOfExperience: data.yearsOfExperience || 0,
        specialties: data.specialties || [],
        postalCode: data.postalCode || '',
        email: data.professionalEmail || '',
        cabinetName: data.cabinetName || '',
        phoneNumber: data.phone || '',
        message: data.professionalSummary || ''
      };
      
      console.log('Sending data:', simplifiedData);
      
      return this.http.post<DoctorVerification>(this.apiUrl, simplifiedData, { 
        headers,
        observe: 'response'
      }).pipe(
        map(response => {
          console.log('Full response:', response);
          if (!response.body) {
            throw new Error('Empty response body');
          }
          return response.body;
        }),
        catchError(error => {
          console.error('Error details:', {
            status: error.status,
            message: error.message,
            error: error.error
          });
          throw error;
        })
      );
    } catch (error) {
      console.error('Error in submitVerificationSimple:', error);
      throw error;
    }
  }

  // Méthode alternative avec un autre chemin d'API
  submitVerificationAlt(formData: FormData): Observable<DoctorVerification> {
    return this.http.post<DoctorVerification>(`${this.apiUrl}`, formData);
  }

  // Get verification by doctor ID
  getVerificationByDoctorId(doctorId: number): Observable<DoctorVerification> {
    return this.http.get<DoctorVerification>(`${this.apiUrl}/doctor/${doctorId}`, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }
  
  // Méthode alternative pour essayer un chemin différent
  getVerificationByDoctorIdAlt(doctorId: number, index: number = 1): Observable<DoctorVerification> {
    const urls = [
      `${this.apiUrl}/doctor/${doctorId}`,
      `${this.apiUrl}/${doctorId}`,
      `${environment.apiUrl}/api/v1/doctor-verifications/doctor/${doctorId}`
    ];
    
    // Utiliser l'URL alternative spécifiée par l'index
    const url = index < urls.length ? urls[index] : urls[0];
    return this.http.get<DoctorVerification>(url);
  }

  // Upload cabinet photo
  uploadCabinetPhoto(verificationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = this.getHeaders(true);
    
    return this.http.post<any>(
      `${this.apiUrl}/${verificationId}/cabinet-photo`, 
      formData, 
      { 
        headers,
        withCredentials: true
      }
    );
  }

  // Upload diploma photo
  uploadDiplomaPhoto(verificationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = this.getHeaders(true);
    
    return this.http.post<any>(
      `${this.apiUrl}/${verificationId}/diploma-photo`, 
      formData, 
      { 
        headers,
        withCredentials: true
      }
    );
  }

  // Get current doctor's verification
  getCurrentVerification(): Observable<DoctorVerification> {
    // Get the current user's ID from localStorage
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      // Get the user ID from the token
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload); // Log the full payload
      
      // Try different possible ID fields
      const userId = payload.id || payload.sub || payload.userId || payload.user_id;
      console.log('Extracted user ID:', userId);

      if (!userId) {
        console.log('Available payload fields:', Object.keys(payload));
        throw new Error('No user ID found in token');
      }

      console.log('Getting verification for current doctor ID:', userId);
      return this.http.get<DoctorVerification>(`${this.apiUrl}/doctor/${userId}`).pipe(
        tap(verification => {
          console.log('Current verification status:', verification);
        }),
        catchError(error => {
          console.error('Error getting current verification:', error);
          throw error;
        })
      );
    } catch (error) {
      console.error('Error parsing token:', error);
      throw error;
    }
  }

  // Check doctor verification status
  checkDoctorVerificationStatus(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/${email}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error checking verification:', error);
        return of(false);
      })
    );
  }

  // Method for testing in browser console
  testGetVerificationByDoctorId(doctorId: number): void {
    console.log('TEST: Checking verification for doctor ID:', doctorId);
    this.getVerificationByDoctorId(doctorId).subscribe({
      next: (verification) => {
        console.log('TEST: Verification object:', verification);
        if (verification && verification.status) {
          const status = verification.status.toLowerCase();
          console.log('TEST: Verification status:', status);
          console.log('TEST: Is verified?', status === 'approved');
        } else {
          console.log('TEST: Verification has no status or is invalid');
        }
      },
      error: (error) => {
        console.error('TEST: Error getting verification:', error);
      }
    });
  }
} 