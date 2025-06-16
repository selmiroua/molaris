import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BilanDocument } from '../models/bilan-document.model';

@Injectable({ providedIn: 'root' })
export class BilanMedicalService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/bilans`;
  private consultationApiUrl = `${environment.apiUrl}/api/v1/api/consultations`;

  constructor(private http: HttpClient) {}

  saveBilanMedical(payload: any, files: File[] = []): Observable<any> {
    const bilanPayload = { ...payload };
    delete bilanPayload.amountToPay;
    delete bilanPayload.amountPaid;
    delete bilanPayload.paymentMethod;
    delete bilanPayload.paymentNotes;
    delete bilanPayload.profit;
    delete bilanPayload.remainingToPay;

    const formData = new FormData();
    formData.append('bilan', new Blob([JSON.stringify(bilanPayload)], { type: 'application/json' }));
    files.forEach(file => formData.append('files', file));
    return this.http.post<any>(this.apiUrl, formData);
  }

  // Get consultation by ID or create a new one if it doesn't exist
  getOrCreateConsultation(appointmentId: number, bilanMedicalId: number): Observable<any> {
    console.log('Getting or creating consultation for appointment:', appointmentId, 'bilanMedicalId:', bilanMedicalId);
    
    if (!appointmentId) {
      console.error('Cannot create consultation: appointmentId is missing');
      return throwError(() => new Error('Appointment ID is required'));
    }
    
    // Only send bilanMedicalId if it's a valid ID (greater than 0)
    const payload: any = {
      appointmentId: appointmentId
    };
    
    if (bilanMedicalId && bilanMedicalId > 0) {
      payload.bilanMedicalId = bilanMedicalId;
      console.log('Including bilanMedicalId in payload:', bilanMedicalId);
    } else {
      console.log('Not including bilanMedicalId in payload as it is', bilanMedicalId);
    }
    
    console.log('Creating consultation with payload:', payload);
    
    return this.http.post<any>(`${this.consultationApiUrl}`, payload)
      .pipe(
        tap(consultation => console.log('Created consultation:', consultation)),
        catchError(error => {
          console.error('Error creating consultation:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          return throwError(() => error);
        })
      );
  }

  savePaymentToConsultation(appointmentId: number, paymentData: any): Observable<any> {
    console.log('Saving payment to consultation for appointment:', appointmentId, paymentData);
    
    if (!appointmentId) {
      console.error('Cannot save payment: appointmentId is missing');
      return throwError(() => new Error('Appointment ID is required'));
    }
    
    // First get or create the consultation
    return this.getOrCreateConsultation(appointmentId, paymentData.bilanMedicalId || 0)
      .pipe(
        switchMap(consultation => {
          if (!consultation || !consultation.id) {
            console.error('Invalid consultation object received:', consultation);
            return throwError(() => new Error('Invalid consultation data received from server'));
          }
          
          console.log('Got consultation for payment:', consultation);
          const consultationId = consultation.id;
          console.log('API URL:', `${this.consultationApiUrl}/${consultationId}/payment`);
          
          const paymentPayload = {
            amountToPay: paymentData.amountToPay || 0,
            amountPaid: paymentData.amountPaid || 0,
            paymentMethod: paymentData.paymentMethod || '',
            paymentNotes: paymentData.paymentNotes || '',
            profit: paymentData.profit || 0,
            remainingToPay: paymentData.remainingToPay || 0
          };
          
          console.log('Payment payload:', paymentPayload);
          
          return this.http.post<any>(`${this.consultationApiUrl}/${consultationId}/payment`, paymentPayload);
        }),
        tap(response => console.log('Payment saved successfully:', response)),
        catchError(error => {
          console.error('Error saving payment:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          return throwError(() => error);
        })
      );
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

  getMyBilans(): Observable<any[]> {
    console.log('BilanMedicalService: Fetching bilans for current doctor');
    return this.http.get<any[]>(`${this.apiUrl}/me`).pipe(
      tap(bilans => {
        console.log('BilanMedicalService: Received bilans:', bilans);
        console.log('BilanMedicalService: Number of bilans:', bilans.length);
        if (bilans.length > 0) {
          console.log('BilanMedicalService: First bilan sample:', bilans[0]);
        }
      }),
      catchError(error => {
        console.error('BilanMedicalService: Error fetching bilans:', error);
        throw error;
      })
    );
  }
} 