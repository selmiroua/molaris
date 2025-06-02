import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, NgForm } from '@angular/forms';
import { DemandeService } from './demande.service';
import { DemandeDataService } from './demande-data.service';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Constants for file validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export interface Demande {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  nom: string;
  prenom: string;
  email: string;
  specialite: string;
  aCabinet: boolean;
  nomCabinet?: string;
  motifRefus?: string;
}

@Component({
  selector: 'app-demande',
  templateUrl: './demande.component.html',
  styleUrls: ['./demande.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    MatProgressBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
  ],
  providers: [DemandeService],
})
export class DemandeComponent implements OnInit {
  demandeForm!: FormGroup;
  isSubmitting = false;
  hasExistingDemande = false;
  existingDemande: Demande | null = null;
  photoPreview: string | null = null;
  diplomePreview: string | null = null;
  cabinetPhotoPreview: string | null = null;
  showAutreSpecialite = false;
  errorMessage: string = '';
  hasError: boolean = false;

  villesTunisie: string[] = [
    'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana',
    'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul',
    'Tataouine', 'Béja', 'Le Kef', 'Mahdia', 'Sidi Bouzid', 'Jendouba',
    'Tozeur', 'Manouba', 'Siliana', 'Zaghouan', 'Kébili'
  ];

  specialitesOptions: string[] = [
    'Dentiste généraliste',
    'Orthodontiste',
    'Parodontiste',
    'Endodontiste',
    'Chirurgien dentiste',
    'Pédodontiste',
    'Autre'
  ];

