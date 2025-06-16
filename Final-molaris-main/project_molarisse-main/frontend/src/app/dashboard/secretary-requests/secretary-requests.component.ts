import { Component, OnInit } from '@angular/core';
import { AdminService, SecretaryRequest } from '../../services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-secretary-requests',
  templateUrl: './secretary-requests.component.html',
  styleUrls: ['./secretary-requests.component.scss']
})
export class SecretaryRequestsComponent implements OnInit {
  requests: SecretaryRequest[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.error = null;
    
    this.adminService.getSecretaryRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading secretary requests:', err);
        this.error = 'Une erreur est survenue lors du chargement des demandes.';
        this.loading = false;
      }
    });
  }

  approveRequest(requestId: number): void {
    this.adminService.approveSecretaryRequest(requestId).subscribe({
      next: () => {
        this.snackBar.open('Demande approuvée avec succès', 'Fermer', { duration: 3000 });
        this.loadRequests(); // Reload the list
      },
      error: (err) => {
        console.error('Error approving request:', err);
        this.snackBar.open('Erreur lors de l\'approbation de la demande', 'Fermer', { duration: 3000 });
      }
    });
  }

  rejectRequest(requestId: number): void {
    this.adminService.rejectSecretaryRequest(requestId).subscribe({
      next: () => {
        this.snackBar.open('Demande rejetée', 'Fermer', { duration: 3000 });
        this.loadRequests(); // Reload the list
      },
      error: (err) => {
        console.error('Error rejecting request:', err);
        this.snackBar.open('Erreur lors du rejet de la demande', 'Fermer', { duration: 3000 });
      }
    });
  }
} 