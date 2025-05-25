import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Router } from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatListModule,
    MatSelectModule,
    MatRadioModule
  ],
  providers: [
    MatDatepickerModule,
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
  ],
  templateUrl: './welcome-modal.component.html',
  styleUrls: ['./welcome-modal.component.scss']
})
export class WelcomeModalComponent implements OnInit {
  currentStep = 1;
  patientForm: FormGroup;
  patientNumber: string;
  uploadedFiles: File[] = [];
  maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WelcomeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private patientService: PatientService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.patientForm = this.fb.group({
      age: ['', Validators.required],
      genre: ['', Validators.required],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9+]{8,}$')]],
      adresseResidence: ['', Validators.required],
      profession: [''],
      etatGeneral: [''],
      antecedentsChirurgicaux: [''],
      priseMedicamenteuse: ['non'],
      medicationDetails: [''],
      allergies: this.fb.group({
        latex: ['non'],
        penicilline: ['non'],
        anesthesiques: ['non'],
        iode: ['non'],
        metal: ['non'],
        autre: ['non'],
        autreAllergies: ['']
      })
    });

    this.patientNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.initializeValidators();
    
    // Prevent dialog from closing when clicking outside
    this.dialogRef.disableClose = true;
  }

  ngOnInit(): void {}

  private initializeValidators(): void {
    // Add conditional validation for medication details
    this.patientForm.get('priseMedicamenteuse')?.valueChanges.subscribe(value => {
      const medicationDetailsControl = this.patientForm.get('medicationDetails');
      if (value === 'oui') {
        medicationDetailsControl?.setValidators([Validators.required]);
      } else {
        medicationDetailsControl?.clearValidators();
      }
      medicationDetailsControl?.updateValueAndValidity();
    });

    // Add conditional validation for other allergies
    this.patientForm.get('allergies.autre')?.valueChanges.subscribe(value => {
      const autreAllergiesControl = this.patientForm.get('allergies.autreAllergies');
      if (value === 'oui') {
        autreAllergiesControl?.setValidators([Validators.required]);
      } else {
        autreAllergiesControl?.clearValidators();
      }
      autreAllergiesControl?.updateValueAndValidity();
    });
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  terminer(): void {
    if (this.patientForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.patientForm.value;
      
      // Format allergies as a string
      const allergies = formData.allergies;
      const selectedAllergies: string[] = [];
      if (allergies.latex === 'oui') selectedAllergies.push('Latex');
      if (allergies.penicilline === 'oui') selectedAllergies.push('Pénicilline');
      if (allergies.anesthesiques === 'oui') selectedAllergies.push('Anesthésiques');
      if (allergies.iode === 'oui') selectedAllergies.push('Iode');
      if (allergies.metal === 'oui') selectedAllergies.push('Métaux');
      if (allergies.autre === 'oui' && allergies.autreAllergies) {
        selectedAllergies.push(allergies.autreAllergies);
      }

      // Get current user info
      this.authService.currentUser.subscribe(currentUser => {
        if (!currentUser) {
          this.snackBar.open('Erreur: Utilisateur non connecté', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
          return;
        }

        // Create the fiche patient data with correct field mappings
        const fichePatient = {
          nom: currentUser.nom,
          prenom: currentUser.prenom,
          age: formData.age,
          sexe: formData.genre,
          telephone: formData.telephone,
          adresse: formData.adresseResidence,
          profession: formData.profession,
          etatGeneral: formData.etatGeneral,
          antecedentsChirurgicaux: formData.antecedentsChirurgicaux,
          allergies: selectedAllergies.join(', '),
          priseMedicaments: formData.priseMedicamenteuse === 'oui' ? formData.medicationDetails : null
        };

        this.patientService.createPatientFicheFromWelcome(fichePatient, this.uploadedFiles).subscribe({
          next: (response) => {
            // Set the welcome banner seen flag
            localStorage.setItem('welcomeBannerSeen', 'true');
            
            this.snackBar.open('Votre profil médical a été enregistré avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Close the dialog and navigate to profile
            this.dialogRef.close(fichePatient);
            this.router.navigate(['/dashboard/patient'], { queryParams: { section: 'profile' } });
          },
          error: (error) => {
            console.error('Error saving patient fiche:', error);
            this.snackBar.open('Une erreur est survenue lors de l\'enregistrement de votre profil', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.isSubmitting = false;
          }
        });
      });
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    this.handleFiles(files);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  private handleFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      if (file.size <= this.maxFileSize) {
        if (!this.uploadedFiles.some(f => f.name === file.name)) {
          this.uploadedFiles.push(file);
        } else {
          this.snackBar.open('Un fichier avec le même nom existe déjà', 'Fermer', {
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
        }
      } else {
        this.snackBar.open('Le fichier dépasse la taille maximale de 10MB', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  controlNames() {
    return Object.keys(this.patientForm.controls);
  }
} 