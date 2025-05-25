import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, forkJoin, switchMap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  // Updated API URL to match the correct backend endpoint pattern
  private apiUrl = `${environment.apiUrl}/api/v1/api/users`;

  // Mock data only for fallback
  private mockDoctors: User[] = [
    {
      id: 1,
      nom: 'Smith',
      prenom: 'John',
      email: 'john.smith@example.com',
      role: { id: 2, nom: 'doctor' },
      enabled: true,
      accountLocked: false,
      phoneNumber: '123-456-7890',
      specialities: ['Orthodontie', 'Dentisterie Pédiatrique'],
      secretaries: []
    },
    {
      id: 2,
      nom: 'Johnson',
      prenom: 'Sarah',
      email: 'sarah.johnson@example.com',
      role: { id: 2, nom: 'doctor' },
      enabled: true,
      accountLocked: false,
      phoneNumber: '987-654-3210',
      specialities: ['Endodontie', 'Prosthodontie'],
      secretaries: []
    },
    {
      id: 3,
      nom: 'Williams',
      prenom: 'Michael',
      email: 'michael.williams@example.com',
      role: { id: 2, nom: 'doctor' },
      enabled: true,
      accountLocked: false,
      phoneNumber: '555-123-4567',
      specialities: ['Chirurgie Orale', 'Parodontie'],
      secretaries: []
    }
  ];

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get all available doctors for secretary assignment
   * Returns only doctors who are not already assigned to a secretary
   */
  getAvailableDoctors(): Observable<User[]> {
    console.log('Requesting unassigned doctors from API...');
    const headers = this.getHeaders();
    console.log('API URL:', `${this.apiUrl}/doctors/unassigned`);
    console.log('Headers:', headers);
    
    return this.http.get<User[]>(`${this.apiUrl}/doctors/unassigned`, { headers })
      .pipe(
        map(doctors => {
          console.log('Received unassigned doctors from API:', doctors);
          return doctors;
        }),
        catchError(error => {
          console.error('Error fetching unassigned doctors:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          
          if (error.status === 403) {
            console.error('Access forbidden. Please check authentication and permissions.');
          }
          
          // If API call fails, return empty array
          return of([]);
        })
      );
  }

  /**
   * Get doctor details by ID
   */
  getDoctorById(doctorId: number): Observable<User> {
    const headers = this.getHeaders();
    return this.http.get<User>(`${this.apiUrl}/doctors/${doctorId}`, { headers }).pipe(
      catchError(error => {
        console.warn('Erreur lors de la récupération des détails du médecin, utilisation des données de test', error);
        const doctor = this.mockDoctors.find(d => d.id === doctorId);
        return doctor ? of(doctor) : throwError(() => new Error('Médecin non trouvé'));
      })
    );
  }

  /**
   * Get all doctors
   */
  getAllDoctors(): Observable<User[]> {
    const headers = this.getHeaders();
    return this.http.get<User[]>(`${this.apiUrl}/doctors`, { headers }).pipe(
      map(doctors => {
        // Combine doctor verification data with user data
        const verificationRequests = doctors.map(doctor =>
          this.http.get<any>(`${environment.apiUrl}/api/v1/api/doctor-verifications/doctor/${doctor.id}`).pipe(
            catchError(() => of(null))
          )
        );

        return forkJoin(verificationRequests).pipe(
          map(verifications => {
            return doctors.map((doctor, index) => {
              const verification = verifications[index];
              return {
                ...doctor,
                cabinetAddress: verification?.cabinetAddress,
                yearsOfExperience: verification?.yearsOfExperience,
                specialities: verification?.specialties || doctor.specialities
              };
            });
          })
        );
      }),
      switchMap(result => result),
      catchError(error => {
        console.warn('Error fetching doctors with verifications, using mock data:', error);
        return of(this.mockDoctors);
      })
    );
  }
} 