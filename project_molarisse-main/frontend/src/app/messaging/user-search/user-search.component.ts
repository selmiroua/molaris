import { Component, OnInit, EventEmitter, Output } from '@angular/core';
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
import { Router } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../auth/auth.service';
import { User, Role } from '../../core/models/user.model';
import { forkJoin } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MessagingService } from '../../core/services/messaging.service';

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
    MatTooltipModule
  ],
  template: `
    <div class="user-search-container">
      <div class="search-header">
        <h2>Rechercher</h2>
      </div>
      
      <div class="search-form">
        <mat-form-field appearance="outline" class="search-input">
          <mat-label>Rechercher un utilisateur</mat-label>
          <input 
            matInput 
            [(ngModel)]="searchQuery" 
            placeholder="Nom, prénom..."
            (keyup)="filterUsers()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>
      
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading && filteredUsers.length === 0" class="empty-state">
        <mat-icon>person_search</mat-icon>
        <p>Aucun utilisateur trouvé</p>
        <p class="empty-subtitle" *ngIf="searchQuery">Modifiez votre recherche</p>
        <p class="empty-subtitle" *ngIf="!searchQuery">Aucun utilisateur disponible</p>
      </div>
      
      <mat-list *ngIf="!loading && filteredUsers.length > 0">
        <div class="user-group" *ngIf="doctors && doctors.length > 0">
          <h3 class="user-group-title">Médecins</h3>
          <mat-list-item *ngFor="let user of doctors" class="user-item" (click)="startConversation(user)">
            <div class="user-avatar" matListItemAvatar>
              <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                {{ getInitials(user.prenom + ' ' + user.nom) }}
              </div>
              <img *ngIf="user.profilePicturePath || user.profileImageUrl" [src]="user.profilePicturePath || user.profileImageUrl" alt="{{ user.prenom }} {{ user.nom }}">
            </div>
            
            <div matListItemTitle>{{ user.prenom }} {{ user.nom }}</div>
            
            <div matListItemLine>{{ getRoleBadge(getRoleAsString(user.role)) }}</div>
            
            <button 
              mat-icon-button 
              color="primary" 
              matTooltip="Démarrer une conversation"
              (click)="startConversation(user); $event.stopPropagation()">
              <mat-icon>chat</mat-icon>
            </button>
          </mat-list-item>
        </div>
        
        <div class="user-group" *ngIf="secretaires.length > 0">
          <h3 class="user-group-title">Secrétaires</h3>
          <mat-list-item *ngFor="let user of secretaires" class="user-item" (click)="startConversation(user)">
            <div class="user-avatar" matListItemAvatar>
              <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                {{ getInitials(user.prenom + ' ' + user.nom) }}
              </div>
              <img *ngIf="user.profilePicturePath || user.profileImageUrl" [src]="user.profilePicturePath || user.profileImageUrl" alt="{{ user.prenom }} {{ user.nom }}">
            </div>
            
            <div matListItemTitle>{{ user.prenom }} {{ user.nom }}</div>
            
            <div matListItemLine>{{ getRoleBadge(getRoleAsString(user.role)) }}</div>
            
            <button 
              mat-icon-button 
              color="primary" 
              matTooltip="Démarrer une conversation"
              (click)="startConversation(user); $event.stopPropagation()">
              <mat-icon>chat</mat-icon>
            </button>
          </mat-list-item>
        </div>
        
        <div class="user-group" *ngIf="patients.length > 0">
          <h3 class="user-group-title">Patients</h3>
          <mat-list-item *ngFor="let user of patients" class="user-item" (click)="startConversation(user)">
            <div class="user-avatar" matListItemAvatar>
              <div *ngIf="!user.profilePicturePath && !user.profileImageUrl" class="avatar-placeholder">
                {{ getInitials(user.prenom + ' ' + user.nom) }}
              </div>
              <img *ngIf="user.profilePicturePath || user.profileImageUrl" [src]="user.profilePicturePath || user.profileImageUrl" alt="{{ user.prenom }} {{ user.nom }}">
            </div>
            
            <div matListItemTitle>{{ user.prenom }} {{ user.nom }}</div>
            
            <div matListItemLine>{{ getRoleBadge(getRoleAsString(user.role)) }}</div>
            
            <button 
              mat-icon-button 
              color="primary" 
              matTooltip="Démarrer une conversation"
              (click)="startConversation(user); $event.stopPropagation()">
              <mat-icon>chat</mat-icon>
            </button>
          </mat-list-item>
        </div>
      </mat-list>
    </div>
  `,
  styles: [`
    .user-search-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 0 16px 0;
    }
    
    .search-header {
      padding: 16px 16px 8px;
    }
    
    .search-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }
    
    .search-form {
      padding: 0 16px 16px;
    }
    
    .search-input {
      width: 100%;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      color: rgba(67, 97, 238, 0.4);
    }
    
    .empty-state p {
      margin: 0;
      color: #555;
      font-size: 18px;
    }
    
    .empty-subtitle {
      font-size: 14px !important;
      color: #999 !important;
      margin-top: 8px !important;
    }
    
    .user-group {
      margin-bottom: 16px;
    }
    
    .user-group-title {
      font-size: 14px;
      font-weight: 500;
      color: #4361ee;
      padding: 0 16px;
      margin: 16px 0 8px 0;
    }
    
    .user-item {
      cursor: pointer;
      transition: background-color 0.2s;
      height: auto !important;
      padding: 8px 0;
    }
    
    .user-item:hover {
      background-color: #f5f5f5;
    }
    
    .user-avatar {
      position: relative;
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
    }
    
    .user-avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
  `]
})
export class UserSearchComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery: string = '';
  loading: boolean = true;
  currentUserId: number = 0;
  userRole: string = '';
  secretaires: User[] = [];
  patients: User[] = [];
  doctors: User[] = [];
  @Output() conversationStarted = new EventEmitter<number>();
  
  constructor(
    private doctorService: DoctorService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private messagingService: MessagingService
  ) {}
  
  ngOnInit(): void {
    this.loadCurrentUser();
  }
  
  loadCurrentUser(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId !== null) {
      this.currentUserId = userId;
    }
    
    const userRole = this.authService.getUserRole();
    if (userRole) {
      this.userRole = userRole;
    }
    
    this.loadUsers();
  }
  
  // Helper method to get headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  loadUsers(): void {
    this.loading = true;
    
    if (!this.userRole) {
      this.loading = false;
      return;
    }
    
    switch (this.userRole.toLowerCase()) {
      case 'doctor':
      case 'medecin':
      case 'docteur':
        this.loading = true;
        
        // Collect needed requests
        const requests = [];
        
        // 1. Get assigned secretaries (personal staff)
        const secretariesRequest = this.userService.getAssignedSecretaries();
        requests.push(secretariesRequest);
        
        // 2. Get patients with appointments with this doctor
        const appointmentsRequest = this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/appointments/my-doctor-appointments`, { headers: this.getHeaders() });
        requests.push(appointmentsRequest);
        
        // Use forkJoin to process both requests
        forkJoin(requests).subscribe(
          ([assignedSecretaries, appointments]) => {
            // Process personal secretaries
            const staffUsers = assignedSecretaries || [];
            
            // Extract patients from appointments and remove duplicates
            const patientMap = new Map<number, User>();
            
            if (appointments && Array.isArray(appointments)) {
              appointments.forEach((appt: any) => {
                if (appt.patient && appt.patient.id && !patientMap.has(appt.patient.id)) {
                  const patient: User = {
                    id: appt.patient.id,
                    nom: appt.patient.nom,
                    prenom: appt.patient.prenom,
                    email: appt.patient.email,
                    phoneNumber: appt.patient.phoneNumber,
                    role: { id: 3, nom: 'patient' },
                    enabled: true,
                    accountLocked: false
                  };
                  patientMap.set(patient.id, patient);
                }
              });
            }
            
            const patientUsers = Array.from(patientMap.values());
            
            // Combine assigned secretaries and patients only
            this.users = [...staffUsers, ...patientUsers];
            this.filteredUsers = [...this.users];
            this.loading = false;
            
            // Populate the secretaires and patients arrays
            this.secretaires = staffUsers;
            this.patients = patientUsers;
            this.doctors = [];
            
            console.log('Loaded users:', this.users);
          },
          error => {
            console.error('Error loading users:', error);
            this.loading = false;
          }
        );
        break;
        
      case 'patient':
        // For patients, get doctors they've had appointments with
        console.log('Loading doctors for patient...');
        const appointmentsRequestForPatient = this.http.get<any[]>(`${environment.apiUrl}/api/v1/api/appointments/my-appointments`, 
          { headers: this.getHeaders() });
        
        appointmentsRequestForPatient.subscribe(
          (appointments) => {
            console.log('Patient appointments received:', appointments);
            
            // Extract doctors from appointments
            const doctorMap = new Map<number, User>();
            
            if (appointments && Array.isArray(appointments)) {
              appointments.forEach((appt: any) => {
                // Check different possible field names for doctor in the appointment
                const doctorData = appt.doctor || appt.medecin || appt.docteur;
                
                if (doctorData && doctorData.id && !doctorMap.has(doctorData.id)) {
                  console.log('Found doctor in appointment:', doctorData);
                  
                  // Create User object from doctor data
                  const doctor: User = {
                    id: doctorData.id,
                    nom: doctorData.nom || doctorData.lastName || doctorData.name || '',
                    prenom: doctorData.prenom || doctorData.firstName || '',
                    email: doctorData.email || '',
                    phoneNumber: doctorData.phoneNumber || doctorData.phone || '',
                    role: { id: 2, nom: 'doctor' },
                    enabled: true,
                    accountLocked: false
                  };
                  
                  // Make sure we have at least some name data
                  if ((doctor.nom || doctor.prenom)) {
                    doctorMap.set(doctor.id, doctor);
                  }
                }
              });
            }
            
            const doctorList = Array.from(doctorMap.values());
            console.log('Extracted doctors for patient:', doctorList);
            
            // If no doctors found via appointments, try direct doctor service as fallback
            if (doctorList.length === 0) {
              console.log('No doctors found in appointments, trying doctor service...');
              this.doctorService.getAllDoctors().subscribe(
                doctors => {
                  this.users = doctors;
                  this.filteredUsers = [...this.users];
                  this.secretaires = [];
                  this.patients = [];
                  this.doctors = doctors;
                  this.loading = false;
                },
                error => {
                  console.error('Error loading doctors via fallback:', error);
                  this.loading = false;
                }
              );
            } else {
              this.users = doctorList;
              this.filteredUsers = [...this.users];
              this.secretaires = [];
              this.patients = [];
              this.doctors = doctorList;
              this.loading = false;
            }
          },
          error => {
            console.error('Error loading patient appointments:', error);
            
            // Fallback to getting all doctors if appointments fail
            console.log('Falling back to getting all doctors...');
            this.doctorService.getAllDoctors().subscribe(
              doctors => {
                this.users = doctors;
                this.filteredUsers = [...this.users];
                this.secretaires = [];
                this.patients = [];
                this.doctors = doctors;
                this.loading = false;
              },
              fallbackError => {
                console.error('Error loading fallback doctors:', fallbackError);
                this.loading = false;
              }
            );
          }
        );
        break;
        
      case 'secretaire':
        // For secretaries, show only their associated doctor
        this.userService.getAssignedDoctor().subscribe(
          doctor => {
            if (doctor) {
              this.users = [doctor];
              this.filteredUsers = [...this.users];
              this.doctors = doctor ? [doctor] : [];
            }
            this.secretaires = [];
            this.patients = [];
            this.loading = false;
          },
          error => {
            console.error('Error loading assigned doctor:', error);
            this.loading = false;
          }
        );
        break;
        
      case 'admin':
        // For admins, show all doctors since we don't have a getAllUsers method
        this.doctorService.getAllDoctors().subscribe(
          doctors => {
            this.users = doctors;
            this.filteredUsers = [...this.users];
            this.secretaires = [];
            this.patients = [];
            this.doctors = doctors;
            this.loading = false;
          },
          error => {
            console.error('Error loading doctors:', error);
            this.loading = false;
          }
        );
        break;
        
      default:
        this.loading = false;
    }
  }
  
  filterUsers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
      
      // Reset role-based arrays from original users
      this.secretaires = this.users.filter(user => 
        this.getRoleAsString(user.role).toLowerCase() === 'secretaire'
      );
      this.patients = this.users.filter(user => 
        this.getRoleAsString(user.role).toLowerCase() === 'patient'
      );
      this.doctors = this.users.filter(user => 
        this.getRoleAsString(user.role).toLowerCase() === 'doctor' || 
        this.getRoleAsString(user.role).toLowerCase() === 'medecin' || 
        this.getRoleAsString(user.role).toLowerCase() === 'docteur'
      );
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.nom?.toLowerCase().includes(query) || 
      user.prenom?.toLowerCase().includes(query) ||
      this.getRoleAsString(user.role).toLowerCase().includes(query)
    );
    
    // Update all role-based arrays based on filtered results
    this.secretaires = this.filteredUsers.filter(user => 
      this.getRoleAsString(user.role).toLowerCase() === 'secretaire'
    );
    this.patients = this.filteredUsers.filter(user => 
      this.getRoleAsString(user.role).toLowerCase() === 'patient'
    );
    this.doctors = this.filteredUsers.filter(user => 
      this.getRoleAsString(user.role).toLowerCase() === 'doctor' || 
      this.getRoleAsString(user.role).toLowerCase() === 'medecin' || 
      this.getRoleAsString(user.role).toLowerCase() === 'docteur'
    );
  }
  
  getRoleAsString(role: string | Role): string {
    if (typeof role === 'object' && role !== null && 'nom' in role) {
      return role.nom;
    }
    return String(role || '');
  }
  
  startConversation(user: User): void {
    if (user && user.id) {
      // Emit an event that can be caught by the parent component
      this.conversationStarted.emit(user.id);
      
      // Instead of navigating to another page, just emit the event
      // The parent component will handle updating the right panel
    }
  }
  
  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  getRoleBadge(role: string | undefined): string {
    if (!role) return '';
    
    switch(role.toLowerCase()) {
      case 'doctor': return 'Médecin';
      case 'secretaire': return 'Secrétaire';
      case 'patient': return 'Patient';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  }
} 