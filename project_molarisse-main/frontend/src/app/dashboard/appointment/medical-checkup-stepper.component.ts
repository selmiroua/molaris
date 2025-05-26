import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { BilanMedicalService } from '../../core/services/bilan-medical.service';
import { HttpClient } from '@angular/common/http';
import { PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-medical-checkup-stepper',
  template: `
    <div class="stepper-panel-modern">
      <div class="stepper-title-fixed">
        <h1 class="stepper-main-title">Bilan Médical</h1>
      </div>
      <div class="stepper-header-modern-fr">
        <div *ngFor="let step of steps; let i = index" class="step-modern-fr" [class.active]="i === currentStep" [class.completed]="i < currentStep">
          <div class="step-icon-modern-fr">
            <mat-icon [ngClass]="{
              'completed-icon': i < currentStep,
              'active-icon': i === currentStep,
              'upcoming-icon': i > currentStep
            }">{{ step.icon }}</mat-icon>
          </div>
          <div class="step-label-modern-fr">{{ step.label }}</div>
          <div *ngIf="i < steps.length - 1" class="step-progress-line"></div>
        </div>
      </div>
      <div class="info-alert-fr">
        <mat-icon>info</mat-icon>
        <span>Les données médicales sont basées sur le dernier contrôle, vous pouvez les mettre à jour.</span>
      </div>
      <div class="stepper-content-card">
        <ng-container *ngIf="currentStep === 0">
          <form [formGroup]="medicalDataForm">
            <div class="form-section no-bg">
              <label class="form-label">Tension artérielle</label>
              <div class="form-row">
                <mat-form-field appearance="fill" class="form-field" [ngClass]="getBpClass('systolic')">
                  <input matInput type="number" placeholder="Entrer la valeur" formControlName="bloodPressureSystolic" (input)="onBpInput()">
                  <span matSuffix>mm</span>
                </mat-form-field>
                <mat-form-field appearance="fill" class="form-field" [ngClass]="getBpClass('diastolic')">
                  <input matInput type="number" placeholder="Entrer la valeur" formControlName="bloodPressureDiastolic" (input)="onBpInput()">
                  <span matSuffix>hg</span>
                </mat-form-field>
              </div>
              <div *ngIf="bpMessage" class="bp-message" [ngClass]="bpStatus">{{ bpMessage }}</div>
            </div>

            <div class="form-section no-bg">
              <label class="form-label">Maladies particulières</label>
              <div class="checkbox-group simple-list">
                <div class="sickness-row"><mat-checkbox formControlName="heartDisease">Maladie cardiaque</mat-checkbox></div>
                <div class="sickness-row"><mat-checkbox formControlName="covid19">Covid-19</mat-checkbox></div>
                <div class="sickness-row"><mat-checkbox formControlName="haemophilia">Hémophilie</mat-checkbox></div>
                <div class="sickness-row"><mat-checkbox formControlName="hepatitis">Hépatite</mat-checkbox></div>
                <div class="sickness-row"><mat-checkbox formControlName="gastring">Gastrite</mat-checkbox></div>
                <div class="sickness-row"><mat-checkbox formControlName="otherDisease">Autre maladie</mat-checkbox>
                  <input *ngIf="medicalDataForm.get('otherDisease')?.value" matInput placeholder="Précisez l'autre maladie" formControlName="otherDiseaseText" class="autre-maladie-input" />
                </div>
              </div>
            </div>

            <!-- Wrap Allergies and Medicaments in a form-row for side-by-side layout -->
            <div class="form-row form-row-spacing-top">
              <div class="form-section no-bg form-col">
                <label class="form-label">Allergies</label>
                <mat-form-field appearance="outline" class="full-width clean-input">
                  <mat-label>Allergies connues</mat-label>
                  <textarea matInput formControlName="allergiesText" rows="3" placeholder="Décrivez les allergies..."></textarea>
                </mat-form-field>
              </div>

              <div class="form-section no-bg form-col">
                <label class="form-label">Prise Médicamenteuse</label>
                <mat-form-field appearance="outline" class="full-width clean-input">
                  <mat-label>Détails des médicaments</mat-label>
                  <textarea matInput formControlName="priseMedicaments" rows="3" placeholder="Médicaments pris..."></textarea>
                </mat-form-field>
              </div>
            </div>

          </form>

        </ng-container>

        <ng-container *ngIf="currentStep === 1">
          <ng-container *ngIf="currentSubStep2 === 1">
            <div class="cosmetic-stepper-header">
              <div class="cosmetic-stepper-steps-indicator">
                <span class="cosmetic-step-number" [ngClass]="{'green': isSubStep1(), 'grey': !isSubStep1()}">1</span>
                <span class="step-dash">—</span>
                <span class="cosmetic-step-number" [ngClass]="{'green': isSubStep2(), 'grey': !isSubStep2()}">2</span>
              </div>
              <div class="cosmetic-stepper-title">Service médical</div>
              <div class="cosmetic-stepper-subtitle">Sélectionnez les dents à problème</div>
            </div>
            <div class="tooth-chart-svg-wrapper">
              <svg viewBox="0 0 520 600" width="420" height="500" style="display:block;margin:auto;">
                <!-- Center cross -->
                <line x1="260" y1="100" x2="260" y2="500" stroke="#e5e7eb" stroke-width="1" />
                <line x1="80" y1="300" x2="440" y2="300" stroke="#e5e7eb" stroke-width="1" />
                <!-- Upper arch teeth -->
                <g>
                  <g *ngFor="let tooth of upperTeeth; let i = index">
                    <g [attr.transform]="getToothTransformArch(i, 'upper')" (mouseenter)="showToothInfo(tooth.num, $event)" (mouseleave)="hideToothInfo()">
                      <path [attr.d]="getToothPathByType(tooth.type)"
                            [attr.fill]="getToothFill(tooth.num)"
                            stroke="#666" stroke-width="1" class="tooth-shape"
                            (click)="onToothClick(tooth.num, getToothArchPosition(i, 'upper').x, getToothArchPosition(i, 'upper').y)" />
                      <path [attr.d]="getToothGrooveByType(tooth.type)" stroke="#999" stroke-width="0.6" fill="none" />
                    </g>
                    <text [attr.x]="getToothNumberArch(i, 'upper').x" [attr.y]="getToothNumberArch(i, 'upper').y" font-size="12" fill="#666" text-anchor="middle" style="font-weight: 400;">{{tooth.num}}</text>
                  </g>
                </g>
                <!-- Lower arch teeth -->
                <g>
                  <g *ngFor="let tooth of lowerTeeth; let i = index">
                    <g [attr.transform]="getToothTransformArch(i, 'lower')" (mouseenter)="showToothInfo(tooth.num, $event)" (mouseleave)="hideToothInfo()">
                      <path [attr.d]="getToothPathByType(tooth.type)"
                            [attr.fill]="getToothFill(tooth.num)"
                            stroke="#666" stroke-width="1" class="tooth-shape"
                            (click)="onToothClick(tooth.num, getToothArchPosition(i, 'lower').x, getToothArchPosition(i, 'lower').y)" />
                      <path [attr.d]="getToothGrooveByType(tooth.type)" stroke="#999" stroke-width="0.6" fill="none" />
                    </g>
                    <text [attr.x]="getToothNumberArch(i, 'lower').x" [attr.y]="getToothNumberArch(i, 'lower').y" font-size="12" fill="#666" text-anchor="middle" style="font-weight: 400;">{{tooth.num}}</text>
                  </g>
                </g>
                <!-- Legend -->
                <g>
                  <rect x="110" y="540" width="18" height="18" rx="3" fill="#93c5fd" />
                  <text x="135" y="554" font-size="14" fill="#666">Has treatment before</text>
                  <rect x="270" y="540" width="18" height="18" rx="3" fill="#fde68a" />
                  <text x="295" y="554" font-size="14" fill="#666">Recomended to be treated</text>
                </g>
              </svg>
            </div>
          </ng-container>

          <ng-container *ngIf="currentSubStep2 === 2">
            <div class="cosmetic-service-details-wrapper">
              <div class="cosmetic-stepper-header">
                <div class="cosmetic-stepper-steps-indicator">
                  <span class="cosmetic-step-number" [ngClass]="{'green': isSubStep1(), 'grey': !isSubStep1()}">1</span>
                  <span class="step-dash">—</span>
                  <span class="cosmetic-step-number" [ngClass]="{'green': isSubStep2(), 'grey': !isSubStep2()}">2</span>
                </div>
                <div class="cosmetic-stepper-title">Service cosmétique</div>
                <div class="cosmetic-stepper-subtitle">Sélectionnez les dents et la condition</div>
              </div>
              <!-- Modal popup for SVG chart -->
              <div *ngIf="showCosmeticForm" class="cosmetic-modal-overlay">
                <div class="cosmetic-modal-content">
                  <button class="cosmetic-modal-close" (click)="cancelCosmeticForm()">
                    <mat-icon>close</mat-icon>
                  </button>
                  <div class="tooth-chart-svg-wrapper">
                    <svg viewBox="0 0 520 600" width="420" height="500" style="display:block;margin:auto;">
                      <!-- Center cross -->
                      <line x1="260" y1="100" x2="260" y2="500" stroke="#e5e7eb" stroke-width="1" />
                      <line x1="80" y1="300" x2="440" y2="300" stroke="#e5e7eb" stroke-width="1" />
                      <!-- Upper arch teeth -->
                      <g>
                        <g *ngFor="let tooth of upperTeeth; let i = index">
                          <g [attr.transform]="getToothTransformArch(i, 'upper')">
                            <path [attr.d]="getToothPathByType(tooth.type)"
                                  [attr.fill]="getToothFill(tooth.num)"
                                  stroke="#666" stroke-width="1" class="tooth-shape"
                                  [ngClass]="{'cosmetic-clickable': isColoredTooth(tooth.num)}"
                                  (click)="isColoredTooth(tooth.num) ? onCosmeticToothClick(tooth.num, getToothArchPosition(i, 'upper').x, getToothArchPosition(i, 'upper').y) : null"
                                  [style.cursor]="isColoredTooth(tooth.num) ? 'pointer' : 'default'" />
                            <path [attr.d]="getToothGrooveByType(tooth.type)" stroke="#999" stroke-width="0.6" fill="none" />
                          </g>
                          <text [attr.x]="getToothNumberArch(i, 'upper').x" [attr.y]="getToothNumberArch(i, 'upper').y" font-size="12" fill="#666" text-anchor="middle" style="font-weight: 400;">{{tooth.num}}</text>
                        </g>
                      </g>
                      <!-- Lower arch teeth -->
                      <g>
                        <g *ngFor="let tooth of lowerTeeth; let i = index">
                          <g [attr.transform]="getToothTransformArch(i, 'lower')">
                            <path [attr.d]="getToothPathByType(tooth.type)"
                                  [attr.fill]="getToothFill(tooth.num)"
                                  stroke="#666" stroke-width="1" class="tooth-shape"
                                  [ngClass]="{'cosmetic-clickable': isColoredTooth(tooth.num)}"
                                  (click)="isColoredTooth(tooth.num) ? onCosmeticToothClick(tooth.num, getToothArchPosition(i, 'lower').x, getToothArchPosition(i, 'lower').y) : null"
                                  [style.cursor]="isColoredTooth(tooth.num) ? 'pointer' : 'default'" />
                            <path [attr.d]="getToothGrooveByType(tooth.type)" stroke="#999" stroke-width="0.6" fill="none" />
                          </g>
                          <text [attr.x]="getToothNumberArch(i, 'lower').x" [attr.y]="getToothNumberArch(i, 'lower').y" font-size="12" fill="#666" text-anchor="middle" style="font-weight: 400;">{{tooth.num}}</text>
                        </g>
                      </g>
                    </svg>
                  </div>
                  <div *ngIf="selectedCosmeticTooth !== null" class="popup-compact popup-shadow popup-rounded cosmetic-popup-modern" [ngStyle]="{ left: cosmeticPopupX + 'px', top: cosmeticPopupY + 'px' }">
                    <div class="popup-title-row cosmetic-popup-title-row">
                      <div>
                        <span class="popup-title">Dent {{ selectedCosmeticTooth }} - {{ toothNames[selectedCosmeticTooth] || '' }}</span>
                        <div class="popup-last-treatment" *ngIf="getLastCosmeticTreatment(selectedCosmeticTooth)">
                          Dernier traitement : <b>{{ getLastCosmeticTreatment(selectedCosmeticTooth) }}</b>
                        </div>
                      </div>
                      <button mat-icon-button (click)="closeCosmeticPopup()"><mat-icon>close</mat-icon></button>
                    </div>
                    <label class="popup-label">Type de traitement cosmétique</label>
                    <mat-form-field appearance="outline" class="popup-form-field">
                      <mat-select [(ngModel)]="cosmeticForm.type" placeholder="Type de traitement">
                        <mat-option value="blanchiment">Blanchiment dentaire</mat-option>
                        <mat-option value="facettes">Facettes dentaires</mat-option>
                        <mat-option value="contouring">Contouring</mat-option>
                        <mat-option value="bijou">Bijou dentaire</mat-option>
                        <mat-option value="autre">Autre</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field *ngIf="cosmeticForm.type === 'autre'" appearance="outline" class="popup-form-field">
                      <input matInput [(ngModel)]="cosmeticForm.other" placeholder="Précisez le traitement cosmétique..." />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="popup-note-field">
                      <textarea matInput [(ngModel)]="cosmeticForm.note" placeholder="Notes" rows="2"></textarea>
                    </mat-form-field>
                    <div class="popup-btn-row">
                      <button class="popup-btn save-btn-flat popup-btn-modern-blue" (click)="saveCosmeticTreatmentForTooth()">Enregistrer</button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Initial view when no cosmetic treatments are added -->
              <div class="cosmetic-empty-state" *ngIf="!showCosmeticForm && cosmeticTreatments.length === 0">
                <div class="cosmetic-illustration-placeholder">
                  <img src="/assets/images/tooth.jpg" alt="Illustration of teeth" class="cosmetic-illustration">
                </div>
                <p class="cosmetic-empty-text">Aucun traitement cosmétique sélectionné</p>
                <div class="cosmetic-add-btn-row">
                  <button mat-stroked-button color="primary" class="add-cosmetic-btn always-add-btn" (click)="addCosmeticTreatment()">
                    <mat-icon>add</mat-icon> Ajouter un Traitement Cosmétique
                  </button>
                </div>
              </div>
              <!-- List of added cosmetic treatments -->
              <div *ngIf="cosmeticTreatments.length > 0 && !showCosmeticForm">
                <div class="cosmetic-add-btn-row">
                  <button mat-stroked-button color="primary" class="add-cosmetic-btn always-add-btn" (click)="addCosmeticTreatment()">
                    <mat-icon>add</mat-icon> Ajouter un Traitement Cosmétique
                  </button>
                </div>
                <div class="cosmetic-treatments-list">
                  <div class="cosmetic-treatment-item modern-treatment-card" *ngFor="let treatment of cosmeticTreatments">
                    <div class="treatment-list-row">
                      <div class="treatment-list-info">
                        <div class="treatment-type-modern">{{ getCosmeticTreatmentLabel(treatment) }}</div>
                        <div class="treatment-details-modern">
                          <span>Dents: {{ treatment.teeth.join(', ') }}</span>
                          <span *ngIf="treatment.note">Notes: {{ treatment.note }}</span>
                        </div>
                      </div>
                      <div class="treatment-list-actions">
                        <button class="delete-btn-modern" (click)="deleteCosmeticTreatment(treatment)"><mat-icon>delete</mat-icon> Supprimer</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>

        <ng-container *ngIf="currentStep === 2">
          <h2 class="stepper-title">{{ steps[2].label }}</h2>
          <p>Contenu pour le contrôle buccal.</p>
        </ng-container>

        <ng-container *ngIf="currentStep === 3">
          <h2 class="stepper-title">{{ steps[3].label }}</h2>
          <p>Contenu pour l'accord du plan.</p>
          <button mat-flat-button color="primary" class="nav-btn-fr next-btn-fr" (click)="saveAllBilan()">Done</button>
        </ng-container>

      </div>
      <div class="stepper-actions-modern-fr">
        <button mat-stroked-button color="primary" class="nav-btn-fr" (click)="prevStep()" [disabled]="currentStep === 0">
          Annuler
        </button>
        <button *ngIf="currentStep > 0" mat-stroked-button color="primary" class="nav-btn-fr prev-btn-fr" (click)="prevStep()">
          Précédent
        </button>
        <button mat-flat-button color="primary" class="nav-btn-fr next-btn-fr" (click)="nextStep()" [disabled]="currentStep === steps.length - 1">
          Suivant
        </button>
      </div>
    </div>
    <div *ngIf="hoveredTooth !== null && toothData[hoveredTooth]" class="tooth-info-card" [ngStyle]="{ left: hoverX + 'px', top: hoverY + 'px' }">
      <div class="info-title-row">
        <span class="info-title">{{ toothNames[hoveredTooth] || 'Dent' }}</span>
        <span class="tooth-cadre info-cadre">
          <svg viewBox="0 0 20 20"><path d="M5 6 Q4 2 10 2 Q16 2 15 6 Q14 10 15 16 Q15.5 18 13 18 Q10 18 10 15 Q10 18 7 18 Q4.5 18 5 16 Q6 10 5 6 Z"/></svg>
          {{ hoveredTooth }}
        </span>
      </div>
      <div class="info-section">
        <div class="info-label">DERNIÈRE CONDITION</div>
        <div class="info-value">{{ getConditionLabel(toothData[hoveredTooth].condition) }}</div>
      </div>
      <div class="info-section">
        <div class="info-label">DERNIER TRAITEMENT</div>
        <div class="info-value">{{ getSelectedTreatmentLabel(toothData[hoveredTooth].treatment) }}</div>
      </div>
      <div class="info-section">
        <div class="info-label">NOTES</div>
        <div class="info-value">{{ toothData[hoveredTooth].note }}</div>
      </div>
      <button class="edit-info-btn" (click)="editToothFromInfoCard($event)">Edit</button>
    </div>
    <div *ngIf="selectedTooth !== null && !(currentStep === 1 && currentSubStep2 === 2)" class="popup-compact popup-shadow popup-rounded" [ngStyle]="{ left: popupX + 'px', top: popupY + 'px' }">
      <div class="popup-title-row">
        <span class="popup-title">{{ toothNames[selectedTooth] || 'Tooth' }}</span>
        <span class="tooth-cadre">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M5 6 Q4 2 10 2 Q16 2 15 6 Q14 10 15 16 Q15.5 18 13 18 Q10 18 10 15 Q10 18 7 18 Q4.5 18 5 16 Q6 10 5 6 Z" stroke="#4f7fff" fill="none" stroke-width="1.2"/></svg>
          {{ selectedTooth }}
        </span>
      </div>
      <mat-form-field appearance="outline" class="popup-form-field">
        <mat-select [(ngModel)]="toothPopup.condition" placeholder="Select condition">
          <mat-select-trigger>
            <span class="abbr-cadre">{{ selectedConditionAbbr }}</span>
            {{ selectedConditionLabel }}
          </mat-select-trigger>
          <mat-option *ngFor="let condition of conditions" [value]="condition.value">
            <span class="abbr-cadre">{{ condition.abbr }}</span> {{ condition.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="popup-form-field">
        <mat-select [(ngModel)]="toothPopup.treatment" placeholder="Select treatment">
          <mat-option *ngFor="let treatment of treatments" [value]="treatment.value">
            <span [ngClass]="{
              'abbr-cadre-multi': treatment.abbr === 'multi',
              'abbr-cadre-single': treatment.abbr === 'single'
            }">{{ treatment.abbr }}</span>
            {{ treatment.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="popup-note-field">
        <textarea matInput [(ngModel)]="toothPopup.note" placeholder="Note" rows="2"></textarea>
      </mat-form-field>
      <div class="popup-btn-row">
        <button class="popup-btn delete-btn-flat" (click)="deleteToothInfo()">
          <mat-icon>delete</mat-icon>
        </button>
        <button class="popup-btn save-btn-flat" (click)="saveToothPopup()">Save</button>
      </div>
    </div>
  `,
  styles: [`
    .stepper-panel-modern {
      width: 100%;
      min-width: 0;
      max-width: none;
      height: 100vh;
      max-height: 100vh;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      box-shadow: 2px 0 16px rgba(0,0,0,0.08);
      border-top-left-radius: 18px;
      border-bottom-left-radius: 18px;
      border-right: 1px solid #e5e7eb;
      overflow: hidden;
      padding: 0 32px;
    }
    .stepper-title-fixed {
      background: #fff;
      position: sticky;
      top: 0;
      z-index: 10;
      padding-top: 32px;
      padding-bottom: 0;
    }
    .stepper-main-title {
      font-size: 28px;
      font-weight: 900;
      color: #222;
      margin: 24px 2px 28px 24px;
      text-align: left;
      letter-spacing: -1px;
    }
    .stepper-header-modern-fr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      border-radius: 12px;
      padding: 0 12px 18px 12px;
      margin-bottom: 8px;
      position: relative;
    }
    .step-modern-fr {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
    }
    .step-icon-modern-fr {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid #2563eb;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      color: #2563eb;
      margin-bottom: 4px;
      transition: background 0.2s, color 0.2s;
    }
    .step-icon-modern-fr.completed-icon {
      border-color: #22c55e;
      color: #22c55e;
    }
    .step-icon-modern-fr.active-icon {
      border-color: #2563eb;
      color: #2563eb;
    }
    .step-icon-modern-fr.upcoming-icon {
      border-color: #bcd0fa;
      color: #bcd0fa;
    }
    .step-label-modern-fr {
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      color: #2563eb;
      margin-top: 2px;
    }
    .step-modern-fr.completed .step-label-modern-fr {
      color: #22c55e;
    }
    .step-progress-line {
      position: absolute;
      top: 22px;
      left: 100%;
      width: 40px;
      height: 2px;
      background: #e0e7ff;
      z-index: 0;
    }
    .step-modern-fr.active ~ .step-progress-line {
      background: #2563eb;
    }
    .step-modern-fr.completed ~ .step-progress-line {
      background: #22c55e;
    }
    .info-alert-fr {
      display: flex;
      align-items: center;
      background: #e0e7ff;
      color: #2563eb;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 15px;
      margin-bottom: 12px;
      gap: 8px;
    }
    .form-label {
      font-size: 16px;
      font-weight: 600;
      color: #222;
      margin-bottom: 18px;
      display: block;
    }
    .form-section.no-bg {
      background: #fff !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 0 24px 0 !important;
      margin-top: 32px !important;
      margin-bottom: 0px !important;
    }
    .form-section.no-bg .form-label {
      margin-top: 18px;
      margin-bottom: 16px;
    }
    .form-row {
      display: flex;
      gap: 20px;
    }
    .form-row-spacing-top {
      margin-top: 16px !important;
      padding-top: 0px !important;
    }
    .form-col {
      flex: 1;
    }
    .checkbox-group.simple-list {
      background: #fff;
      border: 1.5px solid #ededed;
      border-radius: 12px;
      box-shadow: none;
      padding: 18px 24px;
      margin-top: 16px !important;
      margin-bottom: 24px !important;
      gap: 0;
      display: flex;
      flex-direction: column;
      margin-bottom: 24px;
    }
    .checkbox-group.simple-list .sickness-row {
      border-bottom: 1px dashed #e0e0e0;
      min-height: 44px;
      display: flex;
      align-items: center;
      background: transparent;
    }
    .checkbox-group.simple-list .sickness-row:last-child {
      border-bottom: none;
    }
    .checkbox-group.simple-list .mat-checkbox {
      border-bottom: none;
      margin: 0;
      padding: 0 0 0 0;
      min-height: 44px;
      display: flex;
      align-items: center;
      background: transparent;
    }
    .checkbox-group.simple-list .mat-checkbox:last-child {
      border-bottom: none;
    }
    .checkbox-group.simple-list .mat-checkbox .mat-checkbox-label {
      font-size: 16px;
      color: #222;
      font-weight: 500;
      margin-left: 8px;
    }
    .autre-maladie-input {
      margin-left: 40px;
      margin-top: 8px;
      width: 60%;
      min-width: 180px;
      max-width: 300px;
      display: block;
    }
    .stepper-actions-modern-fr {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 18px;
      padding: 24px 40px 18px 40px;
      background: #fff;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 18px;
      border-top: 1px solid #e5e7ff;
    }
    .nav-btn-fr {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      padding: 12px 0;
      text-align: center;
      text-transform: uppercase;
      box-shadow: none !important;
      border: 1.5px solid #ccc !important;
      color: #666 !important;
      background-color: #fff !important;
      transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    }
    .next-btn-fr {
      background-color:rgb(45, 75, 158) !important;
      color: #fff !important;
      border: none !important;
    }
    .next-btn-fr[disabled] {
      background: #bcd0fa !important;
      color: #fff !important;
    }
    .stepper-content-card {
      background: #fff;
      margin: 0 0 0 0;
      border-radius: 0;
      box-shadow: none;
      padding: 0 0 0 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow-y: auto;
      padding: 0 0 0 0;
    }
    .tooth-stepper-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .tooth-stepper-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .tooth-stepper-steps {
      font-size: 20px;
      font-weight: 600;
      color: #222;
      margin-bottom: 4px;
    }
    .tooth-stepper-title {
      font-size: 22px;
      font-weight: 700;
      color: #222;
      margin-bottom: 4px;
    }
    .tooth-stepper-subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 0px;
    }
    .tooth-chart-svg-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 0 auto !important;
      margin-top: 0 !important;
      padding-top: 0 !important;
      padding-bottom: 0;
      background: #fff;
      max-width: 420px;
    }
    .tooth-legend-wrapper {
      display: flex;
      justify-content: flex-start;
      gap: 24px;
      margin: 16px auto;
      padding: 0 24px;
      max-width: 420px;
    }
    .tooth-legend-item {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #666;
      gap: 8px;
    }
    .tooth-legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 2px;
      display: inline-block;
    }
    @media (max-width: 900px) {
      .stepper-content-card {
        margin: 12px 2px 0 2px;
        padding: 16px 6px 10px 6px;
      }
      .form-row {
        flex-direction: column;
        gap: 10px;
      }
      .stepper-actions-modern-fr {
        padding: 16px 8px 10px 8px;
      }
    }
    .tooth-popup {
      position: absolute;
      z-index: 100;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      padding: 16px 24px 12px 24px;
      min-width: 320px;
      min-height: 80px;
      border: 1.5px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .tooth-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
      gap: 0;
    }
    .tooth-popup-title {
      font-size: 15px;
      font-weight: 700;
      color: #222;
      letter-spacing: -0.5px;
      margin-right: 0;
    }
    .tooth-cadre {
      display: flex;
      align-items: center;
      border: 1.2px solid #4f7fff;
      border-radius: 8px;
      padding: 1px 6px 1px 4px;
      gap: 2px;
      background: #fff;
      font-weight: 600;
      color: #4f7fff;
      font-size: 13px;
    }
    .tooth-cadre svg {
      width: 14px;
      height: 14px;
      stroke: #4f7fff;
      fill: none;
      stroke-width: 1.2;
      margin-right: 1px;
      display: inline-block;
      vertical-align: middle;
    }
    .popup-field {
      margin-bottom: 0 !important;
    }
    .mat-form-field {
      margin-bottom: 0 !important;
    }
    .mat-form-field-infix {
      padding: 2px 0 !important;
      min-height: 28px !important;
    }
    .popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
      align-items: center;
    }
    .popup-actions button[mat-flat-button] {
      background: #fff !important;
      color: #2563eb !important;
      font-weight: 700;
      border-radius: 12px;
      border: 2px solid #2563eb !important;
      padding: 10px 36px;
      font-size: 18px;
      min-height: 44px;
      min-width: 120px;
      box-shadow: none;
      transition: background 0.2s, color 0.2s;
      margin-left: 0;
    }
    .popup-actions button[mat-flat-button]:hover {
      background: #e0e7ff !important;
      color: #2563eb !important;
    }
    .popup-actions button[mat-icon-button] {
      color: #ef4444 !important;
      background: #fff !important;
      border: 2px solid #ef4444 !important;
      border-radius: 12px;
      font-size: 24px;
      min-width: 44px;
      min-height: 44px;
      margin-right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      transition: border 0.2s;
    }
    .popup-actions button[mat-icon-button] .mat-icon {
      color: #ef4444 !important;
      font-size: 24px;
      width: 24px;
      height: 24px;
      stroke: #ef4444;
      fill: none;
    }
    .tooth-shape:hover { fill: #e0e7ff; cursor: pointer; }
    .mat-form-field-wrapper {
      padding-bottom: 0 !important;
      margin-bottom: 0 !important;
    }
    .mat-form-field-flex {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }
    textarea.mat-input-element {
      min-height: 32px !important;
      padding-top: 4px !important;
      padding-bottom: 4px !important;
    }
    .abbr-cadre {
      background: #e0e7ff;
      color: #2563eb;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 2px 10px;
      margin-right: 8px;
      min-width: 32px;
      text-align: center;
      display: inline-block;
    }
    .mat-option:hover .abbr-cadre,
    .mat-option.mat-active .abbr-cadre {
      background: #2563eb;
      color: #fff;
    }
    .abbr-cadre-multi {
      background: #e0d7ff;
      color: #7c3aed;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 2px 10px;
      margin-right: 8px;
      min-width: 32px;
      text-align: center;
      display: inline-block;
    }
    .abbr-cadre-single {
      background: #d1fae5;
      color: #059669;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 2px 10px;
      margin-right: 8px;
      min-width: 32px;
      text-align: center;
      display: inline-block;
    }
    .autre-treatment-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
      padding: 16px 12px 12px 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .autre-treatment-input .mat-form-field-infix {
      font-size: 18px;
      font-weight: 600;
      color: #222;
      min-height: 44px;
    }
    .custom-treatment-label {
      font-size: 17px;
      font-weight: 700;
      color: #222;
      margin-left: 4px;
      letter-spacing: 0.5px;
    }
    .toggle-type-row {
      display: flex;
      gap: 12px;
      margin-top: 2px;
    }
    .toggle-type-btn {
      border: none;
      outline: none;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      padding: 4px 18px;
      border-radius: 8px;
      transition: box-shadow 0.2s, border 0.2s;
      box-shadow: 0 0 0 1.5px #e0e7ff;
      opacity: 0.85;
    }
    .toggle-type-btn.selected-toggle {
      box-shadow: 0 0 0 2.5px #2563eb;
      opacity: 1;
    }
    .tooth-info-card {
      position: fixed;
      z-index: 200;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 6px 32px rgba(0,0,0,0.13);
      padding: 22px 24px 18px 24px;
      min-width: 260px;
      min-height: 120px;
      border: 1.5px solid #e0e0e0;
      pointer-events: auto;
      color: #222;
      transition: box-shadow 0.2s;
    }
    .info-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .info-title {
      font-size: 18px;
      font-weight: 700;
      color: #222;
    }
    .info-cadre {
      font-size: 15px;
      padding: 2px 12px 2px 6px;
      border-radius: 10px;
    }
    .info-section {
      margin-bottom: 10px;
    }
    .info-label {
      font-size: 11px;
      color: #888;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 15px;
      color: #222;
      font-weight: 500;
    }
    .edit-info-btn {
      width: 100%;
      margin-top: 10px;
      border: 1.5px solid #2563eb;
      background: #fff;
      color: #2563eb;
      font-weight: 700;
      border-radius: 10px;
      padding: 8px 0;
      font-size: 15px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .edit-info-btn:hover {
      background: #e0e7ff;
      color: #2563eb;
    }
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
    .mat-form-field.full-width.no-underline .mat-form-field-wrapper {
      padding-bottom: 0 !important;
      margin-bottom: -1.25em !important;
    }
    .mat-form-field.full-width.no-underline .mat-form-field-underline {
      display: none !important;
    }
    .mat-form-field.full-width.no-underline .mat-form-field-outline {
      border: none !important;
    }
    .mat-form-field.full-width.no-underline .mat-form-field-appearance-outline .mat-form-field-outline-start,
    .mat-form-field.full-width.no-underline .mat-form-field-appearance-outline .mat-form-field-outline-end,
    .mat-form-field.full-width.no-underline .mat-form-field-appearance-outline .mat-form-field-outline-gap {
        border-width: 0 !important;
    }
    .mat-form-field.full-width.no-underline textarea.mat-input-element {
        padding: 8px 12px !important;
        margin: 0 !important;
    }
    /* Styling for cleaner input appearance - removing outline */
    .mat-form-field.clean-input.mat-form-field-appearance-outline .mat-form-field-outline {
        border: none !important;
    }

    .mat-form-field.clean-input.mat-form-field-appearance-outline .mat-form-field-outline-start,
    .mat-form-field.clean-input.mat-form-field-appearance-outline .mat-form-field-outline-end,
    .mat-form-field.clean-input.mat-form-field-appearance-outline .mat-form-field-outline-gap {
        border-width: 0 !important;
    }

    /* Adjust padding and margin within the mat-form-field for outline appearance without border */
     .mat-form-field.clean-input.mat-form-field-appearance-outline .mat-form-field-flex {
        padding: 0.83333em 0.75em !important;
        margin-top: 0em !important;
     }

     .mat-form-field.clean-input .mat-form-field-label {
        margin-top: 0em !important;
        transform: translateY(-1.5em) scale(.75) !important;
     }

    /* Style the actual textarea for a subtle bottom border */
    .mat-form-field.clean-input textarea.mat-input-element {
        border: none !important;
        border-bottom: 1px solid #ccc !important; /* Subtle bottom border */
        padding: 8px 0px !important; /* Adjust padding */
        margin: 0 !important;
        box-sizing: border-box;
        width: 100%;
        resize: vertical; /* Allow vertical resizing */
    }

    /* Remove default textarea outline on focus */
    .mat-form-field.clean-input textarea.mat-input-element:focus {
        outline: none !important;
    }

    /* New styles for Cosmetic Service Details (Sub-step 2) */
    .cosmetic-service-details-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center; /* Center content horizontally */
        padding: 24px; /* Add some padding */
    }

    .cosmetic-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center; /* Center content horizontally */
        text-align: center; /* Center text */
        margin-top: 24px; /* Space from header */
    }

    .cosmetic-illustration-placeholder {
        width: 120px; /* Adjust size as needed */
        height: 120px; /* Adjust size as needed */
        background-color: transparent; /* Remove background */
        border-radius: 8px; /* Rounded corners for placeholder */
        margin-bottom: 16px; /* Space below illustration */
        display: flex; /* Center SVG inside */
        align-items: center;
        justify-content: center;
        /* Add actual illustration later */
    }

    /* Style for the actual image, remove background from placeholder */
    .cosmetic-illustration-placeholder {
        background-color: transparent; /* Remove background */
    }

    .cosmetic-illustration {
        display: block;
        max-width: 100%;
        height: auto;
    }

    .cosmetic-empty-text {
        font-size: 18px; /* Adjust font size */
        color: #555; /* Adjust color */
        margin-bottom: 24px; /* Space below text */
    }

    .add-cosmetic-btn {
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        padding: 8px 16px; /* Smaller padding */
        box-shadow: none;
        text-transform: none;
        border: 1.5px solid #a3bffa !important; /* Lighter blue border */
        color:rgb(58, 89, 154) !important; /* Lighter blue text */
        background-color: #fff !important; /* White background */
    }

    .add-cosmetic-btn mat-icon {
        margin-right: 8px;
    }

    .cosmetic-treatments-list {
        width: 100%; /* Take full width */
        margin-top: 24px; /* Space from empty state or add form */
    }

    .add-cosmetic-form {
        width: 100%; /* Take full width */
        margin-top: 24px; /* Space from list */
        padding: 16px; /* Add padding around the form */
        border: 1px solid #eee; /* Optional border */
        border-radius: 8px;
    }

    /* Styles for the cosmetic stepper header */
    .cosmetic-stepper-header {
        text-align: center;
        margin-bottom: 10px; /* Reduced space */
    }

    .cosmetic-stepper-steps-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
    }

    .cosmetic-step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 700;
        border-radius: 50%;
        width: 30px;
        height: 30px;
    }

    .cosmetic-step-number.green {
        color: #22c55e; /* Green color */
        border: 2px solid #22c55e; /* Green circle */
    }

    .cosmetic-step-number.grey {
        color: #666; /* Grey color */
        border: 2px solid #ccc; /* Grey circle */
    }

    .step-dash {
        font-size: 18px;
        font-weight: 400;
        color: #666;
        margin: 0 4px;
    }

    .cosmetic-stepper-title {
        font-size: 18px; /* Smaller title font size */
        font-weight: 700;
        color: #222;
        margin-bottom: 4px;
    }

    .cosmetic-stepper-subtitle {
        font-size: 14px; /* Smaller subtitle font size */
        color: #666;
    }

    .popup-compact {
      position: fixed;
      z-index: 2000;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 6px 32px rgba(0,0,0,0.13);
      min-width: 260px;
      max-width: 320px;
      padding: 18px 20px 12px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .popup-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .popup-title {
      font-size: 17px;
      font-weight: 700;
      color: #222;
    }
    .tooth-cadre {
      display: flex;
      align-items: center;
      border: 1.2px solid #4f7fff;
      border-radius: 8px;
      padding: 1px 6px 1px 4px;
      gap: 2px;
      background: #fff;
      font-weight: 600;
      color: #4f7fff;
      font-size: 13px;
    }
    .tooth-cadre svg {
      width: 14px;
      height: 14px;
      stroke: #4f7fff;
      fill: none;
      stroke-width: 1.2;
      margin-right: 1px;
      display: inline-block;
      vertical-align: middle;
    }
    .popup-form-field {
      margin-bottom: 0 !important;
      width: 100%;
    }
    .popup-note-field {
      margin-bottom: 0 !important;
      width: 100%;
    }
    .popup-btn-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      width: 100%;
    }
    .popup-btn.save-btn-flat {
      background: #fff;
      color: #2563eb;
      border: none;
      font-weight: 700;
      font-size: 17px;
      width: 100%;
      min-height: 44px;
      padding: 0 0;
      border-radius: 8px;
      box-shadow: none;
      transition: color 0.2s;
      cursor: pointer;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
    }
    .popup-btn.save-btn-flat:hover {
      color: #1746a2;
      background: #f3f6fd;
    }
    .popup-btn.delete-btn-flat {
      background: #fff;
      color: #ef4444;
      border: none;
      min-width: 44px;
      min-height: 36px;
      padding: 0 0;
      border-radius: 8px;
      box-shadow: none;
      cursor: pointer;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: auto;
    }
    .popup-btn.delete-btn-flat mat-icon {
      color: #ef4444;
      font-size: 22px;
      width: 22px;
      height: 22px;
      border: none;
      background: none;
      padding: 0;
      margin: 0;
    }
    
    .cosmetic-form-container {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-top: 24px;
      width: 100%;
      max-width: 600px;
    }

    .cosmetic-form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .cosmetic-form-header h3 {
      margin: 0;
      font-size: 20px;
      color: #222;
    }

    .cosmetic-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .selected-teeth-display {
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .selected-teeth-display p {
      margin: 0;
      color: #666;
    }

    .cosmetic-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .cosmetic-treatments-list {
      margin-top: 24px;
      width: 100%;
      max-width: 600px;
    }

    .cosmetic-treatment-item {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }

    .treatment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .treatment-header h4 {
      margin: 0;
      color: #222;
      font-size: 16px;
    }

    .cosmetic-treatment-item p {
      margin: 4px 0;
      color: #666;
    }

    .cosmetic-clickable:hover {
      fill: #fde68a !important;
      cursor: pointer;
      opacity: 0.85;
    }

    /* Add styles for the modal overlay and content */
    .cosmetic-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.25);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cosmetic-modal-content {
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      padding: 32px 32px 24px 32px;
      position: relative;
      min-width: 480px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .cosmetic-modal-close {
      position: absolute;
      top: 18px;
      right: 18px;
      background: #fff;
      border: 1.5px solid #e0e7ff;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: background 0.2s;
    }
    .cosmetic-modal-close:hover {
      background: #e0e7ff;
    }
    .cosmetic-popup-modern {
      min-width: 260px;
      max-width: 340px;
      padding: 22px 18px 18px 18px;
      box-shadow: 0 6px 32px rgba(0,0,0,0.13);
      border-radius: 16px;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cosmetic-popup-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
      gap: 8px;
    }
    .popup-title {
      font-size: 18px;
      font-weight: 700;
      color: #222;
      display: block;
      margin-bottom: 2px;
    }
    .popup-last-treatment {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
      margin-bottom: 4px;
    }
    .popup-label {
      font-size: 14px;
      font-weight: 600;
      color: #444;
      margin-bottom: 4px;
      margin-top: 6px;
      display: block;
    }
    .popup-form-field, .popup-note-field {
      width: 100%;
      margin-bottom: 8px !important;
    }
    .popup-btn-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      width: 100%;
      justify-content: flex-end;
    }
    .popup-btn-modern {
      background: #2563eb !important;
      color: #fff !important;
      font-weight: 700;
      font-size: 16px;
      border-radius: 8px;
      min-width: 120px;
      min-height: 40px;
      box-shadow: none;
      transition: background 0.2s;
      cursor: pointer;
      outline: none;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
    }
    .popup-btn-modern:hover {
      background: #1746a2 !important;
    }
    .popup-btn-modern-blue {
      background: #fff !important;
      color: #2563eb !important;
      font-weight: 700;
      font-size: 16px;
      border-radius: 8px;
      min-width: 120px;
      min-height: 40px;
      box-shadow: none;
      transition: background 0.2s, border 0.2s, color 0.2s;
      cursor: pointer;
      outline: none;
      border: 2px solid #2563eb !important;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
    }
    .popup-btn-modern-blue:hover {
      background: #e0e7ff !important;
      color: #1746a2 !important;
      border: 2px solid #1746a2 !important;
    }
    .modern-treatment-card {
      width: 100%;
      min-width: 0;
      max-width: none;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      padding: 0;
      margin-bottom: 12px;
      border: 1.5px solid #f3f4f6;
      background: #fff;
    }
    .treatment-list-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 22px 32px 22px 32px;
    }
    .treatment-list-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .treatment-type-modern {
      font-size: 18px;
      font-weight: 700;
      color: #222;
      margin-bottom: 2px;
    }
    .treatment-details-modern {
      font-size: 15px;
      color: #666;
      display: flex;
      flex-direction: row;
      gap: 18px;
    }
    .treatment-list-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
    }
    .delete-btn-modern {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff;
      color: #ef4444;
      border: 1.5px solid #ef4444;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      padding: 10px 28px;
      cursor: pointer;
      transition: background 0.18s, color 0.18s, border 0.18s;
      outline: none;
      box-shadow: none;
    }
    .delete-btn-modern mat-icon {
      color: #ef4444 !important;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 2px;
    }
    .delete-btn-modern:hover {
      background: #fef2f2;
      color: #b91c1c;
      border: 1.5px solid #b91c1c;
    }
    .cosmetic-add-btn-row {
      width: 100%;
      display: flex;
      justify-content: flex-end;
      margin-bottom: 18px;
      margin-top: 8px;
    }
    .always-add-btn {
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      padding: 8px 18px;
      box-shadow: none;
      text-transform: none;
      border: 1.5px solid #a3bffa !important;
      color: rgb(58, 89, 154) !important;
      background-color: #fff !important;
      transition: background 0.18s, color 0.18s, border 0.18s;
    }
    .always-add-btn mat-icon {
      margin-right: 8px;
    }
    .always-add-btn:hover {
      background: #e0e7ff !important;
      color: #1746a2 !important;
      border: 1.5px solid #2563eb !important;
    }
    .bp-message {
      margin-top: 8px;
      font-size: 15px;
      font-weight: 600;
      padding: 6px 18px;
      border-radius: 8px;
      display: inline-block;
      transition: color 0.3s, background 0.3s;
    }
    .bp-message.high, .bp-message.low {
      color: #ef4444;
      background: #fef2f2;
    }
    .bp-message.normal {
      color: #22c55e;
      background: #f0fdf4;
    }
    .form-field.bp-high .mat-form-field-flex,
    .form-field.bp-high .mat-form-field-outline,
    .form-field.bp-high .mat-form-field-outline-thick,
    .form-field.bp-high .mat-form-field-outline-start,
    .form-field.bp-high .mat-form-field-outline-end,
    .form-field.bp-high .mat-form-field-outline-gap,
    .form-field.bp-high .mat-input-element {
      background: #fee2e2 !important;
      background-color: #fee2e2 !important;
      border-radius: 12px !important;
      box-shadow: 0 0 0 2px #fca5a5 !important;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .form-field.bp-low .mat-form-field-flex,
    .form-field.bp-low .mat-form-field-outline,
    .form-field.bp-low .mat-form-field-outline-thick,
    .form-field.bp-low .mat-form-field-outline-start,
    .form-field.bp-low .mat-form-field-outline-end,
    .form-field.bp-low .mat-form-field-outline-gap,
    .form-field.bp-low .mat-input-element {
      background: #fee2e2 !important;
      background-color: #fee2e2 !important;
      border-radius: 12px !important;
      box-shadow: 0 0 0 2px #fca5a5 !important;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .form-field.bp-normal .mat-form-field-flex,
    .form-field.bp-normal .mat-form-field-outline,
    .form-field.bp-normal .mat-form-field-outline-thick,
    .form-field.bp-normal .mat-form-field-outline-start,
    .form-field.bp-normal .mat-form-field-outline-end,
    .form-field.bp-normal .mat-form-field-outline-gap,
    .form-field.bp-normal .mat-input-element {
      background: #dcfce7 !important;
      background-color: #dcfce7 !important;
      border-radius: 12px !important;
      box-shadow: 0 0 0 2px #bbf7d0 !important;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .mat-form-field-suffix {
      margin-left: 8px !important;
      margin-right: 2px !important;
    }
    /* Remove previous background color rules for bp-high, bp-low, bp-normal */
    .form-field.bp-high .mat-form-field-underline {
      border-bottom: 3px solid #ef4444 !important;
      transition: border-color 0.3s;
    }
    .form-field.bp-low .mat-form-field-underline {
      border-bottom: 3px solid #ef4444 !important;
      transition: border-color 0.3s;
    }
    .form-field.bp-normal .mat-form-field-underline {
      border-bottom: 3px solid #22c55e !important;
      transition: border-color 0.3s;
    }
    .form-field.bp-high .mat-form-field-outline,
    .form-field.bp-high .mat-form-field-outline-start,
    .form-field.bp-high .mat-form-field-outline-end,
    .form-field.bp-high .mat-form-field-outline-gap {
      border-color: #ef4444 !important;
      border-width: 2px !important;
      transition: border-color 0.3s;
    }
    .form-field.bp-low .mat-form-field-outline,
    .form-field.bp-low .mat-form-field-outline-start,
    .form-field.bp-low .mat-form-field-outline-end,
    .form-field.bp-low .mat-form-field-outline-gap {
      border-color: #ef4444 !important;
      border-width: 2px !important;
      transition: border-color 0.3s;
    }
    .form-field.bp-normal .mat-form-field-outline,
    .form-field.bp-normal .mat-form-field-outline-start,
    .form-field.bp-normal .mat-form-field-outline-end,
    .form-field.bp-normal .mat-form-field-outline-gap {
      border-color: #22c55e !important;
      border-width: 2px !important;
      transition: border-color 0.3s;
    }
    /* Deep override for Angular Material outline border color */
    ::ng-deep .form-field.bp-high .mat-form-field-outline {
      stroke: #ef4444 !important;
      border-color: #ef4444 !important;
    }
    ::ng-deep .form-field.bp-low .mat-form-field-outline {
      stroke: #ef4444 !important;
      border-color: #ef4444 !important;
    }
    ::ng-deep .form-field.bp-normal .mat-form-field-outline {
      stroke: #22c55e !important;
      border-color: #22c55e !important;
    }
  `],
  imports: [MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, CommonModule, ReactiveFormsModule, MatSelectModule, FormsModule]
})
export class MedicalCheckupStepperComponent implements OnInit {
  @Input() open = false;
  @Input() fichePatient: any;
  steps = [
    { icon: 'assignment', label: 'Données médicales' },
    { icon: 'event', label: 'Plan de traitement' },
    { icon: 'medical_services', label: 'Contrôle buccal' },
    { icon: 'assignment_turned_in', label: 'Accord du plan' }
  ];
  currentStep = 0;
  currentSubStep2 = 1;

