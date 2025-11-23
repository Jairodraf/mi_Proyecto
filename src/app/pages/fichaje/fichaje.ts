import { Component, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FichajesService, FichajeCreateDto, FichajeDto } from '../../services/fichajes.service';
import { AuthService } from '../../services/auth.service';
import { EmpleadosService, EmpleadoDto } from '../../services/empleados.service';

type PunchType = 'Entrada' | 'Salida';
type LastPressed = 'ENTRADA' | 'SALIDA';

interface HistoryItem {
  id?: string; // <-- id del backend (para poder actualizar observación)
  type: PunchType;
  date: string;
  time: string;
  ts: string;
  incidence?: string;
  empleadoId?: number; // <-- para filtrar por empleado
}

@Component({
  selector: 'app-fichaje',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fichaje.html',
  styleUrls: ['./fichaje.scss'],
})
export class Fichaje implements AfterViewInit, OnDestroy {
  private api = inject(FichajesService);
  private msg = inject(NzMessageService);
  private auth = inject(AuthService);
  private empleadosService = inject(EmpleadosService);

  // … (tus propiedades tal cual)
  lastType: string = '—';
  lastDate: string = '';
  lastTime: string = '';

  currentTime: string = '';

  entradaDisabled = false;
  salidaDisabled = true;

  history: HistoryItem[] = [];
  private storageKey = 'fichaje_history_v1';

  lastPressed: LastPressed | null = null;
  private lastEntryIndex: number | null = null;
  private lastExitIndex: number | null = null;

  filterStart: string = '';
  filterEnd: string = '';

  incidenceText: string = '';
  isIncidenceSuccessVisible: boolean = false;
  isFichajeSuccessVisible: boolean = false;
  fichajeConfirmData = { tipo: '', fecha: '', hora: '' };

  // Funcionalidad admin
  isAdmin = false;
  empleados: EmpleadoDto[] = [];
  selectedEmpleadoId: number | null = null;
  searchQuery = '';
  filteredEmpleados: EmpleadoDto[] = [];
  showEmpleadosList = false;

  filteredGroups: Array<{
    date: string;
    pairs: Array<{ entrada: HistoryItem | null; salida: HistoryItem | null; durationMs: number }>;
    totalMs: number;
  }> = [];
  filteredTotalMs: number = 0;

  private clockIntervalId: any = null;

  constructor() {
    this.loadHistory();

    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);

    // Verificar si es admin
    this.isAdmin = this.auth.rol === 'Admin';
    if (this.isAdmin) {
      this.loadEmpleados();
    }

