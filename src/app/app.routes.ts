import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Privacidad } from './pages/privacidad/privacidad';
import { Ausencias } from './pages/ausencias/ausencias';
import { Contacto } from './pages/contacto/contacto';
import { Fichaje } from './pages/fichaje/fichaje';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'fichaje', component: Fichaje },
  { path: 'privacidad', component: Privacidad },
  { path: 'contacto', component: Contacto },
  { path: 'ausencias', component: Ausencias },
  { path: 'contacto.html', redirectTo: 'contacto', pathMatch: 'full' },


  { path: 'logout', redirectTo: 'login' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
