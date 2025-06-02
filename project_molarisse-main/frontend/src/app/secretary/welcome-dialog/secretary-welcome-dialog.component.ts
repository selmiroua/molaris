import { Component, OnInit, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfileService, UserProfile } from '../../profile/profile.service';
import { environment } from '../../../environments/environment';
import { HttpEventType } from '@angular/common/http';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-secretary-welcome-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressBarModule,
    MatStepperModule,
    MatSnackBarModule
  ],
  template: `
    <div class="welcome-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Bienvenue chez Molarisse</h2>
        <p class="subtitle">Complétez votre profil pour commencer</p>
      </div>

      <mat-dialog-content>
        <mat-stepper [linear]="false" #stepper (selectionChange)="onStepChange($event)">
          <!-- Step 0: Introduction -->
          <mat-step completed="true">
            <ng-template matStepLabel>Introduction</ng-template>
            <div class="intro-container">
              <div class="intro-image">
                <img src="assets/images/secretary-welcome.svg" alt="Bienvenue" class="welcome-image">
                <div class="image-overlay">
                  <div class="pulse-circle"></div>
                  <div class="pulse-circle delay-1"></div>
                  <div class="pulse-circle delay-2"></div>
                </div>
              </div>
              
              <div class="intro-text">
                <h3>Complétez votre profil professionnel</h3>
                <p>
                  Bienvenue dans l'équipe Molarisse ! Pour finaliser votre inscription, veuillez compléter 
                  vos informations personnelles et télécharger votre CV.
                </p>
                <p>
                  <mat-icon color="primary">check_circle</mat-icon>
                  Ces informations sont essentielles pour que le médecin puisse valider votre profil.
                </p>
                <p>
                  <mat-icon color="primary">check_circle</mat-icon>
                  Votre CV sera visible uniquement par les médecins avec lesquels vous travaillez.
                </p>
                <p>
                  <mat-icon color="primary">check_circle</mat-icon>
                  Remplir un profil complet augmente vos chances d'être sélectionné(e) par un médecin.
                </p>
              </div>
              
              <div class="button-row">
                <button mat-raised-button color="primary" matStepperNext>
                  Commencer <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <!-- Step 1: Basic Information -->
          <mat-step [stepControl]="basicInfoForm" [editable]="true">
            <ng-template matStepLabel>Informations personnelles</ng-template>
            <form [formGroup]="basicInfoForm">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Prénom</mat-label>
                  <input matInput formControlName="prenom" required>
                  <mat-error *ngIf="basicInfoForm.get('prenom')?.hasError('required')">
                    Le prénom est requis
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="nom" required>
                  <mat-error *ngIf="basicInfoForm.get('nom')?.hasError('required')">
                    Le nom est requis
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" required type="email">
                  <mat-error *ngIf="basicInfoForm.get('email')?.hasError('required')">
                    L'email est requis
                  </mat-error>
                  <mat-error *ngIf="basicInfoForm.get('email')?.hasError('email')">
                    Format d'email invalide
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Téléphone</mat-label>
                  <input matInput formControlName="telephone" placeholder="Ex: 0612345678">
                  <mat-error *ngIf="basicInfoForm.get('telephone')?.hasError('pattern')">
                    Format de téléphone invalide
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Date de naissance</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="dateNaissance">
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Adresse</mat-label>
                  <input matInput formControlName="adresse">
                </mat-form-field>
              </div>

              <div class="button-row">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Précédent
                </button>
                <button mat-button matStepperNext color="primary" [disabled]="basicInfoForm.invalid">
                  Suivant <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: CV Upload -->
          <mat-step [editable]="true">
            <ng-template matStepLabel>CV</ng-template>
            <div class="cv-upload-container">
              <h3>Téléchargez votre CV</h3>
              <p>Veuillez télécharger votre CV au format PDF (10 Mo max)</p>

              <div class="upload-area" 
                   (dragover)="onDragOver($event)" 
                   (dragleave)="onDragLeave($event)" 
                   (drop)="onFileDrop($event)"
                   [class.drag-over]="isDragOver">
                <mat-icon>cloud_upload</mat-icon>
                <p>Glissez votre CV ici ou</p>
                <button mat-raised-button color="primary" (click)="triggerFileInput()">
                  Parcourir
                </button>
                <input type="file" #fileInput hidden (change)="onFileSelected($event)" accept=".pdf">
              </div>

              <div *ngIf="selectedFile" class="selected-file">
                <mat-icon>insert_drive_file</mat-icon>
                <span>{{ selectedFile.name }}</span>
                <button mat-icon-button color="warn" (click)="removeSelectedFile()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <mat-progress-bar *ngIf="uploadProgress > 0" 
                               [value]="uploadProgress"
                               class="upload-progress"></mat-progress-bar>

              <div class="button-row">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Précédent
                </button>
                <button mat-raised-button color="primary" 
                        (click)="completeProfile()"
                        [disabled]="!selectedFile && !uploadProgress">
                  Terminer
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .welcome-dialog {
      max-width: 800px;
    }
    
    .dialog-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    h2 {
      margin-bottom: 8px;
      color: #2c3e50;
    }
    
    .subtitle {
      color: #7f8c8d;
      margin: 0 0 20px;
    }
    
    /* Introduction slide styles */
    .intro-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 16px 0;
    }
    
    .intro-image {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      overflow: hidden;
    }
    
    .welcome-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.5s ease;
    }
    
    .welcome-image:hover {
      transform: scale(1.05);
    }
    
    .image-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .pulse-circle {
      position: absolute;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: rgba(65, 105, 225, 0.2);
      animation: pulse 2s infinite;
    }
    
    .delay-1 {
      animation-delay: 0.5s;
    }
    
    .delay-2 {
      animation-delay: 1s;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      70% {
        transform: scale(1.2);
        opacity: 0;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
    
    .intro-text {
      padding: 0 16px;
    }
    
    .intro-text h3 {
      color: #2c3e50;
      margin-bottom: 16px;
    }
    
    .intro-text p {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .intro-text mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }
    
    /* Form styles */
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    
    .form-row mat-form-field {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
    }
    
    .button-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      gap: 10px;
    }
    
    .cv-upload-container {
      padding: 20px 0;
    }
    
    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      margin: 20px 0;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .upload-area mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #4169E1;
      margin-bottom: 16px;
    }
    
    .upload-area p {
      margin-bottom: 16px;
      color: #666;
    }
    
    .drag-over {
      border-color: #4169E1;
      background-color: rgba(65, 105, 225, 0.05);
    }
    
    .selected-file {
      display: flex;
      align-items: center;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin: 16px 0;
    }
    
    .selected-file mat-icon {
      color: #4169E1;
      margin-right: 8px;
    }
    
    .selected-file span {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .upload-progress {
      margin: 16px 0;
    }
    
    /* Responsive styles */
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .intro-image {
        height: 150px;
      }
    }
  `]
})
export class SecretaryWelcomeDialogComponent implements OnInit {
  basicInfoForm!: FormGroup;
  selectedFile?: File;
  uploadProgress = 0;
  isDragOver = false;
  currentStep = 0;
  
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('stepper') stepper: any;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SecretaryWelcomeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const user = this.data.user;
    
