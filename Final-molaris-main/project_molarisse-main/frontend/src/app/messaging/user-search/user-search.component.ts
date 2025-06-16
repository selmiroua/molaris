import { Component, OnInit, EventEmitter, Output, Input, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../auth/auth.service';
import { User, Role } from '../../core/models/user.model';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MessagingService } from '../../core/services/messaging.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatRippleModule
  ],
  template: `
    <div class="user-search-container">
      <div class="search-form" *ngIf="!externalSearch">
        <mat-form-field appearance="outline" class="search-input">
          <mat-label>Rechercher dans le tableau</mat-label>
          <input 
            matInput 
            [(ngModel)]="internalSearchQuery" 
            placeholder="Nom, prénom..."
            (keyup)="onInternalSearchChange()">
          <button 
            *ngIf="internalSearchQuery" 
            matSuffix 
            mat-icon-button 
            aria-label="Clear" 
            (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
          <mat-icon matSuffix *ngIf="!internalSearchQuery">search</mat-icon>
        </mat-form-field>
      </div>
      
      <!-- Message d'explication -->
      <div class="explanation-box" *ngIf="!loading">
        <div class="explanation-content">
          <mat-icon class="info-icon">info</mat-icon>
          <span *ngIf="userRole.toLowerCase() === 'doctor' || userRole.toLowerCase() === 'medecin' || userRole.toLowerCase() === 'médecin'">
            Ce tableau affiche tous les patients ayant un rendez-vous avec vous, vos secrétaires, et les administrateurs.
          </span>
          <span *ngIf="userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrator'">
            Ce tableau affiche la liste de tous les médecins disponibles.
          </span>
          <span *ngIf="userRole.toLowerCase() === 'secretary' || userRole.toLowerCase() === 'secretaire' || userRole.toLowerCase() === 'secrétaire'">
            Ce tableau affiche les patients du médecin auquel vous êtes assigné(e) et votre médecin.
          </span>
          <span *ngIf="userRole.toLowerCase() === 'patient'">
            Ce tableau affiche les médecins avec qui vous avez des rendez-vous et leurs secrétaires.
          </span>
        </div>
      </div>
      
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Chargement des utilisateurs...</span>
      </div>
      
      <div *ngIf="!loading && filteredUsers.length === 0" class="empty-state">
        <div class="empty-icon">
          <mat-icon>person_search</mat-icon>
        </div>
        <h3>Aucun utilisateur trouvé</h3>
        <p *ngIf="searchQuery || internalSearchQuery">Essayez avec d'autres termes de recherche</p>
        <p *ngIf="!searchQuery && !internalSearchQuery">Aucun utilisateur disponible pour la messagerie</p>
      </div>
      
      <div class="user-list-container" *ngIf="!loading">
        <!-- Administrateurs -->
        <div class="user-group" *ngIf="filteredAdmins.length > 0">
          <div class="user-group-title">ADMINISTRATEURS</div>
          <div class="user-list">
            <div 
              *ngFor="let user of filteredAdmins" 
              class="user-item" 
              matRipple
              (click)="startConversation(user)">
              
              <div class="user-avatar">
                <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                  {{ getInitials(user.prenom + ' ' + user.nom) }}
                </div>
                <img 
                  *ngIf="user.profilePicturePath || user.profileImageUrl" 
                  [src]="user.profileImageUrl" 
                  alt="{{ user.prenom }} {{ user.nom }}"
                  (error)="handleImageError($event)">
              </div>
              
              <div class="user-info">
                <div class="user-name">{{ user.prenom }} {{ user.nom }}</div>
                <div class="user-role">Administrateur</div>
              </div>
              
              <button 
                mat-icon-button 
                color="primary" 
                class="message-button"
                matTooltip="Envoyer un message"
                (click)="startConversation(user); $event.stopPropagation()">
                <mat-icon>chat</mat-icon>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Secrétaires -->
        <div class="user-group" *ngIf="filteredSecretaires.length > 0">
          <div class="user-group-title">SECRÉTAIRES</div>
          <div class="user-list">
            <div 
              *ngFor="let user of filteredSecretaires" 
              class="user-item" 
              matRipple
              (click)="startConversation(user)">
              
              <div class="user-avatar">
                <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                  {{ getInitials(user.prenom + ' ' + user.nom) }}
                </div>
                <img 
                  *ngIf="user.profilePicturePath || user.profileImageUrl" 
                  [src]="user.profileImageUrl" 
                  alt="{{ user.prenom }} {{ user.nom }}"
                  (error)="handleImageError($event)">
              </div>
              
              <div class="user-info">
                <div class="user-name">{{ user.prenom }} {{ user.nom }}</div>
                <div class="user-role">Secrétaire</div>
              </div>
              
              <button 
                mat-icon-button 
                color="primary" 
                class="message-button"
                matTooltip="Envoyer un message"
                (click)="startConversation(user); $event.stopPropagation()">
                <mat-icon>chat</mat-icon>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Médecins -->
        <div class="user-group" *ngIf="filteredDoctors.length > 0">
          <div class="user-group-title">MÉDECINS</div>
          <div class="user-list">
            <div 
              *ngFor="let user of filteredDoctors" 
              class="user-item" 
              matRipple
              (click)="startConversation(user)">
              
              <div class="user-avatar">
                <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                  {{ getInitials(user.prenom + ' ' + user.nom) }}
                </div>
                <img 
                  *ngIf="user.profilePicturePath || user.profileImageUrl" 
                  [src]="user.profileImageUrl" 
                  alt="{{ user.prenom }} {{ user.nom }}"
                  (error)="handleImageError($event)">
              </div>
              
              <div class="user-info">
                <div class="user-name">{{ user.prenom }} {{ user.nom }}</div>
                <div class="user-role">Médecin</div>
              </div>
              
              <button 
                mat-icon-button 
                color="primary" 
                class="message-button"
                matTooltip="Envoyer un message"
                (click)="startConversation(user); $event.stopPropagation()">
                <mat-icon>chat</mat-icon>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Patients -->
        <div class="user-group" *ngIf="filteredPatients.length > 0">
          <div class="user-group-title">PATIENTS</div>
          <div class="user-list">
            <div 
              *ngFor="let user of filteredPatients" 
              class="user-item" 
              matRipple
              (click)="startConversation(user)">
              
              <div class="user-avatar">
                <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                  {{ getInitials(user.prenom + ' ' + user.nom) }}
                </div>
                <img 
                  *ngIf="user.profilePicturePath || user.profileImageUrl" 
                  [src]="user.profileImageUrl" 
                  alt="{{ user.prenom }} {{ user.nom }}"
                  (error)="handleImageError($event)">
              </div>
              
              <div class="user-info">
                <div class="user-name">{{ user.prenom }} {{ user.nom }}</div>
                <div class="user-role">Patient</div>
              </div>
              
              <button 
                mat-icon-button 
                color="primary" 
                class="message-button"
                matTooltip="Envoyer un message"
                (click)="startConversation(user); $event.stopPropagation()">
                <mat-icon>chat</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-search-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: white;
    }
    
    .search-form {
      padding: 16px 16px 8px;
      background-color: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }
    
    .search-input {
      width: 100%;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      gap: 16px;
      flex-shrink: 0;
    }
    
    .loading-container span {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      height: 100%;
      background-color: white;
      flex-shrink: 0;
    }
    
    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: rgba(67, 97, 238, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    .empty-icon mat-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #4361ee;
    }
    
    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
      font-weight: 500;
    }
    
    .empty-state p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .user-list-container {
      overflow-y: auto;
      flex-grow: 1;
      background-color: white;
      max-height: calc(100vh - 200px); /* Fixed height with some space for header and search */
      min-height: 300px; /* Minimum height to ensure usability */
    }
    
    .user-group {
      margin-bottom: 0;
    }
    
    .user-group-title {
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      padding: 8px 16px;
      margin: 0;
      background-color: #f8f9fa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    .user-list {
      display: flex;
      flex-direction: column;
    }
    
    .user-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: background-color 0.2s;
      background-color: white;
    }
    
    .user-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    .user-avatar {
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #4361ee;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 16px;
    }
    
    .user-avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .user-info {
      flex-grow: 1;
      min-width: 0;
    }
    
    .user-name {
      font-weight: 500;
      font-size: 15px;
      color: rgba(0, 0, 0, 0.87);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-role {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 2px;
    }
    
    .message-button {
      margin-left: 8px;
      color: #4361ee;
    }
    
    .message-button mat-icon {
      font-size: 20px;
    }
    
    @media (max-width: 768px) {
      .search-form {
        padding: 12px 12px 4px;
      }
      
      .user-item {
        padding: 10px 12px;
      }
      
      .avatar-placeholder, .user-avatar img {
        width: 36px;
        height: 36px;
      }
      
      .user-name {
        font-size: 14px;
      }
      
      .user-role {
        font-size: 12px;
      }
      
      .user-list-container {
        max-height: calc(100vh - 180px); /* Slightly adjusted for mobile */
      }
    }

    .explanation-box {
      padding: 12px 16px;
      margin: 0 16px 8px;
      background-color: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    .explanation-content {
      display: flex;
      align-items: flex-start;
      font-size: 14px;
      color: #0d47a1;
      line-height: 1.4;
    }

    .info-icon {
      color: #2196f3;
      margin-right: 8px;
      font-size: 20px;
      height: 20px;
      width: 20px;
      flex-shrink: 0;
    }
  `]
})
export class UserSearchComponent implements OnInit, OnChanges {
  users: User[] = [];
  filteredUsers: User[] = [];
  internalSearchQuery: string = '';
  loading: boolean = true;
  currentUserId: number = 0;
  userRole: string = '';
  
