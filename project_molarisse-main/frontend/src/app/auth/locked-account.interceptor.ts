import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class LockedAccountInterceptor implements HttpInterceptor {
  
  constructor(private router: Router) {}
  
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
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
              const requestBody = JSON.parse(request.body as string);
              if (requestBody && requestBody.email) {
                localStorage.setItem('lastAttemptedEmail', requestBody.email);
              }
            } catch (e) {
              // Silently fail if we can't parse the request body
            }
            
            // Redirect to banned account page
            this.router.navigate(['/banned-account']);
          }
        }
        
        // Always rethrow the error for other interceptors/error handlers
        return throwError(() => error);
      })
    );
  }
} 