  medicalDataForm!: FormGroup;
  selectedTeeth: number[] = [];
  selectedTooth: number | null = null;
  toothPopup = {
    condition: '',
    treatment: '',
    note: '',
    otherCondition: '',
    otherTreatment: '',
    otherTreatmentType: 'single'
  };
  toothData: { [key: number]: any } = {};

  toothNames: { [key: number]: string } = {
    18: '2e Molaire', 17: '1re Molaire', 16: '2e Prémolaire', 15: '1re Prémolaire', 14: 'Canine', 13: 'Incisive latérale', 12: 'Incisive centrale', 11: 'Incisive centrale',
    21: 'Incisive centrale', 22: 'Incisive latérale', 23: 'Canine', 24: '1re Prémolaire', 25: '2e Prémolaire', 26: '1re Molaire', 27: '2e Molaire', 28: '3e Molaire',
    48: '3e Molaire', 47: '2e Molaire', 46: '1re Molaire', 45: '2e Prémolaire', 44: '1re Prémolaire', 43: 'Canine', 42: 'Incisive latérale', 41: 'Incisive centrale',
    31: 'Incisive centrale', 32: 'Incisive latérale', 33: 'Canine', 34: '1re Prémolaire', 35: '2e Prémolaire', 36: '1re Molaire', 37: '2e Molaire', 38: '3e Molaire'
  };
  conditions = [
    { value: 'car', label: 'Caries', abbr: 'car' },
    { value: 'pre', label: 'Éruption partielle', abbr: 'pre' },
    { value: 'une', label: 'Non éruptée', abbr: 'une' },
    { value: 'imv', label: 'Inclus partiellement visible', abbr: 'imv' },
    { value: 'ano', label: 'Anomalie', abbr: 'ano' },
    { value: 'autre', label: 'Autre', abbr: 'autre' }
  ];
  treatments = [
    { value: 'blanchiment', label: 'Blanchiment dentaire', abbr: 'multi', color: 'purple' },
    { value: 'detartrage', label: 'Détartrage', abbr: 'single', color: 'green' },
    { value: 'plombage', label: 'Plombage', abbr: 'single', color: 'green' },
    { value: 'extraction', label: 'Extraction dentaire', abbr: 'multi', color: 'purple' },
    { value: 'couronne', label: 'Couronne', abbr: 'single', color: 'green' },
    { value: 'scaling', label: 'Scaling', abbr: 'multi', color: 'purple' },
    { value: 'autre', label: 'Autre traitement', abbr: 'single', color: 'green' }
  ];

