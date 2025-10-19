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

  constructor(private auth: AuthService, private router: Router) {
    this.isAdmin$ = this.auth.isAdmin$;
  }

  esLogin(): boolean {
    return this.router.url === '/login';
  }

  loginAdmin(): void {
    this.auth.loginAsAdmin();
  }

  loginUser(): void {
    this.auth.loginAsUser();
  }
}
