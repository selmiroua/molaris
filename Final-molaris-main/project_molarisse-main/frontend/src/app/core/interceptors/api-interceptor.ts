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

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('Intercepting request to:', request.url);
    
    // Clone the request and handle content type differently based on body type
    let clonedRequest;
    
    if (request.body instanceof FormData) {
      // Pour FormData, ne pas spécifier Content-Type pour que le navigateur 
      // définisse automatiquement le boundary correct
      clonedRequest = request.clone({
        setHeaders: {
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      console.log('Envoi de FormData, laissant le Content-Type être défini automatiquement');
    } else {
      // Pour les requêtes JSON standard
      clonedRequest = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      console.log('Envoi de JSON, Content-Type défini à application/json');
    }

    // Pass the cloned request instead of the original request
    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Erreur HTTP (${error.status}):`, error);
        
        if (error.status === 0) {
          console.error('Erreur CORS ou réseau:', error);
        } else if (error.status === 400) {
          console.error('Erreur 400 Bad Request - Données invalides:', error);
          console.error('Corps de la requête:', request.body);
        } else if (error.status === 401) {
          console.error('Erreur 401 Unauthorized - Authentification requise');
        } else if (error.status === 403) {
          console.error('Erreur 403 Forbidden - Accès refusé');
        } else if (error.status === 404) {
          console.error('Erreur 404 Not Found - Ressource non trouvée:', request.url);
        }
        
        // Log des détails supplémentaires pour le débogage
        if (error.error instanceof ErrorEvent) {
          console.error('Erreur côté client:', error.error.message);
        } else {
          try {
            console.error(
              `Code d'erreur backend: ${error.status}, ` +
              `Corps: ${JSON.stringify(error.error)}`
            );
          } catch (e) {
            console.error('Impossible de parser le corps de l\'erreur:', error.error);
          }
        }
        
        // Rethrow the error
        return throwError(() => error);
      })
    );
  }
} 