  popupX = 200;
  popupY = 200;

  // Tooth type definitions
  readonly toothTypes = {
    incisor: { width: 18, height: 28, r: 4 },
    canine: { width: 20, height: 28, r: 5 },
    premolar: { width: 22, height: 26, r: 6 },
    molar: { width: 26, height: 24, r: 7 }
  };
  // Tooth number and type arrays (universal numbering)
  readonly upperTeeth = [
    { num: 18, type: 'molar' }, { num: 17, type: 'molar' }, { num: 16, type: 'molar' }, { num: 15, type: 'premolar' },
    { num: 14, type: 'premolar' }, { num: 13, type: 'canine' }, { num: 12, type: 'incisor' }, { num: 11, type: 'incisor' },
    { num: 21, type: 'incisor' }, { num: 22, type: 'incisor' }, { num: 23, type: 'canine' }, { num: 24, type: 'premolar' },
    { num: 25, type: 'premolar' }, { num: 26, type: 'molar' }, { num: 27, type: 'molar' }, { num: 28, type: 'molar' }
  ];
  readonly lowerTeeth = [
    { num: 48, type: 'molar' }, { num: 47, type: 'molar' }, { num: 46, type: 'molar' }, { num: 45, type: 'premolar' },
    { num: 44, type: 'premolar' }, { num: 43, type: 'canine' }, { num: 42, type: 'incisor' }, { num: 41, type: 'incisor' },
    { num: 31, type: 'incisor' }, { num: 32, type: 'incisor' }, { num: 33, type: 'canine' }, { num: 34, type: 'premolar' },
    { num: 35, type: 'premolar' }, { num: 36, type: 'molar' }, { num: 37, type: 'molar' }, { num: 38, type: 'molar' }
  ];

