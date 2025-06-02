import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretaryApplicationsComponent } from './secretary-applications.component';

describe('SecretaryApplicationsComponent', () => {
  let component: SecretaryApplicationsComponent;
  let fixture: ComponentFixture<SecretaryApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretaryApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretaryApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
