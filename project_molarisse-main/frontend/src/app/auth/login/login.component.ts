import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, state, style, transition, animate } from '@angular/animations';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    RouterModule,
    MatProgressSpinnerModule
  ],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(10px)'
      })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  rememberMe = false;
  loginError: string | null = null;
  isLoading = false;
  imageFallback = false;
  formSubmitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    public router: Router,
    private snackBar: MatSnackBar,
    private elementRef: ElementRef
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getUserRole();
      if (role) {
        this.router.navigate([`/dashboard/${role.toLowerCase()}`]);
      }
    }
    
    // Apply autofocus on email field
    setTimeout(() => {
      const emailInput = this.elementRef.nativeElement.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.focus();
      }
    }, 500);
    
    // Check if there are saved credentials in localStorage if rememberMe was previously checked
    if (localStorage.getItem('rememberMe') === 'true') {
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        this.loginForm.patchValue({ email: savedEmail });
        this.rememberMe = true;
      }
    }
  }

  // Handle keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Allow Enter key to submit when form is valid
    if (event.key === 'Enter' && this.loginForm.valid && !this.isLoading) {
      this.onSubmit();
    }
  }

  handleImageError(event: Event): void {
    this.imageFallback = true;
    const target = event.target as HTMLImageElement;
    if (target) {
      // Use a reliable fallback dental image
      target.src = 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=1200&auto=format&fit=crop';
      
      // If the fallback also fails, use a local fallback
      target.onerror = () => {
        target.src = 'assets/images/dental-clinic-fallback.jpg';
        target.onerror = null; // Prevent infinite error loop
      };
    }
  }

  goToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  onSubmit() {
    this.formSubmitted = true;
    
    if (this.loginForm.valid) {
      this.loginError = null;
      this.isLoading = true;
      
      const credentials = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };
      
      // Save email to localStorage if rememberMe is checked
      if (this.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', credentials.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }
      
      this.authService.authenticate(credentials).subscribe({
        next: (response: any) => {
          const role = response.role?.toLowerCase(); // Convert role to lowercase
          
          if (!role) {
            console.error('No role received from backend');
            this.loginError = "Erreur: Aucun rôle utilisateur reçu du serveur";
            this.showErrorSnackbar("Erreur d'authentification: veuillez contacter l'administrateur");
            this.isLoading = false;
            return;
          }

          // Define valid roles
          const validRoles = ['doctor', 'admin', 'patient', 'secretaire', 'fournisseur', 'pharmacie', 'labo'];
          
          if (!validRoles.includes(role)) {
            console.error('Invalid role received:', role);
            this.loginError = "Erreur: Rôle utilisateur non reconnu";
            this.showErrorSnackbar("Erreur d'authentification: rôle non reconnu");
            this.isLoading = false;
            return;
          }
          
          // Check if user is banned
          if (response.banned === true) {
            console.log('User is banned but still allowed to login');
            
            // Show a warning notification about account status
            this.showWarningSnackbar(
              "Votre compte est suspendu. Certaines fonctionnalités seront limitées.", 
              "Continuer",
              () => {
                // Navigate to dashboard - restrictions will be handled there
                this.router.navigate([`/dashboard/${role}`]);
              }
            );
            
            // Continue to dashboard even if banned
            this.isLoading = false;
            this.router.navigate([`/dashboard/${role}`]);
            return;
          }

          // Success path for non-banned users
          this.loginError = null;
          this.showSuccessSnackbar("Connexion réussie");
          
          const dashboardPath = `/dashboard/${role}`;
          this.router.navigate([dashboardPath]);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed', error);
          this.isLoading = false;
          
          // Check if the error message suggests a banned account
          const errorMessage = error?.error?.message || '';
          const stackTrace = JSON.stringify(error?.error) || '';
          
          if (
            error.status === 500 && 
            (errorMessage.includes('banned') || 
             errorMessage.includes('suspendu') || 
             errorMessage.includes('Authentication failed') ||
             stackTrace.includes('LockedException') || 
             stackTrace.includes('User account is locked'))
          ) {
            console.log('User might be banned, trying fallback login method');
            this.tryFallbackLoginForBannedUser(
              credentials.email, 
              credentials.password
            );
          } else {
            this.handleLoginError(error);
          }
        }
      });
    } else {
      // Mark all fields as touched to display errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  private handleLoginError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      // Check if error message contains "locked" for locked accounts
      const errorMessage = error?.error?.message || '';
      const stackTrace = JSON.stringify(error?.error) || '';
      
      if (errorMessage.includes('locked') || errorMessage.includes('User account is locked') || 
          stackTrace.includes('LockedException') || stackTrace.includes('User account is locked')) {
        this.loginError = "Votre compte est verrouillé. Veuillez contacter l'administrateur pour plus d'informations.";
        // Store email in local storage for banned account page
        localStorage.setItem('lastAttemptedEmail', this.loginForm.get('email')?.value);
        // Redirect to banned account page
        this.router.navigate(['/banned-account']);
        return;
      }
      
      // Original 401 unauthorized handling
      this.loginError = "Email ou mot de passe incorrect.";
      this.showErrorSnackbar("Identifiants incorrects", "Réessayer");
    } else if (error.status === 403) {
      const errorMessage = error?.error?.message || '';
      const stackTrace = JSON.stringify(error?.error) || '';
      
      if (errorMessage.includes('banned') || errorMessage.includes('suspendu') || 
          errorMessage.includes('locked') || stackTrace.includes('LockedException') || 
          stackTrace.includes('User account is locked')) {
        // Another check for banned account messages
        this.loginError = "Votre compte est suspendu. Veuillez contacter l'administrateur pour plus d'informations.";
        localStorage.setItem('lastAttemptedEmail', this.loginForm.get('email')?.value);
        this.router.navigate(['/banned-account']);
      } else {
        this.loginError = "Votre compte n'est pas activé. Veuillez vérifier votre email pour le lien d'activation.";
        this.showWarningSnackbar("Compte non activé", "Activer maintenant", () => this.router.navigate(['/activate-account']));
      }
    } else if (error.status === 429) {
      this.loginError = "Trop de tentatives de connexion. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.";
      this.showErrorSnackbar("Trop de tentatives", "Réinitialiser mot de passe", () => this.goToForgotPassword());
    } else if (error.status === 500) {
      // Check for locked or banned account in server error messages
      const errorMessage = error?.error?.message || '';
      const stackTrace = JSON.stringify(error?.error) || '';
      
      if (errorMessage.includes('locked') || errorMessage.includes('banned') || 
          errorMessage.includes('suspendu') || stackTrace.includes('LockedException') || 
          stackTrace.includes('User account is locked')) {
        this.loginError = "Votre compte est suspendu ou verrouillé. Veuillez contacter l'administrateur pour plus d'informations.";
        localStorage.setItem('lastAttemptedEmail', this.loginForm.get('email')?.value);
        this.router.navigate(['/banned-account']);
      } else {
        this.loginError = "Erreur lors de la connexion. Veuillez réessayer plus tard.";
        this.showErrorSnackbar("Erreur de connexion au serveur");
      }
    } else if (error.status === 0) {
      this.loginError = "Impossible de communiquer avec le serveur. Veuillez vérifier votre connexion internet et réessayer.";
      this.showErrorSnackbar("Erreur de connexion au serveur", "Réessayer");
    } else {
      this.loginError = "Erreur lors de la connexion. Veuillez réessayer plus tard.";
      this.showErrorSnackbar("Erreur de connexion");
    }
  }
  
  // Method to handle banned users
  private loginWithBannedAccount(email: string): void {
    // Get the user role from local storage if available
    let role = localStorage.getItem('userRole');
    
    if (!role) {
      // Try to get the role using the email
      this.getUserRoleByEmail(email);
    } else {
      // Set banned flag manually
      localStorage.setItem('banned', 'true');
      
      // Show warning and navigate to dashboard
      this.showWarningSnackbar(
        "Votre compte est suspendu. Certaines fonctionnalités seront limitées.",
        "Continuer",
        () => {
          this.router.navigate([`/dashboard/${role.toLowerCase()}`]);
        }
      );
      
      // Navigate to dashboard even if banned
      this.router.navigate([`/dashboard/${role.toLowerCase()}`]);
    }
  }
  
  // Method to get user role by email for banned users
  private getUserRoleByEmail(email: string): void {
    // Show loading indicator
    this.isLoading = true;
    
    // Call the service to get user info by email
    this.authService.getUserInfoByEmail(email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response && response.role) {
          // Store the role and banned status
          localStorage.setItem('userRole', response.role.toLowerCase());
          localStorage.setItem('banned', 'true');
          
          // Navigate to dashboard with the role
          this.router.navigate([`/dashboard/${response.role.toLowerCase()}`]);
        } else {
          // If no role is returned, show error
          this.showErrorSnackbar("Impossible de récupérer les informations de votre compte.", "OK");
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showErrorSnackbar("Votre compte est suspendu. Veuillez contacter l'administrateur.", "OK");
      }
    });
  }

  // Snackbar helper methods
  private showSuccessSnackbar(message: string, action: string = "Fermer"): void {
    this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['success-snackbar'],
      verticalPosition: 'top'
    });
  }

  private showErrorSnackbar(message: string, action: string = "Fermer", callback?: () => void): void {
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['error-snackbar'],
      verticalPosition: 'top'
    });
    
    if (callback) {
      snackBarRef.onAction().subscribe(callback);
    }
  }

  private showWarningSnackbar(message: string, action: string, callback?: () => void): void {
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 8000,
      panelClass: ['warning-snackbar'],
      verticalPosition: 'top'
    });
    
    if (callback) {
      snackBarRef.onAction().subscribe(callback);
    }
  }

  loginWithGoogle() {
    // Implement Google login logic here
  }

  loginWithApple() {
    // Implement Apple login logic here
  }

  loginWithFacebook() {
    // Implement Facebook login logic here
  }

  // Try a fallback login method for banned users
  private tryFallbackLoginForBannedUser(email: string, password: string): void {
    const localStorageUser = localStorage.getItem('userEmail');
    const rememberMeEnabled = localStorage.getItem('rememberMe') === 'true';

    // If the user was previously logged in and we have their email stored
    if (rememberMeEnabled && localStorageUser === email) {
      const role = localStorage.getItem('userRole');
      
      if (role) {
        // Set the banned flag
        localStorage.setItem('banned', 'true');
        
        // Show appropriate message
        this.showWarningSnackbar(
          "Votre compte est suspendu. Certaines fonctionnalités sont limitées.", 
          "Continuer",
          () => {
            this.router.navigate([`/dashboard/${role.toLowerCase()}`]);
          }
        );
        
        // Navigate anyway
        this.router.navigate([`/dashboard/${role.toLowerCase()}`]);
      } else {
        // If we don't know the role, show error
        this.showErrorSnackbar("Impossible de vous connecter. Contactez l'administrateur.", "OK");
      }
    } else {
      // If we don't have previous login info, show error
      this.showErrorSnackbar("Connexion échouée. Votre compte est peut-être suspendu.", "OK");
    }
  }
}