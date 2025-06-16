import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

interface ToothProblem {
  toothNumber: number;
  condition: string;
  treatment: string;
  notes: string;
}

@Component({
  selector: 'app-dental-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="dental-chart-container">
      <div class="chart-header">
        <h2>Medical service</h2>
        <div class="step-indicator">
          <span class="step active">1</span>
          <span class="step">2</span>
        </div>
      </div>

      <div class="chart-subheader">
        Select a problem tooths
      </div>

      <div class="dental-chart">
        <!-- Upper Teeth -->
        <div class="teeth-row upper">
          <div *ngFor="let i of upperTeeth" 
               class="tooth" 
               [class.active]="selectedTooth === i"
               [class.has-problem]="hasToothProblem(i)"
               (click)="selectTooth(i)">
            {{ i }}
          </div>
        </div>

        <!-- Lower Teeth -->
        <div class="teeth-row lower">
          <div *ngFor="let i of lowerTeeth" 
               class="tooth"
               [class.active]="selectedTooth === i"
               [class.has-problem]="hasToothProblem(i)"
               (click)="selectTooth(i)">
            {{ i }}
          </div>
        </div>
      </div>

      <!-- Problem Form -->
      <div class="problem-form" *ngIf="selectedTooth">
        <div class="tooth-identifier">
          <mat-icon>medical_services</mat-icon>
          <span>{{ getToothName(selectedTooth) }}</span>
          <div class="tooth-number">{{ selectedTooth }}</div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Condition</mat-label>
          <mat-select [(ngModel)]="currentProblem.condition">
            <mat-option value="caries">Caries</mat-option>
            <mat-option value="filling">Filling needed</mat-option>
            <mat-option value="crown">Crown needed</mat-option>
            <mat-option value="extraction">Extraction needed</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Treatment</mat-label>
          <mat-select [(ngModel)]="currentProblem.treatment">
            <mat-option value="filling">Filling</mat-option>
            <mat-option value="root-canal">Root Canal</mat-option>
            <mat-option value="crown">Crown</mat-option>
            <mat-option value="extraction">Extraction</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="currentProblem.notes" rows="3"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <button mat-button color="warn" (click)="clearSelection()">
            <mat-icon>delete</mat-icon>
            Clear
          </button>
          <button mat-raised-button color="primary" (click)="saveProblem()">
            <mat-icon>save</mat-icon>
            Save
          </button>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="dot recent"></span>
          Recent findings
        </div>
        <div class="legend-item">
          <span class="dot treated"></span>
          Has treatment
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dental-chart-container {
      padding: 24px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        margin: 0;
        font-size: 20px;
        color: #2e3d54;
      }
    }

    .step-indicator {
      display: flex;
      gap: 8px;

      .step {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #eee;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #666;

        &.active {
          background: #4e5eeb;
          color: white;
        }
      }
    }

    .chart-subheader {
      color: #666;
      margin-bottom: 32px;
    }

    .dental-chart {
      display: flex;
      flex-direction: column;
      gap: 32px;
      margin-bottom: 32px;
    }

    .teeth-row {
      display: grid;
      grid-template-columns: repeat(16, 1fr);
      gap: 4px;

      &.upper {
        margin-bottom: 16px;
      }
    }

    .tooth {
      aspect-ratio: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #4e5eeb;
        background: rgba(78, 94, 235, 0.1);
      }

      &.active {
        border-color: #4e5eeb;
        background: rgba(78, 94, 235, 0.1);
        color: #4e5eeb;
      }

      &.has-problem {
        background: rgba(239, 83, 80, 0.1);
        border-color: #ef5350;
        color: #ef5350;
      }
    }

    .problem-form {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .tooth-identifier {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #2e3d54;
      font-weight: 500;

      mat-icon {
        color: #4e5eeb;
      }

      .tooth-number {
        background: rgba(78, 94, 235, 0.1);
        color: #4e5eeb;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    .legend {
      display: flex;
      gap: 24px;
      margin-top: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.recent {
        background: #ef5350;
      }

      &.treated {
        background: #4e5eeb;
      }
    }
  `]
})
export class DentalChartComponent {
  @Input() patientId?: number;
  @Output() problemSaved = new EventEmitter<ToothProblem>();

  upperTeeth = Array.from({length: 16}, (_, i) => i + 11);
  lowerTeeth = Array.from({length: 16}, (_, i) => i + 41);
  
  selectedTooth: number | null = null;
  currentProblem: ToothProblem = {
    toothNumber: 0,
    condition: '',
    treatment: '',
    notes: ''
  };

  problems: ToothProblem[] = [];

  selectTooth(toothNumber: number) {
    this.selectedTooth = toothNumber;
    this.currentProblem = {
      toothNumber,
      condition: '',
      treatment: '',
      notes: ''
    };

    // Check if tooth already has a problem
    const existingProblem = this.problems.find(p => p.toothNumber === toothNumber);
    if (existingProblem) {
      this.currentProblem = {...existingProblem};
    }
  }

  getToothName(number: number): string {
    if (number >= 11 && number <= 18) return `Upper Right ${number - 10}`;
    if (number >= 21 && number <= 28) return `Upper Left ${number - 20}`;
    if (number >= 31 && number <= 38) return `Lower Left ${number - 30}`;
    if (number >= 41 && number <= 48) return `Lower Right ${number - 40}`;
    return '';
  }

  hasToothProblem(toothNumber: number): boolean {
    return this.problems.some(p => p.toothNumber === toothNumber);
  }

  saveProblem() {
    if (!this.selectedTooth) return;

    const problemIndex = this.problems.findIndex(p => p.toothNumber === this.selectedTooth);
    if (problemIndex >= 0) {
      this.problems[problemIndex] = {...this.currentProblem};
    } else {
      this.problems.push({...this.currentProblem});
    }

    this.problemSaved.emit(this.currentProblem);
    this.clearSelection();
  }

  clearSelection() {
    this.selectedTooth = null;
    this.currentProblem = {
      toothNumber: 0,
      condition: '',
      treatment: '',
      notes: ''
    };
  }
} 