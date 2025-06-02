import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-create-patient-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatRadioModule,
    MatListModule
  ],
  template: `
    <h2 mat-dialog-title>Créer un nouveau patient</h2>
    
    <mat-dialog-content>
      <div class="patient-form-container">
        <div class="form-header">
          <h3>FICHE PATIENT</h3>
        </div>

        <form [formGroup]="patientForm" class="patient-form">
          <!-- Informations de base -->
          <div class="form-section">
            <h4>Informations personnelles</h4>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="nom" required>
                <mat-error *ngIf="patientForm.get('nom')?.hasError('required')">Le nom est requis</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Prénom</mat-label>
                <input matInput formControlName="prenom" required>
                <mat-error *ngIf="patientForm.get('prenom')?.hasError('required')">Le prénom est requis</mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
                <mat-error *ngIf="patientForm.get('email')?.hasError('required')">L'email est requis</mat-error>
                <mat-error *ngIf="patientForm.get('email')?.hasError('email')">Format d'email invalide</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="phoneNumber" required>
                <mat-error *ngIf="patientForm.get('phoneNumber')?.hasError('required')">Le téléphone est requis</mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Date de naissance</mat-label>
                <input matInput [matDatepicker]="birthPicker" formControlName="dateNaissance" required>
                <mat-datepicker-toggle matSuffix [for]="birthPicker"></mat-datepicker-toggle>
                <mat-datepicker #birthPicker></mat-datepicker>
                <mat-error *ngIf="patientForm.get('dateNaissance')?.hasError('required')">La date de naissance est requise</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Âge</mat-label>
                <input matInput type="number" formControlName="age">
              </mat-form-field>
            </div>

            <div class="form-row">
              <div class="field-container gender-container">
                <label>Sexe</label>
                <mat-radio-group formControlName="sexe" class="gender-radio-group">
                  <mat-radio-button value="M">Homme</mat-radio-button>
                  <mat-radio-button value="F">Femme</mat-radio-button>
                </mat-radio-group>
              </div>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Profession</mat-label>
                <input matInput formControlName="profession">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Adresse</mat-label>
                <textarea matInput formControlName="address" rows="2"></textarea>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>État général</mat-label>
                <mat-select formControlName="etatGeneral">
                  <mat-option value="excellent">Excellent</mat-option>
                  <mat-option value="good">Bon</mat-option>
                  <mat-option value="fair">Moyen</mat-option>
                  <mat-option value="poor">Mauvais</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Informations médicales -->
          <div class="form-section">
            <h4>Informations médicales</h4>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Antécédents chirurgicaux</mat-label>
              <textarea matInput formControlName="antecedentsChirurgicaux" rows="3"></textarea>
            </mat-form-field>

            <div class="form-row">
              <div class="field-container">
                <label>Prise de médicaments</label>
                <mat-radio-group formControlName="priseMedicamenteuse" class="radio-group">
                  <mat-radio-button value="oui">Oui</mat-radio-button>
                  <mat-radio-button value="non">Non</mat-radio-button>
                </mat-radio-group>
              </div>
            </div>

            <mat-form-field appearance="outline" class="full-width" *ngIf="patientForm.get('priseMedicamenteuse')?.value === 'oui'">
              <mat-label>Détails des médicaments</mat-label>
              <textarea matInput formControlName="medicationDetails" rows="2" 
                        placeholder="Veuillez préciser les médicaments que vous prenez actuellement"></textarea>
            </mat-form-field>
          </div>

          <!-- Allergies -->
          <div class="form-section">
            <h4>Allergies</h4>
            
            <div class="allergies-container" formGroupName="allergies">
              <div class="allergy-row">
                <div class="allergy-item">
                  <label>Latex:</label>
                  <mat-radio-group formControlName="latex" class="radio-group">
                    <mat-radio-button value="oui">Oui</mat-radio-button>
                    <mat-radio-button value="non">Non</mat-radio-button>
                  </mat-radio-group>
                </div>
                
                <div class="allergy-item">
                  <label>Pénicilline:</label>
                  <mat-radio-group formControlName="penicilline" class="radio-group">
                    <mat-radio-button value="oui">Oui</mat-radio-button>
                    <mat-radio-button value="non">Non</mat-radio-button>
                  </mat-radio-group>
                </div>
              </div>
              
              <div class="allergy-row">
                <div class="allergy-item">
                  <label>Anesthésiques locaux:</label>
                  <mat-radio-group formControlName="anesthesiques" class="radio-group">
                    <mat-radio-button value="oui">Oui</mat-radio-button>
                    <mat-radio-button value="non">Non</mat-radio-button>
                  </mat-radio-group>
                </div>
                
                <div class="allergy-item">
                  <label>Iode:</label>
                  <mat-radio-group formControlName="iode" class="radio-group">
                    <mat-radio-button value="oui">Oui</mat-radio-button>
                    <mat-radio-button value="non">Non</mat-radio-button>
                  </mat-radio-group>
                </div>
              </div>
              
              <div class="allergy-row">
                <div class="allergy-item">
                  <label>Métaux (ex: nickel):</label>
                  <mat-radio-group formControlName="metal" class="radio-group">
                    <mat-radio-button value="oui">Oui</mat-radio-button>
                    <mat-radio-button value="non">Non</mat-radio-button>
                  </mat-radio-group>
                </div>
                
                <div class="allergy-item">
                  <label>Autre:</label>
                  <mat-radio-group formControlName="autre" class="radio-group">
                    <mat-radio-button value="oui">Oui</mat-radio-button>
                    <mat-radio-button value="non">Non</mat-radio-button>
                  </mat-radio-group>
                </div>
              </div>
              
              <mat-form-field appearance="outline" class="full-width" *ngIf="patientForm.get('allergies.autre')?.value === 'oui'">
                <mat-label>Précisez vos autres allergies</mat-label>
                <textarea matInput formControlName="autreAllergies" rows="2"
                          placeholder="Veuillez préciser les autres allergies"></textarea>
              </mat-form-field>
            </div>
          </div>

          <!-- Documents section -->
          <div class="form-section">
            <h4>Documents & Radiographies</h4>
            <div class="file-upload-container">
              <div class="file-upload-box" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onFileDrop($event)">
                <input #fileInput type="file" hidden (change)="onFileSelected($event)" multiple accept="image/*,.pdf">
                <mat-icon>cloud_upload</mat-icon>
                <p>Cliquez ou glissez vos fichiers ici</p>
                <span class="file-types">Images, radiographies, PDF (Max 10MB)</span>
              </div>
              
              <div class="uploaded-files" *ngIf="uploadedFiles.length > 0">
                <h5>Fichiers ajoutés ({{uploadedFiles.length}})</h5>
                <mat-list>
                  <mat-list-item *ngFor="let file of uploadedFiles; let i = index" class="file-item">
                    <mat-icon matListIcon>insert_drive_file</mat-icon>
                    <span matLine>{{file.name}}</span>
                    <button mat-icon-button color="warn" (click)="removeFile(i)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </mat-list-item>
                </mat-list>
              </div>
            </div>
          </div>
        </form>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="patientForm.invalid || loading" 
        (click)="onSubmit()">
        <span *ngIf="!loading">Créer le patient</span>
        <mat-spinner *ngIf="loading" diameter="24"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .patient-form-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-header {
      text-align: center;
      margin-bottom: 16px;
    }
    
    .form-header h3 {
      color: #4361ee;
      font-weight: 600;
      margin: 0;
      padding: 8px 0;
      border-bottom: 2px solid #4361ee;
    }
    
    .patient-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-section {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .form-section h4 {
      color: #4361ee;
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: 500;
      font-size: 1.1rem;
      border-bottom: 1px solid #e1e4e8;
      padding-bottom: 8px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    
    .form-field, .field-container {
      flex: 1;
      min-width: 200px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .gender-container, .field-container {
      display: flex;
      flex-direction: column;
      padding: 4px 0;
    }
    
    .gender-container label, .field-container label {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .gender-radio-group, .radio-group {
      display: flex;
      gap: 16px;
      margin-top: 4px;
    }
    
    .allergies-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .allergy-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .allergy-item {
      flex: 1;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .allergy-item label {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }
    
    .file-upload-container {
      margin-top: 12px;
    }
    
    .file-upload-box {
      border: 2px dashed #4361ee;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: rgba(67, 97, 238, 0.05);
    }
    
    .file-upload-box:hover {
      background-color: rgba(67, 97, 238, 0.1);
    }
    
    .file-upload-box mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4361ee;
    }
    
    .file-upload-box p {
      margin: 8px 0;
      font-weight: 500;
      color: #333;
    }
    
    .file-types {
      font-size: 0.8rem;
      color: #666;
    }
    
    .uploaded-files {
      margin-top: 20px;
      border: 1px solid #e1e4e8;
      border-radius: 8px;
      padding: 12px;
      background-color: white;
    }
    
    .uploaded-files h5 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #333;
      font-weight: 500;
    }
    
    .file-item {
      border-bottom: 1px solid #f1f1f1;
    }
  `]
})
export class CreatePatientDialogComponent implements OnInit {
  patientForm: FormGroup;
  loading = false;
  uploadedFiles: File[] = [];
  private apiUrl = `${environment.apiUrl}/api/v1/api/users`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CreatePatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.patientForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      age: [''],
      sexe: ['M'],
      profession: [''],
      address: [''],
      etatGeneral: ['good'],
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
    
