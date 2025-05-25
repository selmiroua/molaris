import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BilanMedicalService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/bilans`;

  constructor(private http: HttpClient) {}

  saveBilanMedical(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  getBilanMedicalByFichePatientId(fichePatientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fichePatient/${fichePatientId}`);
  }
} 