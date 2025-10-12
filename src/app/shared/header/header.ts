import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/contacto', label: 'Contacto' },
    { path: '/privacidad', label: 'Privacidad' },
    { path: '/registro', label: 'Registro' },
    { path: '/login', label: 'Login' }
  ];
}
