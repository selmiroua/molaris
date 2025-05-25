import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DemandeDataService {
  private demandeData: any = null;

  setDemandeData(data: any): void {
    this.demandeData = data;
  }

  getDemandeData(): any {
    return this.demandeData;
  }

  clearDemandeData(): void {
    this.demandeData = null;
  }
}
