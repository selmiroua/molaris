import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { catchError, retry, throwError } from 'rxjs';

interface DoctorVerificationResponse {
  id: number;
  doctorId: number;
  status: string;
  address: string;
  cabinetAddress: string;
  yearsOfExperience: number;
  specialties: string[];
  postalCode: string;
  cabinetName: string;
  email: string;
  message?: string;
  cabinetPhotoPath?: string;
  diplomaPhotoPath?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-doctor-welcome-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatStepperModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './doctor-welcome-dialog.component.html',
  styleUrls: ['./doctor-welcome-dialog.component.scss']
})
export class DoctorWelcomeDialogComponent implements OnInit {
  currentStep = 0;
  totalSteps = 4;
  isLoading = false;
  uploadProgress = 0;
  verificationId: number | null = null;

  verificationForm: FormGroup;
  
  // Preview images
  cabinetPhotoPreview: SafeUrl | null = null;
  diplomaPhotoPreview: SafeUrl | null = null;
  
  // Selected files
  cabinetPhotoFile: File | null = null;
  diplomaPhotoFile: File | null = null;
  
  // Specialties list
  specialties = [
    'Dentisterie générale',
    'Orthodontie',
    'Chirurgie buccale et maxillo-faciale',
    'Parodontie',
    'Endodontie',
    'Prothèse dentaire',
    'Dentisterie pédiatrique',
    'Dentisterie esthétique',
    'Implantologie',
    'Radiologie buccale',
    'Médecine buccale',
    'Dentisterie gériatrique',
    'Dentisterie préventive',
    'Autre'
  ];

  // List of villes
  villes = [
    'Ariana',
    'Béja',
    'Ben Arous',
    'Bizerte',
    'Gabès',
    'Gafsa',
    'Jendouba',
    'Kairouan',
    'Kasserine',
    'Kébili',
    'Kef',
    'Mahdia',
    'Manouba',
    'Médenine',
    'Monastir',
    'Nabeul',
    'Sfax',
    'Sidi Bouzid',
    'Siliana',
    'Sousse',
    'Tataouine',
    'Tozeur',
    'Tunis',
    'Zaghouan'
  ];

  // Api URL
  private apiUrl = `${environment.apiUrl}/api/v1/api/doctor-verifications`;
  private userApiUrl = `${environment.apiUrl}/api/v1/api/users`;

  constructor(
    public dialogRef: MatDialogRef<DoctorWelcomeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userName: string, doctorId: number },
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    console.log('Constructor received data:', data);
    
    // Make sure doctorId is a number and not undefined
    const doctorId = data && data.doctorId ? Number(data.doctorId) : null;
    console.log('Initialized doctorId:', doctorId);
    
