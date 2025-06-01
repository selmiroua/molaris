import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BilanDocument } from '../models/bilan-document.model';

@Injectable({ providedIn: 'root' })
export class BilanMedicalService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/bilans`;

  constructor(private http: HttpClient) {}

  saveBilanMedical(payload: any, files: File[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('bilan', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    files.forEach(file => formData.append('files', file));
    return this.http.post<any>(this.apiUrl, formData);
  }

  getBilanMedicalByFichePatientId(fichePatientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fichePatient/${fichePatientId}`);
  }

  uploadDocument(bilanId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<any>(`${this.apiUrl}/${bilanId}/document`, formData);
  }

  deleteDocument(bilanId: number, documentId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${bilanId}/document/${documentId}`);
  }

  getBilanDocuments(bilanId: number): Observable<BilanDocument[]> {
    return this.http.get<BilanDocument[]>(`${this.apiUrl}/${bilanId}/documents`);
  }

  uploadDocuments(bilanId: number, files: File[]): Observable<BilanDocument[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<BilanDocument[]>(`${this.apiUrl}/${bilanId}/document`, formData);
  }
} 