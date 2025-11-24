/**
 * Guard de Autenticación
 *
 * Protege rutas que requieren que el usuario esté logueado.
 * Si alguien intenta acceder sin haberse logueado, lo redirige al login.
 *
 * Se usa en el archivo de rutas (app.routes.ts) con canMatch.
 * Por ejemplo, las rutas de fichaje, ausencias y registro están protegidas.
 */

import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = () => {
  // Inyectar servicios necesarios
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si hay token (está logueado), permitir acceso
  if (auth.hasToken()) return true;

  // Si no hay token, redirigir al login y denegar acceso
  router.navigateByUrl('/login', { replaceUrl: true });
  return false;
};
