import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacidad.html',
  styleUrls: ['./privacidad.scss']
})
export class Privacidad {
  constructor(private router: Router) {}
  goContacto() {
    this.router.navigate(['/contacto']);
  }
}