  @ViewChild('formDirective') formDirective!: NgForm;
  @ViewChild('photoInput') photoInput!: ElementRef;
  @ViewChild('diplomeInput') diplomeInput!: ElementRef;
  @ViewChild('cabinetPhotoInput') cabinetPhotoInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private demandeDataService: DemandeDataService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkExistingDemande();
    this.watchSpecialiteChanges();
    this.watchCabinetChanges();
  }

  private initializeForm(): void {
    this.demandeForm = this.fb.group({
      // Informations personnelles
      photo: [null, [Validators.required]],
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      adresse: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      ville: ['', Validators.required],
      codePostal: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],

      // Informations professionnelles
      anneeExperience: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      specialite: ['', Validators.required],
      autreSpecialite: [''],
      aCabinet: [false, Validators.required],

      // Informations sur le cabinet (conditionnelles)
      nomCabinet: [''],
      adresseCabinet: [''],
      villeCabinet: [''],
      codePostalCabinet: [''],
      photoCabinet: [null],
      photoDiplome: [null, Validators.required]
    });
  }

  private watchSpecialiteChanges(): void {
    this.demandeForm.get('specialite')?.valueChanges.subscribe(value => {
      if (value === 'Autre') {
        this.demandeForm.get('autreSpecialite')?.setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50)
        ]);
      } else {
        this.demandeForm.get('autreSpecialite')?.clearValidators();
        this.demandeForm.get('autreSpecialite')?.setValue('');
      }
      this.demandeForm.get('autreSpecialite')?.updateValueAndValidity();
    });
  }

  private watchCabinetChanges(): void {
    this.demandeForm.get('aCabinet')?.valueChanges.subscribe(hasCabinet => {
      const cabinetControls = [
        'nomCabinet',
        'adresseCabinet',
        'villeCabinet',
        'codePostalCabinet',
        'photoCabinet'
      ];

      cabinetControls.forEach(control => {
        const formControl = this.demandeForm.get(control);
        if (hasCabinet) {
          if (control === 'codePostalCabinet') {
            formControl?.setValidators([
              Validators.required,
              Validators.pattern(/^[0-9]{4}$/)
            ]);
          } else if (control === 'photoCabinet') {
            formControl?.setValidators([Validators.required]);
          } else {
            formControl?.setValidators([
              Validators.required,
              Validators.minLength(2),
              control === 'adresseCabinet' ? Validators.maxLength(200) : Validators.maxLength(50)
            ]);
          }
        } else {
          formControl?.clearValidators();
          formControl?.setValue(control === 'photoCabinet' ? null : '');
        }
        formControl?.updateValueAndValidity();
      });
    });
  }

  get autreSpecialiteVisible(): boolean {
    return this.demandeForm.get('specialite')?.value === 'Autre';
  }

  get cabinetVisible(): boolean {
    return this.demandeForm.get('aCabinet')?.value === true;
  }

  private validateFile(file: File, fieldName: string): boolean {
    if (!file) return false;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      this.snackBar.open(
        `Le fichier ${fieldName} doit être une image (JPEG, PNG ou GIF)`,
        'Fermer',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.snackBar.open(
        `Le fichier ${fieldName} ne doit pas dépasser 5MB`,
        'Fermer',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return false;
    }

    return true;
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.validateFile(file, 'photo')) {
      this.demandeForm.patchValue({ photo: file });
      this.photoPreview = URL.createObjectURL(file);
    }
  }

  onCabinetPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.validateFile(file, 'photoCabinet')) {
      this.demandeForm.patchValue({ photoCabinet: file });
      this.cabinetPhotoPreview = URL.createObjectURL(file);
    }
  }

  onDiplomePhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.validateFile(file, 'photoDiplome')) {
      this.demandeForm.patchValue({ photoDiplome: file });
      this.diplomePreview = URL.createObjectURL(file);
    }
  }

  private checkExistingDemande(): void {
    this.demandeService.getCurrentUserDemande().subscribe({
      next: (demande) => {
        if (demande) {
          console.log('Received demande:', demande);
          this.hasExistingDemande = true;
          this.existingDemande = demande;
        }
      },
      error: (error) => {
        console.error('Error checking existing demande:', error);
        this.snackBar.open(
          'Une erreur est survenue lors de la vérification de votre demande.',
          'Fermer',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  onSubmit(): void {
    if (this.demandeForm.invalid) {
      this.markAllFormControlsAsTouched();
      this.showFormErrors();
      return;
    }

    this.isSubmitting = true;
    const formData = this.prepareFormData();

    this.demandeService.submitDemande(formData).subscribe({
      next: (response) => this.handleSuccess(response),
      error: (err) => this.handleError(err),
      complete: () => this.isSubmitting = false
    });
  }

  private prepareFormData(): FormData {
    const formData = new FormData();

    // Ajout des champs de formulaire
    formData.append('nom', this.demandeForm.get('nom')?.value);
    formData.append('prenom', this.demandeForm.get('prenom')?.value);
    formData.append('email', this.demandeForm.get('email')?.value);
    formData.append('telephone', this.demandeForm.get('telephone')?.value);
    formData.append('adresse', this.demandeForm.get('adresse')?.value);
    formData.append('ville', this.demandeForm.get('ville')?.value);
    formData.append('codePostal', this.demandeForm.get('codePostal')?.value);
    formData.append('anneeExperience', this.demandeForm.get('anneeExperience')?.value);
    formData.append('specialite', this.demandeForm.get('specialite')?.value);
    formData.append('autreSpecialite', this.demandeForm.get('autreSpecialite')?.value || '');
    formData.append('aCabinet', this.demandeForm.get('aCabinet')?.value.toString());

    // Si le cabinet est renseigné, on ajoute les informations
    if (this.demandeForm.get('aCabinet')?.value) {
      formData.append('nomCabinet', this.demandeForm.get('nomCabinet')?.value);
      formData.append('adresseCabinet', this.demandeForm.get('adresseCabinet')?.value);
      formData.append('villeCabinet', this.demandeForm.get('villeCabinet')?.value);
      formData.append('codePostalCabinet', this.demandeForm.get('codePostalCabinet')?.value);
    }

    // Ajout des fichiers
    if (this.demandeForm.get('photo')?.value) {
      formData.append('photo', this.demandeForm.get('photo')?.value);
    }
    if (this.demandeForm.get('photoCabinet')?.value) {
      formData.append('cabinetPhoto', this.demandeForm.get('photoCabinet')?.value);
    }
    if (this.demandeForm.get('photoDiplome')?.value) {
      formData.append('diplomePhoto', this.demandeForm.get('photoDiplome')?.value);
    }

    return formData;
  }

  private markAllFormControlsAsTouched(): void {
    Object.values(this.demandeForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private showFormErrors(): void {
    const errors = this.collectFormErrors();
    if (errors.length > 0) {
      this.snackBar.open(
        `Veuillez corriger les erreurs: ${errors.join(', ')}`,
        'Fermer',
        { duration: 7000, panelClass: ['error-snackbar'] }
      );
    }
  }

  private collectFormErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.demandeForm.controls).forEach(key => {
      const control = this.demandeForm.get(key);
      if (control?.errors) {
        if (control.errors['required']) {
          errors.push(`${this.getFieldLabel(key)} est requis`);
        } else if (control.errors['email']) {
          errors.push('Email invalide');
        } else if (control.errors['pattern']) {
          if (key.includes('codePostal')) {
            errors.push('Code postal invalide (4 chiffres)');
          } else if (key === 'telephone') {
            errors.push('Téléphone invalide (8 chiffres)');
          }
        } else if (control.errors['minlength']) {
          errors.push(`${this.getFieldLabel(key)} trop court`);
        } else if (control.errors['maxlength']) {
          errors.push(`${this.getFieldLabel(key)} trop long`);
        }
      }
    });
    return errors;
  }

  private getFieldLabel(key: string): string {
    const labels: {[key: string]: string} = {
      photo: 'Photo',
      nom: 'Nom',
      prenom: 'Prénom',
      email: 'Email',
      telephone: 'Téléphone',
      adresse: 'Adresse',
      ville: 'Ville',
      codePostal: 'Code postal',
      anneeExperience: 'Années d\'expérience',
      specialite: 'Spécialité',
      autreSpecialite: 'Autre spécialité',
      aCabinet: 'Cabinet dentaire',
      nomCabinet: 'Nom du cabinet',
      adresseCabinet: 'Adresse du cabinet',
      villeCabinet: 'Ville du cabinet',
      codePostalCabinet: 'Code postal du cabinet',
      photoCabinet: 'Photo du cabinet',
      photoDiplome: 'Diplôme'
    };
    return labels[key] || key;
  }

  private handleSuccess(response: any): void {
    // Create a clean object with the form data for the confirmation page
    const demandeData = {
      nom: this.demandeForm.get('nom')?.value,
      prenom: this.demandeForm.get('prenom')?.value,
      email: this.demandeForm.get('email')?.value,
      telephone: this.demandeForm.get('telephone')?.value,
      adresse: this.demandeForm.get('adresse')?.value,
      ville: this.demandeForm.get('ville')?.value,
      codePostal: this.demandeForm.get('codePostal')?.value,
      anneeExperience: this.demandeForm.get('anneeExperience')?.value,
      specialite: this.demandeForm.get('specialite')?.value,
      autreSpecialite: this.demandeForm.get('autreSpecialite')?.value,
      aCabinet: this.demandeForm.get('aCabinet')?.value,
      nomCabinet: this.demandeForm.get('nomCabinet')?.value,
      adresseCabinet: this.demandeForm.get('adresseCabinet')?.value,
      villeCabinet: this.demandeForm.get('villeCabinet')?.value,
      codePostalCabinet: this.demandeForm.get('codePostalCabinet')?.value
    };

    // Store the data in the service
    this.demandeDataService.setDemandeData(demandeData);

    // Navigate to the confirmation page
    this.router.navigate(['/dashboard/demande/confirmation']);
  }

  private handleError(error: HttpErrorResponse): void {
    this.isSubmitting = false;
    this.hasError = true;
    console.error('Error submitting demande:', error);
    
    if (error.status === 400) {
      this.errorMessage = 'Veuillez vérifier les informations saisies.';
    } else if (error.status === 409) {
      this.errorMessage = 'Une demande existe déjà pour cet utilisateur.';
    } else {
      this.errorMessage = 'Une erreur est survenue lors de la vérification de votre demande.';
    }
    
    this.showFormErrors();
  }

  onReset(): void {
    this.demandeForm.reset({
      aCabinet: false,
      anneeExperience: 0
    });
    this.photoPreview = null;
    this.cabinetPhotoPreview = null;
    this.diplomePreview = null;
    this.formDirective.resetForm();
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getStatusText(status: string | undefined): string {
    switch (status) {
      case 'PENDING':
        return 'En cours de traitement';
      case 'APPROVED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return 'Statut inconnu';
    }
  }

  formatCreatedAt(dateArray: any): string {
    if (!dateArray || !Array.isArray(dateArray)) return '';
    const [year, month, day, hour, minute] = dateArray;
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  dismissError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }
}
