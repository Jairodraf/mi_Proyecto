import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class Footer {
  currentYear = new Date().getFullYear();

  links = [
    { path: '/', label: 'Inicio' },
    { path: '/contacto', label: 'Contacto' },
    { path: '/privacidad', label: 'Privacidad' },
    { path: '/registro', label: 'Registro' }
  ];
}
