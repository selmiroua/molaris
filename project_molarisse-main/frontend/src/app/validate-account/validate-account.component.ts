import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-validate-account',
  templateUrl: './validate-account.component.html',
  styleUrls: ['./validate-account.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIf,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.5s ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ValidateAccountComponent {
  validateForm: FormGroup;
  isDoctor: boolean = false;
  isFournisseur: boolean = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private snackBar: MatSnackBar) {
    this.validateForm = this.fb.group({
      file: [null, Validators.required],
      specialty: [''],
      patent: [null]
    });
  }

  ngOnInit() {
    this.isDoctor = this.checkIfUserIsDoctor();
    this.isFournisseur = this.checkIfUserIsFournisseur();
  }

  checkIfUserIsDoctor(): boolean {
    // Implement logic to determine if the user is a doctor
    return true; // Placeholder; replace with actual logic
  }

  checkIfUserIsFournisseur(): boolean {
    // Implement logic to determine if the user is a fournisseur
    return true; // Placeholder; replace with actual logic
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.validateForm.patchValue({ file: file });
  }

  onPatentChange(event: any) {
    const file = event.target.files[0];
    this.validateForm.patchValue({ patent: file });
  }

  onSubmit() {
    if (this.validateForm.valid) {
      const formData = new FormData();
      formData.append('file', this.validateForm.get('file')?.value);
      if (this.isDoctor) {
        formData.append('specialty', this.validateForm.get('specialty')?.value);
      }
      if (this.isFournisseur) {
        formData.append('patent', this.validateForm.get('patent')?.value);
      }

      this.http.post('/api/v1/request-visibility', formData).subscribe(response => {
        this.snackBar.open('Demande soumise avec succès !', 'Fermer', { duration: 3000 });
      }, error => {
        this.snackBar.open('Erreur lors de la soumission de la demande.', 'Fermer', { duration: 3000 });
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs requis.', 'Fermer', { duration: 3000 });
    }
  }
}