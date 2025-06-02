import { Component } from '@angular/core';
import { ProfileComponent } from '../../../profile/profile.component';

@Component({
  selector: 'app-profile-wrapper',
  template: '<app-profile></app-profile>',
  styles: [],
  imports: [ProfileComponent],
  standalone: true
})
export class ProfileWrapperComponent {} 