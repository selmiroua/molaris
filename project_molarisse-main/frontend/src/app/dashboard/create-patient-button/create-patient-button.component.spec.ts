import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePatientButtonComponent } from './create-patient-button.component';

describe('CreatePatientButtonComponent', () => {
  let component: CreatePatientButtonComponent;
  let fixture: ComponentFixture<CreatePatientButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePatientButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePatientButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
