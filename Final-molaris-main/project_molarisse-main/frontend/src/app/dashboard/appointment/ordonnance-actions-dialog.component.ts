import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ordonnance-actions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">Ordonnance existante</h2>
      
      <div mat-dialog-content class="dialog-content">
        <div class="tooth-info">
          <div class="tooth-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <span class="tooth-number">Dent {{data.toothNum}}</span>
            <span class="tooth-name">{{data.toothName}}</span>
          </div>
        </div>
        
        <p class="question">Que souhaitez-vous faire avec cette ordonnance?</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button class="btn-view" (click)="dialogRef.close('view')">Consulter</button>
        <button mat-button class="btn-edit" (click)="dialogRef.close('edit')">Modifier</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 16px;
      max-width: 100%;
    }
    
    .dialog-title {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #3b82f6;
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .dialog-content {
      padding: 0;
    }
    
    .tooth-info {
      display: flex;
      align-items: center;
      background-color: #f0f9ff;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 16px;
    }
    
    .tooth-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background-color: #3b82f6;
      color: white;
      margin-right: 12px;
    }
    
    .tooth-number {
      display: block;
      font-weight: 600;
      font-size: 16px;
      color: #1e293b;
    }
    
    .tooth-name {
      display: block;
      font-size: 13px;
      color: #64748b;
    }
    
    .question {
      font-size: 15px;
      color: #334155;
      margin: 0 0 16px 0;
      text-align: center;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 0;
      margin: 0;
    }
    
    .btn-view, .btn-edit {
      flex: 1;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 12px;
      min-height: 40px;
    }
    
    .btn-view {
      background-color: #f1f5f9;
      color: #475569;
    }
    
    .btn-edit {
      background-color: #3b82f6;
      color: white;
    }
    
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 8px !important;
    }
  `]
})
export class OrdonnanceActionsDialog {
  constructor(
    public dialogRef: MatDialogRef<OrdonnanceActionsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {toothNum: number, toothName: string}
  ) {}
}
