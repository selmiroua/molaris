import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ordonnance-form',
  templateUrl: './ordonnance-form.component.html',
  styleUrls: ['./ordonnance-form.component.scss']
})
export class OrdonnanceFormComponent {
  ordonnanceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OrdonnanceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { patient: any }
  ) {
    this.ordonnanceForm = this.fb.group({
      doctor: this.fb.group({
        name: ['Dr. Nadia Ben Salem'],
        specialty: ['Chirurgien-dentiste'],
        rpps: ['123456678901'],
        clinic: ['Cabinet Dentaire SmileCare'],
        phone: ['+216 71 123 456'],
        email: ['smilecare.dentiste@gmail.com']
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
      signature: ['']
    });
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

  save() {
    if (this.ordonnanceForm.valid) {
      this.dialogRef.close(this.ordonnanceForm.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
} 