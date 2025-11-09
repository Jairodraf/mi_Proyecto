// src/main.ts
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

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideNzI18n(es_ES),
    importProvidersFrom(NzModalModule,),
    provideHttpClient(withInterceptors([authInterceptor])), // ⬅️ imprescindible
  ]
}).catch(err => console.error(err));
