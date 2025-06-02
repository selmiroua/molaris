import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { DoctorService } from '../../core/services/doctor.service';
import { SecretaryService } from '../../core/services/secretary.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DoctorApplicationService } from '../../core/services/doctor-application.service';
import { DoctorApplication } from '../../core/models/doctor-application.model';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { CvViewerDialogComponent } from '../../shared/cv-viewer-dialog/cv-viewer-dialog.component';

@Component({
  selector: 'app-doctor-application',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="application-container">
      <h2>Postuler pour travailler avec un médecin</h2>
      
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <ng-container *ngIf="!loading">
        <div *ngIf="secretaryStatus === 'APPROVED'" class="already-assigned">
          <mat-card>
            <mat-card-content>
              <mat-icon class="success-icon">check_circle</mat-icon>
              <h3>Vous êtes déjà assigné(e) à un médecin</h3>
              <p>Vous travaillez actuellement avec Dr. {{assignedDoctor?.prenom}} {{assignedDoctor?.nom}}</p>
            </mat-card-content>
          </mat-card>
        </div>
        
        <div *ngIf="secretaryStatus === 'PENDING'" class="pending-application">
          <mat-card>
            <mat-card-content>
              <mat-icon class="pending-icon">pending</mat-icon>
              <h3>Votre candidature est en attente</h3>
              <p>Vous avez postulé pour travailler avec Dr. {{assignedDoctor?.prenom}} {{assignedDoctor?.nom}}</p>
              <p>Veuillez attendre que le médecin examine votre candidature.</p>
            </mat-card-content>
          </mat-card>
        </div>
        
        <div *ngIf="secretaryStatus === 'REJECTED'" class="rejected-application">
          <mat-card>
            <mat-card-content>
              <mat-icon class="rejected-icon">cancel</mat-icon>
              <h3>Votre candidature a été refusée</h3>
              <p>Votre précédente candidature n'a pas été approuvée.</p>
              <p>Vous pouvez postuler pour travailler avec un autre médecin.</p>
            </mat-card-content>
          </mat-card>
        </div>
        
        <ng-container *ngIf="secretaryStatus === 'NONE' || secretaryStatus === 'REJECTED'">
          <div class="doctor-list">
            <h3>Médecins disponibles</h3>
            
            <div *ngIf="doctors.length === 0" class="no-doctors">
              <p>Aucun médecin disponible n'a été trouvé dans la base de données.</p>
              <p class="secondary-message">Seuls les médecins qui ne sont pas déjà assignés à un secrétaire sont affichés.</p>
            </div>
            
            <div class="doctors-grid">
              <mat-card *ngFor="let doctor of doctors" class="doctor-card">
                <mat-card-header>
                  <div mat-card-avatar class="doctor-avatar">
                    <mat-icon>person</mat-icon>
                  </div>
                  <mat-card-title>Dr. {{doctor.prenom}} {{doctor.nom}}</mat-card-title>
                  <mat-card-subtitle *ngIf="doctor.specialities && doctor.specialities.length">
                    {{doctor.specialities.join(', ')}}
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <p *ngIf="doctor.email"><strong>Email:</strong> {{doctor.email}}</p>
                  <p *ngIf="doctor.phoneNumber"><strong>Téléphone:</strong> {{doctor.phoneNumber}}</p>
                </mat-card-content>
                
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="openApplicationForm(doctor)">
                    Postuler
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </ng-container>
        
        <div *ngIf="selectedDoctor" class="application-form">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Postuler auprès de Dr. {{selectedDoctor.prenom}} {{selectedDoctor.nom}}</mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <form [formGroup]="applicationForm" (ngSubmit)="onSubmit()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Message au médecin</mat-label>
                  <textarea matInput formControlName="message" rows="4" 
                    placeholder="Expliquez pourquoi vous souhaiteriez travailler avec ce médecin"></textarea>
                  <mat-error *ngIf="applicationForm.get('message')?.invalid && applicationForm.get('message')?.touched">
                    {{ getMessageErrorText() }}
                  </mat-error>
                  <mat-hint align="end">{{ getMessageRemainingChars() }} caractères restants</mat-hint>
                </mat-form-field>
                
                <div class="file-upload">
                  <h4>Télécharger votre CV (Optionnel)</h4>
                  <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf,.doc,.docx">
                  <p *ngIf="selectedFile" class="selected-file">
                    Sélectionné: {{fileName}}
                  </p>
                </div>
                
                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelApplication()">
                    Annuler
                  </button>
                  <button mat-raised-button color="primary" type="submit" 
                    [disabled]="submitting || !applicationForm.valid">
                    {{ submitting ? 'Soumission en cours...' : 'Soumettre la candidature' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .application-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h2 {
      margin-bottom: 24px;
      color: #333;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
    
    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .doctor-card {
      height: 100%;
    }
    
    .doctor-avatar {
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .application-form {
      margin-top: 30px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .file-upload {
      margin: 20px 0;
    }
    
    .selected-file {
      margin-top: 8px;
      font-style: italic;
      color: #666;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .already-assigned, .pending-application, .rejected-application {
      text-align: center;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .success-icon {
      color: #4caf50;
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
    
    .pending-icon {
      color: #ff9800;
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
    
    .rejected-icon {
      color: #f44336;
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
    
    .no-doctors {
      text-align: center;
      color: #666;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .secondary-message {
      color: #999;
      font-size: 0.9rem;
      margin-top: 10px;
    }
  `]
})
export class DoctorApplicationComponent implements OnInit {
  loading = true;
  submitting = false;
  applicationForm: FormGroup;
  doctors: User[] = [];
  selectedDoctor: User | null = null;
  selectedFile: File | null = null;
  fileName = '';
  secretaryStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NONE' | null = null;
  assignedDoctor: User | null = null;
  application: DoctorApplication | null = null;
  
  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private doctorService: DoctorService,
    private secretaryService: SecretaryService,
    private applicationService: DoctorApplicationService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    this.applicationForm = this.fb.group({
      doctorId: [null, Validators.required],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }
  
  ngOnInit(): void {
    this.loadData();
  }
  
  private loadData(): void {
    this.loading = true;
    console.log('Chargement des données de candidature au médecin...');
    
    // First check secretary status to decide if we should redirect
    this.secretaryService.getSecretaryStatus()
      .pipe(
        tap((response: any) => {
          console.log('Statut du secrétaire reçu:', response);
          if (response && typeof response.status === 'string') {
            this.secretaryStatus = response.status as 'APPROVED' | 'PENDING' | 'REJECTED' | 'NONE';
            
            // If the secretary is already approved or has a pending application, redirect to dashboard
            if (this.secretaryStatus === 'APPROVED' || this.secretaryStatus === 'PENDING') {
              console.log(`Secrétaire avec statut ${this.secretaryStatus}, redirection vers le dashboard`);
              this.snackBar.open(`Vous avez déjà ${this.secretaryStatus === 'APPROVED' ? 'un médecin assigné' : 'une candidature en attente'}.`, 'Fermer', {
                duration: 3000
              });
              this.router.navigate(['/dashboard/secretaire']);
              return;
            }
            
            // If we haven't redirected, load the doctors and application data
            this.loadAvailableDoctors();
            this.loadCurrentApplication();
          }
        }),
        catchError((error: any) => {
          console.error('Erreur lors du chargement du statut du secrétaire:', error);
          this.snackBar.open('Erreur lors du chargement du statut du secrétaire: ' + error.message, 'Fermer', {
            duration: 5000
          });
          this.loading = false;
          return of(null);
        })
      )
      .subscribe();
  }
  
  // Separate method to load current application
  private loadCurrentApplication(): void {
    this.applicationService.getCurrentApplication().subscribe({
      next: (application: DoctorApplication | null) => {
        console.log('Données de candidature reçues:', application);
        this.application = application;
        if (application) {
          this.applicationForm.patchValue({
            doctorId: application.doctorId,
            message: application.message
          });
          
          if (application.status !== 'pending') {
            this.applicationForm.disable();
          }
        }
        
        // Set loading to false after application is loaded
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de la candidature:', error);
        this.loading = false;
      }
    });
  }
  
  loadAvailableDoctors(): void {
    console.log('Chargement des médecins disponibles depuis la base de données...');
    this.doctors = []; // Reset doctors array
    this.loading = true;
    
    this.doctorService.getAvailableDoctors()
      .pipe(
        tap((doctors: User[]) => {
          console.log('Médecins reçus de la base de données:', doctors);
          this.doctors = doctors;
          
          // Notify user if no doctors are available
          if (doctors.length === 0) {
            console.log('Aucun médecin disponible trouvé dans la base de données.');
          } else {
            console.log(`${doctors.length} médecins disponibles trouvés.`);
          }
        }),
        catchError((error: any) => {
          console.error('Erreur lors du chargement des médecins:', error);
          this.snackBar.open('Erreur lors du chargement des médecins. Veuillez réessayer plus tard.', 'Fermer', {
            duration: 5000
          });
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }
  
  openApplicationForm(doctor: User): void {
    this.selectedDoctor = doctor;
    
    // First reset the form completely to clear all values and validators
    this.applicationForm.reset();
    
    // Then set the values explicitly
    this.applicationForm.get('doctorId')?.setValue(doctor.id);
    this.applicationForm.get('message')?.setValue('');
    
    console.log('Opening application form for doctor ID:', doctor.id);
    console.log('Form value after reset:', this.applicationForm.value);
    console.log('Form validity:', this.applicationForm.valid);
    console.log('doctorId value:', this.applicationForm.get('doctorId')?.value);
    
    this.selectedFile = null;
    this.fileName = '';
    console.log('Application form initialized with doctor:', doctor);
  }
  
  cancelApplication(): void {
    this.selectedDoctor = null;
  }
  
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
      this.fileName = this.selectedFile.name;
      
      console.log('File selected:', this.fileName);
      
      // Check file size (max 5MB)
      if (this.selectedFile.size > 5 * 1024 * 1024) {
        this.snackBar.open('La taille du fichier dépasse la limite de 5MB', 'Fermer', {
          duration: 5000
        });
        this.selectedFile = null;
        this.fileName = '';
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(this.selectedFile.type)) {
        this.snackBar.open('Seuls les documents PDF et Word sont autorisés', 'Fermer', {
          duration: 5000
        });
        this.selectedFile = null;
        this.fileName = '';
      }
    }
  }
  
  clearFile(): void {
    this.selectedFile = null;
  }
  
  onSubmit(): void {
    console.log('Form submission triggered, form value:', this.applicationForm.value);
    console.log('Form validity:', this.applicationForm.valid);
    console.log('Form errors:', this.applicationForm.errors);
    console.log('Selected doctor:', this.selectedDoctor);
    
    // Output detailed control validation status
    console.log('doctorId valid:', this.applicationForm.get('doctorId')?.valid);
    console.log('doctorId value:', this.applicationForm.get('doctorId')?.value);
    console.log('doctorId errors:', this.applicationForm.get('doctorId')?.errors);
    
    console.log('message valid:', this.applicationForm.get('message')?.valid);
    console.log('message value:', this.applicationForm.get('message')?.value);
    console.log('message errors:', this.applicationForm.get('message')?.errors);
    
    // Mark form controls as touched to show validation errors
    this.applicationForm.markAllAsTouched();
    
    if (this.applicationForm.invalid) {
      console.log('Form is invalid, validation errors:', this.applicationForm.errors);
      console.log('Form controls status:', {
        doctorId: this.applicationForm.get('doctorId')?.errors,
        message: this.applicationForm.get('message')?.errors
      });
      this.snackBar.open('Veuillez corriger les erreurs dans le formulaire.', 'Fermer', {
        duration: 3000
      });
      return;
    }
    
    if (!this.selectedDoctor) {
      console.error('No doctor selected');
      this.snackBar.open('Erreur: Aucun médecin sélectionné.', 'Fermer', {
        duration: 3000
      });
      return;
    }
    
    this.submitting = true;
    const formValue = this.applicationForm.value;
    const doctorId = this.selectedDoctor.id;
    const message = formValue.message || '';
    
    console.log('Soumission de candidature:', {
      doctorId: doctorId,
      message: message,
      hasFile: !!this.selectedFile,
      selectedDoctor: this.selectedDoctor
    });
    
    const formData = new FormData();
    formData.append('doctorId', doctorId.toString());
    formData.append('message', message);
    if (this.selectedFile) {
      formData.append('cvFile', this.selectedFile);
    }
    
    this.applicationService.submitApplication(formData)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (response: DoctorApplication) => {
          console.log('Candidature soumise avec succès:', response);
          this.snackBar.open('Candidature soumise avec succès !', 'Fermer', {
            duration: 5000
          });
          this.application = response;
          this.applicationForm.disable();
          
          // Update status after successful application
          this.secretaryStatus = 'PENDING';
          
          // Hide the form
          this.selectedDoctor = null;
        },
        error: (error: any) => {
          console.error('Erreur lors de la soumission de candidature:', error);
          this.snackBar.open('Échec de la soumission de la candidature. Veuillez réessayer plus tard.', 'Fermer', {
            duration: 5000
          });
        }
      });
  }
  
  resetForm(): void {
    this.applicationForm.reset();
    this.selectedFile = null;
  }
  
  getMessageRemainingChars(): number {
    const maxLength = 500;
    const currentLength = this.applicationForm.get('message')?.value?.length || 0;
    return maxLength - currentLength;
  }
  
  getMessageErrorText(): string {
    const control = this.applicationForm.get('message');
    if (control?.hasError('required')) {
      return 'Veuillez saisir votre message de candidature';
    }
    if (control?.hasError('minlength')) {
      return 'Le message doit contenir au moins 10 caractères';
    }
    if (control?.hasError('maxlength')) {
      return 'Le message ne peut pas dépasser 500 caractères';
    }
    return '';
  }
  
  getStatusIcon(): string {
    if (!this.application) return '';
    
    switch (this.application.status) {
      case 'approved': return 'check_circle';
      case 'pending': return 'hourglass_empty';
      case 'rejected': return 'cancel';
      default: return '';
    }
  }
  
  getStatusMessage(): string {
    if (!this.application) return '';
    
    switch (this.application.status) {
      case 'approved': 
        return `Félicitations! Votre candidature pour travailler avec Dr. ${this.getDoctorName(this.application.doctorId)} a été approuvée.`;
      case 'pending': 
        return `Votre candidature pour travailler avec Dr. ${this.getDoctorName(this.application.doctorId)} est en cours d'examen.`;
      case 'rejected': 
        return `Malheureusement, votre candidature pour travailler avec Dr. ${this.getDoctorName(this.application.doctorId)} n'a pas été approuvée.`;
      default: 
        return '';
    }
  }
  
  getDoctorName(doctorId: number): string {
    const doctor = this.doctors.find(d => d.id == doctorId);
    return doctor ? `${doctor.prenom} ${doctor.nom}` : 'Unknown Doctor';
  }
} 