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
    
    // Use PUT for updates (when id exists) and POST for new ordonnances
    if (ordonnance.id) {
      const url = `${this.apiUrl}/${ordonnance.id}`;
      console.log(`Updating ordonnance with ID ${ordonnance.id} at URL: ${url}`);
      console.log('Update payload:', JSON.stringify(payload));
      return this.http.put(url, payload);
    } else {
      console.log('Creating new ordonnance');
      console.log('Create payload:', JSON.stringify(payload));
      return this.http.post(this.apiUrl, payload);
    }
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