    this.verificationForm = this.fb.group({
      doctorId: [doctorId, Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      cabinetAddress: ['', [Validators.required, Validators.minLength(5)]],
      yearsOfExperience: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      specialties: [[], [Validators.required]],
      customSpecialty: [''],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
      cabinetName: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      message: ['', [Validators.maxLength(500)]],
      ville: [''],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Pre-fill doctorId if available
    if (this.data && this.data.doctorId) {
      this.verificationForm.patchValue({
        doctorId: this.data.doctorId
      });
    }
    
    // Load user profile data to pre-fill the form
    this.loadUserProfile();
    
    // Check if any specialties are already selected in the dropdown
    this.checkAndSetSpecialties();
    
    // Verify authentication token is available
    this.verifyAuthToken();
    
    // Reset form touched state to prevent validation errors on initial load
    this.resetFormTouched();
  }

  // Reset all form fields to untouched state
  private resetFormTouched(): void {
    Object.keys(this.verificationForm.controls).forEach(key => {
      const control = this.verificationForm.get(key);
      control?.markAsUntouched();
    });
  }

  // Verify that the authentication token is available
  private verifyAuthToken(): void {
    const token = this.getAccessToken();
    if (!token) {
      console.warn('No authentication token found. API calls may fail due to authentication errors.');
      this.snackBar.open('Session d\'authentification manquante. Veuillez vous reconnecter.', 'Fermer', {
        duration: 5000,
        horizontalPosition: 'center',
        panelClass: ['warning-snackbar']
      });
    } else {
      console.log('Authentication token found:', token.substring(0, 15) + '...');
    }
  }
  
  // Get the access token from various storage options
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token') || 
           localStorage.getItem('token') ||
           localStorage.getItem('auth_token') || 
           sessionStorage.getItem('access_token') ||
           sessionStorage.getItem('token');
  }

  // Check if a specialty is visibly selected but not registered in the form model
  checkAndSetSpecialties(): void {
    // Get the selected value displayed in the UI dropdown
    const selectedSpecialty = document.querySelector('.mat-select-value-text')?.textContent?.trim();
    
    // If there's a visible selection but the form value is empty array
    if (selectedSpecialty && 
        this.verificationForm.get('specialties')?.value.length === 0) {
      
      // Find the matching specialty in our list
      const matchedSpecialty = this.specialties.find(spec => 
        spec.includes(selectedSpecialty) || selectedSpecialty.includes(spec)
      );
      
      // If we found a match, set it in the form
      if (matchedSpecialty) {
        this.verificationForm.patchValue({
          specialties: [matchedSpecialty]
        });
        
        // Update validation
        this.verificationForm.get('specialties')?.updateValueAndValidity();
        console.log('Specialty manually set to:', matchedSpecialty);
      }
    }
  }

  // Form Validation and Navigation
  nextStep(): void {
    if (this.currentStep === 1) {
      // Only mark fields as touched when user tries to proceed
      this.markFormAsTouched();
    this.logFormValidationStatus(); // Add debug logging
    
      if (this.verificationForm.valid) {
      this.submitBasicInfo();
      } else {
      // Show error message to help user understand what's wrong
      let errorMessage = 'Veuillez remplir tous les champs obligatoires';
      
      if (!this.isSpecialtySelected()) {
        errorMessage = 'Veuillez sélectionner au moins une spécialité';
      }
      
      this.snackBar.open(errorMessage, 'Fermer', {
        duration: 5000,
        horizontalPosition: 'center',
        panelClass: ['error-snackbar']
      });
      }
    } else if (this.currentStep === 2 && this.cabinetPhotoFile) {
      this.uploadCabinetPhoto();
    } else if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  getStepClass(step: number): string {
    if (step < this.currentStep) {
      return 'completed';
    } else if (step === this.currentStep) {
      return 'active';
    } else {
      return '';
    }
  }

  // Helper to get auth headers with a proper approach
  private getAuthHeaders(): HttpHeaders {
    // Use the access token from storage
    const token = this.getAccessToken();
    
    if (!token) {
      console.warn('No authentication token found in storage!');
    }
    
    console.log('Using token for authorization:', token ? 'Token found' : 'No token');
    
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // API Calls
  submitBasicInfo(): void {
    // Form should already be marked as touched from nextStep method
    // No need to call markFormAsTouched() again

    // Log important diagnostic information
    console.log('Data property:', this.data);
    console.log('Doctor ID from data:', this.data?.doctorId);

    // Add a fix for the specialty field
    const formValues = this.verificationForm.value;

    // CRITICAL: Ensure doctorId is set correctly and is a number
    // This field is causing the validation failure on the backend
    if (this.data && this.data.doctorId) {
      formValues.doctorId = Number(this.data.doctorId);
    } else {
      // Try to get doctorId from localStorage if not in data
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData && parsedUserData.id) {
            formValues.doctorId = Number(parsedUserData.id);
          }
        } catch (e) {
          console.error('Error parsing userData from localStorage', e);
        }
      }
    }

    // If doctorId is still null, check localStorage one more time
    if (!formValues.doctorId) {
    try {
        const userData = localStorage.getItem('user');
      if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData && parsedUserData.id) {
            formValues.doctorId = Number(parsedUserData.id);
        }
      }
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }

    // Handle custom specialty if "Autre" is selected
    if (formValues.specialties && formValues.specialties.includes('Autre') && formValues.customSpecialty) {
      // Add the custom specialty to the specialties array
      if (!formValues.customSpecialty.includes('Autre:')) {
        formValues.specialties.push('Autre: ' + formValues.customSpecialty);
          }
        }

