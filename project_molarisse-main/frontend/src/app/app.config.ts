import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ProfileService } from './core/services/profile.service';
import { OrdonnanceService } from './core/services/ordonnance.service';

// Define a function to create the locked account interceptor
export function lockedAccountInterceptor(req: any, next: any) {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check for specific LockedException error
      if (error.status === 401 || error.status === 403 || error.status === 500) {
        const errorBody = JSON.stringify(error.error || '');
        const errorMessage = error.error?.message || '';
        
        // Detect Spring Security's LockedException or locked account message
        if (errorBody.includes('LockedException') || 
            errorBody.includes('User account is locked') ||
            errorMessage.includes('locked') ||
            errorMessage.includes('verrouillé')) {
          
          // Try to get the email from the failed request body if it was a login attempt
          try {
            const requestBody = JSON.parse(req.body as string);
            if (requestBody && requestBody.email) {
              localStorage.setItem('lastAttemptedEmail', requestBody.email);
            }
          } catch (e) {
            // Silently fail if we can't parse the request body
          }
          
          // Redirect to banned account page
          router.navigate(['/banned-account']);
        }
      }
      
      // Always rethrow the error for other interceptors/error handlers
      return throwError(() => error);
    })
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, lockedAccountInterceptor])),
    provideRouter(routes),
    provideAnimations(),
    ProfileService,
    OrdonnanceService
  ]
};
