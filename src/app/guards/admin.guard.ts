/**
 * Guard de Administrador
 *
 * Protege rutas que solo pueden acceder usuarios con rol Admin.
 * Si un usuario normal (Empleado) intenta acceder, lo redirige al inicio.
 *
 * Se usa en el archivo de rutas (app.routes.ts) con canMatch.
 * Por ejemplo, la ruta de registro de empleados solo la puede ver un Admin.
 */

import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanMatchFn = () => {
  // Inyectar servicios necesarios
  const auth = inject(AuthService);
  const router = inject(Router);

  // Comprobar si el usuario es Admin
  let isAdmin = false;
  auth.isAdmin$.subscribe(v => isAdmin = v).unsubscribe(); // Suscripción instantánea y cancelación

  // Si es Admin, permitir acceso
  if (isAdmin) return true;

  // Si no es Admin, redirigir al inicio y denegar acceso
  router.navigateByUrl('/', { replaceUrl: true });
  return false;
};
