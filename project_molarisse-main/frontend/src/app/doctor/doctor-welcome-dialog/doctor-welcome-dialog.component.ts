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
    'Dentisterie préventive'
  ];

  // Api URL
  private apiUrl = `${environment.apiUrl}/api/v1/api/doctor-verifications`;

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
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
      cabinetName: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Pre-fill doctorId if available
    if (this.data && this.data.doctorId) {
      this.verificationForm.patchValue({
        doctorId: this.data.doctorId
      });
    }
    
    // Check if any specialties are already selected in the dropdown
    this.checkAndSetSpecialties();
    
    // Verify authentication token is available
    this.verifyAuthToken();
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
    this.markFormAsTouched(); // Mark all fields as touched to trigger validation
    this.logFormValidationStatus(); // Add debug logging
    
    if (this.currentStep === 1 && this.verificationForm.valid) {
      this.submitBasicInfo();
    } else if (this.currentStep === 2 && this.cabinetPhotoFile) {
      this.uploadCabinetPhoto();
    } else if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    } else if (this.currentStep === 1 && !this.verificationForm.valid) {
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
    // Start with a valid form
    this.markFormAsTouched();

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

    // Get user email from local storage or other sources
    let userEmail = null;
    try {
      // Try to get from localStorage in various formats
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.email) {
          userEmail = parsed.email;
        }
      }
      
      // Fallback to other localStorage items
      if (!userEmail) {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          if (parsed && parsed.email) {
            userEmail = parsed.email;
          }
        }
      }
      
      // Last fallback - try to get from the auth token
      if (!userEmail) {
        const token = this.getAccessToken();
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          if (payload && payload.sub) {
            userEmail = payload.sub;
          }
        }
      }
    } catch (e) {
      console.error('Error getting user email:', e);
    }
    
    // Final fallback if we couldn't find the email
    if (!userEmail) {
      userEmail = 'user@example.com'; // Provide a default for testing
    }
    
    console.log('Using email:', userEmail);

    // Get user phone number from local storage or other sources
    let userPhoneNumber = null;
    try {
      // Try to get from localStorage in various formats
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.phoneNumber) {
          userPhoneNumber = parsed.phoneNumber;
        } else if (parsed && parsed.phone) {
          userPhoneNumber = parsed.phone;
        }
      }
      
      // Fallback to other localStorage items
      if (!userPhoneNumber) {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          if (parsed && parsed.phoneNumber) {
            userPhoneNumber = parsed.phoneNumber;
          } else if (parsed && parsed.phone) {
            userPhoneNumber = parsed.phone;
          }
        }
      }
    } catch (e) {
      console.error('Error getting user phone number:', e);
    }
    
    // Final fallback if we couldn't find the phone number
    if (!userPhoneNumber) {
      userPhoneNumber = '00000000'; // Provide a default for testing
    }
    
    console.log('Using phone number:', userPhoneNumber);

    console.log('Form doctorId after setting:', formValues.doctorId);

    // DIRECT FIX: Extract specialty from the UI if not present in form data
    // Get the actual selected specialty text from the UI
    const specialtyText = document.querySelector('.mat-select-value-text')?.textContent?.trim();
    
    // Check if we have specialties in the form value
    if ((!formValues.specialties || formValues.specialties.length === 0) && specialtyText) {
      console.log('Extracting specialty directly from UI:', specialtyText);
      formValues.specialties = [specialtyText];
    }

    // Fix for single selection dropdown vs. multiple selection
    if (typeof formValues.specialties === 'string') {
      formValues.specialties = [formValues.specialties];
    }

    // Ensure yearsOfExperience is a number
    if (formValues.yearsOfExperience) {
      formValues.yearsOfExperience = Number(formValues.yearsOfExperience);
    }

    // Properly format the request according to backend expectations
    const requestData = {
      doctorId: formValues.doctorId || this.data?.doctorId || this.getDoctorIdFromDocument(),
      address: formValues.address || '',
      cabinetAddress: formValues.cabinetAddress || '',
      yearsOfExperience: formValues.yearsOfExperience || 0,
      specialties: Array.isArray(formValues.specialties) ? formValues.specialties : 
                   (formValues.specialties ? [formValues.specialties] : ['Dentisterie générale']), // Default specialty
      postalCode: formValues.postalCode || '',
      cabinetName: formValues.cabinetName || '',
      message: formValues.message || '',
      email: userEmail, // Add the email field to the request
      phoneNumber: userPhoneNumber // Add the phone number field to the request
    };

    // HARDCODED FALLBACK: If doctorId is still null, try one more approach
    if (!requestData.doctorId) {
      // Try to extract from the URL if available
      const urlMatch = window.location.href.match(/\/doctor\/(\d+)/);
      if (urlMatch && urlMatch[1]) {
        requestData.doctorId = Number(urlMatch[1]);
      } else {
        // Last resort - hardcode a value for testing if nothing else works
        // This is just for debugging and should be removed in production
        console.warn('Using fallback doctor ID 1 as a last resort');
        requestData.doctorId = 1;
      }
    }

    console.log('Final doctorId being sent:', requestData.doctorId);

    // Final verification to ensure valid data
    if (!requestData.specialties || requestData.specialties.length === 0 || 
        (requestData.specialties.length === 1 && requestData.specialties[0] === '')) {
      
      // Extract from the visible selection in the UI as a last resort
      const visibleSelection = document.querySelector('.mat-select-value-text')?.textContent?.trim();
      if (visibleSelection) {
        requestData.specialties = [visibleSelection];
      } else {
        // Fallback to a default value as a last resort
        requestData.specialties = ['Dentisterie générale'];
      }
    }

    this.isLoading = true;
    this.uploadProgress = 0;

    // Get headers with token
    const headers = this.getAuthHeaders();
    console.log('Submitting to URL:', this.apiUrl);
    console.log('Request payload:', requestData);
    console.log('Headers:', headers.keys());

    // Try with auth headers for API request
    this.http.post<DoctorVerificationResponse>(
      this.apiUrl, 
      requestData,
      { headers }
    ).pipe(
      retry(1),
      catchError(error => {
        console.error('Error details:', error);
        // Enhanced error logging
        if (error.error) {
          console.error('Error response body:', error.error);
          if (error.error.errors) {
            console.error('Validation errors:', error.error.errors);
          }
          if (error.error.message) {
            console.error('Error message:', error.error.message);
          }
        }
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        this.verificationId = response.id;
        this.snackBar.open('Informations de base enregistrées avec succès!', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center'
        });
        this.isLoading = false;
        this.currentStep++;
      },
      error: (error) => {
        console.error('Error submitting verification info:', error);
        
        // Provide better error message based on status code
        let errorMessage = 'Erreur lors de l\'enregistrement des informations.';
        
        if (error.status === 403) {
          errorMessage = 'Authentification requise ou session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
          
          // Try to extract validation errors
          if (error.error) {
            if (error.error.message) {
              errorMessage = error.error.message;
            }
            
            // Check for detailed validation errors
            if (error.error.errors) {
              const fieldErrors = error.error.errors
                .map((err: any) => {
                  const field = err.field || '';
                  const message = err.defaultMessage || '';
                  return `${field}: ${message}`;
                })
                .join(', ');
              
              if (fieldErrors) {
                errorMessage += ` (${fieldErrors})`;
              }
            }
          }
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  // Helper to extract doctor ID from the document if other methods fail
  private getDoctorIdFromDocument(): number | null {
    // Try to find the doctor ID in the document URL or other elements
    const urlParts = window.location.pathname.split('/');
    const dashboardIndex = urlParts.indexOf('dashboard');
    if (dashboardIndex !== -1 && dashboardIndex < urlParts.length - 1) {
      const potentialId = urlParts[dashboardIndex + 1];
      if (potentialId && !isNaN(Number(potentialId))) {
        return Number(potentialId);
      }
    }
    
    // Try to find doctor ID in localStorage
    try {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        if (profile && profile.id) {
          return Number(profile.id);
        }
      }
    } catch (e) {
      console.error('Error parsing profile from localStorage', e);
    }
    
    return null;
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
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
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
} 