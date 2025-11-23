// src/app/core/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const tok = localStorage.getItem('jwt_token');
  const router = inject(Router);
  const auth = inject(AuthService);

  const clonedReq = tok ? req.clone({ setHeaders: { Authorization: `Bearer ${tok}` } }) : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el token ha expirado o es inválido (401), cerrar sesión y redirigir
      if (error.status === 401 && tok) {
        auth.logout();
        router.navigateByUrl('/login', { replaceUrl: true });
      }
      return throwError(() => error);
    })
  );
};
