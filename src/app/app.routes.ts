// src/app/app.routes.ts
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
  { path: 'login', component: Login },

  // protegidas (requieren token)
  { path: 'fichaje',   component: Fichaje,   canMatch: [authGuard] },
  { path: 'ausencias', component: Ausencias, canMatch: [authGuard] },

  // solo admin
  { path: 'registro',  component: Registro,  canMatch: [authGuard, adminGuard] },

  // públicas
  { path: 'privacidad', component: Privacidad },
  { path: 'contacto',   component: Contacto },
  { path: 'contacto.html', redirectTo: 'contacto', pathMatch: 'full' },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
