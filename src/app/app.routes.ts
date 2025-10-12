import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { Privacidad } from './privacidad/privacidad';
import { Contacto } from './contacto/contacto';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'privacidad', component: Privacidad },
  { path: 'contacto', component: Contacto },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