  // Arch parameters
  readonly archParams = {
    cx: 260,
    cyUpper: 250,
    cyLower: 300,
    rx: 100,
    ry: 140
  };

  hoveredTooth: number | null = null;
  hoverX = 0;
  hoverY = 0;

  private currentBilanMedical: any; // Property to store the fetched BilanMedical object
  showCosmeticForm = false;
  cosmeticTreatments: any[] = [];
  cosmeticForm = {
    type: '',
    teeth: [] as number[],
    note: '',
    other: ''
  };
  selectedCosmeticTooth: number | null = null;
  cosmeticPopupX = 0;
  cosmeticPopupY = 0;

  bpStatus: 'normal' | 'high' | 'low' = 'normal';
  bpMessage: string = '';
  onBpInput() {
    const sys = +this.medicalDataForm.get('bloodPressureSystolic')?.value;
    const dia = +this.medicalDataForm.get('bloodPressureDiastolic')?.value;
    if ((!sys && sys !== 0) || (!dia && dia !== 0)) {
      this.bpStatus = 'normal';
      this.bpMessage = '';
      return;
    }
    if (sys > 140 || dia > 90) {
      this.bpStatus = 'high';
      this.bpMessage = 'Tension artérielle élevée !';
    } else if (sys < 90 || dia < 60) {
      this.bpStatus = 'low';
      this.bpMessage = 'Tension artérielle basse !';
    } else {
      this.bpStatus = 'normal';
      this.bpMessage = 'Tension artérielle normale.';
    }
  }
  getBpClass(type: 'systolic' | 'diastolic') {
    return {
      'bp-high': this.bpStatus === 'high',
      'bp-low': this.bpStatus === 'low',
      'bp-normal': this.bpStatus === 'normal',
    };
  }

