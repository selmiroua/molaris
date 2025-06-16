import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretaryProfileDialogComponent } from './secretary-profile-dialog.component';

describe('SecretaryProfileDialogComponent', () => {
  let component: SecretaryProfileDialogComponent;
  let fixture: ComponentFixture<SecretaryProfileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretaryProfileDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretaryProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
