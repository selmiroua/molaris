import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { DemandeDataService } from './demande-data.service';

@Component({
  selector: 'app-demande-confirmation',
  templateUrl: './demande-confirmation.component.html',
  styleUrls: ['./demande-confirmation.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule]
})
export class DemandeConfirmationComponent implements OnInit {
  demandeData: any;

  constructor(
    private router: Router,
    private demandeDataService: DemandeDataService
  ) {}

  ngOnInit(): void {
    // Get the demande data from the service
    this.demandeData = this.demandeDataService.getDemandeData();

    // If no data is available, redirect back to the form
    if (!this.demandeData) {
      this.router.navigate(['/dashboard/demande']);
    }
  }

  goToDashboard(): void {
    // Clear the data when navigating away
    this.demandeDataService.clearDemandeData();
    this.router.navigate(['/dashboard/demande']);
  }
}