  constructor(private fb: FormBuilder, private bilanMedicalService: BilanMedicalService, private patientService: PatientService) {
    this.medicalDataForm = this.fb.group({
      bloodPressureSystolic: [null, Validators.min(0)],
      bloodPressureDiastolic: [null, Validators.min(0)],
      allergiesText: [''],
      priseMedicaments: [''],
      heartDisease: [false],
      covid19: [false],
      haemophilia: [false],
      hepatitis: [false],
      gastring: [false],
      otherDisease: [false],
      allergyLatex: [false],
      allergyPenicillin: [false],
      allergyAnesthetics: [false],
      allergyIodine: [false],
      allergyMetals: [false],
      allergyOther: [false],
      otherAllergiesText: [''],
    });
  }

  ngOnInit(): void {
    console.log('MedicalCheckupStepperComponent initialized.');
    console.log('Received fichePatient:', this.fichePatient);

    // --- Load data from FichePatient first ---
    if (this.fichePatient) {
      console.log('Loading initial data from fichePatient:', this.fichePatient);
      
      console.log('FichePatient priseMedicaments value on init:', this.fichePatient.priseMedicaments);
      let allergiesToDisplay = this.fichePatient.allergies || '';
      // Attempt to parse allergies if it looks like a JSON array string
      if (allergiesToDisplay.startsWith('[') && allergiesToDisplay.endsWith(']')) {
        try {
          const allergiesArray = JSON.parse(allergiesToDisplay);
          if (Array.isArray(allergiesArray)) {
            allergiesToDisplay = allergiesArray.join(', '); // Display as comma-separated string
            console.log('Parsed and formatted allergies from JSON string:', allergiesToDisplay);
          } else {
             console.warn('FichePatient allergies looks like JSON but is not an array:', allergiesToDisplay);
          }
        } catch (e) {
          console.error('Error parsing FichePatient allergies as JSON:', e, allergiesToDisplay);
          // If parsing fails, keep the original string
        }
      }

      this.medicalDataForm.patchValue({
        allergiesText: allergiesToDisplay,
        priseMedicaments: this.fichePatient.priseMedicaments || ''
      });

      // --- Then attempt to load additional data from BilanMedical ---
      if (this.fichePatient.id) {
        console.log(`Attempting to fetch BilanMedical for fichePatientId: ${this.fichePatient.id}`);
        this.bilanMedicalService.getBilanMedicalByFichePatientId(this.fichePatient.id).subscribe({
          next: (data) => {
            console.log('BilanMedical data fetched successfully:', data);
            if (data) {
              this.currentBilanMedical = data; // Store the fetched BilanMedical object
              // Patch only fields specific to BilanMedical or intended to override FichePatient
              this.medicalDataForm.patchValue({
                bloodPressureSystolic: data.bloodPressureSystolic,
                bloodPressureDiastolic: data.bloodPressureDiastolic,
                // Keep allergiesText and priseMedicaments from FichePatient unless you explicitly want BilanMedical to override
                // allergiesText: data.allergiesText // Do NOT overwrite allergies from FichePatient here
              });

              if (data.maladiesParticulieres) {
                try {
                  const maladies = JSON.parse(data.maladiesParticulieres);
                  console.log('Parsed maladiesParticulieres:', maladies);
                  // Patch maladies checkboxes
                  this.medicalDataForm.patchValue({
                    heartDisease: maladies.includes('Maladie cardiaque'),
                    covid19: maladies.includes('Covid-19'),
                    haemophilia: maladies.includes('Hémophilie'),
                    hepatitis: maladies.includes('Hépatite'),
                    gastring: maladies.includes('Gastrite'),
                    otherDisease: maladies.some((m: string) => !['Maladie cardiaque', 'Covid-19', 'Hémophilie', 'Hépatite', 'Gastrite'].includes(m)),
                    otherDiseaseText: maladies.find((m: string) => !['Maladie cardiaque', 'Covid-19', 'Hémophilie', 'Hépatite', 'Gastrite'].includes(m)) || ''
                  });
                } catch (e) {
                  console.error('Error parsing maladiesParticulieres:', e, data.maladiesParticulieres);
                }
              }

              if (data.toothData) {
                try {
                  console.log('Raw toothData from backend:', data.toothData);
                  this.toothData = JSON.parse(data.toothData);
                  console.log('Parsed toothData:', this.toothData);
                  this.selectedTeeth = Object.keys(this.toothData).map(Number);
                  console.log('Set selectedTeeth:', this.selectedTeeth);
                  console.log('Current toothData state after loading:', this.toothData);
                } catch (e) {
                  console.error('Error parsing toothData:', e, data.toothData);
                }
              }

              if (data.cosmeticTreatments) {
                try {
                  this.cosmeticTreatments = JSON.parse(data.cosmeticTreatments);
                } catch (e) {
                  console.error('Error parsing cosmeticTreatments:', e, data.cosmeticTreatments);
                  this.cosmeticTreatments = [];
                }
              }
            } else {
              console.log('No BilanMedical data found for this patient. Initializing form with FichePatient data.');
              // Form is already initialized with FichePatient data above
            }
          },
          error: (err) => {
            console.error('Error fetching BilanMedical data:', err);
            // Continue with data loaded from FichePatient
          }
        });
      }
    } else {
      console.log('fichePatient is not available. Cannot load initial data.');
      // If fichePatient is not available, form remains with default empty values
    }
  }

