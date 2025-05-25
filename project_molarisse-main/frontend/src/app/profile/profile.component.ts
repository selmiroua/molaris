import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProfileService, UserProfile } from './profile.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CvViewerDialogComponent } from '../shared/cv-viewer-dialog/cv-viewer-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PatientService, FichePatient, PatientDocument } from '../core/services/patient.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatListModule,
    MatTabsModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  showEditForm = true;
  userProfile?: UserProfile;
  selectedFile?: File;
  previewUrl?: string;
  uploadProgress = 0;
  passwordChangeSubmitted = false;
  profileUpdateSubmitted = false;
  passwordChangeSuccess = false;
  updateSuccess = false;
  environment = environment;
  selectedCVFile?: File;
  cvFileName?: string;
  cvUploadProgress = 0;
  isSecretary = false;
  userRole = '';
  apiUrl = environment.apiUrl;
  fichePatient?: FichePatient;
  uploadedFiles: File[] = [];
  maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  documents: PatientDocument[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef;
  profileImageUrl: string = '';
  doctorBannerForm!: FormGroup;
  showWelcomeBanner = false;

  commonAllergies = [
    'Pénicilline',
    'Latex',
    'Anesthésiques',
    'Iode',
    'Métaux',
    'Pollen',
    'Acariens',
    'Aspirine',
    'Fruits de mer',
    'Arachides'
  ];

  etatGeneralOptions = [
    'excellent',
    'good',
    'fair',
    'poor'
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private patientService: PatientService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if the user is a secretary
    const role = this.authService.getUserRole();
    this.userRole = role || '';
    this.isSecretary = role?.toLowerCase() === 'secretaire';

    // Initialize doctor banner form here
    this.doctorBannerForm = this.fb.group({
      specialite: [''],
      experience: [''],
      cabinetAdresse: [''],
      rpps: ['']
    });
  }

  ngOnInit(): void {
    console.log('Profile component initialized');
    const role = this.authService.getUserRole();
    console.log('Raw role from auth service:', role);
    this.userRole = role || '';
    console.log('Current user role:', this.userRole);
    
    const bannerSeen = localStorage.getItem('welcomeBannerSeen');
    this.showWelcomeBanner = !bannerSeen;
    this.initializeForms();
    this.loadProfile();
    
    if (this.userRole.toUpperCase() === 'PATIENT') {
      console.log('Loading patient data...');
      this.loadPatientFiche();
      this.loadDocuments();
    }
    
    this.testBackendConnection();
    
    // Reset success state when user starts typing in password form
    this.passwordForm.valueChanges.subscribe(() => {
      if (this.passwordChangeSuccess) {
        this.passwordChangeSuccess = false;
      }
    });
  }

  private initializeForms(): void {
    console.log('Initializing forms');
    const baseFormControls = {
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern('^[0-9+]{8,}$')]],
      adresse: [''],
      dateNaissance: [''],
      genre: ['', Validators.required]
    };

    // Add role-specific form controls
    if (this.userRole.toUpperCase() === 'DOCTOR') {
      this.profileForm = this.fb.group({
        ...baseFormControls,
        ville: [''],
        specialite: [''],
        orderNumber: [''],
        cabinetAdresse: ['']
      });
    } else if (this.userRole.toUpperCase() === 'PATIENT') {
      this.profileForm = this.fb.group({
        ...baseFormControls,
        profession: [''],
        etatGeneral: [''],
        antecedentsChirurgicaux: [''],
        priseMedicamenteuse: ['non'],
        medicationDetails: ['']
      });
    } else {
      this.profileForm = this.fb.group(baseFormControls);
    }

    // Password change form with validation
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
    console.log('Forms initialized:', {
      profileForm: this.profileForm,
      passwordForm: this.passwordForm
    });

    // Add conditional validation for medication details
    if (this.userRole === 'PATIENT') {
      this.profileForm.get('priseMedicamenteuse')?.valueChanges.subscribe(value => {
        const medicationDetailsControl = this.profileForm.get('medicationDetails');
        if (value === 'oui') {
          medicationDetailsControl?.setValidators([Validators.required]);
        } else {
          medicationDetailsControl?.clearValidators();
        }
        medicationDetailsControl?.updateValueAndValidity();
      });
    }
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  loadProfile(): void {
    this.loading = true;
    console.log('Loading profile...');
    const token = localStorage.getItem('auth_token');
    console.log('Current token:', token);
    
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Profile loaded successfully:', profile);
        this.userProfile = profile;
        
        // Handle date of birth specifically
        console.log('Date from profile before processing:', profile.dateNaissance);
        let birthDate = null;
        
        if (profile.dateNaissance) {
          try {
            // Check if it's an array [year, month, day]
            if (Array.isArray(profile.dateNaissance) && profile.dateNaissance.length === 3) {
              const [year, month, day] = profile.dateNaissance;
              birthDate = new Date(year, month - 1, day); // Month is 0-indexed in JS Date
              console.log('Converted array date to Date object:', birthDate);
            }
            // Check if it's already a Date object
            else if (profile.dateNaissance instanceof Date) {
              birthDate = profile.dateNaissance;
            } 
            // Check if it's a string in ISO format (yyyy-MM-dd)
            else if (typeof profile.dateNaissance === 'string') {
              // Try parsing as ISO date
              const parts = profile.dateNaissance.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
                const day = parseInt(parts[2], 10);
                birthDate = new Date(year, month, day);
              } else {
                // Try direct conversion
                birthDate = new Date(profile.dateNaissance);
              }
              
              console.log('Parsed string date:', birthDate);
            }
            
            // Check if the date is valid
            if (birthDate && isNaN(birthDate.getTime())) {
              console.error('Invalid date parsed:', birthDate);
              birthDate = null;
            }
          } catch (e) {
            console.error('Error parsing date:', e);
            birthDate = null;
          }
        }
        
        // Patch the form values
        if (this.profileForm) {
          this.profileForm.patchValue({
            prenom: this.fichePatient?.prenom || profile.prenom,
            nom: this.fichePatient?.nom || profile.nom,
            email: profile.email,
            telephone: profile.phoneNumber,
            dateNaissance: birthDate,
            adresse: profile.address,
            specialite: profile.specialities && profile.specialities.length > 0 ? profile.specialities[0] : '',
            ville: profile.ville || '',
            cabinetAdresse: profile.cabinetAdresse || '',
            orderNumber: profile.orderNumber || ''
          });
        }
        
        this.updateProfileImageUrl();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Error loading profile', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  updateProfileImageUrl() {
    if (this.previewUrl) {
      this.profileImageUrl = this.previewUrl;
    } else {
      this.profileImageUrl = this.getProfileImageUrl(this.userProfile?.profilePicturePath);
    }
  }

  loadPatientFiche(): void {
    this.loading = true;
    this.patientService.getCurrentPatientFiche().subscribe({
      next: (fiche) => {
        console.log('Patient fiche loaded:', fiche);
        this.fichePatient = fiche;
        
        if (this.profileForm) {
          // Map the etatGeneral value directly from the database
          const etatGeneral = fiche.etatGeneral || '';
          console.log('Loading état général:', etatGeneral); // Debug log
          
          this.profileForm.patchValue({
            prenom: fiche.prenom,
            nom: fiche.nom,
            // dateNaissance comes from user profile, not patient fiche
            genre: fiche.sexe,
            profession: fiche.profession,
            telephone: fiche.telephone,
            adresse: fiche.adresse,
            etatGeneral: etatGeneral,
            antecedentsChirurgicaux: fiche.antecedentsChirurgicaux,
            priseMedicamenteuse: fiche.priseMedicaments ? 'oui' : 'non',
            medicationDetails: fiche.priseMedicaments
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patient fiche:', error);
        this.snackBar.open('Error loading medical information', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getAllergies(): string[] {
    if (!this.fichePatient?.allergies) return [];
    try {
      // Try to parse as JSON array
      return JSON.parse(this.fichePatient.allergies);
    } catch {
      // If not JSON, treat as comma-separated string
      return this.fichePatient.allergies.split(',').map(a => a.trim()).filter(a => a);
    }
  }

  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    if (this.showEditForm && this.userProfile) {
      this.profileForm.patchValue(this.userProfile);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.updateProfileImageUrl();
        this.uploadProfilePicture(); // Automatically upload after selection
      };
      reader.readAsDataURL(file);
    }
  }

  handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > this.maxFileSize) {
        this.snackBar.open(`Le fichier ${file.name} dépasse la limite de 10MB`, 'Fermer', { duration: 3000 });
        continue;
      }
      
      if (!this.isValidFileType(file)) {
        this.snackBar.open(`Le type de fichier de ${file.name} n'est pas supporté`, 'Fermer', { duration: 3000 });
        continue;
      }

      this.uploadedFiles.push(file);
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  isValidFileType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    return validTypes.includes(file.type);
  }

  uploadFiles(): void {
    if (this.uploadedFiles.length === 0) return;
    const formData = new FormData();
    this.uploadedFiles.forEach((file) => {
      formData.append('file', file);
    });
    this.patientService.uploadDocuments(formData).subscribe({
      next: (response) => {
        this.snackBar.open('Documents téléchargés avec succès', 'Fermer', { duration: 3000 });
        this.uploadedFiles = [];
        this.loadDocuments();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du téléchargement des documents', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadDocuments(): void {
    this.patientService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du chargement des documents', 'Fermer', { duration: 3000 });
      }
    });
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) return;

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('Profile picture updated successfully', 'Close', { duration: 3000 });
          this.uploadProgress = 0;
          this.selectedFile = undefined;
          this.previewUrl = undefined;
          this.loadProfile(); // Reload profile to get new image path
        }
      },
      error: (error) => {
        this.snackBar.open('Error uploading profile picture', 'Close', { duration: 3000 });
        this.uploadProgress = 0;
      }
    });
  }

  onSubmit(): void {
    // Check if any required fields that have been modified are invalid
    let hasInvalidModifiedFields = false;
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      if (control?.dirty && control?.invalid) {
        hasInvalidModifiedFields = true;
      }
    });
    
    if (hasInvalidModifiedFields) {
      this.snackBar.open('Certains champs modifiés contiennent des erreurs', 'Fermer', { duration: 3000 });
      return;
    }
    
    // Check if the form has been modified at all
    if (!this.profileForm.dirty) {
      this.snackBar.open('Aucune modification détectée', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    console.log('Submitting profile changes:', this.profileForm.value);

    // Format date correctly for backend (YYYY-MM-DD for LocalDate)
    const dateValue = this.profileForm.get('dateNaissance')?.value;
    console.log('Date before formatting:', dateValue, 'Type:', typeof dateValue);
    
    let formattedDate = dateValue;
    if (dateValue instanceof Date) {
      formattedDate = dateValue.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      console.log('Formatted date:', formattedDate);
    }

    // Prepare the profile data - remove genre field completely as it's not in User table
    let profileData: any = {
      nom: this.profileForm.get('nom')?.value,
      prenom: this.profileForm.get('prenom')?.value,
      email: this.profileForm.get('email')?.value,
      phoneNumber: this.profileForm.get('telephone')?.value,
      address: this.profileForm.get('adresse')?.value,
      dateNaissance: this.profileForm.get('dateNaissance')?.value,
      profession: this.profileForm.get('profession')?.value
    };

    if (this.userRole.toUpperCase() === 'DOCTOR') {
      profileData = {
        ...profileData,
        ville: this.profileForm.get('ville')?.value,
        specialities: [this.profileForm.get('specialite')?.value],
        orderNumber: this.profileForm.get('orderNumber')?.value,
        cabinetAdresse: this.profileForm.get('cabinetAdresse')?.value
      };
    } else {
      profileData = {
        ...profileData,
        profession: this.profileForm.get('profession')?.value
      };
    }

    // First update the basic profile
    this.profileService.updateProfile(profileData).subscribe({
      next: (updatedProfile) => {
        this.showWelcomeBanner = false;
        console.log('Profile updated successfully:', updatedProfile);
        
        // If user is a patient, also update medical information
        if (this.userRole.toUpperCase() === 'PATIENT') {
          const medicalData: FichePatient = {
            id: this.fichePatient?.id,
            patientId: this.fichePatient?.patientId,
            nom: this.profileForm.get('nom')?.value,
            prenom: this.profileForm.get('prenom')?.value,
            sexe: this.profileForm.get('genre')?.value, // Keep sexe only for patient fiche
            profession: this.profileForm.get('profession')?.value,
            telephone: this.profileForm.get('telephone')?.value,
            adresse: this.profileForm.get('adresse')?.value,
            etatGeneral: this.profileForm.get('etatGeneral')?.value,
            antecedentsChirurgicaux: this.profileForm.get('antecedentsChirurgicaux')?.value,
            allergies: this.getAllergies().join(', '),
            priseMedicaments: this.profileForm.get('medicationDetails')?.value
          };

          this.patientService.updatePatientFiche(medicalData).subscribe({
            next: (updatedFiche) => {
              console.log('Medical information updated successfully:', updatedFiche);
              this.loading = false;
              this.updateSuccess = true; // Set success message flag
              setTimeout(() => this.updateSuccess = false, 5000); // Hide after 5 seconds
              this.loadProfile(); // Reload the profile to show updated data
              this.loadPatientFiche(); // Reload patient fiche
            },
            error: (error) => {
              console.error('Error updating medical information:', error);
              this.loading = false;
              this.snackBar.open('Error updating medical information', 'Close', { duration: 3000 });
            }
          });
        } else {
          this.loading = false;
          this.updateSuccess = true; // Set success message flag
          setTimeout(() => this.updateSuccess = false, 5000); // Hide after 5 seconds
          this.loadProfile(); // Reload the profile to show updated data
        }
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.loading = false;
        this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
      }
    });
  }

  onSubmitPassword(): void {
    this.passwordChangeSubmitted = true;
    
    if (this.passwordForm.valid) {
      this.loading = true;
      const passwordData = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };

      this.profileService.changePassword(passwordData).subscribe({
        next: () => {
          this.snackBar.open('Password changed successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Set success state and hide the form
          this.passwordChangeSuccess = true;
          this.loading = false;
          
          // After 5 seconds, show the form again with a fresh state
          setTimeout(() => {
            this.passwordChangeSuccess = false;
            // Create a new form with validators
            this.passwordForm = this.fb.group({
              currentPassword: ['', [Validators.required]],
              newPassword: ['', [Validators.required, Validators.minLength(8)]],
              confirmPassword: ['', [Validators.required]]
            }, {
              validators: this.passwordMatchValidator
            });
            // Reset submission state
            this.passwordChangeSubmitted = false;
          }, 5000);
        },
        error: (error) => {
          this.snackBar.open('Error changing password. Please check your current password.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.showEditForm = false;
    this.selectedFile = undefined;
    this.previewUrl = undefined;
    this.profileForm.reset();
    this.passwordForm.reset();
    this.profileUpdateSubmitted = false;
    this.passwordChangeSubmitted = false;
    this.passwordChangeSuccess = false;
    if (this.userProfile) {
      this.profileForm.patchValue(this.userProfile);
    }
  }

  // Helper method to get the full profile image URL
  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
        console.log('Profile picture URL:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    console.log('Using default avatar');
    return 'assets/images/default-avatar.png';
  }

  // Helper method to parse and format dates
  parseDateString(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    
    try {
      // First try direct conversion
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try parsing ISO format (YYYY-MM-DD)
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing date string:', error);
      return null;
    }
  }

  testBackendConnection(): void {
    const url = `${environment.apiUrl}/users/test`;
    console.log('Testing backend connection to:', url);
    
    this.http.get(url).subscribe({
      next: (response) => {
        console.log('Backend connection successful:', response);
      },
      error: (error) => {
        console.error('Backend connection failed:', error);
      }
    });
  }

  onCVFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedCVFile = file;
      this.cvFileName = file.name;
      
      // File validation
      if (file.size > 10000000) { // 10MB limit
        this.snackBar.open('Le fichier ne doit pas dépasser 10MB', 'Fermer', { duration: 3000 });
        this.selectedCVFile = undefined;
        this.cvFileName = undefined;
        return;
      }
      
      if (!file.type.match(/application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
        this.snackBar.open('Format de fichier invalide. Veuillez télécharger un fichier PDF ou DOC/DOCX.', 'Fermer', { duration: 3000 });
        this.selectedCVFile = undefined;
        this.cvFileName = undefined;
        return;
      }
    }
  }

  uploadCV(): void {
    if (!this.selectedCVFile) return;

    this.profileService.uploadCV(this.selectedCVFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.cvUploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('CV mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.cvUploadProgress = 0;
          
          // Update the user profile to get the new CV path
          this.loadProfile();
          
          // Clear the selected file
          this.selectedCVFile = undefined;
          this.cvFileName = undefined;
        }
      },
      error: (error) => {
        console.error('Error uploading CV:', error);
        this.snackBar.open('Une erreur est survenue lors du téléchargement du CV', 'Fermer', { duration: 3000 });
        this.cvUploadProgress = 0;
      }
    });
  }

  viewCV(): void {
    if (this.userProfile?.cvFilePath) {
      this.dialog.open(CvViewerDialogComponent, {
        width: '800px',
        height: '700px',
        data: {
          cvFilePath: this.userProfile.cvFilePath
        }
      });
    }
  }

  addAllergy(allergie: string) {
    if (!allergie.trim()) return;
    
    // Convert to title case
    allergie = allergie.trim().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (this.isAllergyPresent(allergie)) {
      this.snackBar.open('Cette allergie est déjà dans la liste', 'Fermer', { duration: 3000 });
      return;
    }
    
    const currentAllergies = this.getAllergies();
    currentAllergies.push(allergie);
    
    // Update the fiche patient with new allergies
    if (this.fichePatient) {
      this.fichePatient.allergies = JSON.stringify(currentAllergies);
      
      // Update on the server
      this.patientService.updatePatientFiche(this.fichePatient).subscribe({
        next: (response) => {
          this.fichePatient = response;
          this.snackBar.open('Allergie ajoutée avec succès', 'Fermer', { duration: 2000 });
          this.loadPatientFiche(); // Reload fiche to update UI
        },
        error: (error) => {
          console.error('Error updating allergies:', error);
          this.snackBar.open('Erreur lors de l\'ajout de l\'allergie', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  removeAllergy(allergie: string) {
    const currentAllergies = this.getAllergies().filter(a => a !== allergie);
    
    // Update the fiche patient with new allergies
    if (this.fichePatient) {
      this.fichePatient.allergies = JSON.stringify(currentAllergies);
      
      // Update on the server
      this.patientService.updatePatientFiche(this.fichePatient).subscribe({
        next: (response) => {
          this.fichePatient = response;
          this.snackBar.open('Allergie supprimée avec succès', 'Fermer', { duration: 2000 });
          this.loadPatientFiche(); // Reload fiche to update UI
        },
        error: (error) => {
          console.error('Error updating allergies:', error);
          this.snackBar.open('Erreur lors de la suppression de l\'allergie', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  isAllergyPresent(allergie: string): boolean {
    return this.getAllergies().includes(allergie);
  }

  viewDocument(doc: any): void {
    if (!doc.documentPath) {
      this.snackBar.open('Aucun document à afficher', 'Fermer', { duration: 3000 });
      return;
    }
    const documentUrl = `${this.apiUrl}/patients/me/fiche/document`;
    window.open(documentUrl, '_blank');
  }

  deleteDocument(doc: any): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }
    this.patientService.deleteDocument(doc).subscribe({
      next: () => {
        this.snackBar.open('Document supprimé avec succès', 'Fermer', { duration: 3000 });
        this.loadDocuments();
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la suppression du document', 'Fermer', { duration: 3000 });
      }
    });
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onDocumentSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > this.maxFileSize) {
          this.snackBar.open(`Le fichier ${file.name} dépasse la limite de 10MB`, 'Fermer', { duration: 3000 });
          continue;
        }
        if (!this.isValidFileType(file)) {
          this.snackBar.open(`Le type de fichier de ${file.name} n'est pas supporté`, 'Fermer', { duration: 3000 });
          continue;
        }
        this.uploadedFiles.push(file);
      }
    }
  }

  saveDoctorBanner() {
    console.log('Clicked Terminer');
    if (this.doctorBannerForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const professionalInfo = {
      specialities: [this.doctorBannerForm.get('specialite')?.value],
      orderNumber: this.doctorBannerForm.get('rpps')?.value,
      cabinetAdresse: this.doctorBannerForm.get('cabinetAdresse')?.value,
      ville: this.doctorBannerForm.get('ville')?.value
    };
    console.log('Submitting professional info:', professionalInfo);

    this.profileService.updateProfile(professionalInfo).subscribe({
      next: (updatedProfile) => {
        console.log('Profile updated, navigating to /mon-profil');
        this.profileForm.patchValue({
          specialite: professionalInfo.specialities[0],
          orderNumber: professionalInfo.orderNumber,
          cabinetAdresse: professionalInfo.cabinetAdresse,
          ville: professionalInfo.ville
        });
        this.loading = false;
        this.snackBar.open('Professional information updated successfully', 'Close', { duration: 3000 });
        this.loadProfile(); // Reload the profile to show updated data
        this.router.navigate(['/mon-profil']);
      },
      error: (error) => {
        console.error('Error updating professional info:', error);
        this.loading = false;
        this.snackBar.open('Error updating professional information', 'Close', { duration: 3000 });
      }
    });
  }

  scrollToProfileForm() {
    const el = document.querySelector('.profile-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  closeWelcomeBanner() {
    localStorage.setItem('welcomeBannerSeen', 'true');
    this.showWelcomeBanner = false;
  }
}
