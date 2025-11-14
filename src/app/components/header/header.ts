import { Component } from '@angular/core';
import { RouterModule, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  isAdmin$: Observable<boolean>;
  isLogged$: Observable<boolean>;

  constructor(private auth: AuthService, private router: Router) {
    this.isAdmin$ = this.auth.isAdmin$;
    this.isLogged$ = this.auth.isLogged$;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true }).then(() => {
      // bloqueo del primer “atrás”
      history.pushState(null, '', location.href);
      window.addEventListener('popstate', () => {
        history.pushState(null, '', location.href);
      }, { once: true });
    });
  }
}
