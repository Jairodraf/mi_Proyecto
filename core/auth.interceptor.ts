import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tok = localStorage.getItem('jwt_token');
  return next(tok ? req.clone({ setHeaders: { Authorization: `Bearer ${tok}` } }) : req);
};
