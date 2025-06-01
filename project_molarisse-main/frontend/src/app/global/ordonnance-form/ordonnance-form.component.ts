import { Component, Inject, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { OrdonnanceService } from '../../core/services/ordonnance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PatientSelectionDialogComponent } from '../../dashboard/appointment/patient-selection-dialog.component';

@Component({
  selector: 'app-ordonnance-form',
  templateUrl: './ordonnance-form.component.html',
  styleUrls: ['./ordonnance-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe
  ]
})
export class OrdonnanceFormComponent implements OnInit {
  @Input() doctor: any;
  @Input() doctor$!: Observable<any>;
  ordonnanceForm: FormGroup;
  selectedTreatments: boolean[] = [];
  allSelected: boolean = false;
  today: Date = new Date();
  @ViewChild('signaturePad', { static: false }) signaturePad!: ElementRef<HTMLCanvasElement>;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  private highQualitySignature: string = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OrdonnanceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { patient: any, doctor?: any },
    private profileService: ProfileService,
    private ordonnanceService: OrdonnanceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Use doctor from data if provided, else from @Input, else fallback to defaults
    console.log('Doctor data received:', data?.doctor);
    
    this.doctor = data?.doctor || this.doctor || {
      nameFr: 'Dr. Nadia Ben Salem',
      specialtyFr: 'Chirurgien-dentiste',
      nameAr: 'د. نادية بن سالم',
      specialtyAr: 'طبيبة أسنان',
      address: 'Adresse du cabinet',
      phone: '+216 71 123 456',
      email: 'smilecare.dentiste@gmail.com'
    };
    
    console.log('Using doctor:', this.doctor);
    
    this.ordonnanceForm = this.fb.group({
      doctor: this.fb.group({
        name: [this.doctor.nameFr],
        specialty: [this.doctor.specialtyFr],
        rpps: ['123456678901'],
        clinic: ['Cabinet Dentaire SmileCare'],
        phone: [this.doctor.phone],
        email: [this.doctor.email]
      }),
      patient: this.fb.group({
        name: [data?.patient?.name || ''],
        birthDate: [data?.patient?.birthDate || ''],
        address: [data?.patient?.address || ''],
        dossier: [data?.patient?.dossier || '']
      }),
      prescriptions: this.fb.array([
        this.fb.group({
          name: [''],
          dosage: [''],
          duration: [''],
          instructions: ['']
        })
      ]),
      recommendations: [''],
      date: [''],
      signature: [''],
      patientName: this.fb.control(''),
      treatments: this.fb.array([
        this.fb.group({
          name: [''],
          dose: [1],
          frequency: [1]
        })
      ])
    });
  }

  ngOnInit() {
    // Only fetch from profile service if we don't already have doctor data
    if (!this.doctor || !this.doctor.nameFr) {
    this.doctor$ = this.profileService.getCurrentProfile().pipe(
        map((profile: any) => ({
          nameFr: `Dr. ${profile.firstName || profile.prenom || ''} ${profile.lastName || profile.nom || ''}`.trim(),
          specialtyFr: Array.isArray(profile.specialities) && profile.specialities.length > 0 ? profile.specialities.join(', ') : '',
        address: profile.address || '',
        phone: profile.phoneNumber || '',
        email: profile.email || ''
      }))
    );
    } else {
      // Use the existing doctor data
      this.doctor$ = of(this.doctor);
    }

    // If patient data is provided, patch the form to show patient name directly
    if (this.data?.patient) {
      this.ordonnanceForm.patchValue({
        patientName: `${this.data.patient.prenom || ''} ${this.data.patient.nom || ''}`.trim(),
        patient: {
          name: `${this.data.patient.prenom || ''} ${this.data.patient.nom || ''}`.trim(),
          address: this.data.patient.address || '',
          birthDate: this.data.patient.birthDate || '',
          dossier: this.data.patient.dossier || ''
        }
      });
    }
  }

  get prescriptions() {
    return this.ordonnanceForm.get('prescriptions') as FormArray;
  }

  addPrescription() {
    this.prescriptions.push(this.fb.group({
      name: [''],
      dosage: [''],
      duration: [''],
      instructions: ['']
    }));
  }

  removePrescription(i: number) {
    if (this.prescriptions.length > 1) {
      this.prescriptions.removeAt(i);
    }
  }

  get treatments() {
    return this.ordonnanceForm.get('treatments') as FormArray;
  }

  addTreatment() {
    // Create a new treatment form group with proper initial values
    const newTreatment = this.fb.group({
      name: [''],
      dose: [1],
      frequency: [1]
    });
    
    // Add the new treatment to the form array
    this.treatments.push(newTreatment);
    this.selectedTreatments.push(false);
    
    console.log('Added new treatment, current treatments:', this.treatments.value);
  }

  removeTreatment(i: number) {
    if (this.treatments.length > 1) {
      this.treatments.removeAt(i);
      this.selectedTreatments.splice(i, 1);
    }
  }

  onSelectTreatment(i: number, checked: boolean) {
    this.selectedTreatments[i] = checked;
    this.allSelected = this.selectedTreatments.length > 0 && this.selectedTreatments.every(selected => selected);
  }

  toggleSelectAll(checked: boolean) {
    this.allSelected = checked;
    this.selectedTreatments = this.selectedTreatments.map(() => checked);
  }

  anyTreatmentSelected(): boolean {
    return this.selectedTreatments.some(selected => selected);
  }

  removeSelectedTreatments() {
    for (let i = this.selectedTreatments.length - 1; i >= 0; i--) {
      if (this.selectedTreatments[i]) {
        this.treatments.removeAt(i);
        this.selectedTreatments.splice(i, 1);
      }
    }
  }

  incrementDose(i: number) {
    const control = this.treatments.at(i).get('dose');
    if (control) control.setValue((control.value || 1) + 1);
  }

  decrementDose(i: number) {
    const control = this.treatments.at(i).get('dose');
    if (control && (control.value || 1) > 1) control.setValue((control.value || 1) - 1);
  }

  incrementFrequency(i: number) {
    const control = this.treatments.at(i).get('frequency');
    if (control) control.setValue((control.value || 1) + 1);
  }

  decrementFrequency(i: number) {
    const control = this.treatments.at(i).get('frequency');
    if (control && (control.value || 1) > 1) control.setValue((control.value || 1) - 1);
  }

  validateTreatmentName(i: number) {
    const nameControl = this.treatments.at(i).get('name');
    if (!nameControl) return;
    
    // Get the current value and trim it
    const currentValue = nameControl.value;
    
    // Only trim if it's a non-empty string
    if (currentValue && typeof currentValue === 'string') {
      const trimmedValue = currentValue.trim();
      
      // Only update if trimming actually changed something
      if (trimmedValue !== currentValue) {
        nameControl.setValue(trimmedValue);
      }
      
      console.log(`Treatment ${i} name validated: "${trimmedValue}"`);
    }
  }

  updateTreatmentName(i: number, value: string) {
    const nameControl = this.treatments.at(i).get('name');
    if (nameControl) {
      // Directly update the form control value
      nameControl.setValue(value);
      console.log(`Treatment ${i} name updated to: "${value}"`);
      
      // Log all treatment names for debugging
      this.logAllTreatmentNames();
    }
  }

  logAllTreatmentNames() {
    console.log("Current treatment names:");
    const treatmentsArray = this.treatments.value;
    treatmentsArray.forEach((t: any, index: number) => {
      console.log(`  Treatment ${index}: "${t.name || ''}"`);
    });
  }

  startSignature(event: MouseEvent | TouchEvent) {
    this.drawing = true;
    const { x, y } = this.getCanvasCoords(event);
    this.lastX = x;
    this.lastY = y;
  }

  drawSignature(event: MouseEvent | TouchEvent) {
    if (!this.drawing) return;
    event.preventDefault();
    const canvas = this.signaturePad.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = this.getCanvasCoords(event);
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  endSignature() {
    this.drawing = false;
    
    // Get the canvas and its context
    const canvas = this.signaturePad.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Get the canvas data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Check if there's actually any signature (non-transparent pixels)
      let hasSignature = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) {
          hasSignature = true;
          break;
        }
      }
      
      if (hasSignature) {
        // Store high-quality signature for display (PNG format for clarity)
        this.highQualitySignature = canvas.toDataURL('image/png');
        
        // Update the form with the signature (for database, we'll use a placeholder later)
        this.ordonnanceForm.patchValue({ signature: this.highQualitySignature });
        
        console.log('High-quality signature captured');
      } else {
        // No signature, set to empty
        this.highQualitySignature = '';
        this.ordonnanceForm.patchValue({ signature: '' });
      }
    }
  }

  clearSignature() {
    const canvas = this.signaturePad.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private getCanvasCoords(event: MouseEvent | TouchEvent) {
    const canvas = this.signaturePad.nativeElement;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  save() {
    if (this.ordonnanceForm.valid) {
      // Log all treatment data before saving
      this.logAllTreatmentNames();
      
      const raw = this.ordonnanceForm.value;
      console.log("Treatment data before filtering:", JSON.stringify(raw.treatments));
      
      // Make sure treatments is an array and each treatment has required properties
      const treatmentsArray = Array.isArray(raw.treatments) ? raw.treatments : [];
      
      // Debug raw treatment data
      treatmentsArray.forEach((t: any, index: number) => {
        console.log(`Treatment ${index} before processing:`, 
          `name="${t.name}"`, 
          `name type=${typeof t.name}`, 
          `dose=${t.dose}`, 
          `frequency=${t.frequency}`);
      });
      
      // Consider a treatment valid if any of its fields (name, dose, frequency) have a value
      const treatments = treatmentsArray.filter((t: any) => {
        // First ensure the treatment object exists and has the right properties
        if (!t) return false;
        
        // Fix for empty name field - ensure it's at least initialized to empty string if undefined
        if (t.name === undefined || t.name === null) t.name = '';
        
        // Check if any fields have valid values
        return (
          (t.name && t.name.trim() !== '') || 
          (t.dose && t.dose > 0) || 
          (t.frequency && t.frequency > 0)
        );
      });
      
      // Additional handling for treatment names to ensure they're properly saved
      treatments.forEach((t: any) => {
        // IMPORTANT: Don't modify treatment names that have been entered by the user
        // Only add placeholder for truly empty names
        if (t.name === undefined || t.name === null || t.name.trim() === '') {
          if (t.dose > 0 || t.frequency > 0) {
            t.name = 'Traitement non spécifié';
          }
        }
        // Just trim whitespace from names
        else {
          t.name = t.name.trim();
        }
        
        // Ensure dose and frequency are valid numbers
        t.dose = t.dose || 1;
        t.frequency = t.frequency || 1;
      });
      
      console.log("Filtered and normalized treatments:", JSON.stringify(treatments));
      
      // Double-check that treatment names are preserved
      treatments.forEach((t: any, index: number) => {
        console.log(`Treatment ${index} after processing: name="${t.name}"`);
      });
      
      if (treatments.length === 0) {
        this.snackBar.open('Veuillez ajouter au moins un traitement avec des données valides.', 'Fermer', 
          { duration: 4000, panelClass: ['error-snackbar'] });
        return;
      }
      
      // CRITICAL FIX: Don't store actual signature in database
      // Instead, store a placeholder text that indicates a signature exists
      // This keeps the database column small while allowing us to show the signature in UI
      const signatureExists = this.highQualitySignature && this.highQualitySignature.length > 0;
      
      // Get doctor information directly from the source (could be from fichePatient or profile)
      const doctorData = this.doctor || this.data?.doctor || {};
      
      // Prepare the doctor object with consistent field names for display
      const doctorForDisplay = {
        name: doctorData.nameFr || doctorData.name,
        specialty: doctorData.specialtyFr || doctorData.specialty,
        address: doctorData.address || doctorData.clinic || '',
        phone: doctorData.phone || '',
        email: doctorData.email || '',
      };
      
      console.log('Doctor information for preview:', doctorForDisplay);
      
      const payload = {
        doctor: raw.doctor,
        patient: raw.patient,
        patientName: raw.patientName || raw.patient?.name || '',
        date: new Date().toISOString(),
        treatments: JSON.stringify(treatments),
        signature: signatureExists ? '[SIGNATURE]' : '', // Just store a placeholder in DB
        doctorId: raw.doctor?.id,
        patientId: raw.patient?.id
      };
      
      console.log('Payload sent to backend:', payload);
      // Additional check to verify the treatments are properly encoded
      try {
        const decodedTreatments = JSON.parse(payload.treatments);
        console.log('Decoded treatments from payload:', decodedTreatments);
      } catch (e) {
        console.error('Error parsing treatments in payload:', e);
      }
      
      this.ordonnanceService.saveOrdonnance(payload).subscribe(
        (response: any) => {
          this.snackBar.open(
            "Ordonnance enregistrée avec succès\nVous pouvez consulter les détails de l'ordonnance.",
            'Fermer',
            { duration: 4000, panelClass: ['success-snackbar'] }
          );
          this.dialogRef.close();
          setTimeout(() => {
            // For preview, use the high-quality signature from our class property
            this.dialog.open(OrdonnanceDetailsDialog, {
              data: { 
                ordonnance: { 
                  ...this.ordonnanceForm.value, 
                  doctor: doctorForDisplay, // Use the actual doctor info
                  patient: raw.patient, 
                  signature: this.highQualitySignature, // High-quality signature for display
                  treatments,
                  date: new Date() // Ensure we have a valid date
                } 
              },
              height:'500px',
              width: '500px', // Match the card preview max-width
              maxWidth: '100vw',
              panelClass: 'full-bleed-dialog', // Use custom panel class for styling
              autoFocus: false
            });
          }, 200);
        },
        (error: any) => {
          console.error('Error saving ordonnance:', error);
          this.snackBar.open(
            "Erreur lors de l'enregistrement de l'ordonnance.",
            'Fermer',
            { duration: 4000, panelClass: ['error-snackbar'] }
          );
        }
      );
    }
  }

  close() {
    this.dialogRef.close();
  }

  openPatientSelectionDialog(): void {
    const dialogRef = this.dialog.open(PatientSelectionDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(selectedPatient => {
      if (selectedPatient) {
        this.ordonnanceForm.patchValue({
          patientName: `${selectedPatient.prenom} ${selectedPatient.nom}`,
          patient: {
            name: `${selectedPatient.prenom} ${selectedPatient.nom}`,
            address: selectedPatient.address || '',
            birthDate: selectedPatient.birthDate || '',
            dossier: selectedPatient.dossier || ''
          }
        });
      }
    });
  }
}

@Component({
  selector: 'ordonnance-details-dialog',
  template: `
    <div class="ordonnance-card-preview">
      <div class="ordonnance-header">
        <div class="doctor-info-block">
          <div class="doctor-name">Dr. youssef aroua</div>
          <div class="doctor-specialty">dentiste</div>
        </div>
        <div class="ordonnance-logo-img-block">
          <img src="/assets/images/R.png" alt="Pharmacy Logo" class="ordonnance-logo-img" />
        </div>
        <div class="contact-info-block">
          <ul class="contact-list">
            <li class="contact-list-item">
              <mat-icon class="green-icon">location_on</mat-icon>
              <span class="contact-text">28 rue palis abdellia</span>
            </li>
            <li class="contact-list-item">
              <mat-icon class="green-icon">phone</mat-icon>
              <span class="contact-text">27808500</span>
            </li>
            <li class="contact-list-item">
              <mat-icon class="green-icon">email</mat-icon>
              <span class="contact-text">arouayoussef&#64;gmail.com</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="ordonnance-title-block">
        <div class="ordonnance-title ordonnance-title-light-black">Ordonnance médicale</div>
      </div>
      <div class="beneficiaire-block-centered">
        <div class="beneficiaire-form-field-modern">
          <mat-icon matPrefix color="primary">person</mat-icon>
          <span>{{ ordonnance.patientName || ordonnance.patient?.name }}</span>
        </div>
      </div>
      <div class="treatment-table-block">
        <table class="treatment-table">
          <thead>
            <tr>
              <th>Nom du traitement</th>
              <th>Dosage</th>
              <th>Fréquence</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let treatment of treatments">
              <td>{{ treatment.name || 'Traitement non spécifié' }}</td>
              <td>{{ treatment.dose || 1 }} fois/jour</td>
              <td>{{ treatment.frequency || 1 }} jours</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="ordonnance-footer-block">
        <div class="signature-section">
          <div class="signature-label">Signature numérique du médecin :</div>
          <div *ngIf="ordonnance.signature; else noSignature">
            <img [src]="ordonnance.signature" alt="Signature" class="signature-image" />
          </div>
          <ng-template #noSignature>
            <span>[Non signée]</span>
          </ng-template>
          <div class="tunis-date">Tunis, le {{ ordonnance.date | date:'d MMMM yyyy':'':'fr' }}</div>
        </div>
      </div>
      <div class="ordonnance-actions">
        <button mat-flat-button color="primary" mat-dialog-close>Fermer</button>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&family=Pacifico&display=swap');
    
    .ordonnance-card {
      width: 100%;
      margin: 0;
      background: #fff;
      border-radius: 0;
      box-shadow: none;
      padding: 8px 12px;
      font-family: 'Inter', 'Roboto', Arial, sans-serif;
      color: #222;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }
    
    .ordonnance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .doctor-info-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .doctor-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }
    
    .doctor-specialty {
      font-size: 14px;
      color: #666;
    }
    
    .ordonnance-logo-img-block {
      text-align: center;
      margin: 0 16px;
    }
    
    .ordonnance-logo-img {
      width: 60px;
      height: auto;
    }
    
    .contact-info-block {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
    }
    
    .contact-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .contact-list-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .contact-list-item:last-child {
      margin-bottom: 0;
    }
    
    .green-icon {
      color: #22c55e !important;
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
    }
    
    .contact-text {
      color: #666;
      font-size: 13px;
    }
    
    .ordonnance-title-block {
      text-align: center;
      margin: 16px 0 12px 0;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 10px;
    }
    
    .ordonnance-title {
      font-size: 20px;
      font-weight: 700;
      color: #333;
    }
    
    .beneficiaire-block-centered {
      margin: 16px 0;
      text-align: center;
    }
    
    .beneficiaire-form-field-modern {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #f8fafc;
      border-radius: 6px;
      color: #333;
      font-size: 14px;
    }
    
    .treatment-table-block {
      margin: 16px 0;
    }
    
    .treatment-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .treatment-table th,
    .treatment-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .treatment-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #333;
    }
    
    .ordonnance-footer-block {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .tunis-date {
      color: #444;
      font-size: 16px;
      font-family: 'Dancing Script', 'Caveat', 'Pacifico', cursive;
      font-weight: 700;
      letter-spacing: 1px;
      text-align: right;
      transform: rotate(-2deg);
      margin-top: 16px;
      margin-right: 16px;
    }
    
    .signature-section {
      text-align: right;
    }
    
    .signature-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }
    
    .signature-image {
      max-width: 160px;
      max-height: 80px;
    }
    
    .ordonnance-actions {
      margin-top: 16px;
      text-align: right;
    }
    
    ::ng-deep .mat-dialog-container {
      padding: 0 !important;
      border-radius: 0 !important;
      overflow: hidden !important;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, AsyncPipe],
})
export class OrdonnanceDetailsDialog implements OnInit {
  ordonnance: any;
  treatments: any[] = [];
  doctor$!: Observable<any>;
   
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private profileService: ProfileService
  ) {
    this.ordonnance = data.ordonnance;
    console.log('Doctor info in preview:', this.ordonnance.doctor);
     
    // Parse treatments if it's a JSON string
    if (typeof this.ordonnance.treatments === 'string') {
      try {
        this.treatments = JSON.parse(this.ordonnance.treatments);
        
        // Normalize the treatment data to ensure all fields are present
        this.treatments = this.treatments.map((treatment: any) => {
          return {
            name: treatment.name || 'Traitement non spécifié',
            dose: treatment.dose || 1,
            frequency: treatment.frequency || 1
          };
        });
      } catch (e) {
        console.error('Error parsing treatments JSON:', e);
        this.treatments = [];
      }
    } else {
      this.treatments = this.ordonnance.treatments || [];
      
      // Also normalize non-string treatments
      this.treatments = this.treatments.map((treatment: any) => {
        return {
          name: treatment.name || 'Traitement non spécifié',
          dose: treatment.dose || 1,
          frequency: treatment.frequency || 1
        };
      });
    }
    
    console.log('Normalized treatments for display:', this.treatments);
  }
  
  ngOnInit() {
    // Similar to how OrdonnanceFormComponent gets doctor data
    const doctorData = this.ordonnance.doctor || {};
    if (!doctorData || !doctorData.nameFr) {
      this.doctor$ = this.profileService.getCurrentProfile().pipe(
        map((profile: any) => ({
          nameFr: `Dr. ${profile.firstName || profile.prenom || ''} ${profile.lastName || profile.nom || ''}`.trim(),
          specialtyFr: Array.isArray(profile.specialities) && profile.specialities.length > 0 ? profile.specialities.join(', ') : '',
          address: profile.address || '',
          phone: profile.phoneNumber || '',
          email: profile.email || ''
        }))
      );
    } else {
      // Use the existing doctor data
      this.doctor$ = of(doctorData);
    }
  }
} 