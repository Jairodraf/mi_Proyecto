import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  links = [
    { path: '/', label: 'Inicio' },
    { path: '/contacto', label: 'Contacto' },
    { path: '/privacidad', label: 'Privacidad' }
  ];
}
