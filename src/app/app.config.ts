/**
 * CONFIGURACIÓN DE LA APLICACIÓN
 *
 * Este archivo configura los providers globales de Angular.
 * Es similar a main.ts pero con configuración adicional para
 * localización en español, detección de cambios y manejo de errores.
 *
 * Nota: Este archivo puede estar duplicado con main.ts
 * (solo uno de los dos se usa dependiendo de la configuración del proyecto)
 */

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

// Registrar localización española (para fechas, números, etc.)
registerLocaleData(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),                    // Escuchar errores globales del navegador
    provideZoneChangeDetection({ eventCoalescing: true }),  // Optimización de detección de cambios
    provideRouter(routes),                                   // Sistema de rutas
    provideNzI18n(es_ES),                                   // ng-zorro en español
    provideAnimationsAsync(),                                // Animaciones (carga asíncrona)
    provideHttpClient()                                      // HttpClient para peticiones al backend
  ]
};
