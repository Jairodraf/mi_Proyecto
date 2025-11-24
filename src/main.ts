/**
 * PUNTO DE ENTRADA DE LA APLICACIÓN
 *
 * Este archivo es el primero que se ejecuta cuando arranca la app.
 * Aquí se configura Angular y se inicializa el componente principal (App).
 *
 * También se registran todos los providers globales:
 * - Router (sistema de navegación)
 * - Animaciones
 * - ng-zorro (componentes de Ant Design)
 * - HttpClient con interceptor de autenticación
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNzI18n, es_ES } from 'ng-zorro-antd/i18n';
import { importProvidersFrom } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/auth.interceptor';

import { routes } from './app/app.routes';
import { App } from './app/app';

// Iniciar la aplicación Angular
bootstrapApplication(App, {
  providers: [
    provideRouter(routes),                                    // Sistema de rutas
    provideAnimations(),                                      // Animaciones de Angular
    provideNzI18n(es_ES),                                    // ng-zorro en español
    importProvidersFrom(NzModalModule),                      // Módulo de modales de ng-zorro
    provideHttpClient(withInterceptors([authInterceptor])),  // HttpClient con interceptor JWT
  ]
}).catch(err => console.error(err)); // Mostrar error si falla el arranque