    this.basicInfoForm = this.fb.group({
      prenom: [user?.prenom || '', Validators.required],
      nom: [user?.nom || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      telephone: [user?.phoneNumber || '', [Validators.pattern('^[0-9+]{8,}$')]],
      adresse: [user?.address || ''],
      dateNaissance: [user?.dateNaissance ? new Date(user.dateNaissance) : null]
    });
  }

  goToIntroduction(): void {
    if (this.stepper) {
      this.stepper.selectedIndex = 0;
      this.currentStep = 0;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Check if the file is a PDF
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Seuls les fichiers PDF sont acceptés', 'Fermer', {
        duration: 3000
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('La taille du fichier doit être inférieure à 10 Mo', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.selectedFile = file;
  }

  removeSelectedFile(): void {
    this.selectedFile = undefined;
    this.uploadProgress = 0;
  }

  completeProfile(): void {
    if (this.basicInfoForm.invalid) {
      this.snackBar.open('Veuillez compléter correctement les informations personnelles', 'Fermer', {
        duration: 3000
      });
      return;
    }

    // First update the profile information
    const profileData: Partial<UserProfile> = {
      prenom: this.basicInfoForm.value.prenom,
      nom: this.basicInfoForm.value.nom,
      email: this.basicInfoForm.value.email,
      phoneNumber: this.basicInfoForm.value.telephone,
      address: this.basicInfoForm.value.adresse,
      dateNaissance: this.basicInfoForm.value.dateNaissance
    };
    
    this.profileService.updateProfile(profileData).subscribe({
      next: () => {
        // After profile update, upload the CV if selected
        if (this.selectedFile) {
          this.uploadCV();
        } else {
          this.snackBar.open('Veuillez télécharger votre CV', 'Fermer', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', {
          duration: 5000
        });
      }
    });
  }

  uploadCV(): void {
    if (!this.selectedFile) {
      return;
    }

    this.profileService.uploadCV(this.selectedFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('CV téléchargé avec succès', 'Fermer', {
            duration: 3000
          });
          this.closeDialog(true);
        }
      },
      error: (error) => {
        console.error('Error uploading CV:', error);
        this.snackBar.open('Erreur lors du téléchargement du CV', 'Fermer', {
          duration: 5000
        });
      }
    });
  }

  closeDialog(success: boolean = false): void {
    this.dialogRef.close(success);
  }

  onStepChange(event: StepperSelectionEvent): void {
    this.currentStep = event.selectedIndex;
  }
} 