    // Get user email from local storage or other sources
    let userEmail = formValues.email || '';
    let userPhoneNumber = formValues.phoneNumber || ''; // Use form phone number
    
    // Format phone number to match backend validation (8 digits only)
    userPhoneNumber = userPhoneNumber.replace(/\D/g, '');
    if (userPhoneNumber.length > 8) {
      userPhoneNumber = userPhoneNumber.substring(userPhoneNumber.length - 8);
    }
    
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData && parsedUserData.email && !userEmail) {
          userEmail = parsedUserData.email;
        }
      }
    } catch (e) {
      console.error('Error getting user email:', e);
    }
    
    console.log('Using email:', userEmail);

    // Prepare complete verification data
    const verificationData = {
      ...formValues,
      email: userEmail,
      phoneNumber: userPhoneNumber
    };

    console.log('Sending verification data to API:', verificationData);
    
    // Get headers for API call
    const headers = this.getAuthHeaders();
    
    // First update the user profile to sync data
    this.updateUserProfile({
      phoneNumber: userPhoneNumber,
      specialities: formValues.specialties,
      cabinetAdresse: formValues.cabinetAddress,
      ville: formValues.ville || '' // Extract ville from form
    });

    // Send verification request to backend
    this.http.post<DoctorVerificationResponse>(this.apiUrl, verificationData, { headers }).subscribe({
      next: (response) => {
        console.log('Verification request submitted successfully:', response);
        this.verificationId = response.id;
        this.currentStep = 2; // Move to next step
        this.snackBar.open('Informations de base sauvegardées avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error submitting verification request:', error);
        let errorMessage = 'Une erreur est survenue lors de la soumission de votre demande.';
        
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Authentification requise. Veuillez vous reconnecter.';
        } else if (error.error && error.error.message) {
              errorMessage = error.error.message;
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Update user profile to sync data with verification form
  private updateUserProfile(data: any): void {
    console.log('Updating user profile with data:', data);
    const headers = this.getAuthHeaders();

    this.http.put(`${this.userApiUrl}/profile`, data, { headers }).subscribe({
        next: (response) => {
          console.log('User profile updated successfully:', response);
        },
        error: (error) => {
          console.error('Error updating user profile:', error);
      }
    });
  }

  uploadCabinetPhoto(): void {
    if (!this.verificationId || !this.cabinetPhotoFile) {
      this.snackBar.open('Veuillez sélectionner une photo du cabinet', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('file', this.cabinetPhotoFile);

    // Get authentication token
    const token = this.getAccessToken();
    const headers = token ? new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No Content-Type for multipart form data - browser will set it automatically
    }) : undefined;

    console.log('Uploading cabinet photo with token:', token ? 'Token found' : 'No token');

    this.http.post(`${this.apiUrl}/${this.verificationId}/cabinet-photo`, formData, {
      reportProgress: true,
      observe: 'events',
      headers
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('Photo du cabinet téléchargée avec succès!', 'Fermer', {
            duration: 3000
          });
          this.isLoading = false;
          this.currentStep++;
        }
      },
      error: (error) => {
        console.error('Error uploading cabinet photo:', error);
        
        let errorMessage = 'Erreur lors du téléchargement de la photo';
        if (error.status === 403) {
          errorMessage = 'Authentification requise ou session expirée. Veuillez vous reconnecter.';
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  uploadDiplomaPhoto(): void {
    if (!this.verificationId || !this.diplomaPhotoFile) {
      this.snackBar.open('Veuillez sélectionner une photo du diplôme', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('file', this.diplomaPhotoFile);

    // Get authentication token
    const token = this.getAccessToken();
    const headers = token ? new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // No Content-Type for multipart form data - browser will set it automatically
    }) : undefined;

    console.log('Uploading diploma photo with token:', token ? 'Token found' : 'No token');

    this.http.post(`${this.apiUrl}/${this.verificationId}/diploma-photo`, formData, {
      reportProgress: true,
      observe: 'events',
      headers
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('Photo du diplôme téléchargée avec succès!', 'Fermer', {
            duration: 3000
          });
          this.isLoading = false;
          this.completeVerification();
        }
      },
      error: (error) => {
        console.error('Error uploading diploma photo:', error);
        
        let errorMessage = 'Erreur lors du téléchargement de la photo';
        if (error.status === 403) {
          errorMessage = 'Authentification requise ou session expirée. Veuillez vous reconnecter.';
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  completeVerification(): void {
    this.snackBar.open('Vérification complétée avec succès! Votre profil est en cours de vérification.', 'Fermer', {
      duration: 5000
    });
    this.dialogRef.close(true);
  }

  // File Handling
  onCabinetPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.cabinetPhotoFile = input.files[0];
      this.cabinetPhotoPreview = this.sanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(this.cabinetPhotoFile)
      );
    }
  }

  onDiplomaPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.diplomaPhotoFile = input.files[0];
      this.diplomaPhotoPreview = this.sanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(this.diplomaPhotoFile)
      );
    }
  }

  removeCabinetPhoto(): void {
    this.cabinetPhotoFile = null;
    this.cabinetPhotoPreview = null;
  }

  removeDiplomaPhoto(): void {
    this.diplomaPhotoFile = null;
    this.diplomaPhotoPreview = null;
  }

  // Trigger file input clicks
  triggerCabinetPhotoUpload(): void {
    document.getElementById('cabinet-photo-input')?.click();
  }

  triggerDiplomaPhotoUpload(): void {
    document.getElementById('diploma-photo-input')?.click();
  }

  // Helper for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.verificationForm.get(fieldName);
    // Only show validation errors if the form has been touched or submitted
    return field ? (field.invalid && field.touched) : false;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.verificationForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('minlength')) {
      return `Minimum ${field.errors?.['minlength'].requiredLength} caractères`;
    }
    if (field?.hasError('min')) {
      return `Valeur minimale: ${field.errors?.['min'].min}`;
    }
    if (field?.hasError('max')) {
      return `Valeur maximale: ${field.errors?.['max'].max}`;
    }
    if (field?.hasError('pattern')) {
      return 'Format invalide';
    }
    return 'Champ invalide';
  }

  close(): void {
    this.dialogRef.close();
  }

  // Add a new method to check specialty selection
  isSpecialtySelected(): boolean {
    const specialties = this.verificationForm.get('specialties')?.value;
    return Array.isArray(specialties) && specialties.length > 0;
  }

  // Debug method to help identify form validation issues
  logFormValidationStatus(): void {
    console.log('Form validation status:');
    console.log('Overall form valid:', this.verificationForm.valid);
    
    const controls = this.verificationForm.controls;
    Object.keys(controls).forEach(key => {
      console.log(`${key}: ${controls[key].valid ? 'Valid' : 'Invalid'}`);
      if (!controls[key].valid) {
        console.log(`Errors:`, controls[key].errors);
      }
    });
  }
  
  // Force mark all form controls as touched to trigger validation
  markFormAsTouched(): void {
    Object.keys(this.verificationForm.controls).forEach(key => {
      const control = this.verificationForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  // Load user profile data to pre-fill the form
  private loadUserProfile(): void {
    const headers = this.getAuthHeaders();
    this.http.get(`${this.userApiUrl}/profile`, { headers }).subscribe({
      next: (profile: any) => {
        console.log('Retrieved user profile:', profile);
        
        // Format phone number to match backend validation (8 digits only)
        let phoneNumber = profile.phoneNumber || '';
        // Remove any non-digit characters and take the last 8 digits if longer
        phoneNumber = phoneNumber.replace(/\D/g, '');
        if (phoneNumber.length > 8) {
          phoneNumber = phoneNumber.substring(phoneNumber.length - 8);
        }
        
        // Pre-fill the form with existing user data
        this.verificationForm.patchValue({
          phoneNumber: phoneNumber,
          address: profile.address || '',
          cabinetAddress: profile.cabinetAdresse || '',
          ville: profile.ville || '',
          specialties: profile.specialities || [],
          email: profile.email || '',
          doctorId: profile.id || this.verificationForm.get('doctorId')?.value
        });
        
        console.log('Form pre-filled with user data');
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }
} 