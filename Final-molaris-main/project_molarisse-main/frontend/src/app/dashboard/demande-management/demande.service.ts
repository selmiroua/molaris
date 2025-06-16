import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface DemandeResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  codePostal: string;
  anneeExperience: number;
  specialite: string;
  autreSpecialite?: string;
  aCabinet: boolean;
  nomCabinet?: string;
  adresseCabinet?: string;
  villeCabinet?: string;
  codePostalCabinet?: string;
  photoPath: string;
  photoCabinetPath?: string;
  photoDiplomePath: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = `${environment.apiUrl}/api/v1/demandes`;

  constructor(private http: HttpClient, private router: Router) {}

  getDemandes(): Observable<DemandeResponse[]> {
    console.log('[DemandeService] Fetching demandes from:', `${this.apiUrl}/all`);
    const token = localStorage.getItem('access_token');
    console.log('[DemandeService] Current token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.error('[DemandeService] No token found');
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<DemandeResponse[]>(`${this.apiUrl}/all`, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateDemandeStatus(id: number, status: string): Observable<DemandeResponse> {
    console.log(`[DemandeService] Updating demande ${id} status to: ${status}`);
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.error('[DemandeService] No token found');
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<DemandeResponse>(`${this.apiUrl}/${id}/status?status=${status}`, {}, {
      headers: headers,
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  getImage(path: string): Observable<Blob> {
    console.log('[DemandeService] Fetching image:', path);
    const token = localStorage.getItem('access_token');

    if (!token) {
      console.error('[DemandeService] No token found for image request');
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${environment.apiUrl}/api/v1/demandes/pictures/${path}`, {
      headers: headers,
      withCredentials: true,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    if (error.status === 401) {
      localStorage.removeItem('access_token');
      this.router.navigate(['/login']);
    }
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
