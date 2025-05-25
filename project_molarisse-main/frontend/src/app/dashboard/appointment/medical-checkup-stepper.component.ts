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
      <div class="stepper-content-card">
        <ng-container *ngIf="currentStep === 0">
          <div class="info-alert-fr">
            <mat-icon>info</mat-icon>
            <span>Les données médicales sont basées sur le dernier contrôle, vous pouvez les mettre à jour.</span>
          </div>

          <form [formGroup]="medicalDataForm">
            <div class="form-section no-bg">
              <label class="form-label">Tension artérielle</label>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <input matInput placeholder="130" formControlName="bloodPressureSystolic">
                  <span matSuffix>mm</span>
                </mat-form-field>
                <mat-form-field appearance="outline" class="form-field">
                  <input matInput placeholder="80" formControlName="bloodPressureDiastolic">
                  <span matSuffix>hg</span>
                </mat-form-field>
              </div>
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

            <div class="form-section no-bg">
              <label class="form-label">Allergies</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Allergies connues</mat-label>
                <textarea matInput formControlName="allergiesText" rows="3" placeholder="Décrivez les allergies..."></textarea>
              </mat-form-field>
            </div>
          </form>

        </ng-container>

        <ng-container *ngIf="currentStep === 1">
          <div class="tooth-stepper-wrapper">
            <div class="tooth-stepper-header">
              <div class="tooth-stepper-steps">1 — 2</div>
              <div class="tooth-stepper-title">Service médical</div>
              <div class="tooth-stepper-subtitle">Sélectionnez les dents à problème</div>
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
                            (click)="openToothPopup(tooth.num, getToothArchPosition(i, 'upper').x, getToothArchPosition(i, 'upper').y)" />
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
                            (click)="openToothPopup(tooth.num, getToothArchPosition(i, 'lower').x, getToothArchPosition(i, 'lower').y)" />
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
            <div class="tooth-legend-wrapper">
              <span class="tooth-legend-item">
                <span class="tooth-legend-dot" style="background:#93c5fd;"></span>
                Has treatment before
              </span>
              <span class="tooth-legend-item">
                <span class="tooth-legend-dot" style="background:#fde68a;"></span>
                Recomended to be treated
              </span>
            </div>
          </div>
          <div *ngIf="selectedTooth !== null" class="tooth-popup" [ngStyle]="{ left: popupX + 'px', top: popupY + 'px' }">
            <div class="tooth-popup-header">
              <span class="tooth-popup-title">{{ toothNames[selectedTooth] || 'Dent' }}</span>
              <span class="tooth-cadre">
                <svg viewBox="0 0 20 20"><path d="M5 6 Q4 2 10 2 Q16 2 15 6 Q14 10 15 16 Q15.5 18 13 18 Q10 18 10 15 Q10 18 7 18 Q4.5 18 5 16 Q6 10 5 6 Z"/></svg>
                {{ selectedTooth }}
              </span>
            </div>
            <mat-form-field appearance="outline" class="popup-field">
              <mat-label>Condition</mat-label>
              <mat-select [(ngModel)]="toothPopup.condition" [compareWith]="compareAbbr">
                <mat-select-trigger>
                  <span class="abbr-cadre">{{ toothPopup.condition }}</span>
                  <span>{{ getConditionLabel(toothPopup.condition) }}</span>
                </mat-select-trigger>
                <mat-option *ngFor="let c of conditions" [value]="c.value">
                  <span class="abbr-cadre">{{ c.value }}</span> {{ c.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <input *ngIf="toothPopup.condition === 'autre'" matInput placeholder="Précisez l'autre condition" [(ngModel)]="toothPopup.otherCondition" class="autre-maladie-input" />
            <mat-form-field appearance="outline" class="popup-field">
              <mat-label>Traitement</mat-label>
              <mat-select [(ngModel)]="toothPopup.treatment">
                <mat-select-trigger>
                  <ng-container *ngIf="getSelectedTreatment()">
                    <span [ngClass]="toothPopup.treatment === 'autre' ? (toothPopup.otherTreatmentType === 'multi' ? 'abbr-cadre-multi' : 'abbr-cadre-single') : (getSelectedTreatment()?.abbr === 'multi' ? 'abbr-cadre-multi' : 'abbr-cadre-single')">
                      {{ toothPopup.treatment === 'autre' ? (toothPopup.otherTreatmentType === 'multi' ? 'multi' : 'single') : getSelectedTreatment()?.abbr }}
                    </span>
                    <span class="custom-treatment-label" *ngIf="toothPopup.treatment === 'autre' && toothPopup.otherTreatment">{{ toothPopup.otherTreatment }}</span>
                    <span *ngIf="!(toothPopup.treatment === 'autre' && toothPopup.otherTreatment)">{{ getSelectedTreatment()?.label }}</span>
                  </ng-container>
                </mat-select-trigger>
                <mat-option *ngFor="let t of treatments" [value]="t.value">
                  <span [ngClass]="t.abbr === 'multi' ? 'abbr-cadre-multi' : 'abbr-cadre-single'">{{ t.abbr }}</span>
                  <span *ngIf="t.value !== 'autre'">{{ t.label }}</span>
                  <span *ngIf="t.value === 'autre'">Autre traitement</span>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <div *ngIf="toothPopup.treatment === 'autre'" class="autre-treatment-container">
              <mat-form-field appearance="outline" class="popup-field autre-treatment-input">
                <mat-label>Autre traitement</mat-label>
                <input matInput [(ngModel)]="toothPopup.otherTreatment" placeholder="Précisez le traitement">
              </mat-form-field>
              <div class="toggle-type-row">
                <button type="button" class="toggle-type-btn abbr-cadre-single" [class.selected-toggle]="toothPopup.otherTreatmentType === 'single'" (click)="toothPopup.otherTreatmentType = 'single'">single</button>
                <button type="button" class="toggle-type-btn abbr-cadre-multi" [class.selected-toggle]="toothPopup.otherTreatmentType === 'multi'" (click)="toothPopup.otherTreatmentType = 'multi'">multi</button>
              </div>
            </div>

            <mat-form-field appearance="outline" class="popup-field">
              <mat-label>Note</mat-label>
              <textarea matInput [(ngModel)]="toothPopup.note" rows="2"></textarea>
            </mat-form-field>
            <div class="popup-actions">
              <button mat-icon-button color="warn" (click)="deleteToothPopup()"><mat-icon>delete</mat-icon></button>
              <button mat-flat-button color="primary" (click)="saveToothPopup()">Enregistrer</button>
            </div>
          </div>
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
      margin-bottom: 32px !important;
    }
    .form-section.no-bg .form-label {
      margin-top: 18px;
      margin-bottom: 16px;
    }
    .form-row {
      display: flex;
      gap: 18px;
      margin-bottom: 10px;
    }
    .form-field {
      flex: 1;
      min-width: 0;
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
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      padding: 10px 32px;
      min-width: 120px;
      box-shadow: none;
      text-transform: none;
    }
    .next-btn-fr {
      background: #2563eb !important;
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
      margin-bottom: 18px;
    }
    .tooth-stepper-steps {
      font-size: 20px;
      font-weight: 600;
      color: #222;
      margin-bottom: 8px;
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
      margin-bottom: 12px;
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
      display: inline-block;
      background: #e0e7ff;
      color: #2563eb;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 2px 10px;
      margin-right: 8px;
      min-width: 32px;
      text-align: center;
      transition: background 0.2s, color 0.2s;
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
    { value: 'car', label: 'Caries' },
    { value: 'pre', label: 'Éruption partielle' },
    { value: 'une', label: 'Non éruptée' },
    { value: 'imv', label: 'Inclus partiellement visible' },
    { value: 'ano', label: 'Anomalie' },
    { value: 'autre', label: 'Autre' }
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

  constructor(private fb: FormBuilder, private bilanMedicalService: BilanMedicalService) {
    this.medicalDataForm = this.fb.group({
      bloodPressureSystolic: ['', Validators.pattern('^[0-9]*$')],
      bloodPressureDiastolic: ['', Validators.pattern('^[0-9]*$')],
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
      allergiesText: ['']
    });
  }

  ngOnInit(): void {
    console.log('MedicalCheckupStepperComponent initialized.');
    console.log('Received fichePatient:', this.fichePatient);

    if (this.fichePatient && this.fichePatient.id) {
      console.log(`Attempting to fetch BilanMedical for fichePatientId: ${this.fichePatient.id}`);
      this.bilanMedicalService.getBilanMedicalByFichePatientId(this.fichePatient.id).subscribe({
        next: (data) => {
          console.log('BilanMedical data fetched successfully:', data);
          if (data) {
            this.medicalDataForm.patchValue({
              bloodPressureSystolic: data.bloodPressureSystolic,
              bloodPressureDiastolic: data.bloodPressureDiastolic,
              allergiesText: data.allergiesText
            });
            if (data.maladiesParticulieres) {
              try {
                const maladies = JSON.parse(data.maladiesParticulieres);
                console.log('Parsed maladiesParticulieres:', maladies);
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
                this.toothData = JSON.parse(data.toothData);
                console.log('Parsed toothData:', this.toothData);
                this.selectedTeeth = Object.keys(this.toothData).map(Number);
                console.log('Set selectedTeeth:', this.selectedTeeth);

                // Log current toothData state after loading
                console.log('Current toothData state after loading:', this.toothData);
              } catch (e) {
                console.error('Error parsing toothData:', e, data.toothData);
              }
            }
          } else {
            console.log('No BilanMedical data found for this patient. Initializing with default values.');
            // If no data is found, ensure form is reset or has defaults
            // medicalDataForm is initialized in constructor, toothData is {} by default
          }
        },
        error: (err) => {
          console.error('Error fetching BilanMedical data:', err);
        }
      });
    } else {
      console.log('fichePatient is not available or does not have an ID. Cannot fetch BilanMedical data.');
    }
  }

  toggleTooth(tooth: number) {
    const idx = this.selectedTeeth.indexOf(tooth);
    if (idx > -1) {
      this.selectedTeeth.splice(idx, 1);
    } else {
      this.selectedTeeth.push(tooth);
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
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
    this.popupY = y + 60;
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
      bloodPressureSystolic: formData.bloodPressureSystolic,
      bloodPressureDiastolic: formData.bloodPressureDiastolic,
      maladiesParticulieres: JSON.stringify(maladiesParticulieres),
      allergiesText: formData.allergiesText,
      toothData: JSON.stringify(this.toothData),
      fichePatient: fichePatientObj
    };
    this.bilanMedicalService.saveBilanMedical(payload).subscribe({
      next: (data) => {
        alert('Bilan médical enregistré avec succès!');
        this.currentStep = 0;
      },
      error: (err) => {
        alert('Erreur lors de l\'enregistrement du bilan médical.');
      }
    });
  }
} 