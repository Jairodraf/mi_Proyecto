/**
 * Interceptor de autenticación HTTP
 *
 * Este interceptor hace dos cosas importantes:
 * 1. Añade automáticamente el token JWT a todas las peticiones HTTP al backend
 * 2. Detecta cuando el token ha expirado (error 401) y cierra la sesión automáticamente
 *
 * De esta forma no hay que añadir el token manualmente en cada servicio,
 * y si el token expira, el usuario es redirigido al login automáticamente.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  // Obtener el token del localStorage
  const tok = localStorage.getItem('jwt_token');

  // Inyectar servicios necesarios
  const router = inject(Router);
  const auth = inject(AuthService);

  // Si hay token, clonar la petición y añadir el header Authorization
  // Si no hay token, dejar la petición como está
  const clonedReq = tok ? req.clone({ setHeaders: { Authorization: `Bearer ${tok}` } }) : req;

  // Enviar la petición y capturar errores
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde con 401 (No autorizado) y hay token,
      // significa que el token ha expirado o es inválido
      if (error.status === 401 && tok) {
        auth.logout(); // Cerrar sesión (limpia localStorage)
        router.navigateByUrl('/login', { replaceUrl: true }); // Redirigir al login
      }
      // Lanzar el error para que lo maneje el servicio que hizo la petición
      return throwError(() => error);
    })
  );
};
