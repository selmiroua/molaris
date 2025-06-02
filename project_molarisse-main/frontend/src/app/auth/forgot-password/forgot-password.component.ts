import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatProgressSpinnerModule
  ]
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  emailSent = false;
  formError: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.formError = null;
      
      const email = this.forgotPasswordForm.get('email')?.value;
      
      this.authService.forgotPassword({ email }).subscribe({
        next: (response) => {
          console.log('Reset email sent successfully', response);
          this.emailSent = true;
          this.isSubmitting = false;
          this.snackBar.open("Email de réinitialisation envoyé avec succès", "Fermer", {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error sending reset email', error);
          this.isSubmitting = false;
          
          // Pour des raisons de sécurité, on ne devrait pas révéler si l'email existe ou non
          // Mais on peut quand même afficher des erreurs techniques
          if (error.status === 0) {
            this.formError = "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
            this.snackBar.open("Erreur de connexion", "Fermer", {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          } else if (error.status === 429) {
            this.formError = "Trop de tentatives. Veuillez réessayer plus tard.";
            this.snackBar.open("Trop de tentatives", "Fermer", {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          } else {
            // Affichage du message de succès même en cas d'erreur pour des raisons de sécurité
            this.emailSent = true;
          }
        }
      });
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
} 