    // Load fichajes for the authenticated worker from backend (if logged in)
    // If user is authenticated, fetch remote fichajes.
    if (this.auth.hasToken()) {
      this.loadRemoteFichajes();
    } else {
      // Si no hay token, usar historial local
      this.updateLastFromHistory();
    }
  }

  ngAfterViewInit(): void {}
  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
  }

  private updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // ===== helper para el error TS2554 (no existía en tu código) =====
  private findLastIndex(kind: 'Entrada' | 'Salida'): number | null {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].type === kind) return i;
    }
    return null;
  }

  // ---------- Filtrado y agrupación para "Resultados" ----------
  applyFilter() {
    if (!this.filterStart || !this.filterEnd) {
      this.filteredGroups = [];
      this.filteredTotalMs = 0;
      return;
    }

    const start = new Date(this.filterStart + 'T00:00:00');
    const end = new Date(this.filterEnd + 'T23:59:59.999');

    // Si es admin, cargar todos los fichajes y luego filtrar
    if (this.isAdmin) {
      this.api.todos().subscribe({
        next: (rows: FichajeDto[]) => {
          // Convertir a HistoryItem
          const allHistory = rows.map((r) => ({
            id: r.id,
            type: r.tipo === 'Entrada' ? 'Entrada' : 'Salida',
            date: new Date(r.fechaHora).toLocaleDateString('es-ES'),
            time: new Date(r.fechaHora).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            ts: r.fechaHora,
            incidence: r.observacion ?? undefined,
            empleadoId: r.empleadoId,
          } as HistoryItem & { empleadoId: number }));

          // Filtrar por empleado seleccionado o por el admin actual
          const targetEmpleadoId = this.selectedEmpleadoId ?? this.auth.empleadoId;

          // Filtrar por rango de fechas y por empleado
          const items = allHistory
            .filter((h) => {
              const t = new Date(h.ts);
              const inRange = t >= start && t <= end;
              const matchesEmpleado = Number((h as any).empleadoId) === Number(targetEmpleadoId);
              return inRange && matchesEmpleado;
            })
            .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

          this.processFilteredItems(items);
        },
        error: () => {
          this.msg.error('Error al cargar fichajes para filtrar');
          this.filteredGroups = [];
          this.filteredTotalMs = 0;
        }
      });
      return;
    }

    // Si no es admin, filtrar desde el historial local (sus propios fichajes)
    const items = this.history
      .filter((h) => {
        const t = new Date(h.ts);
        return t >= start && t <= end;
      })
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    this.processFilteredItems(items);
  }

  private processFilteredItems(items: HistoryItem[]) {

    // Agrupa por fecha local
    const byDate = new Map<string, HistoryItem[]>();
    for (const it of items) {
      const d = new Date(it.ts).toLocaleDateString('es-ES');
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(it);
    }

    const groups: Array<{
      date: string;
      pairs: Array<{ entrada: HistoryItem | null; salida: HistoryItem | null; durationMs: number }>;
      totalMs: number;
    }> = [];
    let overall = 0;

    const orderedDates = Array.from(byDate.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    for (const d of orderedDates) {
      const arr = byDate.get(d)!;

      const pairs: Array<{
        entrada: HistoryItem | null;
        salida: HistoryItem | null;
        durationMs: number;
      }> = [];
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

  /**
   * Load fichajes from backend. Always loads only the current user's fichajes
   * to properly control button states (Entrada/Salida).
   * Replaces local history with server data (the canonical source).
   */
  loadRemoteFichajes(limit?: number) {
    // Siempre cargar solo los fichajes del usuario actual para controlar botones correctamente
    this.api.misFichajes(limit).subscribe({
      next: (rows: FichajeDto[]) => {
        this.history = rows.map((r) => ({
          id: r.id,
          type: r.tipo === 'Entrada' ? 'Entrada' : 'Salida',
          date: new Date(r.fechaHora).toLocaleDateString('es-ES'),
          time: new Date(r.fechaHora).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          ts: r.fechaHora,
          incidence: r.observacion ?? undefined,
          empleadoId: r.empleadoId,
        } as HistoryItem));
        this.saveHistory();
        this.updateLastFromHistory();
      },
      error: () => this.msg.error('No se pudieron cargar los fichajes desde el servidor'),
    });
  }

  private updateLastFromHistory() {
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
    } else {
      // Si no hay historial, habilita solo Entrada (primer fichaje)
      this.entradaDisabled = false;
      this.salidaDisabled = true;
      this.lastType = '—';
      this.lastDate = '';
      this.lastTime = '';
    }
  }

  // ---------- Fichar ----------
  fichar(type: 'ENTRADA' | 'SALIDA') {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES');
    const time = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const iso = now.toISOString();

    if (type === 'ENTRADA') {
      // 1) Pinta local
      const entry: HistoryItem = { type: 'Entrada', date, time, ts: iso };
      this.history.push(entry);
      this.lastEntryIndex = this.history.length - 1;
      this.lastPressed = 'ENTRADA';

      this.lastType = 'Entrada';
      this.lastDate = date;
      this.lastTime = time;

      this.entradaDisabled = true;
      this.salidaDisabled = false;
      this.saveHistory();

      // 2) Persistir en backend
      const dto: FichajeCreateDto = { tipo: 'Entrada', fechaHora: iso };
      this.api.crear(dto).subscribe({
        next: (res: FichajeDto) => {
          // guarda el id para poder actualizar Observacion más tarde
          this.history[this.lastEntryIndex!].id = res.id;
          this.saveHistory();
          // Mostrar modal de confirmación
          this.fichajeConfirmData = { tipo: 'Entrada', fecha: date, hora: time };
          this.isFichajeSuccessVisible = true;
        },
        error: () => this.msg.error('No se pudo registrar la Entrada en servidor'),
      });
    } else {
      // SALIDA
      const exit: HistoryItem = { type: 'Salida', date, time, ts: iso };
      this.history.push(exit);
      this.lastExitIndex = this.history.length - 1;
      this.lastPressed = 'SALIDA';

      this.lastType = 'Salida';
      this.lastDate = date;
      this.lastTime = time;

      this.entradaDisabled = false;
      this.salidaDisabled = true;
      this.saveHistory();

      const dto: FichajeCreateDto = { tipo: 'Salida', fechaHora: iso };
      this.api.crear(dto).subscribe({
        next: (res: FichajeDto) => {
          this.history[this.lastExitIndex!].id = res.id;
          this.saveHistory();
          // Mostrar modal de confirmación
          this.fichajeConfirmData = { tipo: 'Salida', fecha: date, hora: time };
          this.isFichajeSuccessVisible = true;
        },
        error: () => this.msg.error('No se pudo registrar la Salida en servidor'),
      });
    }
  }

  // ---------- Registrar incidencia (se guarda en Observacion del back) ----------
  registerIncidentNow() {
    const text = (this.incidenceText || '').trim();
    if (!text) return;

    let idx: number | null = null;
    if (this.lastPressed === 'ENTRADA') {
      idx = this.lastEntryIndex ?? this.findLastIndex('Entrada');
    } else if (this.lastPressed === 'SALIDA') {
      idx = this.lastExitIndex ?? this.findLastIndex('Salida');
    } else {
      idx = this.findLastIndex('Entrada') ?? this.findLastIndex('Salida');
    }

    if (idx == null || idx < 0) return;

    // actualiza local
    this.history[idx].incidence = text;
    this.saveHistory();
    this.incidenceText = '';

    // si hay id, persistimos Observacion
    const id = this.history[idx].id;
    if (id) {
      this.api.actualizarObservacion(id, text).subscribe({
        next: () => {
          this.isIncidenceSuccessVisible = true;
        },
        error: () => this.msg.error('No se pudo guardar la incidencia en el servidor'),
      });
    } else {
      this.msg.warning('Incidencia guardada localmente (pendiente de sincronizar)');
    }
  }

  handleIncidenceSuccessOk(): void {
    this.isIncidenceSuccessVisible = false;
  }

  handleFichajeSuccessOk(): void {
    this.isFichajeSuccessVisible = false;
  }

  // Métodos para búsqueda de empleados (Admin)
  private loadEmpleados() {
    this.empleadosService.getAll().subscribe({
      next: (data) => {
        this.empleados = data;
      },
      error: () => {
        this.msg.error('Error al cargar la lista de empleados');
      }
    });
  }

  onEmpleadoSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const query = input.value.toLowerCase().trim();
    this.searchQuery = query;

    if (!query) {
      this.filteredEmpleados = [];
      this.showEmpleadosList = false;
      return;
    }

    this.filteredEmpleados = this.empleados.filter(e =>
      e.nombre.toLowerCase().includes(query) ||
      e.apellidos.toLowerCase().includes(query) ||
      e.dni.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query)
    );
    this.showEmpleadosList = this.filteredEmpleados.length > 0;
  }

  selectEmpleado(emp: EmpleadoDto) {
    this.selectedEmpleadoId = emp.id;
    this.searchQuery = `${emp.nombre} ${emp.apellidos} (${emp.dni})`;
    this.filteredEmpleados = [];
    this.showEmpleadosList = false;
    // Aplicar filtro automáticamente si hay fechas seleccionadas
    if (this.filterStart && this.filterEnd) {
      this.applyFilter();
    }
  }

  clearEmpleadoSelection() {
    this.selectedEmpleadoId = null;
    this.searchQuery = '';
    this.filteredEmpleados = [];
    this.showEmpleadosList = false;
    // Aplicar filtro automáticamente si hay fechas seleccionadas
    if (this.filterStart && this.filterEnd) {
      this.applyFilter();
    }
  }

  // … (resto de tu código: filtros, agrupación, utilidades)

  private saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch {}
  }
  private loadHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.history = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
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
