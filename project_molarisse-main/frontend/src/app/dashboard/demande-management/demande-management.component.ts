import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DemandeService, DemandeResponse } from './demande.service';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-demande-management',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, MatTooltipModule],
  providers: [DemandeService],
  templateUrl: './demande-management.component.html',
  styleUrls: ['./demande-management.component.scss']
})
export class DemandeManagementComponent implements OnInit, OnDestroy {
  demandes: DemandeResponse[] = [];
  error: string | null = null;
  loading: boolean = true;
  selectedDemande: DemandeResponse | null = null;
  selectedImage: string | null = null;
  private imageUrls: Map<string, string> = new Map();

  constructor(private demandeService: DemandeService) {
    console.log('DemandeManagementComponent constructed');
    console.log('API URL:', environment.apiUrl);
  }

  ngOnInit() {
    console.log('DemandeManagementComponent initialized');
    this.loadDemandes();
  }

  ngOnDestroy() {
    // Clean up blob URLs
    this.imageUrls.forEach(url => URL.revokeObjectURL(url));
  }

  loadDemandes() {
    console.log('Loading demandes...');
    this.error = null;
    this.loading = true;
    this.demandeService.getDemandes().subscribe({
      next: (data) => {
        console.log('Demandes loaded:', data);
        this.demandes = data;
        this.loading = false;
        // Preload images for loaded demandes
        this.demandes.forEach(demande => {
          if (demande.photoPath) this.loadImage(demande.photoPath);
          if (demande.photoDiplomePath) this.loadImage(demande.photoDiplomePath);
          if (demande.photoCabinetPath) this.loadImage(demande.photoCabinetPath);
        });
      },
      error: (error: Error) => {
        console.error('Error loading demandes:', error);
        this.error = 'Failed to load demandes. Please try again later.';
        this.loading = false;
      }
    });
  }

  private loadImage(path: string): void {
    if (!this.imageUrls.has(path)) {
      console.log('[DemandeManagement] Loading image:', path);
      this.demandeService.getImage(path).subscribe({
        next: (blob) => {
          console.log('[DemandeManagement] Image loaded successfully:', path);
          const url = URL.createObjectURL(blob);
          this.imageUrls.set(path, url);
        },
        error: (error) => {
          console.error('[DemandeManagement] Error loading image:', path, error);
          // Only set placeholder if we haven't already set a URL for this path
          if (!this.imageUrls.has(path)) {
            this.imageUrls.set(path, 'assets/images/placeholder-image.png');
          }
        }
      });
    } else {
      console.log('[DemandeManagement] Image already loaded:', path);
    }
  }

  acceptDemande(id: number) {
    this.demandeService.updateDemandeStatus(id, 'APPROVED').subscribe({
      next: () => {
        console.log('Demande accepted successfully');
        this.loadDemandes();
      },
      error: (error: Error) => {
        console.error('Error accepting demande:', error);
        this.error = 'Failed to accept demande. Please try again later.';
      }
    });
  }

  refuseDemande(id: number) {
    this.demandeService.updateDemandeStatus(id, 'REJECTED').subscribe({
      next: () => {
        console.log('Demande refused successfully');
        this.loadDemandes();
      },
      error: (error: Error) => {
        console.error('Error refusing demande:', error);
        this.error = 'Failed to refuse demande. Please try again later.';
      }
    });
  }

  viewDemandeDetails(demande: DemandeResponse) {
    console.log('Selected demande:', demande);
    console.log('Photo paths:', {
      profile: demande.photoPath,
      diploma: demande.photoDiplomePath,
      cabinet: demande.photoCabinetPath
    });
    this.selectedDemande = demande;
  }

  closeModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal') ||
        (event.target as HTMLElement).classList.contains('close-btn') ||
        (event.target as HTMLElement).closest('.close-btn')) {
      this.selectedDemande = null;
      this.selectedImage = null;
    }
  }

  getImageUrl(path: string | null): string {
    if (!path) {
      console.log('No image path provided');
      return 'assets/images/placeholder-image.png';
    }

    const url = this.imageUrls.get(path);
    if (!url) {
      this.loadImage(path);
      return 'assets/images/placeholder-image.png';
    }
    return url;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    const path = img.getAttribute('data-original-path');
    console.error('[DemandeManagement] Image failed to load:', {
      originalSrc: img.src,
      path: path
    });

    // If the image failed to load and it's not already a placeholder
    if (!img.src.includes('placeholder-image.png')) {
      img.src = 'assets/images/placeholder-image.png';
      img.classList.add('error-image');

      // Retry loading the image if it failed
      if (path) {
        console.log('[DemandeManagement] Retrying image load:', path);
        this.loadImage(path);
      }
    }
  }

  viewFullImage(path: string) {
    console.log('Viewing full image:', path);
    this.selectedImage = this.getImageUrl(path);
  }

  closeFullImage(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('full-image-modal')) {
      this.selectedImage = null;
    }
  }
}
