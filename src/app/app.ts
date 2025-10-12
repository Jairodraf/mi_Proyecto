import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Header } from "./shared/header/header";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Footer, Header],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  constructor(public router: Router) {}

  isLoginPage(): boolean {
    // Devuelve true si estás en /login exactamente
    return this.currentPath() === '/login';
  }

  currentPath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }
}