    // If data is provided (from appointment creation), pre-populate the form
    if (data && data.patientInfo) {
      this.patientForm.patchValue(data.patientInfo);
    }
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      return;
    }

    this.loading = true;
    
    // Prepare allergies data
    const allergiesData = this.patientForm.get('allergies')?.value;
    let allergiesString = '';
    if (allergiesData) {
      const allergiesList = [];
      if (allergiesData.latex === 'oui') allergiesList.push('Latex');
      if (allergiesData.penicilline === 'oui') allergiesList.push('Pénicilline');
      if (allergiesData.anesthesiques === 'oui') allergiesList.push('Anesthésiques locaux');
      if (allergiesData.iode === 'oui') allergiesList.push('Iode');
      if (allergiesData.metal === 'oui') allergiesList.push('Métaux');
      if (allergiesData.autre === 'oui' && allergiesData.autreAllergies) {
        allergiesList.push(allergiesData.autreAllergies);
      }
      allergiesString = allergiesList.join(', ');
    }
    
    // Prepare medication data
    let medicationString = '';
    if (this.patientForm.get('priseMedicamenteuse')?.value === 'oui') {
      medicationString = this.patientForm.get('medicationDetails')?.value || '';
    }
    
    // Extract only the basic user data needed for registration
    const userData = {
      nom: this.patientForm.get('nom')?.value,
      prenom: this.patientForm.get('prenom')?.value,
      email: this.patientForm.get('email')?.value,
      phoneNumber: this.patientForm.get('phoneNumber')?.value,
      dateNaissance: this.patientForm.get('dateNaissance')?.value,
      address: this.patientForm.get('address')?.value,
      password: 'Password123!', // Default password that will be reset
      role: 'patient'           // Always create as patient
    };
    
    // Create the user first
    this.http.post(`${this.apiUrl}/register`, userData)
      .pipe(
        tap((response: any) => {
          console.log('User registered successfully:', response);
          
          // Now create the patient fiche with all medical info
          const ficheData = {
            patientId: response.id, // Use ID from the registered user
            nom: this.patientForm.get('nom')?.value,
            prenom: this.patientForm.get('prenom')?.value,
            age: this.patientForm.get('age')?.value,
            profession: this.patientForm.get('profession')?.value,
            telephone: this.patientForm.get('phoneNumber')?.value,
            adresse: this.patientForm.get('address')?.value,
            sexe: this.patientForm.get('sexe')?.value,
            etatGeneral: this.patientForm.get('etatGeneral')?.value,
            antecedentsChirurgicaux: this.patientForm.get('antecedentsChirurgicaux')?.value,
            priseMedicaments: medicationString,
            allergies: allergiesString
          };
          
          // If we have files, we would upload them here
          // For now, just show success
          this.snackBar.open('Patient créé avec succès!', 'Fermer', { 
            duration: 3000 
          });
          this.dialogRef.close(userData);
        }),
        catchError(error => {
          console.error('Error registering user:', error);
          this.loading = false;
          this.snackBar.open(
            error.error?.message || 'Erreur lors de la création du patient', 
            'Fermer', 
            { duration: 5000 }
          );
          return throwError(() => error);
        })
      )
      .subscribe();
  }
  
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size <= 10 * 1024 * 1024) { // 10MB limit
          this.uploadedFiles.push(files[i]);
        } else {
          this.snackBar.open(`Le fichier ${files[i].name} dépasse la limite de 10MB`, 'Fermer', {
            duration: 3000
          });
        }
      }
    }
  }
  
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.match(/image.*/) || files[i].type === 'application/pdf') {
          if (files[i].size <= 10 * 1024 * 1024) { // 10MB limit
            this.uploadedFiles.push(files[i]);
          } else {
            this.snackBar.open(`Le fichier ${files[i].name} dépasse la limite de 10MB`, 'Fermer', {
              duration: 3000
            });
          }
        } else {
          this.snackBar.open(`Type de fichier non pris en charge: ${files[i].type}`, 'Fermer', {
            duration: 3000
          });
        }
      }
    }
  }
  
  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }
} 