import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdonnanceService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/ordonnances`;
  
  

  constructor(private http: HttpClient) {}

  saveOrdonnance(ordonnance: any): Observable<any> {
    // Ensure patientId is a number
    const payload = {
      ...ordonnance,
      patientId: Number(ordonnance.patientId),
      doctorId: Number(ordonnance.doctorId),
      toothNumber: Number(ordonnance.toothNumber)
    };
    console.log('Sending ordonnance payload:', payload);
    return this.http.post(this.apiUrl, payload);
  }

  existsForTooth(patientId: number, toothNumber: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists`, {
      params: { patientId: patientId.toString(), toothNumber: toothNumber.toString() }
    });
  }

  getOrdonnanceForTooth(patientId: number, toothNumber: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-patient-tooth`, {
      params: { patientId: patientId.toString(), toothNumber: toothNumber.toString() }
    });
  }
} 