import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidateAccountComponent } from './validate-account.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

describe('ValidateAccountComponent', () => {
  let component: ValidateAccountComponent;
  let fixture: ComponentFixture<ValidateAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ValidateAccountComponent],
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with required controls', () => {
    expect(component.validateForm.contains('file')).toBeTruthy();
    expect(component.validateForm.contains('specialty')).toBeTruthy();
    expect(component.validateForm.contains('patent')).toBeTruthy();
  });

  it('should require the file field', () => {
    const fileControl = component.validateForm.get('file');
    fileControl?.setValue(null);
    expect(fileControl?.valid).toBeFalsy();
    fileControl?.setValue('dummy-file');
    expect(fileControl?.valid).toBeTruthy();
  });

  it('should require the specialty field if the user is a doctor', () => {
    component.isDoctor = true;
    fixture.detectChanges();

    const specialtyControl = component.validateForm.get('specialty');
    specialtyControl?.setValue('');
    expect(specialtyControl?.valid).toBeFalsy();
    specialtyControl?.setValue('orthodontics');
    expect(specialtyControl?.valid).toBeTruthy();
  });

  it('should require the patent field if the user is a fournisseur', () => {
    component.isFournisseur = true;
    fixture.detectChanges();

    const patentControl = component.validateForm.get('patent');
    patentControl?.setValue(null);
    expect(patentControl?.valid).toBeFalsy();
    patentControl?.setValue('dummy-patent');
    expect(patentControl?.valid).toBeTruthy();
  });

  it('should call onSubmit method when the form is submitted', () => {
    spyOn(component, 'onSubmit');
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should disable the submit button if the form is invalid', () => {
    component.validateForm.setErrors({ invalid: true });
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBeTruthy();
  });

  it('should enable the submit button if the form is valid', () => {
    component.validateForm.setErrors(null);
    component.validateForm.get('file')?.setValue('dummy-file');
    component.validateForm.get('specialty')?.setValue('orthodontics');
    component.validateForm.get('patent')?.setValue('dummy-patent');
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBeFalsy();
  });

  it('should handle file input change for certification', () => {
    const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
    const file = new File(['dummy-content'], 'certification.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    component.onFileChange(event);
    expect(component.validateForm.get('file')?.value).toEqual(file);
  });

  it('should handle file input change for patent', () => {
    component.isFournisseur = true;
    fixture.detectChanges();

    const patentInput = fixture.nativeElement.querySelector('input#patent');
    const file = new File(['dummy-content'], 'patent.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } };

    component.onPatentChange(event);
    expect(component.validateForm.get('patent')?.value).toEqual(file);
  });
});