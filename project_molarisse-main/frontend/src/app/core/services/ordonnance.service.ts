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
    return this.http.post(this.apiUrl, ordonnance);
  }
} 