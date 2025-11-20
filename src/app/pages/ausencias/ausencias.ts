import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AusenciasService } from '../../services/ausencias.service';
import { AuthService } from '../../services/auth.service';
import { EmpleadosService, EmpleadoDto } from '../../services/empleados.service';

interface Absence {
  id: string;
  empleadoId: number;
  empleadoNombre: string;
  start: string;
  end: string;
  motivo: string;
  aceptada: boolean | null;
  createdAt: string;
}

@Component({
  selector: 'app-ausencias',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgForOf],
  templateUrl: './ausencias.html',
  styleUrls: ['./ausencias.scss']
})
export class Ausencias implements OnInit, OnDestroy {
  absenceStart = '';
  absenceEnd = '';
  absenceReason = '';

  absences: Absence[] = [];
  loading = false;

  showConfirm = false;
  pendingAbsence: Absence | null = null;

  showDateWarning = false;
  showDateError = false;
  showSuccess = false;
  showEmailConfirm = false;
  showDeleteConfirm = false;
  showError = false;
  errorMessage = '';
  deleteId = '';
  lastCreatedAbsence: Absence | null = null;
  minDate = '';  // para bloquear fechas pasadas

  // Funcionalidad admin
  isAdmin = false;
  empleados: EmpleadoDto[] = [];
  selectedEmpleadoId: number | null = null;
  searchQuery = '';
  filteredEmpleados: EmpleadoDto[] = [];
  showEmpleadosList = false;

  private authSubscription?: Subscription;

  constructor(
    private api: AusenciasService,
    private authService: AuthService,
    private empleadosService: EmpleadosService,
    private cdr: ChangeDetectorRef
  ) {
    // Establecer la fecha mínima a hoy
    this.minDate = this.getTodayString();
  }

  ngOnInit() {
    // Verificar si es admin - mantener la suscripción activa
    this.authSubscription = this.authService.state$.subscribe(state => {
      const wasAdmin = this.isAdmin;
      this.isAdmin = state.rol === 'Admin';

      // Forzar detección de cambios
      this.cdr.detectChanges();

      // Si cambió de no-admin a admin, cargar empleados
      if (!wasAdmin && this.isAdmin) {
        this.loadEmpleados();
      }

      // Si cambió de admin a no-admin, limpiar selección
      if (wasAdmin && !this.isAdmin) {
        this.clearEmpleadoSelection();
      }
    });

    if (this.isAdmin) {
      this.loadEmpleados();
    }

    this.loadAbsencesFromServer();
  }

  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private loadAbsencesFromServer() {
    this.loading = true;

    // Si es admin y tiene un empleado seleccionado, cargar sus ausencias
    const request = this.isAdmin && this.selectedEmpleadoId
      ? this.api.listarPorEmpleado(this.selectedEmpleadoId)
      : this.api.listar();

    request.subscribe({
      next: (data) => {
        // Mapear del formato backend al formato local
        this.absences = data.map(item => ({
          id: item.id.toString(),
          empleadoId: item.empleadoId,
          empleadoNombre: item.empleadoNombre,
          start: item.fechaInicio.split('T')[0],  // Extraer solo la fecha yyyy-mm-dd
          end: item.fechaFin.split('T')[0],
          motivo: item.motivo,
          aceptada: item.aceptada,
          createdAt: item.fechaInicio  // Usar fechaInicio como createdAt
        }));
        this.loading = false;
      },
      error: () => {
        console.warn('Error cargando ausencias del servidor; mostrando vacío');
        this.absences = [];
        this.loading = false;
      }
    });
  }

  onRegisterClick() {
    if (!this.absenceStart || !this.absenceEnd) {
      this.errorMessage = 'Por favor, selecciona fecha de inicio y fin.';
      this.showError = true;
      return;
    }

    const start = new Date(this.absenceStart + 'T00:00:00');
    const end = new Date(this.absenceEnd + 'T23:59:59');
    const today = this.getTodayDate();

    // Validar que la fecha de inicio no sea anterior a hoy
    if (start < today) {
      this.showDateWarning = true;
      return;
    }

    if (end < start) {
      this.showDateError = true;
      return;
    }

    let empleadoId = 0;
    this.authService.state$.subscribe(state => {
      empleadoId = state.empleadoId || 0;
    }).unsubscribe();

    this.pendingAbsence = {
      id: this.uuid(),
      empleadoId: empleadoId,
      empleadoNombre: '',
      start: this.absenceStart,
      end: this.absenceEnd,
      motivo: (this.absenceReason || '').trim() || 'Sin especificar',
      aceptada: null,
      createdAt: new Date().toISOString()
    };

    this.showConfirm = true;
  }

  closeDateWarning() {
    this.showDateWarning = false;
  }

