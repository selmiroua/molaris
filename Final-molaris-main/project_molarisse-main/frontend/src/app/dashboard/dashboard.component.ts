import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  message: string = '';

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.message = navigation?.extras.state?.['message'] || '';
  }
}