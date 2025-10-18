import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
scm-history-item:d%3A%5COneDrive%20-%20Educacyl%5CCFGS%20DAM%5CPROYECTO%20DAM%5CMiProyecto%5Cmi_Proyecto?%7B%22repositoryId%22%3A%22scm0%22%2C%22historyItemId%22%3A%22e1dc6972996b3244e27d3a3e89f318ae6f93650c%22%2C%22historyItemParentId%22%3A%220b39f9b37da87cb0984b828254d10c7e9792bb52%22%2C%22historyItemDisplayId%22%3A%22e1dc697%22%7D
@Component({
  selector: 'app-fichaje',
  standalone: true,
  imports: [CommonModule, FormsModule, NgForOf],
  // Use the repaired official template
  templateUrl: './fichaje.html',
  styleUrls: ['./fichaje.scss']
})
export class Fichaje implements AfterViewInit, OnDestroy {
  lastType: string = '—';
  lastDate: string = '';
  lastTime: string = '';
  // Live clock shown above buttons
  currentTime: string = '';

  // Button states: entrada enabled initially, salida disabled
  entradaDisabled = false;
  salidaDisabled = true;

  // Persisted history of fichajes. Each entry may have an optional `incidence` text.
  history: Array<{ type: string; date: string; time: string; ts: string; incidence?: string }> = [];

  private storageKey = 'fichaje_history_v1';
  private clockIntervalId: any;
  private _resizeHandler: (() => void) | null = null;
  private _mutationObservers: MutationObserver[] = [];

  // Filter inputs
  filterStart: string = '';
  filterEnd: string = '';

  // Incidence input bound to the textarea; when registered it will be attached to the last 'Entrada' of the same day
  incidenceText: string = '';

  // Computed groups after applying filter
  filteredGroups: Array<{ date: string; pairs: Array<{ entrada: any; salida: any; durationMs: number }>; totalMs: number; dayIncidence?: string }> = [];
  filteredTotalMs: number = 0;

  // When grouping by day we can attach a day-level incidence (string) if any were registered for that day
  // The filteredGroups entries will include an optional `dayIncidence` property added in applyFilter().

  constructor() {
    this.loadHistory();
    // Initialize button state based on last history item (if any)
    const last = this.history[this.history.length - 1];
    if (last && last.type === 'Entrada') {
      this.entradaDisabled = true;
      this.salidaDisabled = false;
      this.lastType = last.type;
      this.lastDate = last.date;
      this.lastTime = last.time;
    }

    // Start live clock
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
  }

  ngAfterViewInit(): void {
    // measure left control card and expose a CSS variable so right control cards can match height
    this.updateControlHeights();
    this.updateTopCardsHeight();
    this._resizeHandler = () => {
      this.updateControlHeights();
      this.updateTopCardsHeight();
    };
    window.addEventListener('resize', this._resizeHandler);

    // Setup MutationObservers on top cards so their height changes update the CSS var
    this.setupMutationObservers();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    // disconnect mutation observers
    for (const obs of this._mutationObservers) {
      try { obs.disconnect(); } catch (e) { /* noop */ }
    }
    this._mutationObservers = [];
  }

