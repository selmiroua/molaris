import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ColorPreferenceService, ColorPalette } from '../core/services/color-preference.service';

// Define interface for status list items
interface StatusItem {
  value: keyof ColorPalette;
  label: string;
  icon: string;
  previewTitle: string;
  previewTime: string;
}

@Component({
  selector: 'app-color-palette-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <div class="color-palette-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Personnaliser les couleurs</h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div mat-dialog-content>
        <div class="color-selection-grid">
          <!-- Left Column: Status colors -->
          <div class="status-colors">
            <div class="color-option" *ngFor="let status of statusList; let i = index">
              <div class="color-item" [class]="status.value">
                <div class="status-label">{{status.label}}</div>
                <div class="color-tools">
                  <input 
                    type="color" 
                    [id]="'color-' + status.value"
                    [(ngModel)]="colors[status.value]" 
                    class="color-input"
                    (change)="updatePreviewAndApply(status.value)"
                  >
                  <div class="preview-swatch" [style.background-color]="colors[status.value]"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Preview -->
          <div class="preview-container">
            <div class="preview-item" 
              *ngFor="let status of statusList" 
              [style.background-color]="colors[status.value]" 
              [style.color]="getTextColor(colors[status.value])"
              [style.border-left]="'4px solid ' + getBorderColor(colors[status.value])">
              <div class="preview-icon">
                <mat-icon>{{status.icon}}</mat-icon>
              </div>
              <div class="preview-content">
                <div class="preview-title">{{status.previewTitle}}</div>
                <div class="preview-time">{{status.previewTime}}</div>
                <div class="preview-status">{{status.label}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div mat-dialog-actions>
        <button mat-stroked-button (click)="resetToDefaults()" color="warn">
          <mat-icon>refresh</mat-icon>
          Réinitialiser
        </button>
        <span class="spacer"></span>
        <button mat-button mat-dialog-close>Annuler</button>
        <button mat-raised-button color="primary" (click)="save()">Enregistrer</button>
      </div>
    </div>
  `,
  styles: [`
    .color-palette-dialog {
      position: relative;
      max-width: 800px;
      width: 100%;
      border-radius: 8px;
      background-color: white;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background-color: #f5f7fa;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .close-button {
      margin-right: -12px;
    }
    
    h2[mat-dialog-title] {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #3b82f6;
    }
    
    [mat-dialog-content] {
      padding: 20px;
      margin: 0;
      max-height: 70vh;
    }
    
    .color-selection-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 20px;
    }
    
    .status-colors {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .color-option {
      margin-bottom: 4px;
    }
    
    .color-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      background-color: #f9fafb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      transition: all 0.2s ease;
    }
    
    .color-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
    }
    
    .status-label {
      font-weight: 500;
      font-size: 14px;
    }
    
    .color-tools {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .color-input {
      width: 30px;
      height: 30px;
      padding: 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: transparent;
    }
    
    .preview-swatch {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .preview-item {
      display: flex;
      align-items: center;
      padding: 14px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    
    .preview-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }
    
    .preview-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      margin-right: 14px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .preview-content {
      display: flex;
      flex-direction: column;
    }
    
    .preview-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .preview-time {
      font-size: 12px;
      margin-bottom: 2px;
      opacity: 0.9;
    }
    
    .preview-status {
      font-size: 12px;
      font-style: italic;
      opacity: 0.8;
    }
    
    [mat-dialog-actions] {
      display: flex;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      margin: 0;
    }
    
    .spacer {
      flex: 1;
    }
    
    @media (max-width: 768px) {
      .color-selection-grid {
        grid-template-columns: 1fr;
      }
      
      .preview-container {
        margin-top: 12px;
      }
    }
  `]
})
export class ColorPaletteDialogComponent implements OnInit {
  // Colors object
  colors: ColorPalette;
  
  // Status definitions
  statusList: StatusItem[] = [
    { 
      value: 'pending', 
      label: 'En attente', 
      icon: 'event',
      previewTitle: 'Rendez-vous avec Dr. Martin',
      previewTime: '08:00 - 08:30'
    },
    { 
      value: 'accepted', 
      label: 'Accepté', 
      icon: 'event_available',
      previewTitle: 'Consultation dentaire',
      previewTime: '09:00 - 09:30'
    },
    { 
      value: 'completed', 
      label: 'Terminé', 
      icon: 'event_note',
      previewTitle: 'Détartrage complet',
      previewTime: '10:00 - 10:30'
    },
    { 
      value: 'rejected', 
      label: 'Refusé', 
      icon: 'event_busy',
      previewTitle: 'Examen radiologique',
      previewTime: '11:00 - 11:30'
    },
    { 
      value: 'canceled', 
      label: 'Annulé', 
      icon: 'event_busy',
      previewTitle: 'Consultation d\'urgence',
      previewTime: '12:00 - 12:30'
    }
  ];
  
  constructor(
    public dialogRef: MatDialogRef<ColorPaletteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColorPalette,
    private colorPreferenceService: ColorPreferenceService
  ) {
    // Initialize with provided colors or defaults
    this.colors = { ...this.colorPreferenceService.defaultColors };
    if (data) {
      this.colors = { ...data };
    }
  }
  
  ngOnInit() {
    // Fetch existing color preferences
    this.colorPreferenceService.getColorPreferences().subscribe({
      next: (preferences) => {
        this.colors = { ...preferences };
        // Apply colors to DOM to see changes live
        this.applyColorsToDom();
      },
      error: (error) => {
        console.error('Error fetching color preferences:', error);
      }
    });
  }

  // Helper method to determine if text should be dark or light
  getTextColor(backgroundColor: string): string {
    // Convert hex to RGB
    const r = parseInt(backgroundColor.substr(1, 2), 16);
    const g = parseInt(backgroundColor.substr(3, 2), 16);
    const b = parseInt(backgroundColor.substr(5, 2), 16);
    
    // Calculate brightness (perceived brightness formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black for light backgrounds, white for dark
    return brightness > 128 ? '#000000' : '#ffffff';
  }
  
  // Helper method to get border color
  getBorderColor(backgroundColor: string): string {
    // Convert hex to RGB
    let r = parseInt(backgroundColor.substr(1, 2), 16);
    let g = parseInt(backgroundColor.substr(3, 2), 16);
    let b = parseInt(backgroundColor.substr(5, 2), 16);
    
    // Make color darker by factor
    const darkenFactor = 0.7; // 30% darker
    
    r = Math.floor(r * darkenFactor);
    g = Math.floor(g * darkenFactor);
    b = Math.floor(b * darkenFactor);
    
    // Ensure no value goes below 0
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  updatePreviewAndApply(status: keyof ColorPalette) {
    // Apply colors immediately to see changes in real-time
    this.applyColorsToDom();
    
    // Also apply to calendar view in real-time
    this.colorPreferenceService.applyColorPreferencesToDOM(this.colors);
    
    // Apply to any existing calendar events by updating CSS variables
    document.documentElement.style.setProperty(`--status-${status}-bg`, this.colors[status]);
    document.documentElement.style.setProperty(`--status-${status}-text`, this.getTextColor(this.colors[status]));
    document.documentElement.style.setProperty(`--status-${status}-border`, this.getBorderColor(this.colors[status]));
    
    // Find any calendar API and force a re-render of the events
    setTimeout(() => {
      const calendarComponents = document.querySelectorAll('full-calendar');
      if (calendarComponents && calendarComponents.length > 0) {
        // Try to access the calendar API through the Angular component
        // This is a workaround to access the FullCalendar API directly
        // @ts-ignore: Accessing private Angular component API
        const calendarApi = calendarComponents[0]?.['_fullCalendar']?.getApi();
        if (calendarApi) {
          // Update all events to reflect the new colors
          calendarApi.getEvents().forEach((event: any) => {
            // This reapplies all CSS classes including status classes
            const classes = event.classNames;
            event.setProp('classNames', [...classes]);
          });
          // Force a re-render
          calendarApi.render();
        }
      }
    }, 10);
  }
  
  applyColorsToDom() {
    // Apply colors immediately to see changes in real-time
    this.colorPreferenceService.applyColorPreferencesToDOM(this.colors);
  }
  
  resetToDefaults() {
    this.colors = { ...this.colorPreferenceService.defaultColors };
    // Apply the default colors immediately
    this.applyColorsToDom();
  }
  
  save() {
    // First apply colors to DOM for immediate effect
    this.colorPreferenceService.applyColorPreferencesToDOM(this.colors);
    
    // Then close dialog with new colors
    this.dialogRef.close(this.colors);
  }
} 