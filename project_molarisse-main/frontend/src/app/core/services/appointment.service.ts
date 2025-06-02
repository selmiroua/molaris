import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError, switchMap, retry, of, tap, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileService } from '../../profile/profile.service';
import { jwtDecode } from 'jwt-decode';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export enum CaseType {
  URGENT = 'URGENT',
  CONTROL = 'CONTROL',
  NORMAL = 'NORMAL'
}

export enum AppointmentType {
  DETARTRAGE = 'DETARTRAGE',
  SOIN = 'SOIN',
  EXTRACTION = 'EXTRACTION',
  BLANCHIMENT = 'BLANCHIMENT',
  ORTHODONTIE = 'ORTHODONTIE'
}

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDateTime: string;
  caseType: CaseType;
  appointmentType: AppointmentType;
  notes?: string;
}

export interface UnregisteredPatientAppointmentRequest {
  nom: string;
  prenom: string;
  email: string;
  phoneNumber: string;
  dateNaissance: string;
  doctorId: number;
  appointmentDateTime: string;
  caseType: CaseType;
  appointmentType: AppointmentType;
  notes?: string;
}

export interface StatusUpdateRequest {
  status: AppointmentStatus;
  secretaryId?: number;
}

export interface Appointment {
  id: number;
  appointmentDateTime: string;
  status: AppointmentStatus;
  caseType: CaseType;
  appointmentType: AppointmentType;
  notes?: string;
  patient?: any;
  doctor?: any;
  payment?: {
    amount: number;
    amountPaid: number;
    remainingAmount: number;
    status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
    billNumber?: string;
  };
}

export interface UpdateAppointmentRequest {
  appointmentDateTime: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/appointments`;

  constructor(
    private http: HttpClient,
    private profileService: ProfileService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Book a new appointment
  bookAppointment(request: AppointmentRequest): Observable<Appointment> {
    // Get the current patient's ID from the profile service
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        if (!profile || !profile.id) {
          console.error('No profile or profile ID found');
          return throwError(() => new Error('Patient ID not found'));
        }

        console.log('Using patient ID from profile:', profile.id);

        // Override the patientId in the request with the authenticated user's ID
        const authenticatedRequest = {
          ...request,
          patientId: profile.id
        };

        console.log('Booking appointment with authenticated patient ID:', profile.id);

        return this.http.post<Appointment>(`${this.apiUrl}/book`, authenticatedRequest)
          .pipe(
            map(appointment => {
              console.log('Raw appointment response:', appointment);
              return this.normalizeAppointment(appointment);
            }),
            catchError(error => {
              console.error('Error booking appointment:', error);
              return throwError(() => new Error('Failed to book appointment'));
            })
          );
      })
    );
  }

  // Get appointments for the current patient
  getMyAppointments(): Observable<Appointment[]> {
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        if (!profile || !profile.id) {
          console.error('No profile or profile ID found');
          return throwError(() => new Error('Patient ID not found'));
        }

        console.log('Using patient ID from profile:', profile.id);
        return this.http.get<Appointment[]>(`${this.apiUrl}/my-appointments`).pipe(
          map(appointments => this.normalizeAppointments(appointments))
        );
      }),
      catchError(error => {
        console.error('Error getting patient appointments:', error);
        return throwError(() => new Error('Failed to get appointments'));
      })
    );
  }

  // Get appointments for the current doctor
  getMyDoctorAppointments(): Observable<Appointment[]> {
    console.log('Calling getMyDoctorAppointments API');
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.apiUrl}/my-doctor-appointments`;
    console.log('Making request to URL:', url);
    console.log('Using headers:', headers.keys());
    
    return this.http.get<Appointment[]>(url, { headers }).pipe(
      retry(3),
      map(appointments => {
        console.log('Raw API Response (doctor appointments):', appointments);
        console.log('Response type:', typeof appointments);
        console.log('Is array?', Array.isArray(appointments));
        if (Array.isArray(appointments)) {
          console.log('Array length:', appointments.length);
        }
        
        const normalized = this.normalizeAppointments(appointments);
        console.log('After normalization:', normalized);
        return normalized;
      }),
      catchError(error => {
        console.error('Error getting doctor appointments:', error);
        console.error('Status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        return throwError(() => new Error('Failed to get appointments'));
      })
    );
  }

