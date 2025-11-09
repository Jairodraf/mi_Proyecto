import { Component } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgIf, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  isAdmin$: Observable<boolean>;
  // opcional, por si quieres ocultar todo si no hay sesión
  // isLogged$ = this.auth.isLogged$;

  constructor(private auth: AuthService, private router: Router) {
    this.isAdmin$ = this.auth.isAdmin$;
  }

  esLogin(): boolean {
    return this.router.url === '/login';
  }

  // Botón “Cerrar sesión” si lo usas en el header
  salir(): void {
    this.auth.clear();
    this.router.navigateByUrl('/login');
  }
}