  private setupMutationObservers() {
    try {
      const ids = ['leftControlsCard', 'lastFichajeCard', 'filterCard'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const obs = new MutationObserver(() => this.updateTopCardsHeight());
          obs.observe(el, { attributes: true, childList: true, subtree: true, characterData: true });
          this._mutationObservers.push(obs);
        }
      }
    } catch (e) {
      // ignore if DOM is not available
    }
  }

  private updateControlHeights() {
    try {
      const el = document.getElementById('leftControlsCard');
      if (el && el.getBoundingClientRect) {
        const h = Math.round(el.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--left-controls-height', `${h}px`);
      }
    } catch (e) {
      // no-op
    }
  }

  private updateTopCardsHeight() {
    try {
      const ids = ['leftControlsCard', 'filterCard'];
      let maxH = 0;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect) {
          const h = Math.round(el.getBoundingClientRect().height);
          if (h > maxH) maxH = h;
        }
      }
      if (maxH > 0) document.documentElement.style.setProperty('--top-cards-height', `${maxH}px`);
    } catch (e) {
      // ignore
    }
  }

  private updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  fichar(type: 'ENTRADA' | 'SALIDA') {
    const now = new Date();
    // Format date/time for display
    const date = now.toLocaleDateString('es-ES');
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (type === 'ENTRADA') {
      this.lastType = 'Entrada';
      this.lastDate = date;
      this.lastTime = time;
      this.entradaDisabled = true;
      this.salidaDisabled = false;
      // Record Entrada without attaching a pre-registered incidence (incidences are registered explicitly)
      this.pushHistory('Entrada', date, time, now.toISOString());
    } else {
      this.lastType = 'Salida';
      this.lastDate = date;
      this.lastTime = time;
      this.entradaDisabled = false;
      this.salidaDisabled = true;
      this.pushHistory('Salida', date, time, now.toISOString());
    }
  }

  /**
   * Register an incidence immediately with the current timestamp.
   * It will be saved as an entry of type 'Incidencia' and can be grouped per day.
   */
  registerIncidentNow() {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES');
    const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ts = now.toISOString();
    const text = this.incidenceText ? this.incidenceText.trim() : '';
    if (!text) return;
    // Try to attach the incidence to the most recent Entrada that doesn't already have one
    for (let i = this.history.length - 1; i >= 0; i--) {
      const h = this.history[i] as any;
      if (h.type === 'Entrada' && !h.incidence) {
        h.incidence = text;
        this.saveHistory();
        this.incidenceText = '';
        // keep lastType as the last actual entry type, but update last fields if needed
        this.lastType = h.type;
        this.lastDate = h.date;
        this.lastTime = h.time;
        setTimeout(() => this.updateTopCardsHeight(), 50);
        return;
      }
    }
    // No Entrada found to attach: record as a standalone Incidencia entry (grouped by day)
    const entry: any = { type: 'Incidencia', date, time, ts, incidence: text };
    this.history.push(entry);
    this.saveHistory();
    this.incidenceText = '';
    this.lastType = 'Incidencia';
    this.lastDate = date;
    this.lastTime = time;
    setTimeout(() => this.updateTopCardsHeight(), 50);
  }

  private pushHistory(type: string, date: string, time: string, ts: string, incidence?: string) {
    // If this is an Entrada and incidence is provided, store it on this entry.
    const entry: any = { type, date, time, ts };
    if (incidence) entry.incidence = incidence;
    this.history.push(entry);
    this.saveHistory();
  }

  private saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        // Support older format without incidence field by migrating entries
        const parsed = JSON.parse(raw) as Array<any>;
        this.history = parsed.map((e: any) => ({ type: e.type, date: e.date, time: e.time, ts: e.ts, incidence: e.incidence }));
        // Populate last fields with the latest entry
        const last = this.history[this.history.length - 1];
        if (last) {
          this.lastType = last.type;
          this.lastDate = last.date;
          this.lastTime = last.time;
        }
      }
    } catch (e) {
      console.warn('Could not load history from localStorage', e);
      this.history = [];
    }
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem(this.storageKey);
    this.lastType = '—';
    this.lastDate = '';
    this.lastTime = '';
    this.entradaDisabled = false;
    this.salidaDisabled = true;
    this.filteredGroups = [];
    this.filteredTotalMs = 0;
  }

  applyFilter() {
    // parse filterStart/filterEnd as local dates
    if (!this.filterStart || !this.filterEnd) {
      this.filteredGroups = [];
      this.filteredTotalMs = 0;
      return;
    }
    const start = new Date(this.filterStart + 'T00:00:00');
    const end = new Date(this.filterEnd + 'T23:59:59.999');

    // filter history entries within range
    const items = this.history.filter(h => {
      const t = new Date(h.ts);
      return t >= start && t <= end;
    }).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    // group by local date
    const groupsMap = new Map<string, Array<any>>();
    for (const it of items) {
      const localDate = new Date(it.ts).toLocaleDateString('es-ES');
      if (!groupsMap.has(localDate)) groupsMap.set(localDate, []);
      groupsMap.get(localDate)!.push(it);
    }

  const groups: Array<{ date: string; pairs: Array<{ entrada: any; salida: any; durationMs: number }>; totalMs: number; dayIncidence?: string }> = [];
    let overall = 0;
    // iterate groups in date order
    const orderedDates = Array.from(groupsMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    for (const date of orderedDates) {
      const arr = groupsMap.get(date)!;
      const pairs: Array<{ entrada: any; salida: any; durationMs: number }> = [];
      // Collect any day-level incidence entries (type === 'Incidencia')
      const dayInc = arr.filter(x => x.type === 'Incidencia').map(x => x.incidence).filter(Boolean);
      const dayIncidenceText = dayInc.length ? dayInc.join(' | ') : undefined;
      let pending: any = null;
      for (const it of arr) {
        if (it.type === 'Entrada') {
          pending = it;
        } else if (it.type === 'Salida') {
          if (pending) {
            const dur = new Date(it.ts).getTime() - new Date(pending.ts).getTime();
            // include incidence text from the Entrada entry (if any)
            pairs.push({ entrada: pending, salida: it, durationMs: dur });
            pending = null;
          } else {
            // unmatched salida — ignore or could be paired with previous day; skip
          }
        }
      }
      const totalMs = pairs.reduce((s, p) => s + p.durationMs, 0);
      overall += totalMs;
      const g: any = { date, pairs, totalMs };
      if (dayIncidenceText) g.dayIncidence = dayIncidenceText;
      groups.push(g);
    }

    this.filteredGroups = groups;
    this.filteredTotalMs = overall;
  }

  // helper to format ms to hh:mm format and decimal hours
  msToHhMm(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  msToDecimalHours(ms: number) {
    return (ms / (1000 * 60 * 60));
  }
}
