import { Component, Inject, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProfileService } from '../core/services/profile.service';
import { UserProfile } from '../core/models/user-profile.model';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { OrdonnanceService } from '../core/services/ordonnance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientSelectionDialogComponent } from '../dashboard/appointment/patient-selection-dialog.component';

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
  private generateId: () => string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OrdonnanceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { patient: any, doctor?: any, toothNumber?: string, readonly?: boolean, ordonnance?: any },
    private profileService: ProfileService,
    private ordonnanceService: OrdonnanceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.generateId = () => {
      return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    };
    
    if (data?.ordonnance?.doctor) {
      this.doctor = data.ordonnance.doctor;
    } else if (data?.doctor) {
      this.doctor = data.doctor;
    } else {
      this.doctor = {};
    }
    
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
          id: [this.generateId()],
          name: [''],
          dose: [1],
          frequency: [1]
        })
      ])
    });
  }

  ngOnInit() {
    if (this.data?.ordonnance) {
      console.log('Editing existing ordonnance:', this.data.ordonnance);
      
      this.ordonnanceForm.patchValue({
        patient: this.data.ordonnance.patient || {},
        patientName: this.data.ordonnance.patientName || this.data.ordonnance.patient?.name || '',
        recommendations: this.data.ordonnance.recommendations || ''
      });
      
      if (this.data.ordonnance.treatments) {
        let treatments = this.data.ordonnance.treatments;
        
        if (typeof treatments === 'string') {
          try {
            treatments = JSON.parse(treatments);
          } catch (e) {
            console.error('Error parsing treatments JSON:', e);
            treatments = [];
          }
        }
        
        treatments = treatments.map((t: any) => ({
          id: t.id || this.generateId(),
          ...t
        }));
        
        this.ordonnanceForm.setControl('treatments', this.fb.array(
          treatments.map((t: any) => this.fb.group({
            id: [t.id],
            name: [t.name],
            dose: [t.dose],
            frequency: [t.frequency]
          }))
        ));
      }
    }
    
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
      this.doctor$ = of(this.doctor);
    }

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

    if (this.data?.ordonnance) {
      const ordonnance = this.data.ordonnance;
      this.ordonnanceForm.patchValue({
        patientName: ordonnance.patientName || '',
        date: ordonnance.date || '',
        signature: ordonnance.signature || ''
      });
      if (ordonnance.treatments) {
        let treatmentsArr = [];
        try {
          treatmentsArr = typeof ordonnance.treatments === 'string' ? JSON.parse(ordonnance.treatments) : ordonnance.treatments;
        } catch (e) {
          treatmentsArr = [];
        }
        const treatmentsFormArray = this.fb.array(
          treatmentsArr.map((t: any) => this.fb.group({
            id: [t.id || this.generateId()],
            name: [t.name || ''],
            dose: [t.dose || 1],
            frequency: [t.frequency || 1]
          }))
        );
        this.ordonnanceForm.setControl('treatments', treatmentsFormArray);
      }
      this.ordonnanceForm.disable();
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
    const newTreatment = this.fb.group({
      id: [this.generateId()],
      name: [''],
      dose: [1],
      frequency: [1]
    });
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
    
    const currentValue = nameControl.value;
    
    if (currentValue && typeof currentValue === 'string') {
      const trimmedValue = currentValue.trim();
      
      if (trimmedValue !== currentValue) {
        nameControl.setValue(trimmedValue);
      }
      
      console.log(`Treatment ${i} name validated: "${trimmedValue}"`);
    }
  }

  updateTreatmentName(i: number, value: string) {
    const nameControl = this.treatments.at(i).get('name');
    if (nameControl) {
      nameControl.setValue(value, { emitEvent: true });
      nameControl.markAsDirty();
      nameControl.updateValueAndValidity();
      console.log(`Treatment ${i} name updated to: "${value}"`);
      
      this.logAllTreatmentNames();
      
      // Mark the form as dirty to enable the save button
      this.ordonnanceForm.markAsDirty();
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
    
    const canvas = this.signaturePad.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      let hasSignature = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) {
          hasSignature = true;
          break;
        }
      }
      
      if (hasSignature) {
        this.highQualitySignature = canvas.toDataURL('image/png');
        
        this.ordonnanceForm.patchValue({ signature: this.highQualitySignature });
        
        console.log('High-quality signature captured');
      } else {
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
    // Always proceed with saving, regardless of form validation state
    this.logAllTreatmentNames();
    
    const raw = this.ordonnanceForm.getRawValue(); // Get values even from disabled controls
    console.log("Treatment data before filtering:", JSON.stringify(raw.treatments));
    
    const treatmentsArray = Array.isArray(raw.treatments) ? raw.treatments : [];
    
    treatmentsArray.forEach((t: any, index: number) => {
      console.log(`Treatment ${index} before processing:`, 
        `name="${t.name}"`, 
        `name type=${typeof t.name}`, 
        `dose=${t.dose}`, 
        `frequency=${t.frequency}`);
    });
    
    // Process all treatments, even empty ones
    const treatments = treatmentsArray.map((t: any) => {
      if (!t) return null;
      
      // Ensure name is a string
      if (t.name === undefined || t.name === null) t.name = '';
      
      return {
        id: t.id || this.generateId(),
        name: t.name.trim(),
        dose: t.dose || 1,
        frequency: t.frequency || 1
      };
    }).filter((t: any) => t !== null); // Remove any null entries
    
    // Handle empty names for treatments with dose/frequency
    treatments.forEach((t: any) => {
      if (t.name === '') {
        if (t.dose > 0 || t.frequency > 0) {
          t.name = 'Traitement non spécifié';
        }
      }
    });
    
    console.log("Processed treatments:", JSON.stringify(treatments));
    
    treatments.forEach((t: any, index: number) => {
      console.log(`Treatment ${index} after processing: name="${t.name}"`);
    });
    
    const signatureExists = this.highQualitySignature && this.highQualitySignature.length > 0;
    
    const doctorData = this.doctor || this.data?.doctor || {};
    
    const doctorForDisplay = {
      name: doctorData.nameFr || doctorData.name,
      specialty: doctorData.specialtyFr || doctorData.specialty,
      address: doctorData.address || doctorData.clinic || '',
      phone: doctorData.phone || '',
      email: doctorData.email || ''
    };
    
    console.log('Doctor information for preview:', doctorForDisplay);
    
    const payload = {
      id: this.data?.ordonnance?.id,
      doctor: raw.doctor,
      patient: raw.patient,
      patientName: raw.patientName || raw.patient?.name || '',
      date: new Date().toISOString(),
      treatments: JSON.stringify(treatments),
      signature: signatureExists ? '[SIGNATURE]' : '',
      doctorId: this.data?.doctor?.id,
      patientId: this.data?.patient?.id,
      toothNumber: Number(this.data?.toothNumber)
    };
    
    console.log('Payload sent to backend:', payload);
    try {
      const decodedTreatments = JSON.parse(payload.treatments);
      console.log('Decoded treatments from payload:', decodedTreatments);
    } catch (e) {
      console.error('Error parsing treatments in payload:', e);
    }
    
    if (signatureExists && this.highQualitySignature) {
      const signatureKey = `signature_${this.data?.patient?.id}_${this.data?.toothNumber}`;
      localStorage.setItem(signatureKey, this.highQualitySignature);
      console.log('Signature saved to localStorage with key:', signatureKey);
    }
    
    this.ordonnanceService.saveOrdonnance(payload).subscribe(
      (response: any) => {
        this.snackBar.open(
          "Ordonnance enregistrée avec succès\nVous pouvez consulter les détails de l'ordonnance.",
          'Fermer',
          { duration: 4000, panelClass: ['success-snackbar'] }
        );
        this.dialogRef.close(true);
        setTimeout(() => {
          this.dialog.open(OrdonnanceDetailsDialog, {
            data: { 
              ordonnance: { 
                ...this.ordonnanceForm.getRawValue(), 
                doctor: doctorForDisplay,
                patient: raw.patient, 
                signature: this.highQualitySignature,
                treatments,
                date: new Date()
              } 
            },
            height:'500px',
            width: '500px',
            maxWidth: '100vw',
            panelClass: 'full-bleed-dialog',
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
          <div class="doctor-name">{{ (doctor$ | async)?.nameFr }}</div>
          <div class="doctor-specialty">{{ (doctor$ | async)?.specialtyFr }}</div>
        </div>
        <div class="ordonnance-logo-img-block">
          <img src="/assets/images/R.png" alt="Pharmacy Logo" class="ordonnance-logo-img" />
        </div>
        <div class="contact-info-block">
          <ul class="contact-list">
            <li class="contact-list-item">
              <mat-icon class="green-icon">location_on</mat-icon>
              <span class="contact-text">{{ (doctor$ | async)?.address }}</span>
            </li>
            <li class="contact-list-item">
              <mat-icon class="green-icon">phone</mat-icon>
              <span class="contact-text">{{ (doctor$ | async)?.phone }}</span>
            </li>
            <li class="contact-list-item">
              <mat-icon class="green-icon">email</mat-icon>
              <span class="contact-text">{{ (doctor$ | async)?.email }}</span>
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
          <div class="signature-container">
            <img *ngIf="isSignatureImage(ordonnance.signature)" [src]="ordonnance.signature" class="signature-image" alt="Signature du médecin">
            <svg *ngIf="!isSignatureImage(ordonnance.signature)" class="signature-svg" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,40 C20,20 30,50 40,30 C50,10 60,40 70,30 C80,20 90,40 100,30 C110,20 120,40 130,30 C140,20 150,40 160,30 C170,20 180,40 190,30 C200,20 210,40 220,30 C230,20 240,40 250,30" 
                fill="none" stroke="#0047ab" stroke-width="2" stroke-linecap="round"/>
              <text x="150" y="50" text-anchor="middle" font-family="'Dancing Script', cursive" font-size="16" fill="#0047ab">Dr. Aroua Youssef</text>
            </svg>
          </div>
          <div class="tunis-date">
            Tunis, le {{ formatDate() }}
          </div>
        </div>
      </div>
      <div class="ordonnance-actions">
        <button mat-flat-button color="accent" (click)="editOrdonnance()" style="margin-right: 8px;">Modifier</button>
        <button mat-flat-button color="primary" mat-dialog-close>Fermer</button>
      </div>
    </div>
  `,
  styles: [
    `
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&family=Pacifico&display=swap');
    .ordonnance-card-preview, .ordonnance-card {
      width: 100%;
      max-width: 700px;
      min-width: 380px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.10);
      padding: 40px 48px 40px 48px;
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
      border: 1px solid #e0e7ef;
      border-radius: 4px;
      padding: 4px;
      background: #fff;
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
    
    .no-signature-message {
      color: #999;
      font-style: italic;
      margin: 8px 0;
    }
    
    .signature-container {
      margin: 10px 0;
      text-align: center;
      height: 60px;
    }
    
    .signature-svg {
      width: 100%;
      max-width: 300px;
      height: 60px;
    }
    
    .signature-image {
      max-width: 300px;
      max-height: 60px;
      display: block;
      margin: 0 auto;
    }
    `],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, AsyncPipe],
})
export class OrdonnanceDetailsDialog implements OnInit {
  ordonnance: any;
  treatments: any[] = [];
  doctor$!: Observable<any>;
  dialogRef!: MatDialogRef<OrdonnanceDetailsDialog>;
   
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private profileService: ProfileService,
    private dialog: MatDialog,
    public matDialogRef: MatDialogRef<OrdonnanceDetailsDialog>
  ) {
    this.dialogRef = matDialogRef;
    this.ordonnance = data.ordonnance;
    console.log('Ordonnance data in preview:', this.ordonnance);
    
    if (!this.ordonnance.dateStr) {
      const today = new Date();
      this.ordonnance.dateStr = today.getDate() + ' ' + 
                       ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][today.getMonth()] + ' ' + 
                       today.getFullYear();
    }
    
    if (!this.isSignatureImage(this.ordonnance.signature) && 
        (!this.ordonnance.signature || this.ordonnance.signature === '[SIGNATURE]')) {
      this.ordonnance.signature = null;
    }
     
    if (typeof this.ordonnance.treatments === 'string') {
      try {
        this.treatments = JSON.parse(this.ordonnance.treatments);
      } catch (e) {
        console.error('Error parsing treatments JSON:', e);
        this.treatments = [];
      }
    } else {
      this.treatments = this.ordonnance.treatments || [];
    }
  }
    
  ngOnInit() {
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
      this.doctor$ = of(doctorData);
    }
  }

  isSignatureImage(signature: string | null | undefined): boolean {
    return !!signature && typeof signature === 'string' && signature.startsWith('data:image/');
  }
  
  formatDate(): string {
    if (this.ordonnance.dateStr && typeof this.ordonnance.dateStr === 'string') {
      return this.ordonnance.dateStr;
    }
    
    try {
      const date = this.ordonnance.date ? new Date(this.ordonnance.date) : new Date();
      const day = date.getDate();
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return '13 juin 2025';
    }
  }

  editOrdonnance(): void {
    this.dialogRef.close();
    
    const dialogRef = this.dialog.open(OrdonnanceFormComponent, {
      width: '800px',
      disableClose: false,
      data: {
        patient: this.ordonnance.patient,
        doctor: this.ordonnance.doctor,
        ordonnance: this.ordonnance,
        toothNumber: this.ordonnance.toothNumber,
        readonly: false
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        console.log('Ordonnance was successfully edited and saved');
      }
    });
  }
} 