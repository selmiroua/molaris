import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService, AppointmentStatus } from '../../core/services/appointment.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HttpClientModule } from '@angular/common/http';
import { format, subDays, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BilanMedicalService } from '../../core/services/bilan-medical.service';

interface AppointmentCount {
  name: string;
  value: number;
}

interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

interface TimelineData {
  name: Date;
  value: number;
}

@Component({
  selector: 'app-doctor-statistics',
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
        <h2>Statistiques et analyse des rendez-vous</h2>
        <p>Visualisation graphique de vos données de rendez-vous</p>
      </div>

      <!-- Bilan Médical - Ce mois-ci -->
      <div class="bilan-stats" *ngIf="!previewMode">
        <mat-card class="bilan-stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>payments</mat-icon>
            <mat-card-title>Statistiques Bilan Médical - Ce mois-ci</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="bilan-stats-grid">
              <div class="bilan-stat">
                <span class="bilan-stat-label">Montant total à payer</span>
                <span class="bilan-stat-value">{{ monthAmountToPay | number:'1.2-2' }} DT</span>
              </div>
              <div class="bilan-stat">
                <span class="bilan-stat-label">Montant total payé</span>
                <span class="bilan-stat-value">{{ monthAmountPaid | number:'1.2-2' }} DT</span>
              </div>
              <div class="bilan-stat">
                <span class="bilan-stat-label">Reste à payer total</span>
                <span class="bilan-stat-value">{{ monthRemainingToPay | number:'1.2-2' }} DT</span>
              </div>
              <div class="bilan-stat">
                <span class="bilan-stat-label">Nombre de bilans</span>
                <span class="bilan-stat-value">{{ monthBilans }}</span>
              </div>
            </div>
            <div class="bilan-charts-row">
              <div class="bilan-donut">
                <ngx-charts-pie-chart
                  [scheme]="colorScheme"
                  [results]="monthDonutData"
                  [gradient]="true"
                  [labels]="true"
                  [legend]="true"
                  [doughnut]="true"
                  [arcWidth]="0.5"
                  [explodeSlices]="false"
                  [trimLabels]="false"
                  [maxLabelLength]="20"
                  [tooltipDisabled]="false">
                </ngx-charts-pie-chart>
              </div>
              <div class="bilan-bar">
                <ngx-charts-bar-vertical
                  [scheme]="colorScheme"
                  [results]="monthBarData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Catégorie'"
                  [yAxisLabel]="'Montant (DT)'"
                  [animations]="true">
                </ngx-charts-bar-vertical>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bilan Médical - Tout le temps -->
      <div class="bilan-stats" *ngIf="!previewMode">
        <mat-card class="bilan-stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>payments</mat-icon>
            <mat-card-title>Statistiques Bilan Médical - Tout le temps</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="bilan-stats-grid">
              <div class="bilan-stat">
                <span class="bilan-stat-label">Montant total à payer</span>
                <span class="bilan-stat-value">{{ totalAmountToPay | number:'1.2-2' }} DT</span>
              </div>
              <div class="bilan-stat">
                <span class="bilan-stat-label">Montant total payé</span>
                <span class="bilan-stat-value">{{ totalAmountPaid | number:'1.2-2' }} DT</span>
              </div>
              <div class="bilan-stat">
                <span class="bilan-stat-label">Reste à payer total</span>
                <span class="bilan-stat-value">{{ totalRemainingToPay | number:'1.2-2' }} DT</span>
              </div>
              <div class="bilan-stat">
                <span class="bilan-stat-label">Nombre de bilans</span>
                <span class="bilan-stat-value">{{ totalBilans }}</span>
              </div>
            </div>
            <div class="bilan-charts-row">
              <div class="bilan-donut">
                <ngx-charts-pie-chart
                  [scheme]="colorScheme"
                  [results]="allTimeDonutData"
                  [gradient]="true"
                  [labels]="true"
                  [legend]="true"
                  [doughnut]="true"
                  [arcWidth]="0.5"
                  [explodeSlices]="false"
                  [trimLabels]="false"
                  [maxLabelLength]="20"
                  [tooltipDisabled]="false">
                </ngx-charts-pie-chart>
              </div>
              <div class="bilan-bar">
                <ngx-charts-bar-vertical
                  [scheme]="colorScheme"
                  [results]="allTimeBarData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Catégorie'"
                  [yAxisLabel]="'Montant (DT)'"
                  [animations]="true">
                </ngx-charts-bar-vertical>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
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
              <mat-card-title>Répartition par statut</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container preview-chart">
                <ngx-charts-pie-chart
                  [scheme]="colorScheme"
                  [results]="statusData"
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
              <mat-card-title>Évolution sur 7 jours</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container preview-chart">
                <ngx-charts-line-chart
                  [scheme]="colorScheme"
                  [results]="weeklyData"
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
              <mat-card-title>Répartition par statut</mat-card-title>
              <mat-card-subtitle>Répartition de vos rendez-vous par statut</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-pie-chart
                  [scheme]="colorScheme"
                  [results]="statusData"
                  [gradient]="true"
                  [labels]="true"
                  [legend]="true"
                  [legendTitle]="'Statuts'"
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
              <mat-icon mat-card-avatar>category</mat-icon>
              <mat-card-title>Types de rendez-vous</mat-card-title>
              <mat-card-subtitle>Répartition par type de prestation</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <ngx-charts-bar-vertical
                  [scheme]="colorScheme"
                  [results]="typeData"
                  [gradient]="true"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  [xAxisLabel]="'Type'"
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

    /* Styles pour le mode aperçu */
    .preview-mode {
      padding: 10px;
      height: 100%;
    }
    
    .preview-mode .statistics-content {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      height: 100%;
    }

    .preview-mode .chart-card {
      height: 250px;
      margin-bottom: 0;
    }

    .preview-mode .chart-container {
      height: 180px;
    }

    .preview-chart {
      height: 180px;
    }

    .chart-card {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      overflow: hidden;
      height: 450px;
    }

    .chart-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .wide-card {
      grid-column: span 2;
      height: 450px;
    }

    .chart-container {
      height: 370px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }

    mat-card-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    mat-card-content {
      padding: 16px;
      display: flex;
      justify-content: center;
    }

    mat-card-title {
      font-size: 18px;
      font-weight: 500;
    }

    mat-card-subtitle {
      color: #666;
    }

    mat-icon {
      color: #4054b4;
    }

    @media (max-width: 960px) {
      .statistics-content {
        grid-template-columns: 1fr;
      }

      .wide-card {
        grid-column: span 1;
      }
      
      .preview-mode .statistics-content {
        grid-template-columns: 1fr;
      }
    }

    .bilan-stats {
      margin-bottom: 24px;
    }
    .bilan-stat-card {
      margin-bottom: 16px;
      background: #f8fafc;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .bilan-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin-top: 12px;
    }
    .bilan-stat {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background: #fff;
      border-radius: 8px;
      padding: 16px 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      min-width: 180px;
    }
    .bilan-stat-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .bilan-stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }
  `]
})
export class DoctorStatisticsComponent implements OnInit {
  @Input() previewMode: boolean = false;
  
  loading = true;
  statusData: AppointmentCount[] = [];
  typeData: AppointmentCount[] = [];
  weeklyData: ChartData[] = [];
  hourlyData: any[] = [];
  
  // Nouveaux champs pour les stats financières
  totalAmountToPay: number = 0;
  totalAmountPaid: number = 0;
  totalRemainingToPay: number = 0;
  totalBilans: number = 0;

  // Pour ce mois-ci
  monthAmountToPay: number = 0;
  monthAmountPaid: number = 0;
  monthRemainingToPay: number = 0;
  monthBilans: number = 0;
  monthDonutData: any[] = [];
  monthBarData: any[] = [];

  // Pour tout le temps
  allTimeDonutData: any[] = [];
  allTimeBarData: any[] = [];
  
  // Configuration des couleurs pour les graphiques
  colorScheme: any = {
    domain: ['#3F51B5', '#4CAF50', '#FF5722', '#9C27B0', '#FFC107', '#03A9F4', '#E91E63']
  };
  
  // Configuration de la courbe pour le graphique en ligne
  curve: any = 'cardinal';

  constructor(private appointmentService: AppointmentService, private bilanMedicalService: BilanMedicalService) {}

  ngOnInit(): void {
    this.loadStatisticsData();
    this.loadBilanStats();
  }

  loadStatisticsData(): void {
    this.loading = true;
    
    this.appointmentService.getMyDoctorAppointments().subscribe({
      next: (appointments) => {
        // Traitement des données pour les différents graphiques
        this.processStatusData(appointments);
        this.processTypeData(appointments);
        this.processWeeklyData(appointments);
        this.processHourlyData(appointments);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données de statistiques:', error);
        this.loading = false;
        
        // En cas d'erreur, utiliser des données fictives pour la démo
        this.loadDemoData();
      }
    });
  }

  loadBilanStats(): void {
    console.log('DoctorStatistics: Loading bilan stats...');
    this.bilanMedicalService.getMyBilans().subscribe({
      next: (bilans) => {
        console.log('DoctorStatistics: Received bilans:', bilans);
        
        // Check if bilans is null or not an array
        if (!bilans || !Array.isArray(bilans)) {
          console.error('DoctorStatistics: Invalid bilans data received:', bilans);
          this.resetBilanStats();
          return;
        }
        
        // All time
        this.totalBilans = bilans.length;
        console.log('DoctorStatistics: Total bilans count:', this.totalBilans);
        
        // Process financial data - handle potential null/undefined values
        this.totalAmountToPay = bilans.reduce((sum, b) => {
          const amount = b && b.amountToPay ? Number(b.amountToPay) : 0;
          return sum + amount;
        }, 0);
        
        this.totalAmountPaid = bilans.reduce((sum, b) => {
          const amount = b && b.amountPaid ? Number(b.amountPaid) : 0;
          return sum + amount;
        }, 0);
        
        this.totalRemainingToPay = bilans.reduce((sum, b) => {
          const amount = b && b.remainingToPay ? Number(b.remainingToPay) : 0;
          return sum + amount;
        }, 0);
        
        console.log('DoctorStatistics: Financial totals:', {
          toPay: this.totalAmountToPay,
          paid: this.totalAmountPaid,
          remaining: this.totalRemainingToPay
        });
        
        // Create chart data
        this.allTimeDonutData = [
          { name: 'Payé', value: this.totalAmountPaid },
          { name: 'Reste à payer', value: this.totalRemainingToPay }
        ];
        
        this.allTimeBarData = [
          { name: 'À payer', value: this.totalAmountToPay },
          { name: 'Payé', value: this.totalAmountPaid },
          { name: 'Reste', value: this.totalRemainingToPay }
        ];
        
        // This month
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        
        // Filter bilans for current month, safely handling missing dates
        const monthBilans = bilans.filter(b => {
          try {
            if (!b || !b.dateCreation) return false;
            const date = new Date(b.dateCreation);
            return date >= start && date <= end;
          } catch (err) {
            console.error('Error parsing date:', err);
            return false;
          }
        });
        
        console.log('DoctorStatistics: Month bilans count:', monthBilans.length);
        
        this.monthBilans = monthBilans.length;
        this.monthAmountToPay = monthBilans.reduce((sum, b) => sum + (Number(b.amountToPay) || 0), 0);
        this.monthAmountPaid = monthBilans.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);
        this.monthRemainingToPay = monthBilans.reduce((sum, b) => sum + (Number(b.remainingToPay) || 0), 0);
        
        this.monthDonutData = [
          { name: 'Payé', value: this.monthAmountPaid },
          { name: 'Reste à payer', value: this.monthRemainingToPay }
        ];
        
        this.monthBarData = [
          { name: 'À payer', value: this.monthAmountToPay },
          { name: 'Payé', value: this.monthAmountPaid },
          { name: 'Reste', value: this.monthRemainingToPay }
        ];
        
        console.log('DoctorStatistics: Chart data prepared:', {
          allTimeDonut: this.allTimeDonutData,
          allTimeBar: this.allTimeBarData,
          monthDonut: this.monthDonutData,
          monthBar: this.monthBarData
        });
      },
      error: (err) => {
        console.error('DoctorStatistics: Error loading bilan stats:', err);
        this.resetBilanStats();
      }
    });
  }
  
  // Helper method to reset all bilan stats
  private resetBilanStats(): void {
    this.totalBilans = 0;
    this.totalAmountToPay = 0;
    this.totalAmountPaid = 0;
    this.totalRemainingToPay = 0;
    this.monthBilans = 0;
    this.monthAmountToPay = 0;
    this.monthAmountPaid = 0;
    this.monthRemainingToPay = 0;
    this.monthDonutData = [];
    this.monthBarData = [];
    this.allTimeDonutData = [];
    this.allTimeBarData = [];
  }

  private processStatusData(appointments: any[]): void {
    // Compter les rendez-vous par statut
    const statusCounts: { [key: string]: number } = {
      'En attente': 0,
      'Accepté': 0,
      'Annulé': 0,
      'Terminé': 0,
      'Rejeté': 0
    };

    // Log pour débogage
    console.log('Analyse des statuts de rendez-vous:', appointments.map(a => a.status));

    appointments.forEach(appointment => {
      // Normaliser le statut (convertir en majuscules pour la comparaison)
      const status = appointment.status ? appointment.status.toUpperCase() : '';
      
      // Utiliser la valeur normalisée pour la comparaison
      if (status === 'PENDING' || status === 'EN_ATTENTE') {
        statusCounts['En attente']++;
      } else if (status === 'ACCEPTED' || status === 'ACCEPTE' || status === 'ACCEPTÉ') {
        statusCounts['Accepté']++;
      } else if (status === 'CANCELED' || status === 'CANCELLED' || status === 'ANNULE' || status === 'ANNULÉ') {
        statusCounts['Annulé']++;
      } else if (status === 'COMPLETED' || status === 'TERMINE' || status === 'TERMINÉ') {
        statusCounts['Terminé']++;
      } else if (status === 'REJECTED' || status === 'REJETE' || status === 'REJETÉ') {
        statusCounts['Rejeté']++;
      } else if (status) {
        // Si le statut existe mais ne correspond à aucun cas connu
        console.warn(`Statut de rendez-vous non reconnu: ${appointment.status}`);
      }
    });

    console.log('Comptage des statuts:', statusCounts);

    // Transformer en format pour le graphique, en excluant les statuts avec 0 rendez-vous
    this.statusData = Object.keys(statusCounts)
      .filter(key => statusCounts[key] > 0)
      .map(key => ({
        name: key,
        value: statusCounts[key]
      }));
    
    console.log('Données de statut pour le graphique:', this.statusData);
    
    // Si aucun statut n'a de valeur, ajouter des données factices pour éviter un graphique vide
    if (this.statusData.length === 0) {
      this.statusData = [
        { name: 'Aucune donnée', value: 1 }
      ];
    }
  }

  private processTypeData(appointments: any[]): void {
    // Compter les rendez-vous par type
    const typeCounts: { [key: string]: number } = {
      'Détartrage': 0,
      'Soins': 0,
      'Extraction': 0,
      'Blanchiment': 0,
      'Orthodontie': 0
    };

    appointments.forEach(appointment => {
      switch (appointment.appointmentType) {
        case 'DETARTRAGE':
          typeCounts['Détartrage']++;
          break;
        case 'SOIN':
          typeCounts['Soins']++;
          break;
        case 'EXTRACTION':
          typeCounts['Extraction']++;
          break;
        case 'BLANCHIMENT':
          typeCounts['Blanchiment']++;
          break;
        case 'ORTHODONTIE':
          typeCounts['Orthodontie']++;
          break;
      }
    });

    // Transformer en format pour le graphique
    this.typeData = Object.keys(typeCounts).map(key => ({
      name: key,
      value: typeCounts[key]
    }));
  }

  private processWeeklyData(appointments: any[]): void {
    // Générer un tableau de dates pour les 7 derniers jours
    const today = new Date();
    const lastWeek = subDays(today, 6);
    
    // Create array of dates manually instead of using eachDayOfInterval
    const dateRange: Date[] = [];
    let currentDate = new Date(lastWeek);
    while (currentDate <= today) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialiser les compteurs à zéro pour chaque jour
    const dayCounts: { [key: string]: number } = {};
    dateRange.forEach((date: Date) => {
      dayCounts[format(date, 'yyyy-MM-dd')] = 0;
    });

    // Compter les rendez-vous par jour
    appointments.forEach(appointment => {
      const appointmentDate = format(new Date(appointment.appointmentDateTime), 'yyyy-MM-dd');
      if (dayCounts[appointmentDate] !== undefined) {
        dayCounts[appointmentDate]++;
      }
    });

    // Transformer en format pour le graphique
    const series = Object.keys(dayCounts).map(date => ({
      name: format(parseISO(date), 'dd/MM'),
      value: dayCounts[date]
    }));

    this.weeklyData = [{
      name: 'Rendez-vous',
      series: series
    }];
  }

  private processHourlyData(appointments: any[]): void {
    // Initialiser la matrice des heures (8h à 18h)
    const hours = Array.from({ length: 11 }, (_, i) => i + 8);
    
    // Initialiser la matrice des jours (Lundi à Dimanche)
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    // Initialiser les données avec des zéros
    const hourlyMatrix: { [key: string]: { [key: string]: number } } = {};
    
    days.forEach(day => {
      hourlyMatrix[day] = {};
      hours.forEach(hour => {
        hourlyMatrix[day][`${hour}h`] = 0;
      });
    });
    
    // Compter les rendez-vous par heure et jour
    appointments.forEach(appointment => {
      const date = new Date(appointment.appointmentDateTime);
      const dayOfWeek = format(date, 'EEEE');
      // Format day name and capitalize first letter
      const capitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
      const hour = date.getHours();
      
      if (hourlyMatrix[capitalized] && hourlyMatrix[capitalized][`${hour}h`] !== undefined) {
        hourlyMatrix[capitalized][`${hour}h`]++;
      }
    });
    
    // Transformer en format pour le graphique de chaleur
    this.hourlyData = days.map(day => {
      return {
        name: day,
        series: hours.map(hour => ({
          name: `${hour}h`,
          value: hourlyMatrix[day][`${hour}h`]
        }))
      };
    });
  }

  private loadDemoData(): void {
    // Données de démonstration pour le graphique par statut
    this.statusData = [
      { name: 'En attente', value: 8 },
      { name: 'Accepté', value: 15 },
      { name: 'Terminé', value: 22 },
      { name: 'Annulé', value: 5 }
    ];

    // Données de démonstration pour le graphique par type
    this.typeData = [
      { name: 'Détartrage', value: 14 },
      { name: 'Soins', value: 18 },
      { name: 'Extraction', value: 8 },
      { name: 'Blanchiment', value: 6 },
      { name: 'Orthodontie', value: 4 }
    ];

    // Données de démonstration pour l'évolution hebdomadaire
    this.weeklyData = [{
      name: 'Rendez-vous',
      series: [
        { name: 'Lun', value: 5 },
        { name: 'Mar', value: 8 },
        { name: 'Mer', value: 6 },
        { name: 'Jeu', value: 9 },
        { name: 'Ven', value: 7 },
        { name: 'Sam', value: 4 },
        { name: 'Dim', value: 2 }
      ]
    }];

    // Données de démonstration pour la distribution horaire
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    this.hourlyData = days.map(day => {
      return {
        name: day,
        series: Array.from({ length: 11 }, (_, i) => {
          const hour = i + 8;
          return {
            name: `${hour}h`,
            value: Math.floor(Math.random() * 5)
          };
        })
      };
    });
  }

  // Formater la valeur pour l'affichage dans le graphique
  formatValue(value: number): string {
    return value.toString(); // Afficher seulement le nombre sans décimales
  }
  
  // Formater le libellé pour l'affichage dans le graphique
  formatLabel(label: string): string {
    // Limiter la longueur du libellé si nécessaire
    return label.length > 15 ? label.substring(0, 12) + '...' : label;
  }
} 