  cancelConfirm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
  }

  confirmAndEmail() {
    if (!this.pendingAbsence) return;

    this.loading = true;
    // Crear fechas locales sin conversión UTC
    const fechaInicio = new Date(this.pendingAbsence.start + 'T00:00:00');
    const fechaFin = new Date(this.pendingAbsence.end + 'T23:59:59');

    // Formatear como string ISO sin la Z (hora local)
    const formatLocalISO = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const dto = {
      FechaInicio: formatLocalISO(fechaInicio),
      FechaFin: formatLocalISO(fechaFin),
      Motivo: this.pendingAbsence.motivo
    };

    this.api.crear(dto).subscribe({
      next: (res) => {
        // Añadir a la lista local mapeando del formato backend
        this.absences.push({
          id: res.id.toString(),
          empleadoId: res.empleadoId,
          empleadoNombre: res.empleadoNombre,
          start: res.fechaInicio.split('T')[0],  // Extraer solo la fecha yyyy-mm-dd
          end: res.fechaFin.split('T')[0],
          motivo: res.motivo,
          aceptada: res.aceptada,
          createdAt: res.fechaInicio
        });

        this.loading = false;
        // Guardar la ausencia creada para el email
        this.lastCreatedAbsence = {
          id: res.id.toString(),
          empleadoId: res.empleadoId,
          empleadoNombre: res.empleadoNombre,
          start: res.fechaInicio.split('T')[0],
          end: res.fechaFin.split('T')[0],
          motivo: res.motivo,
          aceptada: res.aceptada,
          createdAt: res.fechaInicio
        };
        this.showSuccess = true;
        this.showEmailConfirm = true;
        this.resetForm();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error al registrar la ausencia en el servidor';
        this.showError = true;
      }
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
      `· Motivo: ${a.motivo}`,
      '',
      'Gracias y un saludo.'
    ];

    const subject = `Solicitud de ausencia: ${startStr} - ${endStr}`;
    const mailto = `mailto:jaime.rodriguez.rafael@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailto;
  }

  removeAbsence(id: string) {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    this.showDeleteConfirm = false;
    this.loading = true;
    this.api.borrar(this.deleteId).subscribe({
      next: () => {
        // Eliminar de la lista local
        this.absences = this.absences.filter(a => a.id !== this.deleteId);
        this.loading = false;
        this.deleteId = '';
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error al eliminar la ausencia del servidor';
        this.showError = true;
        this.deleteId = '';
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteId = '';
  }

  closeError() {
    this.showError = false;
    this.errorMessage = '';
  }

  closeDateError() {
    this.showDateError = false;
  }

  closeSuccess() {
    this.showSuccess = false;
  }

  confirmEmail() {
    this.showEmailConfirm = false;
    if (this.lastCreatedAbsence) {
      this.sendEmail(this.lastCreatedAbsence);
      this.lastCreatedAbsence = null;
    }
  }

  cancelEmail() {
    this.showEmailConfirm = false;
    this.lastCreatedAbsence = null;
  }

  private resetForm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
    this.absenceStart = '';
    this.absenceEnd = '';
    this.absenceReason = '';
  }

  getDays(a: Absence): number {
    // Manejar fechas en formato yyyy-mm-dd o con hora
    const startDate = a.start.includes('T') ? a.start.split('T')[0] : a.start;
    const endDate = a.end.includes('T') ? a.end.split('T')[0] : a.end;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const diff = end.getTime() - start.getTime();
    return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)) + 1, 1);
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

  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  // ===== Métodos para funcionalidad de admin =====

  private loadEmpleados() {
    this.empleadosService.getAll().subscribe({
      next: (empleados) => {
        this.empleados = empleados;
        this.filteredEmpleados = empleados;
      },
      error: () => {
        console.error('Error cargando empleados');
      }
    });
  }

  onSearchEmpleado() {
    if (!this.searchQuery.trim()) {
      this.filteredEmpleados = this.empleados;
      this.showEmpleadosList = false;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredEmpleados = this.empleados.filter(e =>
      e.nombre.toLowerCase().includes(query) ||
      e.apellidos.toLowerCase().includes(query) ||
      e.dni.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query)
    );
    this.showEmpleadosList = true;
  }

  selectEmpleado(empleado: EmpleadoDto) {
    this.selectedEmpleadoId = empleado.id;
    this.searchQuery = `${empleado.nombre} ${empleado.apellidos}`;
    this.showEmpleadosList = false;
    this.loadAbsencesFromServer();
  }

  clearEmpleadoSelection() {
    this.selectedEmpleadoId = null;
    this.searchQuery = '';
    this.filteredEmpleados = this.empleados;
    this.showEmpleadosList = false;
    this.loadAbsencesFromServer();
  }

  toggleAceptada(absence: Absence) {
    if (!this.isAdmin) return;

    const nuevoEstado = !absence.aceptada;
    this.api.actualizarEstado(absence.id, nuevoEstado).subscribe({
      next: () => {
        absence.aceptada = nuevoEstado;
      },
      error: () => {
        this.errorMessage = 'Error al actualizar el estado de la ausencia';
        this.showError = true;
      }
    });
  }
}
