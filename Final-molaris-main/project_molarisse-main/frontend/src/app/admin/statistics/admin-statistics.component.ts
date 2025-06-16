import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HttpClientModule } from '@angular/common/http';
import { AdminService, StatCount, ChartData, AdminStats } from '../../services/admin.service';
import { format, subDays } from 'date-fns';
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
        <!-- Dashboard Summary Cards -->
        <div class="dashboard-summary" *ngIf="!previewMode && dashboardStats">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon doctor-icon">
                <mat-icon>local_hospital</mat-icon>
              </div>
              <div class="summary-details">
                <h3>{{ dashboardStats.totalDoctors }}</h3>
                <p>Médecins</p>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon patient-icon">
                <mat-icon>people</mat-icon>
              </div>
              <div class="summary-details">
                <h3>{{ dashboardStats.totalPatients }}</h3>
                <p>Patients</p>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon users-icon">
                <mat-icon>group</mat-icon>
              </div>
              <div class="summary-details">
                <h3>{{ dashboardStats.totalUsers }}</h3>
                <p>Utilisateurs</p>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon verification-icon">
                <mat-icon>verified_user</mat-icon>
              </div>
              <div class="summary-details">
                <h3>{{ dashboardStats.pendingVerifications }}</h3>
                <p>Vérifications en attente</p>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon appointment-icon">
                <mat-icon>event</mat-icon>
              </div>
              <div class="summary-details">
                <h3>{{ dashboardStats.totalAppointments }}</h3>
                <p>Rendez-vous</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        
        <!-- En mode aperçu, n'afficher que les graphiques principaux -->
        <ng-container *ngIf="previewMode">
          <!-- Stats Summary Cards for Preview Mode -->
          <div class="stats-summary-preview">
            <div class="stat-card">
              <div class="stat-icon doctor-icon">
                <mat-icon>local_hospital</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ dashboardStats?.totalDoctors || 0 }}</div>
                <div class="stat-label">Médecins</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon patient-icon">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ dashboardStats?.totalPatients || 0 }}</div>
                <div class="stat-label">Patients</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon users-icon">
                <mat-icon>group</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ dashboardStats?.totalUsers || 0 }}</div>
                <div class="stat-label">Utilisateurs</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon verification-icon">
                <mat-icon>verified_user</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ dashboardStats?.pendingVerifications || 0 }}</div>
                <div class="stat-label">Vérifications en attente</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon appointment-icon">
                <mat-icon>event</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ dashboardStats?.totalAppointments || 0 }}</div>
                <div class="stat-label">Rendez-vous</div>
              </div>
            </div>
          </div>

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
              <mat-icon mat-card-avatar>dashboard</mat-icon>
              <mat-card-title>Résumé de la plateforme</mat-card-title>
              <mat-card-subtitle>Statistiques générales de la plateforme</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container preview-chart">
                <ngx-charts-bar-horizontal
                  [scheme]="colorScheme"
                  [results]="[
                    { name: 'Médecins', value: dashboardStats?.totalDoctors || 0 },
                    { name: 'Patients', value: dashboardStats?.totalPatients || 0 },
                    { name: 'Utilisateurs', value: dashboardStats?.totalUsers || 0 },
                    { name: 'Vérifications en attente', value: dashboardStats?.pendingVerifications || 0 },
                    { name: 'Rendez-vous', value: dashboardStats?.totalAppointments || 0 }
                  ]"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="false"
                  [animations]="true">
                </ngx-charts-bar-horizontal>
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

          <!-- New Chart for Dashboard Stats -->
          <mat-card class="chart-card wide-card" *ngIf="dashboardStats">
            <mat-card-header>
              <mat-icon mat-card-avatar>dashboard</mat-icon>
              <mat-card-title>Résumé de la plateforme</mat-card-title>
              <mat-card-subtitle>Statistiques générales de la plateforme</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-bar-horizontal
                  [scheme]="colorScheme"
                  [results]="[
                    { name: 'Médecins', value: dashboardStats.totalDoctors },
                    { name: 'Patients', value: dashboardStats.totalPatients },
                    { name: 'Utilisateurs', value: dashboardStats.totalUsers },
                    { name: 'Vérifications en attente', value: dashboardStats.pendingVerifications },
                    { name: 'Rendez-vous', value: dashboardStats.totalAppointments }
                  ]"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Nombre'"
                  [yAxisLabel]="'Catégorie'"
                  [animations]="true">
                </ngx-charts-bar-horizontal>
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

    /* Dashboard summary styles */
    .dashboard-summary {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 20px;
      grid-column: span 2;
    }

    .summary-card {
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .summary-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .summary-card mat-card-content {
      display: flex;
      align-items: center;
      padding: 15px;
    }

    .summary-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 15px;
    }

    .summary-icon mat-icon {
      font-size: 24px;
      color: white;
    }

    .doctor-icon {
      background-color: #5AA454;
    }

    .patient-icon {
      background-color: #A10A28;
    }

    .users-icon {
      background-color: #C7B42C;
    }

    .verification-icon {
      background-color: #4e5eeb;
    }

    .appointment-icon {
      background-color: #00bcd4;
    }

    .summary-details h3 {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
      line-height: 1.2;
    }

    .summary-details p {
      margin: 5px 0 0;
      color: #666;
      font-size: 14px;
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
    
    .stats-summary-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
      justify-content: space-between;
    }
    
    .stats-summary-preview .stat-card {
      flex: 1;
      min-width: 120px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 10px;
      display: flex;
      align-items: center;
    }
    
    .stat-card .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
    }
    
    .stat-card .stat-icon mat-icon {
      color: white;
      font-size: 20px;
      height: 20px;
      width: 20px;
      line-height: 20px;
    }
    
    .stat-card .stat-info .stat-value {
      font-size: 18px;
      font-weight: 500;
    }
    
    .stat-card .stat-info .stat-label {
      font-size: 12px;
      color: #666;
    }
    
    .doctor-icon {
      background-color: #5AA454;
    }
    
    .patient-icon {
      background-color: #A10A28;
    }
    
    .users-icon {
      background-color: #C7B42C;
    }
    
    .verification-icon {
      background-color: #4e5eeb;
    }
    
    .appointment-icon {
      background-color: #00bcd4;
    }

    @media (max-width: 960px) {
      .wide-card {
        grid-column: span 1;
      }
      
      .dashboard-summary {
        grid-template-columns: repeat(2, 1fr);
        grid-column: span 1;
      }
    }
    
    @media (max-width: 600px) {
      .dashboard-summary {
        grid-template-columns: 1fr;
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
  dashboardStats: AdminStats | null = {
    totalDoctors: 0,
    totalPatients: 0,
    totalUsers: 0,
    pendingVerifications: 0,
    totalAppointments: 0
  };

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
      appointmentsByDay: this.adminService.getAppointmentsByDayOfWeek(),
      dashboardStats: this.adminService.getStats()
    }).subscribe({
      next: (results) => {
        this.userTypeData = results.userTypes;
        this.verificationStatusData = results.verificationStatus;
        this.appointmentsByDayData = results.appointmentsByDay;
        this.dashboardStats = results.dashboardStats;
        
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
        name: format(date, 'dd MMM'),
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
    
    // Dashboard summary stats
    this.dashboardStats = {
      totalDoctors: 66,
      totalPatients: 1250,
      totalUsers: 1366,
      pendingVerifications: 12,
      totalAppointments: 458
    };
  }

  formatValue(value: number): string {
    return value.toString();
  }

  formatLabel(label: string): string {
    return label;
  }
} 