  // Get appointments for the current secretary's assigned doctor
  getSecretaryAppointments(secretaryId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/secretary/${secretaryId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(appointments => this.normalizeAppointments(appointments)),
      catchError(error => {
        console.error('Error fetching secretary appointments:', error);
        return throwError(() => new Error('Failed to fetch appointments. Make sure you are assigned to a doctor.'));
      })
    );
  }

  // Get appointments for the current secretary's assigned doctor using ProfileService
  getMySecretaryAppointments(): Observable<Appointment[]> {
    console.log('Calling getMySecretaryAppointments API');
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found for secretary');
      return throwError(() => new Error('Authentication token not found'));
    }
    
    // Debug token information
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token user info:', {
          id: payload.id,
          email: payload.sub,
          roles: payload.authorities || [],
          exp: new Date(payload.exp * 1000).toLocaleString()
        });
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
    
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/my-secretary-appointments`;
    console.log('Making request to URL:', url);
    console.log('Using headers:', headers.keys());
    
    // Add extensive retry and error handling
    return this.http.get<any[]>(url, { headers }).pipe(
      retry(3), // Retry up to 3 times
      map(appointments => {
        console.log('Raw API Response (secretary appointments):', appointments);
        console.log('Response type:', typeof appointments);
        console.log('Is array?', Array.isArray(appointments));
        if (Array.isArray(appointments)) {
          console.log('Array length:', appointments.length);
          
          // Log each appointment briefly for debugging
          appointments.forEach((apt, index) => {
            console.log(`Appointment ${index + 1}:`, {
              id: apt.id,
              status: apt.status,
              date: apt.appointmentDateTime,
              patientId: apt.patient?.id || 'unknown',
              doctorId: apt.doctor?.id || 'unknown'
            });
          });
        }
        
        // If response is empty, log but still continue normalization
        if (!appointments || (Array.isArray(appointments) && appointments.length === 0)) {
          console.log('No appointments returned from API');
        }
        
        const normalized = this.normalizeAppointments(appointments);
        console.log('After normalization:', normalized);
        return normalized;
      }),
      catchError(error => {
        console.error('Error fetching secretary appointments:', error);
        console.error('Status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        // Return empty array on all errors to prevent UI from breaking
        console.log('Returning empty array due to API error');
        return of([]); 
      })
    );
  }

  // Update appointment status with secretary check
  updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.apiUrl}/update-secretary-appointment-status?appointmentId=${appointmentId}`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(
      map(appointment => this.normalizeAppointment(appointment)),
      catchError(error => {
        console.error('Error updating appointment status:', error);
        if (error.status === 403) {
          return throwError(() => new Error('You do not have permission to update this appointment.'));
        }
        return throwError(() => new Error('Failed to update appointment status.'));
      })
    );
  }

  // Update appointment status (for doctor)
  updateMyAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/update-my-appointment-status?appointmentId=${appointmentId}`, { status })
      .pipe(
        map(appointment => this.normalizeAppointment(appointment))
      );
  }

  // Méthode privée pour normaliser un tableau de rendez-vous
  private normalizeAppointments(appointments: any[]): Appointment[] {
    if (!appointments || !Array.isArray(appointments)) {
      console.warn('Invalid appointments data:', appointments);
      return [];
    }

    console.log('Starting normalization of appointments array. Count:', appointments.length);
    const normalized = appointments.map((appointment, index) => {
      console.log(`Normalizing appointment ${index + 1}/${appointments.length}`);
      return this.normalizeAppointment(appointment);
    });

    console.log('Completed normalizing all appointments');
    return normalized;
  }

  // Méthode privée pour normaliser un rendez-vous individuel
  private normalizeAppointment(appointment: any): Appointment {
    if (!appointment) {
      console.warn('Invalid appointment data:', appointment);
      return {} as Appointment;
    }

    console.log('Raw appointment data:', appointment);

    // Extract patient data - handle both nested and flat structures
    let patientData = appointment.patient || {};
    if (typeof patientData === 'number') {
      patientData = { id: patientData };
    }

    // Create normalized patient object with fallbacks
    const normalizedPatient = {
      id: patientData.id || appointment.patient_id || -1,
      nom: patientData.nom || appointment.patient_nom || '',
      prenom: patientData.prenom || appointment.patient_prenom || '',
      email: patientData.email || appointment.patient_email || '',
      phoneNumber: patientData.phoneNumber || appointment.patient_phone || '',
      profilePicturePath: patientData.profilePicturePath || appointment.patient_profilePicturePath || null
    };

    // Extract doctor data - handle both nested and flat structures
    let doctorData = appointment.doctor || {};
    if (typeof doctorData === 'number') {
      doctorData = { id: doctorData };
    }

    // Create normalized doctor object with fallbacks
    const normalizedDoctor = {
      id: doctorData.id || appointment.doctor_id || -1,
      nom: doctorData.nom || appointment.doctor_nom || '',
      prenom: doctorData.prenom || appointment.doctor_prenom || '',
      profilePicturePath: doctorData.profilePicturePath || appointment.doctor_profilePicturePath || null
    };

    console.log('Normalized patient:', normalizedPatient);
    console.log('Normalized doctor:', normalizedDoctor);

    // Create normalized appointment with all possible fallbacks
    const normalizedAppointment = {
      id: appointment.id || -1,
      appointmentDateTime: this.normalizeDate(appointment.appointmentDateTime || appointment.date || new Date()),
      status: appointment.status || AppointmentStatus.PENDING,
      caseType: appointment.caseType || appointment.case_type || CaseType.NORMAL,
      appointmentType: appointment.appointmentType || appointment.appointment_type || AppointmentType.SOIN,
      notes: appointment.notes || '',
      patient: normalizedPatient,
      doctor: normalizedDoctor
    };

    console.log('Normalized appointment:', normalizedAppointment);
    return normalizedAppointment;
  }

  // Normaliser différents formats de date vers ISO string
  private normalizeDate(dateStr: any): string {
    try {
      // Si c'est déjà un objet Date valide
      if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
        return dateStr.toISOString();
      }

      // Si c'est une chaîne
      if (typeof dateStr === 'string') {
        // Format "Invalid Date" ou chaîne vide
        if (dateStr === "Invalid Date" || dateStr.trim() === '') {
          console.warn('Date "Invalid Date" détectée, utilisation d\'une date par défaut');
          return new Date().toISOString();
        }

        // Format DD/MM/YYYY HH:MM
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/)) {
          const parts = dateStr.split(' ');
          const dateParts = parts[0].split('/');
          const timeParts = parts[1].split(':');

          // Format YYYY-MM-DDTHH:MM:SS
          const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timeParts[0]}:${timeParts[1]}:00`;
          console.log(`Date normalisée: ${dateStr} -> ${isoDate}`);
          return isoDate;
        }

        // Essayer de créer une date à partir de la chaîne
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }

      // Vérifier si c'est un tableau/objet qui pourrait contenir une date formatée
      if (typeof dateStr === 'object' && dateStr !== null) {
        console.log('Objet date détecté:', dateStr);

        // Cas du format [année, mois, jour, heure, minute]
        if (Array.isArray(dateStr) && dateStr.length >= 5) {
          const [year, month, day, hour, minute] = dateStr;
          // Attention: les mois dans Date() sont 0-indexés
          const date = new Date(year, month - 1, day, hour, minute);
          console.log(`Date reconstruite à partir du tableau: ${date.toISOString()}`);
          return date.toISOString();
        }

        // Essayer d'extraire des propriétés de date
        if (dateStr.year && dateStr.month && dateStr.day) {
          const date = new Date(
            dateStr.year,
            dateStr.month - 1,
            dateStr.day,
            dateStr.hour || 0,
            dateStr.minute || 0
          );
          console.log(`Date reconstruite à partir de l'objet: ${date.toISOString()}`);
          return date.toISOString();
        }
      }

      // Si aucun des formats ci-dessus ne fonctionne, utiliser la date actuelle
      console.warn(`Format de date non reconnu: ${JSON.stringify(dateStr)}, utilisation de la date actuelle`);
      return new Date().toISOString();
    } catch (error) {
      console.error('Erreur lors de la normalisation de la date:', error);
      return new Date().toISOString();
    }
  }

  // Add this to AppointmentService
  testAuth(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/test-auth`);
  }

  // Helper method to get the current doctor's ID
  private getCurrentDoctorId(): number | null {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const decodedToken = jwtDecode(token) as any;
        return decodedToken.id || null;
      }
    } catch (error) {
      console.error('Error getting current doctor ID:', error);
    }
    return null;
  }

  // Helper method to get the current patient's ID from token
  private getCurrentPatientId(): number | null {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      // Split the token and get the payload
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      // Decode the payload
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', payload);

      // Check if user has patient role
      const authorities = payload.authorities || [];
      if (!authorities.includes('patient')) {
        console.error('User is not a patient');
        return null;
      }

      // Get the sub (email) from the token
      const userEmail = payload.sub;
      if (!userEmail) {
        console.error('No email found in token');
        return null;
      }

      // Get the user ID from the token
      const userId = payload.id;
      if (!userId) {
        console.error('No user ID found in token');
        return null;
      }

      console.log('Found patient ID in token:', userId);
      return userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Helper method to get the correct ID
  private getCorrectId(data: any): number | null {
    console.log('Getting correct ID for data:', data);
    if (!data) {
      console.log('No data provided, returning null');
      return null;
    }
    // If it's a direct ID number
    if (typeof data === 'number') {
      console.log('Data is a number, returning:', data);
      return data;
    }
    // If it's an object with an ID
    if (typeof data === 'object' && 'id' in data) {
      console.log('Data is an object with ID, returning:', data.id);
      return data.id;
    }
    console.log('Could not extract ID, returning null');
    return null;
  }

  // Get appointments for a specific doctor (for patients booking appointments)
  getDoctorAppointments(doctorId: number): Observable<Appointment[]> {
    console.log('Getting appointments for doctor:', doctorId);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}/appointments`, { headers }).pipe(
      map(appointments => {
        console.log('Raw API Response for doctor appointments:', appointments);
        const normalized = this.normalizeAppointments(appointments);
        console.log('Normalized doctor appointments:', normalized);
        return normalized;
      }),
      catchError(error => {
        console.error('Error getting doctor appointments:', error);
        return throwError(() => new Error('Failed to get doctor appointments'));
      })
    );
  }

  getPatientAppointments(): Observable<Appointment[]> {
    console.log('Fetching patient appointments from API...');
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('No authentication token found for patient');
      return throwError(() => new Error('Authentication token not found'));
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    console.log('Making request to URL:', `${this.apiUrl}/patient`);
    
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient`, { headers }).pipe(
      retry(2), // Retry the request up to 2 times
      map(appointments => {
        console.log('Raw patient appointments response:', appointments);
        console.log('Response type:', typeof appointments);
        console.log('Is array?', Array.isArray(appointments));
        if (Array.isArray(appointments)) {
          console.log('Array length:', appointments.length);
        }
        
        const normalized = this.normalizeAppointments(appointments);
        console.log('Normalized patient appointments:', normalized);
        return normalized;
      }),
      catchError(error => {
        console.error('Error fetching patient appointments:', error);
        console.error('Status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        return throwError(() => new Error('Failed to fetch appointments: ' + (error.error?.message || error.message || 'Unknown error')));
      })
    );
  }

  // Cancel an appointment
  cancelAppointment(appointmentId: number): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.apiUrl}/status/${appointmentId}`,
      { status: AppointmentStatus.CANCELED },
      { headers: this.getHeaders() }
    ).pipe(
      map(appointment => this.normalizeAppointment(appointment)),
      catchError(error => {
        console.error('Error canceling appointment:', error);
        return throwError(() => new Error('Failed to cancel appointment'));
      })
    );
  }

  // Update appointment details (for patients)
  updateAppointment(appointmentId: number, appointmentDateTime: string, notes?: string): Observable<Appointment> {
    const updateRequest: UpdateAppointmentRequest = {
      appointmentDateTime: appointmentDateTime,
      notes: notes || ''
    };
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }
    
    // Explicitly set Content-Type without charset
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    
    console.log('Headers for update appointment:', headers.keys());
    console.log('Update appointment payload:', updateRequest);
    
    return this.http.put<Appointment>(
      `${this.apiUrl}/update/${appointmentId}`,
      updateRequest,
      { headers }
    ).pipe(
      map(appointment => this.normalizeAppointment(appointment)),
      catchError(error => {
        console.error('Error updating appointment:', error);
        return throwError(() => new Error('Failed to update appointment details'));
      })
    );
  }

  updateAppointmentTimeByDoctor(appointmentId: number, newDateTime: string): Observable<Appointment> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('No authentication token found'));
    }
    
    // Make sure the date format is correct (without the 'Z' at the end)
    if (newDateTime && newDateTime.endsWith('Z')) {
      newDateTime = newDateTime.substring(0, 19); // Format: "2025-05-15T10:00:00"
    }
    
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
      
    console.log('Headers for update appointment by doctor:', headers.keys());
    console.log('Update payload:', { appointmentDateTime: newDateTime });
    
    return this.http.put<Appointment>(
      `${this.apiUrl}/update-time-by-doctor/${appointmentId}`, 
      { appointmentDateTime: newDateTime },
      { headers }
    ).pipe(
      map(response => {
        console.log('Update success response:', response);
        return this.normalizeAppointment(response);
      }),
      catchError(error => {
        console.error('Error updating appointment time', error);
        console.error('Error details:', error.error);
        return throwError(() => new Error('Unable to update appointment time: ' + (error.error?.message || error.error?.error || error.message || 'Unknown error')));
      })
    );
  }

  updateAppointmentTimeBySecretary(appointmentId: number, newDateTime: string): Observable<Appointment> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      return throwError(() => new Error('No authentication token found'));
    }
    
    // Make sure the date format is correct (without the 'Z' at the end)
    if (newDateTime && newDateTime.endsWith('Z')) {
      newDateTime = newDateTime.substring(0, 19); // Format: "2025-05-15T10:00:00"
    }
    
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
      
    console.log('Headers for update appointment by secretary:', headers.keys());
    console.log('Update payload:', { appointmentDateTime: newDateTime });
    
    return this.http.put<Appointment>(
      `${this.apiUrl}/update-time-by-secretary/${appointmentId}`, 
      { appointmentDateTime: newDateTime },
      { headers }
    ).pipe(
      map(response => {
        console.log('Update success response:', response);
        return this.normalizeAppointment(response);
      }),
      catchError(error => {
        console.error('Error updating appointment time', error);
        console.error('Error details:', error.error);
        return throwError(() => new Error('Unable to update appointment time: ' + (error.error?.message || error.error?.error || error.message || 'Unknown error')));
      })
    );
  }

  // Get patient fiche associated with an appointment
  getAppointmentFichePatient(appointmentId: number): Observable<any> {
    const authToken = localStorage.getItem('access_token');
    console.log(`Sending request to fetch fiche for appointment ID: ${appointmentId}`);
    
    return this.http.get<any>(`${this.apiUrl}/${appointmentId}/fiche-patient`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      })
    }).pipe(
      tap(response => console.log('Received appointment fiche patient:', response)),
      catchError(error => {
        console.error('Error fetching appointment fiche patient:', error);
        return throwError(() => error);
      })
    );
  }

  // Getter for apiUrl
  getApiUrl(): string {
    return this.apiUrl;
  }

  // Secretary books appointment for unregistered patient
  bookAppointmentForUnregisteredPatient(request: UnregisteredPatientAppointmentRequest): Observable<Appointment> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    });

    console.log('Sending unregistered patient appointment request:', request);
    
    return this.http.post<Appointment>(`${this.apiUrl}/book-for-unregistered-patient`, request, { headers })
      .pipe(
        map(appointment => {
          console.log('Raw appointment response:', appointment);
          return this.normalizeAppointment(appointment);
        }),
        catchError(error => {
          console.error('Error booking appointment for unregistered patient:', error);
          let errorMessage = 'Failed to book appointment for unregistered patient';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Doctor books appointment for unregistered patient
  bookAppointmentForUnregisteredPatientByDoctor(request: UnregisteredPatientAppointmentRequest): Observable<Appointment> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    });

    console.log('Sending doctor unregistered patient appointment request:', request);
    console.log('Doctor ID in request:', request.doctorId);
    console.log('Authentication token:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
    
    // Use the doctor-specific endpoint
    return this.http.post<Appointment>(`${this.apiUrl}/book-for-unregistered-patient-by-doctor`, request, { headers })
      .pipe(
        map(appointment => {
          console.log('Raw appointment response from doctor booking:', appointment);
          return this.normalizeAppointment(appointment);
        }),
        catchError(error => {
          console.error('Error booking appointment for unregistered patient by doctor:', error);
          console.error('Status code:', error.status);
          console.error('Error response:', error.error);
          
          let errorMessage = 'Failed to book appointment for unregistered patient';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
            console.error('Error message from server:', errorMessage);
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
            console.error('Error string from server:', errorMessage);
          } else if (error.message) {
            errorMessage = error.message;
            console.error('Error message from client:', errorMessage);
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Méthode spéciale pour récupérer tous les rendez-vous sans filtrage
  getAllAppointmentsForSecretaryDoctor(): Observable<Appointment[]> {
    console.log('Getting ALL appointments for secretary\'s doctor');
    
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        console.log('Current profile:', profile);
        
        if (!profile || !profile.id) {
          console.error('No profile or profile ID found');
          return throwError(() => new Error('Profile not found'));
        }
        
        // Define extended profile type with the expected properties
        interface ExtendedProfile {
          id: number;
          role?: string;
          assignedDoctor?: {
            id: number;
          };
        }
        
        // Cast profile to the extended type
        const extendedProfile = profile as unknown as ExtendedProfile;
        
        // Si c'est une secrétaire, vérifier qu'elle a un médecin assigné
        if (extendedProfile.role === 'SECRETAIRE' && (!extendedProfile.assignedDoctor || !extendedProfile.assignedDoctor.id)) {
          console.error('Secretary has no assigned doctor');
          return throwError(() => new Error('No assigned doctor found'));
        }
        
        // Récupérer l'ID du médecin assigné
        const doctorId = extendedProfile.assignedDoctor?.id;
        console.log('Getting appointments for doctor ID:', doctorId);
        
        // Utiliser l'endpoint pour récupérer tous les rendez-vous du médecin
        const url = `${this.apiUrl}/doctor/${doctorId}/appointments`;
        console.log('Request URL:', url);
        
        return this.http.get<Appointment[]>(url, { headers: this.getHeaders() }).pipe(
          map(appointments => {
            console.log('Raw doctor appointments:', appointments);
            console.log('Number of appointments:', appointments.length);
            return this.normalizeAppointments(appointments);
          }),
          catchError(error => {
            console.error('Error fetching doctor appointments:', error);
            return throwError(() => new Error('Failed to fetch doctor appointments'));
          })
        );
      })
    );
  }

  // Get available time slots for a doctor on a specific date
  getAvailableTimeSlots(doctorId: number, date: string, excludeAppointmentId?: number): Observable<string[]> {
    console.log(`Getting available slots for doctor ${doctorId} on date ${date}${excludeAppointmentId ? ', excluding appointment ' + excludeAppointmentId : ''}`);
    const headers = this.getHeaders();
    
    // For a proper implementation, we would call the backend API:
    /*
    return this.http.get<string[]>(`${this.apiUrl}/available-slots`, {
      headers,
      params: {
        doctorId: doctorId.toString(),
        date: date,
        excludeAppointmentId: excludeAppointmentId ? excludeAppointmentId.toString() : undefined
      }
    }).pipe(
      catchError(error => {
        console.error('Error fetching available time slots:', error);
        return of([]); // Return empty array in case of error
      })
    );
    */
    
    // Since the backend API might not be ready, we'll simulate it:
    
    // Step 1: Generate all possible time slots for the day (8:00 AM to 6:00 PM, every 30 minutes)
    const allTimeSlots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    // Step 2: Fetch existing appointments for this doctor on this date
    return this.getDoctorAppointments(doctorId).pipe(
      map(appointments => {
        console.log('All appointments for doctor:', appointments);
        
        // Filter appointments for the selected date
        const appointmentsOnDate = appointments.filter(apt => {
          // Convert appointment datetime to date string (YYYY-MM-DD)
          const aptDate = new Date(apt.appointmentDateTime).toISOString().split('T')[0];
          const selectedDate = new Date(date).toISOString().split('T')[0];
          
          // Only consider active appointments (pending or accepted)
          const isActive = apt.status === AppointmentStatus.PENDING || 
                          apt.status === AppointmentStatus.ACCEPTED;
                          
          // Exclude the current appointment being rescheduled if provided
          const isNotCurrentAppointment = excludeAppointmentId ? apt.id !== excludeAppointmentId : true;
                          
          return aptDate === selectedDate && isActive && isNotCurrentAppointment;
        });
        
        console.log('Appointments on selected date:', appointmentsOnDate);
        
        // Extract the times of existing appointments
        const bookedTimes = appointmentsOnDate.map(apt => {
          const aptTime = new Date(apt.appointmentDateTime);
          return `${aptTime.getHours().toString().padStart(2, '0')}:${aptTime.getMinutes().toString().padStart(2, '0')}`;
        });
        
        console.log('Already booked times:', bookedTimes);
        
        // Filter out the booked times from all time slots
        const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
        
        // Also filter out times that are in the past for today
        if (new Date(date).toDateString() === new Date().toDateString()) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          return availableSlots.filter(slot => {
            // Compare slot time with current time
            return slot > currentTime;
          });
        }
        
        return availableSlots;
      }),
      // Add a delay to simulate API latency
      delay(800)
    );
  }

  // Vérifier si un patient a déjà un rendez-vous à une date donnée
  checkPatientHasAppointmentOnDate(patientId: number, date: string): Observable<boolean> {
    const formattedDate = new Date(date).toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}/appointments`, {
      headers: this.getHeaders()
    }).pipe(
      map(appointments => {
        // Filtrer les rendez-vous pour ne garder que ceux à la date spécifiée
        // et qui sont actifs (en attente ou acceptés)
        const appointmentsOnDate = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDateTime).toISOString().split('T')[0];
          const isActiveStatus = 
            appointment.status === AppointmentStatus.PENDING || 
            appointment.status === AppointmentStatus.ACCEPTED;
          
          return appointmentDate === formattedDate && isActiveStatus;
        });
        
        return appointmentsOnDate.length > 0;
      }),
      catchError(error => {
        console.error('Erreur lors de la vérification des rendez-vous du patient:', error);
        // En cas d'erreur, on considère qu'il n'y a pas de conflit
        return of(false);
      })
    );
  }
  
  // Vérifier si des patients ont déjà un rendez-vous à une date donnée
  checkPatientsHaveAppointmentsOnDate(patientIds: number[], date: string): Observable<{[patientId: number]: boolean}> {
    if (!patientIds || patientIds.length === 0) {
      return of({});
    }
    
    const formattedDate = new Date(date).toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments-on-date`, {
      headers: this.getHeaders(),
      params: {
        date: formattedDate
      }
    }).pipe(
      map(appointments => {
        const result: {[patientId: number]: boolean} = {};
        
        // Initialiser tous les patients à false (pas de rendez-vous)
        patientIds.forEach(id => {
          result[id] = false;
        });
        
        // Marquer les patients qui ont déjà un rendez-vous ce jour-là
        appointments.forEach(appointment => {
          const patientId = appointment.patient?.id;
          const isActiveStatus = 
            appointment.status === AppointmentStatus.PENDING || 
            appointment.status === AppointmentStatus.ACCEPTED;
          
          if (patientId && patientIds.includes(patientId) && isActiveStatus) {
            result[patientId] = true;
          }
        });
        
        return result;
      }),
      catchError(error => {
        console.error('Erreur lors de la vérification des rendez-vous:', error);
        // En cas d'erreur, on retourne un objet vide
        return of({});
      })
    );
  }

  // Check if a patient already has an appointment on the given day and return detailed information
  hasAppointmentSameDayWarning(patientId: number, dateString: string): Observable<{hasAppointment: boolean, existingAppointment?: Appointment}> {
    if (!patientId || !dateString) {
      console.log('Missing patientId or dateString in hasAppointmentSameDayWarning');
      return of({ hasAppointment: false });
    }

    console.log(`Checking appointments for patient ${patientId} on date: ${dateString}`);

    // Get the date part only (YYYY-MM-DD)
    const selectedDate = new Date(dateString);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    console.log('Formatted date for comparison:', formattedDate);
    
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}/appointments`, {
      headers: this.getHeaders()
    }).pipe(
      map(appointments => {
        console.log(`Retrieved ${appointments.length} appointments for patient ${patientId}`);
        
        // Filter appointments to find active ones (PENDING or ACCEPTED) on the same day
        const appointmentsOnSameDay = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDateTime).toISOString().split('T')[0];
          const isActiveStatus = 
            appointment.status === AppointmentStatus.PENDING || 
            appointment.status === AppointmentStatus.ACCEPTED;
          
          console.log(`Appointment date: ${appointmentDate}, status: ${appointment.status}, matches date: ${appointmentDate === formattedDate}, is active: ${isActiveStatus}`);
          
          return appointmentDate === formattedDate && isActiveStatus;
        });
        
        console.log(`Found ${appointmentsOnSameDay.length} appointments on ${formattedDate}`);
        
        if (appointmentsOnSameDay.length > 0) {
          // Return the first existing appointment for the warning message
          console.log('Returning existing appointment for warning');
          return {
            hasAppointment: true,
            existingAppointment: this.normalizeAppointment(appointmentsOnSameDay[0])
          };
        }
        
        console.log('No existing appointments found on this day');
        return { hasAppointment: false };
      }),
      catchError(error => {
        console.error('Error checking if patient has appointment on same day:', error);
        // In case of error, assume no conflicts to avoid blocking the flow
        return of({ hasAppointment: false });
      })
    );
  }

  // Add this method at the end of the class, before the closing bracket
  getUserProfilePicture(userId: number): Observable<string | null> {
    console.log(`Fetching profile picture for user ID: ${userId}`);
    
    // Return the direct URL to the profile picture
    // This URL will be used directly in the img src attribute
    return of(`${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${userId}`);
  }

  // Update a patient's fiche (medical record) - for doctors and secretaries
  updateFichePatient(appointmentId: number, ficheData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    });

    console.log('Updating fiche patient for appointment ID:', appointmentId);
    console.log('Fiche data:', ficheData);
    
    return this.http.put<any>(`${this.apiUrl}/${appointmentId}/update-fiche-patient`, ficheData, { headers })
      .pipe(
        tap(response => {
          console.log('Fiche patient updated successfully:', response);
        }),
        catchError(error => {
          console.error('Error updating fiche patient:', error);
          console.error('Status code:', error.status);
          console.error('Error response:', error.error);
          
          let errorMessage = 'Failed to update patient fiche';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }
} 
