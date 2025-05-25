import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isSubmitting = false;
  resetComplete = false;
  hidePassword = true;
  hideConfirmPassword = true;
  tokenValid = false;
  tokenChecked = false;
  tokenFromUrl: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      token: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  ngOnInit(): void {
    // Récupérer le token de l'URL s'il existe
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.tokenFromUrl = params['token'];
        this.resetPasswordForm.get('token')?.setValue(this.tokenFromUrl);
        this.verifyToken();
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password === confirmPassword) {
      form.get('confirmPassword')?.setErrors(null);
      return null;
    } else {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
  }

  verifyToken(): void {
    const token = this.resetPasswordForm.get('token')?.value;
    
    if (token && token.length === 6) {
      this.isSubmitting = true;
      
      this.authService.verifyResetToken(token).subscribe({
        next: (response) => {
          this.tokenChecked = true;
          this.tokenValid = response.valid === true;
          this.isSubmitting = false;
          
          if (!this.tokenValid) {
            this.snackBar.open('Le code de réinitialisation est invalide ou a expiré.', 'Fermer', {
              duration: 5000
            });
          }
        },
        error: (error) => {
          console.error('Error verifying token', error);
          this.tokenChecked = true;
          this.tokenValid = false;
          this.isSubmitting = false;
          
          this.snackBar.open('Erreur lors de la vérification du code. Veuillez réessayer.', 'Fermer', {
            duration: 5000
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const { token, password, confirmPassword } = this.resetPasswordForm.value;
      
      this.authService.resetPassword({ token, password, confirmPassword }).subscribe({
        next: (response) => {
          console.log('Password reset successfully', response);
          this.resetComplete = true;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error resetting password', error);
          this.isSubmitting = false;
          
          this.snackBar.open('Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.', 'Fermer', {
            duration: 5000
          });
        }
      });
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
  
  backToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
} 