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

          // Success path
          this.loginError = null;
          this.showSuccessSnackbar("Connexion réussie");
          
          const dashboardPath = `/dashboard/${role}`;
          this.router.navigate([dashboardPath]);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed', error);
          this.isLoading = false;
          this.handleLoginError(error);
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
      // Check for specific error messages
      if (error.error && error.error.message) {
        if (error.error.message.includes('mot de passe incorrect') || error.error.message.includes('incorrect password')) {
          this.loginError = "Mot de passe incorrect. Veuillez réessayer ou utiliser la récupération de mot de passe.";
          this.showWarningSnackbar("Mot de passe incorrect", "Mot de passe oublié?", () => this.goToForgotPassword());
        } else if (error.error.message.includes('utilisateur non trouvé') || error.error.message.includes('user not found')) {
          this.loginError = "Aucun compte n'est associé à cet email. Veuillez vérifier votre email ou créer un compte.";
          this.showWarningSnackbar("Compte inexistant", "Créer un compte", () => this.goToSignIn());
        } else {
          this.loginError = "Identifiants incorrects. Veuillez vérifier votre email et mot de passe.";
          this.showErrorSnackbar("Identifiants incorrects");
        }
      } else {
        this.loginError = "Identifiants incorrects. Veuillez vérifier votre email et mot de passe.";
        this.showErrorSnackbar("Identifiants incorrects");
      }
    } else if (error.status === 403) {
      this.loginError = "Votre compte n'est pas activé. Veuillez vérifier votre email pour le lien d'activation.";
      this.showWarningSnackbar("Compte non activé", "Activer maintenant", () => this.router.navigate(['/activate-account']));
    } else if (error.status === 429) {
      this.loginError = "Trop de tentatives de connexion. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.";
      this.showErrorSnackbar("Trop de tentatives", "Réinitialiser mot de passe", () => this.goToForgotPassword());
    } else if (error.status === 0) {
      this.loginError = "Impossible de communiquer avec le serveur. Veuillez vérifier votre connexion internet et réessayer.";
      this.showErrorSnackbar("Erreur de connexion au serveur", "Réessayer");
    } else {
      this.loginError = "Erreur lors de la connexion. Veuillez réessayer plus tard.";
      this.showErrorSnackbar("Erreur de connexion");
    }
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
}