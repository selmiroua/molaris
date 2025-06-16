import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientService, FichePatient } from '../../core/services/patient.service';

@Component({
  selector: 'app-create-fiche-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <h1 class="dialog-title">FICHE PATIENT</h1>

      <div class="dialog-scroll-container">
        <form [formGroup]="ficheForm" (ngSubmit)="saveFiche()">
          <div class="form-content">
            <div class="form-section">
              <div class="form-row">
                <div class="form-group">
                  <label>Date de naissance</label>
                  <mat-form-field appearance="outline" class="full-width">
                    <input 
                      matInput 
                      [matDatepicker]="picker" 
                      formControlName="dateNaissance" 
                      placeholder="JJ/MM/AAAA">
                    <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                  </mat-form-field>
                </div>
                
                <div class="form-group">
                  <label>Gender</label>
                  <div class="radio-group modern">
                    <div class="radio-option">
                      <input type="radio" id="male" formControlName="sexe" value="M">
                      <label for="male">Male</label>
                    </div>
                    <div class="radio-option">
                      <input type="radio" id="female" formControlName="sexe" value="F">
                      <label for="female">Female</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-row">
                <div class="form-group">
                  <label>Profession</label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </span>
                    <input type="text" formControlName="profession" placeholder="Votre profession">
                  </div>
                </div>
                
                <div class="form-group">
                  <label>État général</label>
                  <div class="select-container">
                    <select formControlName="etatGeneral">
                      <option value="" disabled selected>Sélectionnez votre état</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Bon">Bon</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Mauvais">Mauvais</option>
                    </select>
                    <div class="select-arrow">▼</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-row">
                <div class="form-group">
                  <label>Numéro de téléphone</label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </span>
                    <input type="tel" formControlName="telephone" placeholder="+216 ...">
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Adresse de résidence</label>
                  <div class="input-with-icon">
                    <span class="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </span>
                    <input type="text" formControlName="adresse" placeholder="Votre adresse de résidence">
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-group full-width">
                <label>Antécédents chirurgicaux</label>
                <textarea formControlName="antecedentsChirurgicaux" rows="4" placeholder="Décrivez vos antécédents chirurgicaux si applicable..."></textarea>
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-group">
                <div class="section-title">
                  <label>Prise de médicaments</label>
                </div>
                <div class="radio-group modern">
                  <div class="radio-option">
                    <input type="radio" id="medicationsYes" formControlName="priseMedicamentsOption" value="Oui">
                    <label for="medicationsYes">Oui</label>
                  </div>
                  <div class="radio-option">
                    <input type="radio" id="medicationsNo" formControlName="priseMedicamentsOption" value="Non" checked>
                    <label for="medicationsNo">Non</label>
                  </div>
                </div>
                
                <!-- Conditional field for medications -->
                <div *ngIf="ficheForm.get('priseMedicamentsOption')?.value === 'Oui'" class="conditional-field">
                  <textarea 
                    formControlName="priseMedicaments" 
                    placeholder="Précisez les médicaments que vous prenez" 
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-group full-width">
                <div class="section-title">
                  <label>Allergies</label>
                </div>
                
                <div class="allergies-container">
                  <div class="allergy-item">
                    <label>Latex</label>
                    <div class="radio-group modern">
                      <div class="radio-option">
                        <input type="radio" id="latexYes" formControlName="allergyLatex" value="Oui">
                        <label for="latexYes">Oui</label>
                      </div>
                      <div class="radio-option">
                        <input type="radio" id="latexNo" formControlName="allergyLatex" value="Non" checked>
                        <label for="latexNo">Non</label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="allergy-item">
                    <label>Pénicilline</label>
                    <div class="radio-group modern">
                      <div class="radio-option">
                        <input type="radio" id="penicillinYes" formControlName="allergyPenicillin" value="Oui">
                        <label for="penicillinYes">Oui</label>
                      </div>
                      <div class="radio-option">
                        <input type="radio" id="penicillinNo" formControlName="allergyPenicillin" value="Non" checked>
                        <label for="penicillinNo">Non</label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="allergy-item">
                    <label>Anesthésiques locaux</label>
                    <div class="radio-group modern">
                      <div class="radio-option">
                        <input type="radio" id="anestheticsYes" formControlName="allergyAnesthetics" value="Oui">
                        <label for="anestheticsYes">Oui</label>
                      </div>
                      <div class="radio-option">
                        <input type="radio" id="anestheticsNo" formControlName="allergyAnesthetics" value="Non" checked>
                        <label for="anestheticsNo">Non</label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="allergy-item">
                    <label>Iode</label>
                    <div class="radio-group modern">
                      <div class="radio-option">
                        <input type="radio" id="iodineYes" formControlName="allergyIodine" value="Oui">
                        <label for="iodineYes">Oui</label>
                      </div>
                      <div class="radio-option">
                        <input type="radio" id="iodineNo" formControlName="allergyIodine" value="Non" checked>
                        <label for="iodineNo">Non</label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="allergy-item">
                    <label>Métaux (ex: nickel)</label>
                    <div class="radio-group modern">
                      <div class="radio-option">
                        <input type="radio" id="metalsYes" formControlName="allergyMetals" value="Oui">
                        <label for="metalsYes">Oui</label>
                      </div>
                      <div class="radio-option">
                        <input type="radio" id="metalsNo" formControlName="allergyMetals" value="Non" checked>
                        <label for="metalsNo">Non</label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="allergy-item">
                    <label>Autre</label>
                    <div class="radio-group modern">
                      <div class="radio-option">
                        <input type="radio" id="otherAllergiesYes" formControlName="allergyOther" value="Oui">
                        <label for="otherAllergiesYes">Oui</label>
                      </div>
                      <div class="radio-option">
                        <input type="radio" id="otherAllergiesNo" formControlName="allergyOther" value="Non" checked>
                        <label for="otherAllergiesNo">Non</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Conditional field for other allergies -->
                <div *ngIf="ficheForm.get('allergyOther')?.value === 'Oui'" class="conditional-field">
                  <textarea 
                    formControlName="otherAllergiesText" 
                    placeholder="Précisez vos autres allergies" 
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="form-group full-width">
                <div class="section-title">
                  <label>Documents & Radiographies</label>
                </div>
                <div class="file-upload" (click)="fileInput.click()">
                  <input type="file" #fileInput style="display:none" multiple (change)="onFileSelected($event)">
                  <mat-icon>cloud_upload</mat-icon>
                  <p>Cliquez ou glissez vos fichiers ici</p>
                  <p class="file-type">Images, radiographies, PDF (Max 10MB)</p>
                  <div *ngIf="selectedFiles.length > 0" class="selected-files">
                    <div *ngFor="let file of selectedFiles" class="file-item">
                      <span>{{file.name}}</span>
                      <button type="button" class="remove-file" (click)="removeFile($event, file)">×</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="dialogRef.close()" [disabled]="saving">
              <span>Précédent</span>
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving || ficheForm.invalid">
              <span>{{ saving ? 'Enregistrement...' : 'Terminer' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 650px;
      font-family: 'Roboto', sans-serif;
      background-color: white;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .dialog-title {
      font-size: 24px;
      color: #2e3d54;
      font-weight: 600;
      margin: 0;
      padding: 24px 0;
      text-align: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.07);
      flex-shrink: 0;
      background: linear-gradient(to right, #f8f9ff, #ffffff);
    }
    
    .dialog-scroll-container {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: calc(90vh - 70px);
      scrollbar-width: thin;
      scrollbar-color: #c1c1c1 #f1f1f1;
      background-color: #fafbfc;
    }
    
    .dialog-scroll-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .dialog-scroll-container::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    .dialog-scroll-container::-webkit-scrollbar-thumb {
      background-color: #c1c1c1;
      border-radius: 10px;
      border: 2px solid #f1f1f1;
    }
    
    form {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .form-content {
      padding: 0;
    }
    
    .form-section {
      background-color: white;
      margin: 16px;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
      transition: box-shadow 0.3s ease;
    }
    
    .form-section:hover {
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    }
    
    .section-title {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f5;
    }
    
    .section-title label {
      color: #4e5eeb;
      font-weight: 600;
      font-size: 16px;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 10px;
      }
    }
    
    .form-group {
      flex: 1;
      margin-bottom: 0;
    }
    
    .full-width {
      width: 100%;
    }
    
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
      transition: color 0.2s ease;
    }
    
    .form-group:hover label {
      color: #4e5eeb;
    }
    
    input[type="text"],
    input[type="tel"],
    textarea,
    select {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #e0e4f0;
      border-radius: 8px;
      font-size: 14px;
      color: #333;
      background-color: white;
      transition: all 0.2s ease;
    }
    
    input[type="text"]:focus,
    input[type="tel"]:focus,
    textarea:focus,
    select:focus {
      border-color: #4e5eeb;
      box-shadow: 0 0 0 3px rgba(78, 94, 235, 0.1);
      outline: none;
    }
    
    input[type="text"]::placeholder,
    input[type="tel"]::placeholder,
    textarea::placeholder {
      color: #a0a8ba;
    }
    
    .date-input-container {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    
    .date-input-container input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #e0e4f0;
      border-radius: 8px;
      font-size: 14px;
      color: #333;
      background-color: white;
      transition: all 0.2s ease;
    }
    
    .date-input-container input:focus {
      border-color: #4e5eeb;
      box-shadow: 0 0 0 3px rgba(78, 94, 235, 0.1);
      outline: none;
    }
    
    .date-picker-button {
      position: absolute !important;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }
    
    .input-with-icon {
      position: relative;
    }
    
    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #a0a8ba;
      transition: color 0.2s ease;
    }
    
    .input-with-icon input {
      padding-left: 40px;
    }
    
    .input-with-icon:focus-within .input-icon {
      color: #4e5eeb;
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
      line-height: 1.5;
    }
    
    .select-container {
      position: relative;
    }
    
    .select-container select {
      appearance: none;
      width: 100%;
      padding-right: 30px;
      cursor: pointer;
    }
    
    .select-arrow {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      font-size: 10px;
      color: #a0a8ba;
      transition: color 0.2s ease;
    }
    
    .select-container:hover .select-arrow {
      color: #4e5eeb;
    }
    
    .radio-group {
      display: flex;
      gap: 20px;
    }
    
    .radio-group.modern {
      background-color: #f5f7fe;
      display: inline-flex;
      border-radius: 8px;
      padding: 2px;
      gap: 0;
    }
    
    .radio-option {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .radio-group.modern .radio-option {
      position: relative;
      margin: 0;
      z-index: 1;
    }
    
    .radio-group.modern .radio-option label {
      margin: 0;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }
    
    .radio-group.modern .radio-option input[type="radio"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .radio-group.modern .radio-option input[type="radio"]:checked + label {
      background-color: #4e5eeb;
      color: white;
    }
    
    .radio-option input[type="radio"] {
      position: relative;
      width: 18px;
      height: 18px;
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
      border: 2px solid #ddd;
      border-radius: 50%;
    }
    
    .radio-option input[type="radio"]:checked {
      border-color: #4e5eeb;
    }
    
    .radio-option input[type="radio"]:checked:after {
      content: '';
      width: 10px;
      height: 10px;
      background: #4e5eeb;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
    }
    
    .allergies-container {
      background-color: #fafbfd;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 10px;
    }
    
    .allergy-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    
    .allergy-item:nth-child(odd) {
      background-color: rgba(241, 243, 255, 0.4);
    }
    
    .allergy-item label {
      margin-bottom: 0;
      flex: 1;
      font-weight: normal;
    }
    
    .allergy-item .radio-group {
      min-width: 140px;
    }
    
    .conditional-field {
      margin-top: 10px;
      padding: 15px;
      border-radius: 8px;
      background-color: #f8f9ff;
      border-left: 3px solid #4e5eeb;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .file-upload {
      border: 2px dashed #d2d7e5;
      border-radius: 10px;
      padding: 30px 20px;
      text-align: center;
      margin-top: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #fafbfd;
    }
    
    .file-upload:hover {
      border-color: #4e5eeb;
      background-color: #f5f7fe;
    }
    
    .file-upload mat-icon {
      font-size: 36px;
      height: 36px;
      width: 36px;
      margin-bottom: 15px;
      color: #4e5eeb;
    }
    
    .file-upload p {
      margin: 5px 0;
      color: #666;
    }
    
    .file-type {
      font-size: 12px;
      color: #999 !important;
    }
    
    .selected-files {
      margin-top: 15px;
      text-align: left;
      border-top: 1px solid #e0e4f0;
      padding-top: 10px;
    }
    
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f5f7fe;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .remove-file {
      background-color: #f1f3fa;
      color: #666;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      transition: all 0.2s ease;
    }
    
    .remove-file:hover {
      background-color: #ff4d4f;
      color: white;
    }
    
    .form-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px;
      background-color: white;
      margin-top: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.07);
    }
    
    .btn-primary,
    .btn-secondary {
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-primary {
      background-color: #4e5eeb;
      color: white;
      box-shadow: 0 4px 10px rgba(78, 94, 235, 0.2);
    }
    
    .btn-secondary {
      background-color: #f1f3fa;
      color: #5e6278;
    }
    
    .btn-primary:hover {
      background-color: #3b4cd6;
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(78, 94, 235, 0.25);
    }
    
    .btn-secondary:hover {
      background-color: #e5e7f0;
      transform: translateY(-1px);
    }
    
    .btn-primary:active, 
    .btn-secondary:active {
      transform: translateY(1px);
    }
    
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }
    
    ::ng-deep .mat-form-field-appearance-outline .mat-form-field-outline {
      color: #e0e4f0;
    }
    
    ::ng-deep .mat-form-field-appearance-outline.mat-focused .mat-form-field-outline {
      color: #4e5eeb;
    }
    
    ::ng-deep .mat-form-field-appearance-outline .mat-form-field-infix {
      padding: 0.5em 0;
    }
  `]
})
export class CreateFicheDialogComponent implements OnInit {
  ficheForm: FormGroup;
  saving = false;
  selectedFiles: File[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  constructor(
    public dialogRef: MatDialogRef<CreateFicheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {patientId: number, nom?: string, prenom?: string},
    private fb: FormBuilder,
    private patientService: PatientService,
    private snackBar: MatSnackBar
  ) {
    this.ficheForm = this.fb.group({
      nom: [data.nom || ''],
      prenom: [data.prenom || ''],
      dateNaissance: ['', Validators.required],
      sexe: ['', Validators.required],
      profession: ['', Validators.required],
      telephone: ['', Validators.required],
      adresse: ['', Validators.required],
      etatGeneral: ['', Validators.required],
      antecedentsChirurgicaux: [''],
      priseMedicamentsOption: ['Non'],
      priseMedicaments: [''],
      allergyLatex: ['Non'],
      allergyPenicillin: ['Non'],
      allergyAnesthetics: ['Non'],
      allergyIodine: ['Non'],
      allergyMetals: ['Non'],
      allergyOther: ['Non'],
      otherAllergiesText: [''],
      allergies: ['']
    });

    // Add value change listeners to show/hide conditional fields
    this.ficheForm.get('priseMedicamentsOption')?.valueChanges.subscribe(value => {
      if (value === 'Non') {
        this.ficheForm.get('priseMedicaments')?.setValue('');
      }
    });

    this.ficheForm.get('allergyOther')?.valueChanges.subscribe(value => {
      if (value === 'Non') {
        this.ficheForm.get('otherAllergiesText')?.setValue('');
      }
    });
  }
  
  ngOnInit(): void {}
  
  saveFiche(): void {
    if (this.ficheForm.invalid) return;
    
    this.saving = true;
    
    // Format allergies as a combined string
    const allergiesArray = [];
    if (this.ficheForm.value.allergyLatex === 'Oui') allergiesArray.push('Latex');
    if (this.ficheForm.value.allergyPenicillin === 'Oui') allergiesArray.push('Pénicilline');
    if (this.ficheForm.value.allergyAnesthetics === 'Oui') allergiesArray.push('Anesthésiques locaux');
    if (this.ficheForm.value.allergyIodine === 'Oui') allergiesArray.push('Iode');
    if (this.ficheForm.value.allergyMetals === 'Oui') allergiesArray.push('Métaux (ex: nickel)');
    
    // Add the "other allergies" text if specified
    if (this.ficheForm.value.allergyOther === 'Oui' && this.ficheForm.value.otherAllergiesText) {
      allergiesArray.push(`Autre: ${this.ficheForm.value.otherAllergiesText}`);
    } else if (this.ficheForm.value.allergyOther === 'Oui') {
      allergiesArray.push('Autre');
    }
    
    const formData = {
      ...this.ficheForm.value,
      allergies: allergiesArray.length > 0 ? allergiesArray.join(', ') : 'Aucune allergie connue',
      priseMedicaments: this.ficheForm.value.priseMedicamentsOption === 'Oui' 
        ? this.ficheForm.value.priseMedicaments 
        : 'Aucune prise de médicaments'
    };
    
    // Calculate age from dateNaissance and format the date for backend
    if (formData.dateNaissance) {
      const birthDate = new Date(formData.dateNaissance);
      
      // Calculate age
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      
      // If birthday hasn't occurred yet this year, subtract 1 from age
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      formData.age = age;
      
      // Format date for database (YYYY-MM-DD format for Java LocalDate)
      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');
      formData.date_naissance = `${year}-${month}-${day}`; // This matches the format Java's LocalDate expects
      
      console.log('Date of birth:', formData.date_naissance);
      console.log('Calculated age from birthdate:', age);
    }
    
    // Remove temporary form fields that aren't part of the backend model
    delete formData.priseMedicamentsOption;
    delete formData.allergyLatex;
    delete formData.allergyPenicillin;
    delete formData.allergyAnesthetics;
    delete formData.allergyIodine;
    delete formData.allergyMetals;
    delete formData.allergyOther;
    delete formData.otherAllergiesText;
    
    // Keep date_naissance but remove dateNaissance (frontend field name)
    delete formData.dateNaissance;
    
    const fichePatient: FichePatient = {
      ...formData,
      patientId: this.data.patientId
    };
    
    console.log('Sending patient fiche data:', fichePatient);
    
    // Check if there are files to upload
    if (this.selectedFiles.length > 0) {
      console.log('Uploading files with patient fiche:', this.selectedFiles);
      
      // Create FormData for multipart upload
      const formDataObj = new FormData();
      
      // Add the JSON data as a string with proper content type
      const ficheBlob = new Blob([JSON.stringify(fichePatient)], {
        type: 'application/json'
      });
      formDataObj.append('fichePatient', ficheBlob);
      
      // Add files one by one with proper names
      this.selectedFiles.forEach((file, index) => {
        formDataObj.append('files', file, file.name);
        console.log(`Appending file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      });
      
      // Call the service method that handles file uploads with a longer timeout
      this.patientService.createOrUpdateFicheWithFiles(this.data.patientId, formDataObj).subscribe({
        next: (createdFiche) => {
          this.saving = false;
          this.snackBar.open('Fiche patient avec documents créée avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(createdFiche);
        },
        error: (error) => {
          this.saving = false;
          console.error('Error creating fiche with files:', error);
          this.snackBar.open(`Erreur lors de la création de la fiche patient avec documents: ${error.message || 'Erreur inconnue'}`, 'Fermer', { duration: 5000 });
        }
      });
    } else {
      // No files to upload, use the standard method
      this.patientService.createOrUpdateFiche(this.data.patientId, fichePatient).subscribe({
        next: (createdFiche) => {
          this.saving = false;
          this.snackBar.open('Fiche patient créée avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(createdFiche);
        },
        error: (error) => {
          this.saving = false;
          console.error('Error creating fiche:', error);
          this.snackBar.open('Erreur lors de la création de la fiche patient', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  // Add file handling methods
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const fileList: FileList | null = element.files;
    
    if (fileList) {
      // Convert FileList to Array
      const newFiles = Array.from(fileList);
      
      // Check file size and type
      const validFiles = newFiles.filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (file.size > maxSize) {
          this.snackBar.open(`Le fichier ${file.name} dépasse la taille maximale de 10MB`, 'Fermer', { duration: 3000 });
          return false;
        }
        
        if (!validTypes.includes(file.type)) {
          this.snackBar.open(`Le type de fichier ${file.name} n'est pas supporté`, 'Fermer', { duration: 3000 });
          return false;
        }
        
        return true;
      });
      
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    }
    
    // Reset input so the same file can be selected again
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  
  removeFile(event: Event, file: File): void {
    event.stopPropagation(); // Prevent triggering the file input click
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }
} 