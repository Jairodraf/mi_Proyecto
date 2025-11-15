import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AusenciasService } from '../../services/ausencias.service';

interface Absence {
  id: string;
  start: string;
  end: string;
  reason: string;
  createdAt: string;
}

@Component({
  selector: 'app-ausencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ausencias.html',
  styleUrls: ['./ausencias.scss']
})
export class Ausencias {
  absenceStart = '';
  absenceEnd = '';
  absenceReason = '';

  absences: Absence[] = [];
  private storageKey = 'ausencias_v1';

  showConfirm = false;
  pendingAbsence: Absence | null = null;

  constructor(private api: AusenciasService) {
    this.load();
  }

  onRegisterClick() {
    if (!this.absenceStart || !this.absenceEnd) {
      alert('Por favor, selecciona fecha de inicio y fin.');
      return;
    }

    const start = new Date(this.absenceStart + 'T00:00:00');
    const end = new Date(this.absenceEnd + 'T23:59:59');

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

  cancelConfirm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
  }

  confirmAndEmail() {
    if (!this.pendingAbsence) return;

    const dto = {
      start: this.pendingAbsence.start,
      end: this.pendingAbsence.end,
      reason: this.pendingAbsence.reason
    };

    this.api.crear(dto).subscribe({
      next: (res) => {
        this.absences.push({
          id: res.id,
          start: res.start,
          end: res.end,
          reason: res.reason,
          createdAt: res.createdAt
        });

        this.save();
        this.sendEmail(this.pendingAbsence!);
        this.resetForm();
      },
      error: () => alert('Error al registrar la ausencia en el servidor')
    });
  }

  private sendEmail(a: Absence) {
    const startStr = this.formatDateES(a.start);
    const endStr = this.formatDateES(a.end);
    const dias = this.getDays(a);

    const bodyLines = [
      'Hola,',
      '',
      'Solicito la siguiente ausencia:',
      `· Inicio: ${startStr}`,
      `· Fin: ${endStr}`,
      `· Días: ${dias}`,
      `· Motivo: ${a.reason}`,
      '',
      'Gracias y un saludo.'
    ];

    const subject = `Solicitud de ausencia: ${startStr} - ${endStr}`;
    const mailto = `mailto:jaime.rodriguez.rafael@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailto;
  }

  removeAbsence(id: string) {
    this.absences = this.absences.filter(a => a.id !== id);
    this.save();
  }

  private resetForm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
    this.absenceStart = '';
    this.absenceEnd = '';
    this.absenceReason = '';
  }

  getDays(a: Absence): number {
    const start = new Date(a.start + 'T00:00:00');
    const end = new Date(a.end + 'T23:59:59');
    const diff = end.getTime() - start.getTime();
    return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)) + 1, 1);
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.absences));
  }

  private load() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.absences = JSON.parse(raw) as Absence[];
      } catch {
        this.absences = [];
      }
    }
  }

  private uuid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private formatDateES(yyyyMMdd: string): string {
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
