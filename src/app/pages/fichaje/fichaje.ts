import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';

type PunchType = 'Entrada' | 'Salida';
type LastPressed = 'ENTRADA' | 'SALIDA';

interface HistoryItem {
  type: PunchType;    // 'Entrada' | 'Salida'
  date: string;       // fecha local formateada
  time: string;       // hora local formateada
  ts: string;         // ISO timestamp
  incidence?: string; // incidencia asociada a ese evento (entrada o salida)
}

@Component({
  selector: 'app-fichaje',
  standalone: true,
  imports: [CommonModule, FormsModule, NgForOf],
  templateUrl: './fichaje.html',
  styleUrls: ['./fichaje.scss']
})
export class Fichaje implements AfterViewInit, OnDestroy {

  // Último fichaje mostrado en la tarjeta
  lastType: string = '—';
  lastDate: string = '';
  lastTime: string = '';

  // Reloj en vivo
  currentTime: string = '';

  // Estado de botones
  entradaDisabled = false;
  salidaDisabled = true;

  // Historial persistente
  history: HistoryItem[] = [];
  private storageKey = 'fichaje_history_v1';

  // Track del último botón pulsado para asignar incidencias
  lastPressed: LastPressed | null = null;
  private lastEntryIndex: number | null = null;
  private lastExitIndex: number | null = null;

  // Filtros
  filterStart: string = '';
  filterEnd: string = '';

  // Incidencia (card roja)
  incidenceText: string = '';

  // Datos calculados para “Resultados”
  filteredGroups: Array<{
    date: string;
    pairs: Array<{ entrada: HistoryItem | null; salida: HistoryItem | null; durationMs: number }>;
    totalMs: number;
  }> = [];
  filteredTotalMs: number = 0;

  private clockIntervalId: any = null;

  constructor() {
    this.loadHistory();

    // Inicializa estado a partir del último registro
    const last = this.history[this.history.length - 1];
    if (last) {
      this.lastType = last.type;
      this.lastDate = last.date;
      this.lastTime = last.time;
      if (last.type === 'Entrada') {
        this.entradaDisabled = true;
        this.salidaDisabled = false;
      } else {
        this.entradaDisabled = false;
        this.salidaDisabled = true;
      }
    }

    // Reloj en vivo
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
  }

  ngAfterViewInit(): void {
    // nada obligatorio aquí ahora mismo
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
  }

  // ---------- Reloj ----------
  private updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ---------- Fichar ----------
  fichar(type: 'ENTRADA' | 'SALIDA') {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES');
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const iso = now.toISOString();

    if (type === 'ENTRADA') {
      const entry: HistoryItem = { type: 'Entrada', date, time, ts: iso };
      this.history.push(entry);
      this.lastEntryIndex = this.history.length - 1;
      this.lastPressed = 'ENTRADA';

      this.lastType = 'Entrada';
      this.lastDate = date;
      this.lastTime = time;

      this.entradaDisabled = true;
      this.salidaDisabled = false;
    } else {
      const exit: HistoryItem = { type: 'Salida', date, time, ts: iso };
      this.history.push(exit);
      this.lastExitIndex = this.history.length - 1;
      this.lastPressed = 'SALIDA';

      this.lastType = 'Salida';
      this.lastDate = date;
      this.lastTime = time;

      this.entradaDisabled = false;
      this.salidaDisabled = true;
    }

    this.saveHistory();
  }

  // ---------- Registrar incidencia (se asigna al último botón pulsado) ----------
  registerIncidentNow() {
    const text = (this.incidenceText || '').trim();
    if (!text) return;

    // Si sabemos cuál fue el último botón, asignamos ahí
    if (this.lastPressed === 'ENTRADA') {
      let idx = this.lastEntryIndex;
      if (idx == null) {
        // buscar la última Entrada si recargó la página
        for (let i = this.history.length - 1; i >= 0; i--) {
          if (this.history[i].type === 'Entrada') { idx = i; break; }
        }
      }
      if (idx != null && idx >= 0) {
        this.history[idx].incidence = text;
      }
    } else if (this.lastPressed === 'SALIDA') {
      let idx = this.lastExitIndex;
      if (idx == null) {
        // buscar la última Salida si recargó la página
        for (let i = this.history.length - 1; i >= 0; i--) {
          if (this.history[i].type === 'Salida') { idx = i; break; }
        }
      }
      if (idx != null && idx >= 0) {
        this.history[idx].incidence = text;
      }
    } else {
      // Si no hay último pulsado, como fallback asignamos a la última Entrada si existe, si no a la última Salida
      for (let i = this.history.length - 1; i >= 0; i--) {
        if (this.history[i].type === 'Entrada') { this.history[i].incidence = text; break; }
      }
    }

    this.incidenceText = '';
    this.saveHistory();
  }

  // ---------- Filtrado y agrupación para “Resultados” ----------
  applyFilter() {
    if (!this.filterStart || !this.filterEnd) {
      this.filteredGroups = [];
      this.filteredTotalMs = 0;
      return;
    }

    const start = new Date(this.filterStart + 'T00:00:00');
    const end = new Date(this.filterEnd + 'T23:59:59.999');

    // filtra por rango y ordena por tiempo
    const items = this.history
      .filter(h => {
        const t = new Date(h.ts);
        return t >= start && t <= end;
      })
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    // agrupa por fecha local
    const byDate = new Map<string, HistoryItem[]>();
    for (const it of items) {
      const d = new Date(it.ts).toLocaleDateString('es-ES');
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(it);
    }

    const groups: Array<{ date: string; pairs: Array<{ entrada: HistoryItem | null; salida: HistoryItem | null; durationMs: number }>; totalMs: number }> = [];
    let overall = 0;

    const orderedDates = Array.from(byDate.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    for (const d of orderedDates) {
      const arr = byDate.get(d)!;

      const pairs: Array<{ entrada: HistoryItem | null; salida: HistoryItem | null; durationMs: number }> = [];
      let pendingEntrada: HistoryItem | null = null;

      for (const it of arr) {
        if (it.type === 'Entrada') {
          // si había pendiente sin salida, emparejamos como entrada sin salida
          if (pendingEntrada) {
            pairs.push({ entrada: pendingEntrada, salida: null, durationMs: 0 });
          }
          pendingEntrada = it;
        } else {
          // Salida
          if (pendingEntrada) {
            const dur = new Date(it.ts).getTime() - new Date(pendingEntrada.ts).getTime();
            pairs.push({ entrada: pendingEntrada, salida: it, durationMs: Math.max(dur, 0) });
            pendingEntrada = null;
          } else {
            // Salida sin entrada previa: la registramos como par “huérfano”
            pairs.push({ entrada: null, salida: it, durationMs: 0 });
          }
        }
      }

      // Si quedó una entrada sin salida al final del día
      if (pendingEntrada) {
        pairs.push({ entrada: pendingEntrada, salida: null, durationMs: 0 });
      }

      const totalMs = pairs.reduce((acc, p) => acc + (p.durationMs || 0), 0);
      overall += totalMs;
      groups.push({ date: d, pairs, totalMs });
    }

    this.filteredGroups = groups;
    this.filteredTotalMs = overall;
  }

  // ---------- Utilidades ----------
  private saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch { /* noop */ }
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryItem[];
        this.history = parsed ?? [];
      }
    } catch {
      this.history = [];
    }
  }

  msToHhMm(ms: number) {
    const totalSec = Math.floor((ms || 0) / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  }
}
