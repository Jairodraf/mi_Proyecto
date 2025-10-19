import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';   // *ngIf, *ngFor, pipes
import { FormsModule } from '@angular/forms';     // [(ngModel)]

interface Absence {
  id: string;
  start: string;      // YYYY-MM-DD
  end: string;        // YYYY-MM-DD
  reason: string;
  createdAt: string;  // ISO
}

@Component({
  selector: 'app-ausencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ausencias.html',
  styleUrls: ['./ausencias.scss']
})
export class Ausencias {
  // Form
  absenceStart = '';
  absenceEnd = '';
  absenceReason = '';

  // State
  absences: Absence[] = [];
  private storageKey = 'ausencias_v1';

  // Modal de confirmación
  showConfirm = false;
  pendingAbsence: Absence | null = null;

  constructor() {
    this.load();
  }

  /** Botón "Registrar ausencia" -> valida y abre modal (NO guarda aún) */
  onRegisterClick() {
    if (!this.absenceStart || !this.absenceEnd) {
      alert('Por favor, selecciona fecha de inicio y fin.');
      return;
    }
    const start = new Date(this.absenceStart + 'T00:00:00');
    const end   = new Date(this.absenceEnd   + 'T23:59:59');
    if (end < start) {
      alert('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    this.pendingAbsence = {
      id: this.uuid(),
      start: this.absenceStart,
      end: this.absenceEnd,
      reason: (this.absenceReason || '').trim() || 'Sin especificar',
      createdAt: new Date().toISOString()
    };
    this.showConfirm = true;
  }

  /** Cerrar modal sin guardar ni enviar */
  cancelConfirm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
  }

  /** Aceptar modal: guarda y abre el email con mailto */
  confirmAndEmail() {
    if (!this.pendingAbsence) return;

    // 1) Guardar en listado/localStorage
    this.absences.push(this.pendingAbsence);
    this.save();

    // 2) Preparar email
    const to = 'jaime.rodriguez.rafael@gmail.com';
    const startStr = this.formatDateES(this.pendingAbsence.start);
    const endStr   = this.formatDateES(this.pendingAbsence.end);
    const dias     = this.getDays(this.pendingAbsence);

    const subject = `Solicitud de ausencia: ${startStr} - ${endStr}`;
    const bodyLines = [
      'Hola,',
      '',
      'Solicito la siguiente ausencia:',
      `· Inicio: ${startStr}`,
      `· Fin: ${endStr}`,
      `· Días: ${dias}`,
      `· Motivo: ${this.pendingAbsence.reason}`,
      '',
      'Gracias y un saludo.'
    ];
    const body = bodyLines.join('\n');

    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // 3) Abrir aplicación de email
    window.location.href = mailto;

    // 4) Reset UI
    this.showConfirm = false;
    this.pendingAbsence = null;
    this.absenceStart = '';
    this.absenceEnd = '';
    this.absenceReason = '';
  }

  removeAbsence(id: string) {
    this.absences = this.absences.filter(a => a.id !== id);
    this.save();
  }

  getDays(a: Absence): number {
    const start = new Date(a.start + 'T00:00:00');
    const end   = new Date(a.end   + 'T23:59:59');
    const diff = end.getTime() - start.getTime();
    return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)) + 1, 1);
  }

  // Utils
  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.absences));
  }

  private load() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try { this.absences = JSON.parse(raw) as Absence[]; }
      catch { this.absences = []; }
    }
  }

  private uuid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private formatDateES(yyyyMMdd: string): string {
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