  toggleTooth(tooth: number) {
    const idx = this.selectedTeeth.indexOf(tooth);
    if (idx > -1) {
      this.selectedTeeth.splice(idx, 1);
    } else {
      this.selectedTeeth.push(tooth);
    }
    this.open = false;
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.currentSubStep2 < 2) {
        this.currentSubStep2++;
      } else {
        this.currentStep++;
        this.currentSubStep2 = 1;
      }
    } else if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }
  prevStep() {
    if (this.currentStep === 1) {
      if (this.currentSubStep2 > 1) {
        this.currentSubStep2--;
      } else {
        this.currentStep--;
      }
    } else if (this.currentStep > 0) {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.currentSubStep2 = 1;
      }
    }
  }
  closePanel() {
    this.open = false;
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return true;
      default:
        return true;
    }
  }

  saveMedicalDataStep() {
    if (true) {
      const formData = this.medicalDataForm.value;
      console.log('Medical Data Step saved:', formData);
    }
  }

  openToothPopup(tooth: number, x: number, y: number) {
    this.selectedTooth = tooth;
    this.popupX = x + 60;
    this.popupY = (tooth >= 31 && tooth <= 48) ? y - 180 : y + 60;
    // Optionally load previous data for this tooth
  }
  deleteToothPopup() {
    this.selectedTooth = null;
    this.toothPopup = { condition: '', treatment: '', note: '', otherCondition: '', otherTreatment: '', otherTreatmentType: 'single' };
  }
  saveToothPopup() {
    if (this.selectedTooth !== null) {
      // Save the tooth data
      this.toothData[this.selectedTooth] = {
        condition: this.toothPopup.condition,
        treatment: this.toothPopup.treatment,
        note: this.toothPopup.note,
        otherCondition: this.toothPopup.otherCondition,
        otherTreatment: this.toothPopup.otherTreatment,
        otherTreatmentType: this.toothPopup.otherTreatmentType
      };
      
      // Add to selected teeth if not already there
      if (!this.selectedTeeth.includes(this.selectedTooth)) {
        this.selectedTeeth.push(this.selectedTooth);
      }
      
      // Reset the popup
      this.selectedTooth = null;
      this.toothPopup = {
        condition: '',
        treatment: '',
        note: '',
        otherCondition: '',
        otherTreatment: '',
        otherTreatmentType: 'single'
      };
    }
  }

  // Calculate polar position and rotation for each tooth
  getToothArchPosition(i: number, arch: 'upper' | 'lower') {
    const teeth = arch === 'upper' ? this.upperTeeth : this.lowerTeeth;
    const { cx, rx, ry } = this.archParams;
    const cy = arch === 'upper' ? this.archParams.cyUpper : this.archParams.cyLower;
    const angleStart = Math.PI * 1.1;
    const angleEnd = Math.PI * 1.9;
    const t = i / (teeth.length - 1);
    let angle = angleStart + (angleEnd - angleStart) * t;
    if (arch === 'lower') {
      angle += Math.PI;
    }
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return { x, y, angle };
  }

  // Anatomical SVG path for each tooth type
  getToothPathByType(type: string): string {
    if (type === 'incisor') {
      // Anatomical incisor: rounded top, slightly wider bottom
      return 'M -8,-14 Q 0,-18 8,-14 Q 10,-8 8,14 Q 0,18 -8,14 Q -10,-8 -8,-14 Z';
    }
    if (type === 'canine') {
      // Anatomical canine: pointed, slightly curved
      return 'M -9,-14 Q 0,-20 9,-14 Q 10,-8 6,14 Q 0,20 -6,14 Q -10,-8 -9,-14 Z';
    }
    if (type === 'premolar') {
      // Anatomical premolar: rounded rectangle
      return 'M -11,-12 Q -13,0 -11,12 Q 0,16 11,12 Q 13,0 11,-12 Q 0,-16 -11,-12 Z';
    }
    // Molar: rounded square
    return 'M -13,-10 Q -15,0 -13,10 Q 0,14 13,10 Q 15,0 13,-10 Q 0,-14 -13,-10 Z';
  }

  // Tooth groove path (simple vertical or cross for molars)
  getToothGrooveByType(type: string): string {
    if (type === 'incisor') return 'M 0,-10 Q 2,0 0,10';
    if (type === 'canine') return 'M 0,-9 Q 2,0 0,9';
    if (type === 'premolar') return 'M -5,0 Q 0,4 5,0';
    // molar
    return 'M -7,-7 Q 0,0 7,7 M -7,7 Q 0,0 7,-7';
  }

  // Tooth transform for SVG
  getToothTransformArch(i: number, arch: 'upper' | 'lower'): string {
    const { x, y, angle } = this.getToothArchPosition(i, arch);
    return `translate(${x},${y}) rotate(${angle * 180 / Math.PI + 90})`;
  }

  // Tooth number position
  getToothNumberArch(i: number, arch: 'upper' | 'lower'): { x: number, y: number } {
    const { x, y, angle } = this.getToothArchPosition(i, arch);
    const r = 32;
    return {
      x: x + r * Math.cos(angle),
      y: y + r * Math.sin(angle)
    };
  }

  getToothFill(toothNum: number): string {
    if (this.toothData[toothNum]) {
      const treatment = this.toothData[toothNum].treatment;
      const foundTreatment = this.treatments.find(t => t.value === treatment);
      if (foundTreatment) {
        return foundTreatment.color === 'green' ? '#93c5fd' : '#fde68a';
      }
    }
    return '#fff';
  }

  compareAbbr = (a: string, b: string) => a === b;
  displayAbbr = (value: string) => value;

  getConditionLabel(abbr: string): string {
    const found = this.conditions.find(c => c.value === abbr);
    return found ? found.label : '';
  }

  getSelectedTreatment() {
    return this.treatments.find(t => t.value === this.toothPopup.treatment);
  }

  showToothInfo(toothNum: number, event: MouseEvent) {
    if (this.toothData[toothNum]) {
      this.hoveredTooth = toothNum;
      this.hoverX = event.clientX + 16;
      this.hoverY = event.clientY + 16;
    }
  }
  hideToothInfo() {
    this.hoveredTooth = null;
  }
  getSelectedTreatmentLabel(value: string): string {
    const found = this.treatments.find(t => t.value === value);
    return found ? found.label : '';
  }

  editToothFromInfoCard(event: MouseEvent) {
    event.stopPropagation();
    if (this.hoveredTooth !== null) {
      // Open the edit popup for the hovered tooth
      this.openToothPopup(this.hoveredTooth, this.hoverX, this.hoverY);
      this.hoveredTooth = null;
    }
  }

  saveAllBilan() {
    const formData = this.medicalDataForm.value;
    const maladiesParticulieres = [];
    if (formData.heartDisease) maladiesParticulieres.push('Maladie cardiaque');
    if (formData.covid19) maladiesParticulieres.push('Covid-19');
    if (formData.haemophilia) maladiesParticulieres.push('Hémophilie');
    if (formData.hepatitis) maladiesParticulieres.push('Hépatite');
    if (formData.gastring) maladiesParticulieres.push('Gastrite');
    if (formData.otherDisease && formData.otherDiseaseText) maladiesParticulieres.push(formData.otherDiseaseText);
    const fichePatientObj = this.fichePatient && this.fichePatient.id ? { id: this.fichePatient.id } : { id: this.fichePatient };
    const payload = {
      ...(this.currentBilanMedical && this.currentBilanMedical.id && { id: this.currentBilanMedical.id }), // Include BilanMedical ID if editing
      bloodPressureSystolic: formData.bloodPressureSystolic,
      bloodPressureDiastolic: formData.bloodPressureDiastolic,
      maladiesParticulieres: JSON.stringify(maladiesParticulieres),
      allergiesText: formData.allergiesText,
      toothData: JSON.stringify(this.toothData),
      cosmeticTreatments: JSON.stringify(this.cosmeticTreatments),
      fichePatient: fichePatientObj
    };
    this.bilanMedicalService.saveBilanMedical(payload).subscribe({
      next: (data) => {
        console.log('Bilan médical saved successfully:', data);
        // Now update the FichePatient with allergies and medicaments
        if (this.fichePatient && this.fichePatient.id && this.fichePatient.patientId) {
          const updatedFichePatient = {
            id: this.fichePatient.id,
            allergies: formData.allergiesText,
            priseMedicaments: formData.priseMedicaments
          };

          this.patientService.createOrUpdateFiche(this.fichePatient.patientId, updatedFichePatient).subscribe({
            next: (updatedData) => {
              console.log('FichePatient updated successfully:', updatedData);
              alert('Bilan médical et Fiche Patient enregistrés avec succès!');
              this.currentStep = 0;
            },
            error: (updateErr) => {
              console.error('Error updating FichePatient:', updateErr);
              alert('Bilan médical enregistré, mais erreur lors de la mise à jour de la Fiche Patient.');
              this.currentStep = 0;
            }
          });

        } else {
          alert('Bilan médical enregistré avec succès! (Mise à jour Fiche Patient ignorée car fichePatient non disponible)');
          this.currentStep = 0;
        }
      },
      error: (err) => {
        alert('Erreur lors de l\'enregistrement du bilan médical.');
      }
    });
  }

  addCosmeticTreatment() {
    this.showCosmeticForm = true;
  }

  saveCosmeticTreatment() {
    if (this.cosmeticForm.type && this.cosmeticForm.teeth.length > 0) {
      this.cosmeticTreatments.push({
        ...this.cosmeticForm,
        id: Date.now()
      });
      this.showCosmeticForm = false;
      this.cosmeticForm = {
        type: '',
        teeth: [],
        note: '',
        other: ''
      };
    }
  }

  cancelCosmeticForm() {
    this.showCosmeticForm = false;
    this.cosmeticForm = {
      type: '',
      teeth: [],
      note: '',
      other: ''
    };
  }

  toggleToothForCosmetic(toothNum: number) {
    const index = this.cosmeticForm.teeth.indexOf(toothNum);
    if (index === -1) {
      this.cosmeticForm.teeth.push(toothNum);
    } else {
      this.cosmeticForm.teeth.splice(index, 1);
    }
  }

  isSubStep1(): boolean {
    return this.currentSubStep2 === 1;
  }

  isSubStep2(): boolean {
    return this.currentSubStep2 === 2;
  }

  deleteToothInfo() {
    if (this.selectedTooth !== null) {
      delete this.toothData[this.selectedTooth];
      this.selectedTooth = null;
      this.toothPopup = { condition: '', treatment: '', note: '', otherCondition: '', otherTreatment: '', otherTreatmentType: 'single' };
    }
  }

  // Add these getters to the component class
  get selectedConditionAbbr(): string {
    const found = this.conditions.find(c => c.value === this.toothPopup.condition);
    return found ? found.abbr : '';
  }
  get selectedConditionLabel(): string {
    const found = this.conditions.find(c => c.value === this.toothPopup.condition);
    return found ? found.label : 'Select condition';
  }

  isColoredTooth(toothNum: number): boolean {
    // Define what makes a tooth 'colored' for cosmetic step
    // Example: has a treatment or is in selectedTeeth
    return !!this.toothData[toothNum] || this.selectedTeeth.includes(toothNum);
  }

  onToothClick(toothNum: number, x: number, y: number) {
    // Cosmetic step: only allow colored teeth, and show cosmetic popup
    if (this.currentStep === 1 && this.currentSubStep2 === 2) {
      if (this.isColoredTooth(toothNum)) {
        this.openCosmeticPopup(toothNum, x, y);
      }
      return;
    }
    // Medical step: show main chart popup
    if (!(this.currentStep === 1 && this.currentSubStep2 === 2)) {
      this.openToothPopup(toothNum, x, y);
    }
  }

  openCosmeticPopup(toothNum: number, x: number, y: number) {
    // TODO: Show a small, floating cosmetic popup next to the clicked tooth
    // You can implement the popup logic here or trigger a variable to show the popup in the template
    console.log('Open cosmetic popup for tooth', toothNum, x, y);
    // Example: this.selectedCosmeticTooth = toothNum; this.cosmeticPopupX = x; this.cosmeticPopupY = y;
  }

  onCosmeticToothClick(toothNum: number, x: number, y: number) {
    if (this.isColoredTooth(toothNum)) {
      this.selectedCosmeticTooth = toothNum;
      this.cosmeticPopupX = x + 60;
      this.cosmeticPopupY = (toothNum >= 31 && toothNum <= 48) ? y - 180 : y + 60;
      // Optionally pre-fill form if treatment exists
      const found = this.cosmeticTreatments.find(t => t.teeth.includes(toothNum));
      if (found) {
        this.cosmeticForm = {
          type: found.type,
          teeth: [...found.teeth],
          note: found.note,
          other: found.other || ''
        };
      } else {
        this.cosmeticForm = { type: '', teeth: [toothNum], note: '', other: '' };
      }
    }
  }

  closeCosmeticPopup() {
    this.selectedCosmeticTooth = null;
    this.cosmeticForm = { type: '', teeth: [], note: '', other: '' };
  }

  saveCosmeticTreatmentForTooth() {
    if (this.selectedCosmeticTooth && this.cosmeticForm.type) {
      // Remove any previous treatment for this tooth
      this.cosmeticTreatments = this.cosmeticTreatments.filter(t => !t.teeth.includes(this.selectedCosmeticTooth!));
      // Add new
      this.cosmeticTreatments.push({
        ...this.cosmeticForm,
        teeth: [this.selectedCosmeticTooth],
        id: Date.now()
      });
      this.closeCosmeticPopup();
      this.showCosmeticForm = false; // Close the modal to show the updated list
    }
  }

  getLastCosmeticTreatment(toothNum: number): string | null {
    const found = this.cosmeticTreatments.find(t => t.teeth.includes(toothNum));
    if (found && found.type) {
      switch (found.type) {
        case 'blanchiment': return 'Blanchiment dentaire';
        case 'facettes': return 'Facettes dentaires';
        case 'contouring': return 'Contouring';
        case 'bijou': return 'Bijou dentaire';
        case 'autre': return found.other || 'Autre';
        default: return found.type;
      }
    }
    return null;
  }

  getCosmeticTreatmentLabel(treatment: any): string {
    switch (treatment.type) {
      case 'blanchiment': return 'Blanchiment dentaire';
      case 'facettes': return 'Facettes dentaires';
      case 'contouring': return 'Contouring';
      case 'bijou': return 'Bijou dentaire';
      case 'autre': return treatment.other || 'Autre';
      default: return treatment.type.charAt(0).toUpperCase() + treatment.type.slice(1);
    }
  }

  deleteCosmeticTreatment(treatment: any) {
    this.cosmeticTreatments = this.cosmeticTreatments.filter(t => t.id !== treatment.id);
  }
} 