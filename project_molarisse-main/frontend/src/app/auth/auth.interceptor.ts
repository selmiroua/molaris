import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('access_token');
    console.log(`AuthInterceptor - URL: ${req.url} - Token présent: ${!!token}`);
    
    // Clone the request and add the authorization header if token exists
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log(`AuthInterceptor - Headers envoyés:`, authReq.headers.keys());
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
} 