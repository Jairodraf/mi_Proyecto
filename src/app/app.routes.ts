/**
 * CONFIGURACIÓN DE RUTAS DE LA APLICACIÓN
 *
 * Aquí se definen todas las rutas (URLs) de la aplicación y qué componente
 * se carga en cada una. También se configuran los guards que protegen
 * ciertas rutas para que solo puedan acceder usuarios autenticados o admins.
 *
 * Tipos de rutas:
 * - Públicas: Cualquiera puede acceder (login, contacto, privacidad)
 * - Protegidas: Solo usuarios logueados (fichaje, ausencias)
 * - Admin: Solo usuarios con rol Admin (registro de empleados)
 */

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Privacidad } from './pages/privacidad/privacidad';
import { Ausencias } from './pages/ausencias/ausencias';
import { Contacto } from './pages/contacto/contacto';
import { Fichaje } from './pages/fichaje/fichaje';

export const routes: Routes = [
  // Ruta pública: página de inicio de sesión
  { path: 'login', component: Login },

  // ============================================
  // RUTAS PROTEGIDAS (requieren estar logueado)
  // ============================================

  // Página de fichaje (entrada/salida)
  { path: 'fichaje',   component: Fichaje,   canMatch: [authGuard] },

  // Página de gestión de ausencias
  { path: 'ausencias', component: Ausencias, canMatch: [authGuard] },

  // ============================================
  // RUTAS SOLO PARA ADMIN
  // ============================================

  // Página de registro/gestión de empleados (solo Admin)
  // Requiere estar logueado Y ser Admin
  { path: 'registro',  component: Registro,  canMatch: [authGuard, adminGuard] },

  // ============================================
  // RUTAS PÚBLICAS (sin protección)
  // ============================================

  // Página de política de privacidad
  { path: 'privacidad', component: Privacidad },

  // Página de contacto
  { path: 'contacto',   component: Contacto },

  // Redirección legacy (por si alguien pone .html)
  { path: 'contacto.html', redirectTo: 'contacto', pathMatch: 'full' },

  // ============================================
  // RUTAS POR DEFECTO Y ERROR
  // ============================================

  // Ruta raíz: redirige al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Ruta comodín: cualquier URL no definida vuelve al login
  { path: '**', redirectTo: '' }
];
