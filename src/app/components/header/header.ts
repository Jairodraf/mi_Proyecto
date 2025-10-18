import { Component } from '@angular/core';
import { RouterModule, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})

export class Header {
  /** Exposed observable used by the template with the async pipe */
  isAdmin$: Observable<boolean>;

  constructor(private auth: AuthService) {
    this.isAdmin$ = this.auth.isAdmin$;
  }

  loginAdmin(): void {
    this.auth.loginAsAdmin();
  }

  loginUser(): void {
    this.auth.loginAsUser();
  }



}
