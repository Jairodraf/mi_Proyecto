/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 *
 * Este es el componente raíz que se carga en <app-root>.
 * Contiene el header, el footer y el RouterOutlet donde se cargan las páginas.
 *
 * También gestiona el cálculo dinámico de la altura del header y footer
 * para ajustar el espaciado del contenido principal (main).
 */

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
  // Referencia al manejador de resize para poder eliminarlo después
  private resizeHandler: any;

  constructor(public router: Router) {
    // Guardar referencia del manejador para poder eliminarlo en ngOnDestroy
    this.resizeHandler = () => this.updateCssVars();
  }

  ngAfterViewInit(): void {
    // Calcular alturas después de que el header y footer se hayan renderizado
    // Pequeño timeout para asegurar que están completamente dibujados
    setTimeout(() => this.updateCssVars(), 50);

    // Escuchar cambios de tamaño de ventana para recalcular alturas
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    // Limpiar el listener al destruir el componente (buena práctica)
    window.removeEventListener('resize', this.resizeHandler);
  }

  /**
   * Actualiza las variables CSS con las alturas reales del header y footer
   * Esto permite que el main tenga el espaciado correcto automáticamente
   */
  private updateCssVars(): void {
    try {
      const doc = document.documentElement;
      const headerEl = document.querySelector('header');
      const footerEl = document.querySelector('footer');

      // Obtener alturas reales del DOM
      const headerH = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
      const footerH = footerEl ? Math.ceil(footerEl.getBoundingClientRect().height) : 0;

      // Actualizar variables CSS globales
      if (doc && doc.style) {
        doc.style.setProperty('--app-header-height', `${headerH}px`);
        doc.style.setProperty('--app-footer-height', `${footerH}px`);
      }
    } catch (e) {
      // Ignorar errores (por ejemplo, en entornos de testing sin DOM)
    }
  }
}

