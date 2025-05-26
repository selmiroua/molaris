import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, throwError, filter } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FichePatient {
  id?: number;
  patientId?: number;
  nom?: string;
  prenom?: string;
  age?: number;
  dateNaissance?: Date;
  date_naissance?: string;
  profession?: string;
  telephone?: string;
  adresse?: string;
  sexe?: string;
  etatGeneral?: string;
  antecedentsChirurgicaux?: string;
  priseMedicaments?: string;
  allergies?: string;
  observationsDentaires?: string;
  createdAt?: Date;
  updatedAt?: Date;
  documentPath?: string | null;
  documentName?: string | null;
  documentType?: string | null;
  documentSize?: number | null;
  documentUploadDate?: Date | null;
  documents?: PatientDocument[];
}

export interface PatientDocument {
  id: number;
  name: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  filePath: string;
  documentType?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/patients`;

  constructor(private http: HttpClient) {}

  getApiUrl(): string {
    return this.apiUrl;
  }

  // Get current patient's medical information
  getCurrentPatientFiche(): Observable<FichePatient> {
    return this.http.get<FichePatient>(`${this.apiUrl}/me/fiche`).pipe(
      tap(response => console.log('Received fiche:', response)),
      catchError(error => {
        console.error('Error fetching fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Update current patient's medical information
  updatePatientFiche(fichePatient: FichePatient): Observable<FichePatient> {
    const token = localStorage.getItem('access_token');
    return this.http.put<FichePatient>(`${this.apiUrl}/me/fiche`, fichePatient, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      tap(response => console.log('Updated fiche:', response)),
      catchError(error => {
        console.error('Error updating fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Alias for updatePatientFiche to match the component's usage
  updateFichePatient(fichePatient: FichePatient): Observable<FichePatient> {
    return this.updatePatientFiche(fichePatient);
  }

  // Create new patient fiche from welcome modal
  createPatientFicheFromWelcome(patientData: any, files?: File[]): Observable<any> {
    // First create the patient fiche
    return this.http.post(`${this.apiUrl}/me/fiche`, patientData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      tap(response => console.log('Created fiche:', response)),
      catchError(error => {
        console.error('Error creating fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Get patient's medical information by ID (for doctors/secretaries)
  getPatientFiche(patientId: number): Observable<FichePatient> {
    const token = localStorage.getItem('access_token');
    return this.http.get<FichePatient>(`${this.apiUrl}/${patientId}/fiche`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      map(response => {
        console.log('Raw response from backend:', response);
        
        // Handle date_naissance from backend (comes as string)
        if (response.date_naissance) {
          // Parse the date string into a Date object for dateNaissance property
          response.dateNaissance = new Date(response.date_naissance);
          console.log('Converted date_naissance to Date object:', response.dateNaissance);
        }
        // If there's only age but no birthdate, calculate an estimated birthdate
        else if (response.age && !response.dateNaissance) {
          const today = new Date();
          const birthYear = today.getFullYear() - response.age;
          response.dateNaissance = new Date(birthYear, 0, 1); // January 1st of birth year
          console.log('Calculated birthdate from age:', response.dateNaissance);
        }
        
        return response;
      }),
      tap(response => console.log('Processed patient fiche:', response)),
      catchError(error => {
        console.error('Error fetching patient fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Create or update patient's medical information (for doctors/secretaries)
  createOrUpdateFiche(patientId: number, fichePatient: FichePatient): Observable<FichePatient> {
    const token = localStorage.getItem('access_token');
    return this.http.post<FichePatient>(`${this.apiUrl}/${patientId}/fiche`, fichePatient, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      tap(response => console.log('Created/Updated patient fiche:', response)),
      catchError(error => {
        console.error('Error creating/updating patient fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Create or update patient's medical information with files (for doctors/secretaries)
  createOrUpdateFicheWithFiles(patientId: number, formData: FormData): Observable<FichePatient> {
    const url = `${this.apiUrl}/${patientId}/fiche/with-documents`;
    
    // Set up request with longer timeout for file uploads
    const httpOptions = {
      reportProgress: true,
      observe: 'events' as const,
      // Don't set content type - browser will set correct multipart/form-data with boundary
    };
    
    return this.http.post<any>(url, formData, httpOptions).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          // You could emit progress to a subject here if needed
          console.log(`Upload progress: ${progress}%`);
        }
        
        if (event.type === HttpEventType.Response) {
          console.log('Upload complete', event.body);
          return event.body;
        }
        
        return null;
      }),
      filter(response => response !== null),
      catchError(error => {
        console.error('Error uploading files:', error);
        // Enhance error with more details
        const errorMsg = error.error && error.error.error 
          ? error.error.error 
          : 'Erreur lors du téléchargement des fichiers';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  // Upload documents
  uploadDocuments(files: FormData): Observable<PatientDocument[]> {
    // Don't extract the file, send the FormData directly
    return this.http.post<FichePatient>(`${this.apiUrl}/me/fiche/document`, files).pipe(
      map(response => [{
        id: response.id || 1,
        name: response.documentName || 'Document',
        fileType: response.documentType || 'application/octet-stream',
        fileSize: response.documentSize || 0,
        uploadDate: new Date(),
        filePath: response.documentPath || '',
        documentType: response.documentType
      }]),
      tap(response => console.log('Uploaded documents:', response)),
      catchError(error => {
        console.error('Error uploading documents:', error);
        return throwError(() => error);
      })
    );
  }

  // Get all documents
  getDocuments(): Observable<PatientDocument[]> {
    return this.getCurrentPatientFiche().pipe(
      map(fiche => {
        if (fiche.documentPath) {
          return [{
            id: fiche.id || 1,
            name: fiche.documentName || 'Document',
            fileType: fiche.documentType || 'application/octet-stream',
            fileSize: fiche.documentSize || 0,
            uploadDate: new Date(),
            filePath: fiche.documentPath || '',
            documentType: fiche.documentType
          }];
        }
        return [];
      }),
      tap(response => console.log('Received documents:', response)),
      catchError(error => {
        console.error('Error fetching documents:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete a document
  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/fiche/document`).pipe(
      tap(() => console.log('Deleted document:', documentId)),
      catchError(error => {
        console.error('Error deleting document:', error);
        return throwError(() => error);
      })
    );
  }

  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/me/fiche/document`, formData, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      tap(response => console.log('Uploaded document:', response)),
      catchError(error => {
        console.error('Error uploading document:', error);
        return throwError(() => error);
      })
    );
  }

  getDocument(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/me/fiche/document`, {
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    }).pipe(
      tap(response => console.log('Received document:', response)),
      catchError(error => {
        console.error('Error fetching document:', error);
        return throwError(() => error);
      })
    );
  }
}