import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss'
})
export class Contacto {
  nombre = '';
  email = '';
  mensaje = '';
  showEmailConfirm = false;

  onSubmit() {
    if (!this.nombre || !this.email || !this.mensaje) {
      alert('Por favor, completa todos los campos antes de enviar.');
      return;
    }

    if (this.mensaje.length < 10) {
      alert('El mensaje debe tener al menos 10 caracteres.');
      return;
    }

    // Mostrar modal de confirmación
    this.showEmailConfirm = true;
  }

  confirmEmail() {
    this.showEmailConfirm = false;

    const bodyLines = [
      `Nombre: ${this.nombre}`,
      `Email: ${this.email}`,
      '',
      'Mensaje:',
      this.mensaje
    ];

    const subject = `Contacto desde FichajeApp - ${this.nombre}`;
    const mailto = `mailto:jaime.rafrod@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailto;

    // Limpiar el formulario
    this.nombre = '';
    this.email = '';
    this.mensaje = '';
  }

  cancelEmail() {
    this.showEmailConfirm = false;
  }
}
