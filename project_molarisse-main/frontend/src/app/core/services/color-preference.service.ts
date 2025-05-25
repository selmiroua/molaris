import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ColorPalette {
  pending: string;
  accepted: string;
  completed: string;
  rejected: string;
  canceled: string;
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class ColorPreferenceService {
  private readonly API_URL = `${environment.apiUrl}/api/color-preferences`;
  private readonly LOCAL_STORAGE_KEY = 'doctorColorPreferences';
  
  // Default colors
  readonly defaultColors: ColorPalette = {
    pending: '#FFF8E1',
    accepted: '#E8F5E9',
    completed: '#E3F2FD',
    rejected: '#FFEBEE',
    canceled: '#FAFAFA'
  };
  
  // Border colors derived from background colors
  readonly defaultBorderColors = {
    pending: '#f97316',
    accepted: '#0ea5e9',
    completed: '#22c55e',
    rejected: '#ef4444',
    canceled: '#9e9e9e'
  };

  constructor(private http: HttpClient) { }

  /**
   * Get color preferences for the current doctor
   * Tries API first, falls back to localStorage if API fails
   */
  getColorPreferences(): Observable<ColorPalette> {
    return this.http.get<ColorPalette>(`${this.API_URL}`).pipe(
      catchError(error => {
        console.warn('Failed to fetch color preferences from API, using local storage', error);
        // Try to get from localStorage
        const localPrefs = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        
        if (localPrefs) {
          try {
            return of(JSON.parse(localPrefs));
          } catch (e) {
            console.error('Failed to parse local preferences', e);
          }
        }
        
        // Use defaults if nothing else is available
        return of(this.defaultColors);
      })
    );
  }

  /**
   * Save color preferences for the current doctor
   * Saves to API and localStorage as backup
   */
  saveColorPreferences(colors: ColorPalette): Observable<any> {
    // Save to localStorage as backup
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(colors));
    
    // Save to API
    return this.http.post<any>(`${this.API_URL}`, colors).pipe(
      tap(() => console.log('Color preferences saved successfully')),
      catchError(error => {
        console.warn('Failed to save color preferences to API, using localStorage only', error);
        // Return success anyway since we saved to localStorage
        return of({ success: true, source: 'localStorage' });
      })
    );
  }

  /**
   * Reset color preferences to default
   */
  resetColorPreferences(): Observable<any> {
    // Remove from localStorage
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    
    // Reset in API
    return this.http.delete<any>(`${this.API_URL}`).pipe(
      tap(() => console.log('Color preferences reset successfully')),
      catchError(error => {
        console.warn('Failed to reset color preferences in API', error);
        // Return success anyway since we removed from localStorage
        return of({ success: true, source: 'localStorage' });
      })
    );
  }

  /**
   * Apply color preferences to DOM
   * This method adds CSS variables to the document root
   */
  applyColorPreferencesToDOM(colors: ColorPalette): void {
    const root = document.documentElement;
    
    // For each status, apply background color as a CSS variable
    Object.keys(colors).forEach(status => {
      const bgColor = colors[status as keyof ColorPalette];
      const textColor = this.getContrastColor(bgColor);
      const borderColor = this.getDarkerShade(bgColor);
      
      // Set background and text colors as CSS variables
      root.style.setProperty(`--status-${status}-bg`, bgColor);
      root.style.setProperty(`--status-${status}-text`, textColor);
      root.style.setProperty(`--status-${status}-border`, borderColor);
    });
    
    console.log('Applied color preferences to DOM');
  }
  
  /**
   * Calculate a contrasting text color (black or white) based on background brightness
   */
  private getContrastColor(hexColor: string): string {
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness (perceived luminance formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black for light backgrounds, white for dark
    return brightness > 128 ? '#000000' : '#ffffff';
  }
  
  /**
   * Calculate a darker shade of the given color for borders
   */
  private getDarkerShade(hexColor: string): string {
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    // Make color darker by a factor
    const darkenFactor = 0.7; // 30% darker
    
    r = Math.floor(r * darkenFactor);
    g = Math.floor(g * darkenFactor);
    b = Math.floor(b * darkenFactor);
    
    // Ensure no value goes below 0
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
} 