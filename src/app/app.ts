import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from "./components/header/header";
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private resizeHandler: any;

  constructor(public router: Router) {
    // bind handler so we can remove later
    this.resizeHandler = () => this.updateCssVars();
  }

  ngAfterViewInit(): void {
    // initial set after view is ready
    // small timeout to allow header/footer to render
    setTimeout(() => this.updateCssVars(), 50);
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  private updateCssVars(): void {
    try {
      const doc = document.documentElement;
      const headerEl = document.querySelector('header');
      const footerEl = document.querySelector('footer');
      const headerH = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
      const footerH = footerEl ? Math.ceil(footerEl.getBoundingClientRect().height) : 0;
      if (doc && doc.style) {
        doc.style.setProperty('--app-header-height', `${headerH}px`);
        doc.style.setProperty('--app-footer-height', `${footerH}px`);
      }
    } catch (e) {
      // silently ignore in environments where document isn't available
      // console.warn(e);
    }
  }


}

