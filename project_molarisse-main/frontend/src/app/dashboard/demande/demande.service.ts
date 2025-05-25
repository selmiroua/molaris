import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class DemandeService {
  private apiUrl = `${environment.apiUrl}/api/v1/demandes`;
  //private picturesUrl = `${environment.apiUrl}/api/v1/demandes/pictures`;

  constructor(private http: HttpClient, private router: Router)  {}

  /**
   * Gets the URL for a demande picture
   * @param filename The name of the picture file
   * @returns The complete URL for the picture
   */
  //getPictureUrl(filename: string): string {
   // return `${this.picturesUrl}/${filename}`;
  //}

  /**
   * Checks if the user has a pending demande
   * @returns Observable with boolean indicating if there's a pending demande
   */
  checkPendingDemande(): Observable<boolean> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<boolean>(`${this.apiUrl}/check`, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error checking pending demande:', error);
        if (error.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Soumet une demande d'adhésion à l'API
   * @param formData Les données du formulaire incluant les fichiers
   * @returns Observable avec la réponse du serveur
   */
  submitDemande(formData: FormData): Observable<any> {
    console.log('Submitting demande with FormData:', formData);

    // Get the token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    // Log the FormData contents for debugging
    for (const pair of formData.entries()) {
      console.log('FormData entry:', pair[0], pair[1]);
    }

    // Create headers without Content-Type (browser will set it automatically with boundary)
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(this.apiUrl, formData, {
      headers: headers,
      withCredentials: true,
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('Response received:', response);
      }),
      catchError(error => {
        console.error('Error in submitDemande:', error);
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          console.error('Client error:', error.error.message);
        } else {
          // Server-side error
          console.error('Server error:', error.status, error.error);
          if (error.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('access_token');
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  getCurrentUserDemande(): Observable<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/current`, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error getting current user demande:', error);
        if (error.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