  secretaires: User[] = [];
  patients: User[] = [];
  doctors: User[] = [];
  admins: User[] = [];
  
  filteredSecretaires: User[] = [];
  filteredPatients: User[] = [];
  filteredDoctors: User[] = [];
  filteredAdmins: User[] = [];
  
  // Flag to determine if we're using external search
  public externalSearch: boolean = false;
  
  doctorsWithAppointments: User[] = [];
  patientsWithAppointments: User[] = [];
  assignedSecretaries: User[] = [];
  assignedDoctor: User | null = null;
  
  @Input() set searchQuery(value: string) {
    if (value !== undefined && value !== null) {
      this.externalSearch = true;
      this.internalSearchQuery = value;
      this.filterUsers();
    }
  }
  
  @Output() conversationStarted = new EventEmitter<number>();
  
  // Add a session timestamp property
  private sessionTimestamp: string = new Date().getTime().toString();
  
  constructor(
    private doctorService: DoctorService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private messagingService: MessagingService,
    private appointmentService: AppointmentService,
    @Inject(DOCUMENT) private document: Document
  ) {}
  
  ngOnInit(): void {
    this.loadCurrentUser();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery'] && !changes['searchQuery'].firstChange) {
      this.filterUsers();
    }
  }
  
  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.currentUserId = user.id;
          if (typeof user.role === 'string') {
            this.userRole = user.role;
          } else if (user.role && typeof user.role === 'object') {
            // Use type assertion to tell TypeScript this is a Role object with a nom property
            const roleObj = user.role as { nom?: string };
            this.userRole = roleObj.nom || '';
          } else {
            this.userRole = '';
          }
          
          // Check if user is banned first
          if (user.banned) {
            console.log('🚫 User is banned, loading admins directly');
            this.loadAdminsForBannedUser();
          } else {
            // Load regular connections based on role
          this.loadUsers();
          }
        }
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.loading = false;
      }
    });
  }
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('auth_token') || 
                  localStorage.getItem('token');
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  loadUsers(): void {
    console.log('🔍 Loading users based on role:', this.userRole);
    
    // Check if user is banned first
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.banned) {
          console.log('🚫 User is banned, loading only admins');
          this.loadAdminsForBannedUser();
          return;
        }
        
        // If not banned, continue with normal loading
        // Determine which loading method to use based on user role
        if (this.userRole.toLowerCase() === 'doctor' || this.userRole.toLowerCase() === 'medecin' || this.userRole.toLowerCase() === 'médecin') {
          this.loadDoctorConnectionsWithAdmins();
        } else if (this.userRole.toLowerCase() === 'patient') {
      this.loadPatientConnections();
        } else if (this.userRole.toLowerCase() === 'secretary' || this.userRole.toLowerCase() === 'secretaire' || this.userRole.toLowerCase() === 'secrétaire') {
          this.loadSecretaryConnections();
        } else if (this.userRole.toLowerCase() === 'admin' || this.userRole.toLowerCase() === 'administrator' || this.userRole.toLowerCase() === 'administrateur') {
          this.loadAdminConnections();
    } else {
          // Fallback to loading all users
          console.log('⚠️ Unknown role, loading all users as fallback');
      this.loadAllUsers();
    }
      },
      error: (error) => {
        console.error('Error checking if user is banned:', error);
        this.loading = false;
      }
    });
  }
  
  // New method to load admins directly from the backend
  loadAdmins(): Promise<any[]> {
    console.log('🔍 Loading admins from backend');
    return this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/users/admins`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error loading admins:', error);
          console.log('⚠️ No admins data available');
          return of([]);
        })
      ).toPromise() as Promise<any[]>;
  }
  
  // Update the loadDoctorConnectionsWithAdmins method to use the new endpoint
  loadDoctorConnectionsWithAdmins(): void {
    console.log('🔍 Loading doctor connections with admins for doctor ID:', this.currentUserId);
    
    // Utiliser un forkJoin pour exécuter trois requêtes en parallèle
    forkJoin({
      // 1. Récupérer les patients du médecin via ses rendez-vous
      appointments: this.appointmentService.getMyDoctorAppointments().pipe(
        catchError(error => {
          console.error('❌ Error loading doctor appointments:', error);
          console.log('⚠️ No appointments data available');
          return of([]);
        })
      ),
      // 2. Récupérer les secrétaires assignées au médecin
      secretaries: this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/users/doctor/secretaries`, { headers: this.getHeaders() }).pipe(
        catchError(error => {
          console.error('❌ Error loading doctor secretaries:', error);
          console.log('⚠️ No secretaries data available');
          return of([]);
        })
      ),
      // 3. Récupérer les admins avec le nouvel endpoint
      admins: this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/users/admins`, { headers: this.getHeaders() }).pipe(
        catchError(error => {
          console.error('❌ Error loading admins:', error);
          console.log('⚠️ No admins data available');
          return of([]);
        })
      )
    }).subscribe({
      next: (results) => {
        // Rest of the method remains the same
        console.log('✅ Doctor connections received:', results);
        
        // Traiter les rendez-vous pour obtenir les patients
        const appointments = results.appointments;
        if (appointments && appointments.length > 0) {
          // Extraire les patients uniques des rendez-vous
          this.patients = appointments
            .filter(apt => apt.patient && apt.patient.id)
            .map(apt => ({
              id: apt.patient.id,
              nom: apt.patient.nom,
              prenom: apt.patient.prenom,
              email: apt.patient.email,
              role: { id: 4, nom: 'patient' },
              enabled: true,
              accountLocked: false,
              phoneNumber: apt.patient.phoneNumber || '',
              name: `${apt.patient.prenom} ${apt.patient.nom}`
            }))
            // Filtrer les doublons par ID
            .filter((patient, index, self) => 
              index === self.findIndex(p => p.id === patient.id)
            );
          
          console.log('📊 Final patients list:', this.patients);
          this.filteredPatients = [...this.patients];
        } else {
          this.patients = [];
          this.filteredPatients = [];
        }
        
        // Traiter les secrétaires
        const secretaries = results.secretaries;
        if (secretaries && secretaries.length > 0) {
          // Mapper les secrétaires pour le format User
          this.secretaires = secretaries.map(secretary => ({
            id: secretary.id,
            nom: secretary.nom,
            prenom: secretary.prenom,
            email: secretary.email || '',
            role: { id: 3, nom: 'secretaire' },
            enabled: true,
            accountLocked: false,
            phoneNumber: secretary.phoneNumber || '',
            name: `${secretary.prenom} ${secretary.nom}`
          }));
          
          console.log('📊 Final secretaries list:', this.secretaires);
          this.filteredSecretaires = [...this.secretaires];
        } else {
          this.secretaires = [];
          this.filteredSecretaires = [];
        }

        // Traiter les admins - IMPORTANT: Mettre les admins dans leur propre catégorie
        const admins = results.admins;
        if (admins && admins.length > 0) {
          // Mapper les admins pour le format User
          this.admins = admins.map(admin => ({
            id: admin.id,
            nom: admin.nom,
            prenom: admin.prenom,
            email: admin.email || '',
            role: { id: 1, nom: 'admin' },
            enabled: true,
            accountLocked: false,
            phoneNumber: admin.phoneNumber || '',
            name: `${admin.prenom} ${admin.nom}`
          }));
          
          console.log('📊 Final admins list:', this.admins);
          this.filteredAdmins = [...this.admins];
          this.doctors = []; // S'assurer que les admins ne sont pas dans la liste des médecins
          this.filteredDoctors = [];
        } else {
          this.admins = [];
          this.filteredAdmins = [];
        }
        
        // Combiner tous les utilisateurs
        this.users = [...this.patients, ...this.secretaires, ...this.doctors, ...this.admins];
        this.filteredUsers = [...this.users];
        this.loading = false;
        
        // Precompute profile image URLs to avoid ExpressionChangedAfterItHasBeenCheckedError
        this.precomputeProfileImageUrls();
      },
      error: (error) => {
        console.error('❌ Error loading doctor connections:', error);
        
        // En cas d'erreur, afficher une liste vide
        console.log('⚠️ No data available due to error');
        this.patients = [];
        this.filteredPatients = [];
        this.secretaires = [];
        this.filteredSecretaires = [];
        this.doctors = [];
        this.filteredDoctors = [];
        this.admins = [];
        this.filteredAdmins = [];
        this.users = [];
        this.filteredUsers = [];
        this.loading = false;
      }
    });
  }
  
  // Update the loadAdminsForBannedUser method to use the new endpoint
  loadAdminsForBannedUser(): void {
    console.log('Loading admins for banned user');
    this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/users/admins`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('❌ Error loading admins for banned user:', error);
        return of([]);
      })
    ).subscribe({
      next: (admins) => {
        if (admins && admins.length > 0) {
          // Mapper les admins pour le format User
          const adminUsers = admins.map(admin => ({
            id: admin.id,
            nom: admin.nom,
            prenom: admin.prenom,
            email: admin.email || '',
            role: { id: 1, nom: 'admin' },
            enabled: true,
            accountLocked: false,
            phoneNumber: admin.phoneNumber || '',
            name: `${admin.prenom} ${admin.nom}`
          }));
          
          // Set admins as the only available users for banned accounts
          this.admins = adminUsers;
          this.filteredAdmins = [...this.admins];
          this.doctors = [];
          this.filteredDoctors = [];
          this.users = [...this.admins];
          this.filteredUsers = [...this.users];
          
          console.log('📊 Loaded admins for banned user:', adminUsers);
        }
        this.loading = false;
        
        // Precompute profile image URLs to avoid ExpressionChangedAfterItHasBeenCheckedError
        this.precomputeProfileImageUrls();
      },
      error: (error) => {
        console.error('❌ Error loading admins for banned user:', error);
        this.loading = false;
      }
    });
  }
  
  // Méthode pour charger les connexions d'un patient (docteurs avec RDV + leurs secrétaires)
  loadPatientConnections(): void {
    console.log('🔍 Loading patient connections for patient ID:', this.currentUserId);
    
    // First check if the user is banned
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.banned) {
          console.log('🚫 Patient is banned, loading only admins');
          this.loadAdminsForBannedUser();
          return;
        }
        
        // If not banned, continue with normal loading without admins
        this.appointmentService.getMyAppointments().pipe(
          catchError(error => {
            console.error('❌ Error loading patient appointments:', error);
            console.log('⚠️ No data available');
            return of([]);
          })
        ).subscribe({
          next: (appointments) => {
            // Traiter les rendez-vous pour obtenir les docteurs
            if (appointments && appointments.length > 0) {
              console.log('✅ Patient appointments:', appointments);
              
              // Extraire les docteurs uniques des rendez-vous
              this.doctors = appointments
                .filter(apt => apt.doctor && apt.doctor.id)
                .map(apt => ({
                  id: apt.doctor.id,
                  nom: apt.doctor.nom,
                  prenom: apt.doctor.prenom,
                  email: apt.doctor.email,
                  role: { id: 2, nom: 'doctor' },
                  enabled: true,
                  accountLocked: false,
                  phoneNumber: apt.doctor.phoneNumber || '',
                  name: `${apt.doctor.prenom} ${apt.doctor.nom}`
                }))
                // Filtrer les doublons par ID
                .filter((doctor, index, self) => 
                  index === self.findIndex(d => d.id === doctor.id)
                );
              
              console.log('📊 Doctors from appointments:', this.doctors);
              this.filteredDoctors = [...this.doctors];
              
              // Pour chaque docteur, récupérer ses secrétaires
              if (this.doctors.length > 0) {
                // Créer un tableau de promesses pour récupérer les secrétaires de chaque docteur
                const secretaryPromises = this.doctors.map(doctor => 
                  this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/users/doctor/${doctor.id}/secretaries`, { headers: this.getHeaders() })
                    .pipe(
                      catchError(error => {
                        console.error(`❌ Error loading secretaries for doctor ${doctor.id}:`, error);
                        return of([]);
                      })
                    )
                );
                
                // Exécuter toutes les promesses en parallèle
                forkJoin(secretaryPromises).subscribe({
                  next: (secretariesArrays) => {
                    console.log('✅ Secretaries arrays received:', secretariesArrays);
                    
                    // Aplatir le tableau de tableaux de secrétaires
                    const allSecretaries = secretariesArrays.flat();
                    
                    // Mapper les secrétaires pour le format User
                    this.secretaires = allSecretaries.map(secretary => ({
                      id: secretary.id,
                      nom: secretary.nom,
                      prenom: secretary.prenom,
                      email: secretary.email || '',
                      role: { id: 3, nom: 'secretaire' },
                      enabled: true,
                      accountLocked: false,
                      phoneNumber: secretary.phoneNumber || '',
                      name: `${secretary.prenom} ${secretary.nom}`
                    }))
                    // Filtrer les doublons par ID
                    .filter((secretary, index, self) => 
                      index === self.findIndex(s => s.id === secretary.id)
                    );
                    
                    console.log('📊 Final secretaries list:', this.secretaires);
                    this.filteredSecretaires = [...this.secretaires];
                    
                    // Mettre à jour les listes filtrées
                    this.users = [...this.doctors, ...this.secretaires];
                    this.filteredUsers = [...this.users];
                    this.loading = false;
                    
                    // Precompute profile image URLs to avoid ExpressionChangedAfterItHasBeenCheckedError
                    this.precomputeProfileImageUrls();
                  },
                  error: (error) => {
                    console.error('❌ Error loading secretaries:', error);
                    
                    // En cas d'erreur, afficher uniquement les docteurs
                    this.filteredDoctors = [...this.doctors];
                    this.users = [...this.doctors];
                    this.filteredUsers = [...this.doctors];
                    this.loading = false;
                  }
                });
              } else {
                this.loading = false;
              }
            } else {
              // Si aucun rendez-vous, afficher une liste vide
              this.doctors = [];
              this.filteredDoctors = [];
              this.secretaires = [];
              this.filteredSecretaires = [];
              this.users = [];
              this.filteredUsers = [];
              this.loading = false;
            }
          },
          error: (error) => {
            console.error('❌ Error loading patient connections:', error);
            
            // En cas d'erreur, afficher une liste vide
            this.doctors = [];
            this.filteredDoctors = [];
            this.secretaires = [];
            this.filteredSecretaires = [];
            this.users = [];
            this.filteredUsers = [];
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error checking if patient is banned:', error);
        this.loading = false;
      }
    });
  }
  
  // Méthode pour charger les connexions d'une secrétaire (patients du docteur assigné)
  loadSecretaryConnections(): void {
    console.log('🔍 Loading secretary connections for secretary ID:', this.currentUserId);
    
    // First check if the user is banned
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.banned) {
          console.log('🚫 Secretary is banned, loading only admins');
          this.loadAdminsForBannedUser();
          return;
        }
        
        // If not banned, continue with normal loading without admins
        // 1. Récupérer le médecin assigné à la secrétaire
        this.http.get<any>(`${environment.apiUrl}/api/v1/api/users/secretary/doctor`, { headers: this.getHeaders() }).pipe(
        catchError(error => {
          console.error('❌ Error loading assigned doctor:', error);
          console.log('⚠️ No assigned doctor data available');
          return of(null);
        })
        ).subscribe({
        next: (doctor) => {
            // Traiter le médecin assigné
            if (doctor) {
          console.log('✅ Assigned doctor received:', doctor);
          
            // Ajouter le médecin assigné à la liste
            this.doctors = [{
              id: doctor.id,
              nom: doctor.nom,
              prenom: doctor.prenom,
              email: doctor.email || '',
              role: { id: 2, nom: 'doctor' },
              enabled: true,
              accountLocked: false,
              phoneNumber: doctor.phoneNumber || '',
              name: `${doctor.prenom} ${doctor.nom}`
            }];
              
            this.filteredDoctors = [...this.doctors];
          } else {
            this.doctors = [];
            this.filteredDoctors = [];
          }
          
          // 2. Ensuite, récupérer les patients du médecin
          this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/appointments/my-secretary-appointments`, { headers: this.getHeaders() })
            .pipe(
              catchError(error => {
                console.error('❌ Error loading secretary appointments:', error);
                console.log('⚠️ No patient data available');
                return of([]);
              })
            )
            .subscribe({
              next: (appointments) => {
                console.log('✅ Secretary appointments received:', appointments);
                
                // Si aucun rendez-vous ou erreur, garder la liste vide
                if (!appointments || appointments.length === 0) {
                  console.log('⚠️ No appointments found');
                  this.patients = [];
                  this.filteredPatients = [];
                  // Mettre à jour les listes filtrées avec le médecin uniquement
                  this.users = [...this.doctors];
                  this.filteredUsers = [...this.doctors];
                  this.loading = false;
                  return;
                }
                
                // Extraire les patients uniques des rendez-vous
                this.patients = appointments
                  .filter(apt => apt.patient && apt.patient.id)
                  .map(apt => ({
                    id: apt.patient.id,
                    nom: apt.patient.nom,
                    prenom: apt.patient.prenom,
                    email: apt.patient.email,
                    role: { id: 4, nom: 'patient' },
                    enabled: true,
                    accountLocked: false,
                    phoneNumber: apt.patient.phoneNumber || '',
                    name: `${apt.patient.prenom} ${apt.patient.nom}`
                  }))
                  // Filtrer les doublons par ID
                  .filter((patient, index, self) => 
                    index === self.findIndex(p => p.id === patient.id)
                  );
                
                console.log('📊 Final patients list from secretary appointments:', this.patients);
                this.filteredPatients = [...this.patients];
                
                // Combiner les médecins et les patients
                this.users = [...this.doctors, ...this.patients];
                this.filteredUsers = [...this.users];
                this.loading = false;
                
                // Precompute profile image URLs to avoid ExpressionChangedAfterItHasBeenCheckedError
                this.precomputeProfileImageUrls();
              },
              error: (error) => {
                console.error('❌ Error loading secretary appointments:', error);
                
                // En cas d'erreur, afficher uniquement le médecin s'il existe
                console.log('⚠️ No patient data available due to error');
                this.patients = [];
                this.filteredPatients = [];
                this.users = [...this.doctors];
                this.filteredUsers = [...this.doctors];
                this.loading = false;
              }
            });
        },
        error: (error) => {
          console.error('❌ Error loading assigned doctor:', error);
          
          // En cas d'erreur, afficher une liste vide
          console.log('⚠️ No data available due to error');
          this.doctors = [];
          this.filteredDoctors = [];
          this.patients = [];
          this.filteredPatients = [];
          this.users = [];
          this.filteredUsers = [];
              this.loading = false;
            }
          });
        },
        error: (error) => {
        console.error('Error checking if secretary is banned:', error);
          this.loading = false;
        }
      });
  }
  
  // Méthode pour charger tous les utilisateurs (comportement par défaut)
  loadAllUsers(): void {
    // Create an array of observables for different user types
    const requests = [
      // Get doctors
      this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/doctors`, { headers: this.getHeaders() })
        .pipe(catchError(error => {
          console.error('Error loading doctors:', error);
          return of([]);
        })),
      
      // Get secretaries
      this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/secretaries`, { headers: this.getHeaders() })
        .pipe(catchError(error => {
          console.error('Error loading secretaries:', error);
          return of([]);
        })),
      
      // Get patients
      this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/patients`, { headers: this.getHeaders() })
        .pipe(catchError(error => {
          console.error('Error loading patients:', error);
          return of([]);
        }))
    ];
    
    // Execute all requests in parallel
    forkJoin(requests).subscribe({
      next: ([doctorsResponse, secretariesResponse, patientsResponse]) => {
        // Process doctors
        this.doctors = doctorsResponse.map(doctor => ({
          ...doctor,
          role: 'DOCTOR'
        })).filter(doctor => doctor.id !== this.currentUserId);
        
        // Process secretaries
        this.secretaires = secretariesResponse.map(secretary => ({
          ...secretary,
          role: 'SECRETARY'
        })).filter(secretary => secretary.id !== this.currentUserId);
        
        // Process patients
        this.patients = patientsResponse.map(patient => ({
          ...patient,
          role: 'PATIENT'
        })).filter(patient => patient.id !== this.currentUserId);
        
        // Combine all users
        this.users = [
          ...this.doctors,
          ...this.secretaires,
          ...this.patients
        ];
        
        // Apply initial filtering
        this.filterUsers();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  // Méthode pour charger les connexions d'un admin (tous les docteurs)
  loadAdminConnections(): void {
    console.log('🔍 Loading admin connections');
    
    // Récupérer uniquement les docteurs
    this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/doctors`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error loading doctors:', error);
          console.log('⚠️ No data available');
          return of([]);
        })
      )
      .subscribe({
        next: (doctorsResponse) => {
          console.log('✅ Doctors response received:', doctorsResponse);
          console.log('📊 Number of doctors:', doctorsResponse.length);
          
          // Traiter les docteurs
          this.doctors = doctorsResponse.map(doctor => ({
            ...doctor,
            role: { id: 2, nom: 'doctor' }
          })).filter(doctor => doctor.id !== this.currentUserId);
          
          console.log('📊 Final doctors list (after filtering current user):', this.doctors.length, 'doctors');
          
          // Mettre à jour les listes filtrées
          this.filteredDoctors = [...this.doctors];
          this.patients = [];
          this.filteredPatients = [];
          this.secretaires = [];
          this.filteredSecretaires = [];
          this.users = [...this.doctors];
          this.filteredUsers = [...this.doctors];
          this.loading = false;
          
          // Precompute profile image URLs to avoid ExpressionChangedAfterItHasBeenCheckedError
          this.precomputeProfileImageUrls();
        },
        error: (error) => {
          console.error('❌ Error loading doctors:', error);
          this.doctors = [];
          this.filteredDoctors = [];
          this.users = [];
          this.filteredUsers = [];
          this.loading = false;
        }
      });
  }

  onInternalSearchChange(): void {
    this.filterUsers();
  }
  
  clearSearch(): void {
    this.internalSearchQuery = '';
    this.filterUsers();
  }
  
  filterUsers(): void {
    const searchTerm = (this.searchQuery || this.internalSearchQuery || '').toLowerCase().trim();
    
    // Filter users based on search term
    if (searchTerm) {
      this.filteredAdmins = this.admins.filter(user => {
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
      
      this.filteredDoctors = this.doctors.filter(user => {
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
      
      this.filteredSecretaires = this.secretaires.filter(user => {
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
      
      this.filteredPatients = this.patients.filter(user => {
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
    } else {
      // No search term, show all users
      this.filteredAdmins = [...this.admins];
      this.filteredDoctors = [...this.doctors];
      this.filteredSecretaires = [...this.secretaires];
      this.filteredPatients = [...this.patients];
    }
    
    // Precompute image URLs for all filtered users to avoid template function calls
    [...this.filteredAdmins, ...this.filteredDoctors, ...this.filteredSecretaires, ...this.filteredPatients].forEach(user => {
      if (user && (user.profilePicturePath || user.profileImageUrl)) {
        // Store the URL in the existing profileImageUrl property
        user.profileImageUrl = this.getProfileImageUrl(user);
      }
    });
    
    // Update the combined filtered users array
    this.filteredUsers = [
      ...this.filteredAdmins,
      ...this.filteredSecretaires,
      ...this.filteredDoctors,
      ...this.filteredPatients
    ];
  }
  
  getRoleAsString(role: string | Role | undefined): string {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (role && typeof role === 'object' && 'nom' in role) {
      return role.nom;
    }
    return '';
  }
  
  startConversation(user: User): void {
    if (user && user.id) {
      this.conversationStarted.emit(user.id);
    }
  }
  
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.trim().split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
      // Si un seul mot, prendre les deux premières lettres ou juste la première
      if (parts[0].length > 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return parts[0].charAt(0).toUpperCase();
    }
    
    // Prendre la première lettre du premier et du dernier mot
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  getRoleBadge(role: string | undefined): string {
    if (!role) return 'Utilisateur';
    
    const roleLower = role.toLowerCase();
    
    if (roleLower.includes('doctor') || roleLower.includes('médecin') || roleLower.includes('medecin')) {
      return 'Médecin';
    } else if (roleLower.includes('patient')) {
      return 'Patient';
    } else if (roleLower.includes('secretary') || roleLower.includes('secrétaire') || roleLower.includes('secretaire')) {
      return 'Secrétaire';
    } else if (roleLower.includes('admin') || roleLower.includes('administrator') || roleLower.includes('administrateur')) {
      return 'Administrateur';
    }
    
    return 'Utilisateur';
  }
  
  getProfileImageUrl(user: User): string {
    if (!user) return '/assets/images/default-avatar.png';
    
    // If user has no profile picture, return the default avatar
    if (!user.profilePicturePath && !user.profileImageUrl) {
      return '/assets/images/default-avatar.png';
    }
    
    // Use a stable session timestamp instead of generating a new one each time
    return `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${user.id}?t=${this.sessionTimestamp}`;
  }
  
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-avatar.png';
  }

  // Add a method to precompute profile image URLs for all users
  precomputeProfileImageUrls(): void {
    // Apply to all user lists
    const allUsers = [
      ...this.admins,
      ...this.doctors,
      ...this.secretaires,
      ...this.patients
    ];
    
    allUsers.forEach(user => {
      if (user && (user.profilePicturePath || user.profileImageUrl)) {
        user.profileImageUrl = this.getProfileImageUrl(user);
      }
    });
  }
}