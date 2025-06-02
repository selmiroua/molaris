import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HttpClientModule } from '@angular/common/http';
import { AdminService, StatCount, ChartData } from '../../services/admin.service';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    NgxChartsModule,
    HttpClientModule
  ],
  template: `
    <div class="statistics-container" [class.preview-mode]="previewMode">
      <div class="statistics-header" *ngIf="!previewMode">
        <h2>Statistiques et analyse de la plateforme</h2>
        <p>Visualisation graphique des données de la plateforme</p>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement des statistiques...</p>
      </div>

      <div class="statistics-content" *ngIf="!loading">
        <!-- En mode aperçu, n'afficher que les graphiques principaux -->
        <ng-container *ngIf="previewMode">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>pie_chart</mat-icon>
              <mat-card-title>Répartition des utilisateurs</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container preview-chart">
                <ngx-charts-pie-chart
                  [scheme]="colorScheme"
                  [results]="userTypeData"
                  [gradient]="true"
                  [labels]="true"
                  [legend]="false"
                  [doughnut]="true"
                  [arcWidth]="0.5"
                  [explodeSlices]="false"
                  [trimLabels]="true"
                  [maxLabelLength]="10"
                  [tooltipDisabled]="false">
                </ngx-charts-pie-chart>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>timeline</mat-icon>
              <mat-card-title>Évolution des inscriptions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container preview-chart">
                <ngx-charts-line-chart
                  [scheme]="colorScheme"
                  [results]="registrationData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="false"
                  [timeline]="false"
                  [curve]="curve">
                </ngx-charts-line-chart>
              </div>
            </mat-card-content>
          </mat-card>
        </ng-container>

        <!-- Mode complet - afficher tous les graphiques -->
        <ng-container *ngIf="!previewMode">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>pie_chart</mat-icon>
              <mat-card-title>Répartition des utilisateurs</mat-card-title>
              <mat-card-subtitle>Répartition par type d'utilisateur</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-pie-chart
                  [scheme]="colorScheme"
                  [results]="userTypeData"
                  [gradient]="true"
                  [labels]="true"
                  [legend]="true"
                  [legendTitle]="'Types utilisateurs'"
                  [doughnut]="true"
                  [arcWidth]="0.5"
                  [explodeSlices]="false"
                  [trimLabels]="false"
                  [maxLabelLength]="20"
                  [tooltipDisabled]="false">
                </ngx-charts-pie-chart>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>verified_user</mat-icon>
              <mat-card-title>État des vérifications</mat-card-title>
              <mat-card-subtitle>Statut des demandes de vérification</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-bar-vertical
                  [scheme]="colorScheme"
                  [results]="verificationStatusData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Statut'"
                  [yAxisLabel]="'Nombre'"
                  [animations]="true">
                </ngx-charts-bar-vertical>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card wide-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>timeline</mat-icon>
              <mat-card-title>Évolution des inscriptions</mat-card-title>
              <mat-card-subtitle>Nombre d'inscriptions sur les 30 derniers jours</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-line-chart
                  [scheme]="colorScheme"
                  [results]="registrationData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Date'"
                  [yAxisLabel]="'Inscriptions'"
                  [timeline]="true"
                  [curve]="curve">
                </ngx-charts-line-chart>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card wide-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>calendar_today</mat-icon>
              <mat-card-title>Rendez-vous par jour</mat-card-title>
              <mat-card-subtitle>Nombre de rendez-vous par jour de la semaine</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-bar-vertical
                  [scheme]="colorScheme"
                  [results]="appointmentsByDayData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Jour'"
                  [yAxisLabel]="'Nombre'"
                  [animations]="true">
                </ngx-charts-bar-vertical>
              </div>
            </mat-card-content>
          </mat-card>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 20px;
      height: 100%;
      overflow-y: auto;
    }

    .statistics-header {
      margin-bottom: 20px;
      text-align: center;
    }

    .statistics-header h2 {
      font-size: 24px;
      font-weight: 500;
      color: #333;
      margin-bottom: 5px;
    }

    .statistics-header p {
      color: #666;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
    }

    .statistics-content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 20px;
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }

    .wide-card {
      grid-column: span 2;
    }

    /* Styles pour le mode aperçu */
    .preview-mode {
      padding: 10px;
      height: 100%;
    }

    .preview-mode .statistics-content {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .preview-chart {
      height: 200px;
    }

    @media (max-width: 960px) {
      .wide-card {
        grid-column: span 1;
      }
    }
  `]
})
export class AdminStatisticsComponent implements OnInit {
  @Input() previewMode: boolean = false;
  loading = true;
  userTypeData: StatCount[] = [];
  verificationStatusData: StatCount[] = [];
  registrationData: ChartData[] = [];
  appointmentsByDayData: StatCount[] = [];

  colorScheme: any = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#4e5eeb', '#00bcd4', '#ff9800']
  };

  curve: any = 'cardinal';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStatisticsData();
  }

  loadStatisticsData(): void {
    this.loading = true;
    
    // Use forkJoin to make parallel API calls
    forkJoin({
      userTypes: this.adminService.getUserTypeDistribution(),
      verificationStatus: this.adminService.getVerificationStatusDistribution(),
      appointmentsByDay: this.adminService.getAppointmentsByDayOfWeek()
    }).subscribe({
      next: (results) => {
        this.userTypeData = results.userTypes;
        this.verificationStatusData = results.verificationStatus;
        this.appointmentsByDayData = results.appointmentsByDay;
        
        // Generate registration timeline data
        this.generateRegistrationData();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading statistics data:', error);
        // Load demo data as fallback
        this.loadDemoData();
        this.loading = false;
      }
    });
  }

  private generateRegistrationData(): void {
    // Generate mock registration data for the last 30 days
    const registrationSeries = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      registrationSeries.push({
        name: format(date, 'dd MMM', { locale: fr }),
        value: Math.floor(Math.random() * 10) + 1
      });
    }
    this.registrationData = [
      {
        name: 'Inscriptions',
        series: registrationSeries
      }
    ];
  }

  private loadDemoData(): void {
    // User type distribution
    this.userTypeData = [
      { name: 'Médecins', value: 66 },
      { name: 'Patients', value: 1250 },
      { name: 'Secrétaires', value: 45 },
      { name: 'Administrateurs', value: 5 }
    ];

    // Verification status
    this.verificationStatusData = [
      { name: 'En attente', value: 12 },
      { name: 'Approuvées', value: 58 },
      { name: 'Rejetées', value: 8 }
    ];

    // Registration data (last 30 days)
    this.generateRegistrationData();

    // Appointments by day of week
    this.appointmentsByDayData = [
      { name: 'Lundi', value: 45 },
      { name: 'Mardi', value: 52 },
      { name: 'Mercredi', value: 38 },
      { name: 'Jeudi', value: 42 },
      { name: 'Vendredi', value: 56 },
      { name: 'Samedi', value: 30 },
      { name: 'Dimanche', value: 0 }
    ];
  }

  formatValue(value: number): string {
    return value.toString();
  }

  formatLabel(label: string): string {
    return label;
  }
}
