// src/app/core/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const tok = localStorage.getItem('jwt_token');
  return next(tok ? req.clone({ setHeaders: { Authorization: `Bearer ${tok}` } }) : req);
};
