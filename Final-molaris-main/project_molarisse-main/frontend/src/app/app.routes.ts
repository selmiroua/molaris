import { Routes, UrlSegment } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { ActivateAccountComponent } from './auth/activate-account/activate-account.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { PatientDashboardComponent } from './dashboard/patient-dashboard.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { DoctorDashboardComponent } from './dashboard/doctor-dashboard.component';
import { SecretaireDashboardComponent } from './dashboard/secretaire-dashboard.component';
import { LaboDashboardComponent } from './dashboard/labo-dashboard.component';
import { FournisseurDashboardComponent } from './dashboard/fournisseur-dashboard.component';
import { PharmacieDashboardComponent } from './dashboard/pharmacie-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { BookAppointmentComponent } from './dashboard/appointment/book-appointment.component';
import { AppointmentListComponent } from './dashboard/appointment/appointment-list.component';
import { DoctorApplicationComponent } from './secretary/doctor-application/doctor-application.component';
import { LandingComponent } from './landing/landing.component';
import { EspaceSecComponent } from './secretary/espace-sec/espace-sec.component';
import { AppointmentTabsComponent } from './dashboard/appointment/appointment-tabs.component';
import { AppointmentCalendarComponent } from './dashboard/appointment/appointment-calendar.component';
import { BookUnregisteredPatientAppointmentComponent } from './dashboard/secretary/book-unregistered-patient-appointment.component';
import { BannedAccountComponent } from './banned-account/banned-account.component';

export const routes: Routes = [
  { 
    path: '', 
    component: LandingComponent 
  },
  { 
    path: 'login', 
    component: LoginComponent
  },
  { 
    path: 'sign-in', 
    component: SignInComponent
  },
  { 
    path: 'activate-account', 
    component: ActivateAccountComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'banned-account',
    component: BannedAccountComponent
  },
  {
    path: 'espace-sec',
    component: EspaceSecComponent,
    canActivate: [AuthGuard],
    data: { role: 'secretaire' }
  },
  {
    path: 'dashboard/patient',
    component: PatientDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'patient' }
  },
  {
    path: 'dashboard/patient/book-appointment',
    component: BookAppointmentComponent,
    canActivate: [AuthGuard],
    data: { role: 'patient' }
  },
  {
    path: 'dashboard/patient/appointments',
    component: AppointmentListComponent,
    canActivate: [AuthGuard],
    data: { role: 'patient', userRole: 'patient' }
  },
  {
    path: 'dashboard/admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/doctor',
    component: DoctorDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'doctor' },
    children: [
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: 'dashboard/doctor/appointments',
    component: AppointmentListComponent,
    canActivate: [AuthGuard],
    data: { role: 'doctor', userRole: 'doctor' }
  },
  {
    path: 'dashboard/secretaire',
    component: SecretaireDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'secretaire' }
  },
  {
    path: 'dashboard/secretaire/appointments',
    component: AppointmentTabsComponent,
    canActivate: [AuthGuard],
    data: { role: 'secretaire', userRole: 'secretaire' }
  },
  {
    path: 'dashboard/secretaire/doctor-application',
    component: DoctorApplicationComponent,
    canActivate: [AuthGuard],
    data: { role: 'secretaire' }
  },
  {
    path: 'dashboard/secretaire/calendar',
    component: AppointmentCalendarComponent,
    canActivate: [AuthGuard],
    data: { role: 'secretaire', userRole: 'secretaire' }
  },
  {
    path: 'dashboard/labo',
    component: LaboDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'labo' }
  },
  {
    path: 'dashboard/fournisseur',
    component: FournisseurDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'fournisseur' }
  },
  {
    path: 'dashboard/pharmacie',
    component: PharmacieDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'pharmacie' }
  },
  {
    path: 'dashboard/profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'mon-profil',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'secretary/book-unregistered-appointment',
    component: BookUnregisteredPatientAppointmentComponent,
    canActivate: [AuthGuard],
    data: { roles: ['SECRETAIRE'] }
  },
  // Auth check route that will redirect to dashboard if authenticated
  {
    path: 'auth-check',
    canActivate: [AuthGuard],
    component: AdminDashboardComponent,
    data: { authCheck: true }
  },
  
  // Wildcard route to redirect to auth-check
  {
    path: '**',
    redirectTo: 'auth-check'
  }
];