// ============================================================
// COMPONENTE: AUSENCIAS
// ============================================================
// Gestiona el registro, listado y administración de ausencias
// Los usuarios pueden solicitar ausencias y ver las suyas
// Los admins pueden buscar empleados, ver todas las ausencias y aprobar/denegar

// Importaciones necesarias de Angular
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Servicios propios
import { AusenciasService } from '../../services/ausencias.service';
import { AuthService } from '../../services/auth.service';
import { EmpleadosService, EmpleadoDto } from '../../services/empleados.service';

// Interfaz para representar una ausencia en el componente
interface Absence {
  id: string;                     // ID único de la ausencia
  empleadoId: number;             // ID del empleado que solicitó la ausencia
  empleadoNombre: string;         // Nombre completo del empleado
  start: string;                  // Fecha de inicio (formato yyyy-mm-dd)
  end: string;                    // Fecha de fin (formato yyyy-mm-dd)
  motivo: string;                 // Razón de la ausencia
  aceptada: boolean | null;       // Estado: true=aceptada, false=denegada, null=pendiente
  createdAt: string;              // Fecha de creación
}

// Decorador del componente
@Component({
  selector: 'app-ausencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ausencias.html',
  styleUrls: ['./ausencias.scss']
})

export class Ausencias implements OnInit, OnDestroy {
  // ===== PROPIEDADES DEL FORMULARIO =====
  absenceStart = '';              // Fecha de inicio seleccionada
  absenceEnd = '';                // Fecha de fin seleccionada
  absenceReason = '';             // Motivo de la ausencia

  // ===== DATOS Y ESTADO GENERAL =====
  absences: Absence[] = [];       // Lista de ausencias
  loading = false;                // Indicador de carga                // Indicador de carga

  // ===== CONTROL DE MODALES =====
  showConfirm = false;            // Mostrar modal de confirmación de registro
  pendingAbsence: Absence | null = null;  // Ausencia pendiente de confirmación

  showDateWarning = false;        // Modal: fecha pasada no permitida
  showDateError = false;          // Modal: fecha fin anterior a fecha inicio
  showSuccess = false;            // Modal: ausencia registrada con éxito
  showEmailConfirm = false;       // Modal: confirmar envío de email al registrar
  showDeleteConfirm = false;      // Modal: confirmar eliminación
  showDeleteSuccess = false;      // Modal: ausencia eliminada con éxito
  showError = false;              // Modal: error general
  errorMessage = '';              // Mensaje de error dinámico
  deleteId = '';                  // ID de la ausencia a eliminar
  lastCreatedAbsence: Absence | null = null;  // Última ausencia creada (para email)
  showStatusEmailConfirm = false; // Modal: confirmar email al cambiar estado (Admin)
  showStatusSuccess = false;      // Modal: estado cambiado con éxito (Admin)
  statusChangeMessage = '';       // Mensaje dinámico del cambio de estado
  pendingStatusChange: { absence: Absence, nuevoEstado: boolean } | null = null;  // Cambio de estado pendiente
  minDate = '';                   // Fecha mínima permitida (hoy)

  // ===== FUNCIONALIDAD ADMIN ===== ADMIN =====
  isAdmin = false;                // Si el usuario actual es Admin
  empleados: EmpleadoDto[] = [];  // Lista completa de empleados
  selectedEmpleadoId: number | null = null;  // ID del empleado seleccionado (para ver sus ausencias)
  searchQuery = '';               // Texto de búsqueda de empleado
  filteredEmpleados: EmpleadoDto[] = [];  // Empleados filtrados por búsqueda
  showEmpleadosList = false;      // Mostrar lista desplegable de empleados

  private authSubscription?: Subscription;  // Suscripción al estado de autenticación

  // ===== CONSTRUCTOR =====
  constructor(
    private api: AusenciasService,           // Servicio para gestionar ausencias
    private authService: AuthService,        // Servicio de autenticación
    private empleadosService: EmpleadosService,  // Servicio para gestionar empleados (Admin)
    private cdr: ChangeDetectorRef           // Para forzar detección de cambios manual
  ) {
    // Establecer la fecha mínima a hoy (no se permiten fechas pasadas)
    this.minDate = this.getTodayString();
  }

  // ===== INICIALIZACIÓN =====
  ngOnInit() {
    // Suscribirse al estado de autenticación para detectar si es Admin
    // Esta suscripción se mantiene activa para reaccionar a cambios de rol
    this.authSubscription = this.authService.state$.subscribe(state => {
      const wasAdmin = this.isAdmin;
      this.isAdmin = state.rol === 'Admin';

      // Forzar detección de cambios para actualizar la vista
      this.cdr.detectChanges();

      // Si acaba de convertirse en admin, cargar la lista de empleados
      if (!wasAdmin && this.isAdmin) {
        this.loadEmpleados();
      }

      // Si dejó de ser admin, limpiar la selección de empleado
      if (wasAdmin && !this.isAdmin) {
        this.clearEmpleadoSelection();
      }
    });

    // Si ya es admin al iniciar, cargar empleados
    if (this.isAdmin) {
      this.loadEmpleados();
    }

    // Cargar las ausencias desde el servidor
    this.loadAbsencesFromServer();
  }

  // ===== LIMPIEZA =====
  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente para evitar fugas de memoria
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // ===== CARGA DE DATOS =====
  // Cargar ausencias desde el servidor
  // Si es Admin y tiene un empleado seleccionado, carga las ausencias de ese empleado
  // Si no, carga las ausencias del usuario actual
  private loadAbsencesFromServer() {
    this.loading = true;

    // Decidir qué endpoint llamar:
    // - Si es Admin y tiene empleado seleccionado -> ausencias de ese empleado
    // - Si no -> ausencias del usuario actual
    const request = this.isAdmin && this.selectedEmpleadoId
      ? this.api.listarPorEmpleado(this.selectedEmpleadoId)
      : this.api.listar();

    request.subscribe({
      next: (data) => {
        // Mapear del formato backend al formato local de la interfaz Absence
        this.absences = data.map(item => ({
          id: item.id.toString(),
          empleadoId: item.empleadoId,
          empleadoNombre: item.empleadoNombre,
          start: item.fechaInicio.split('T')[0],  // Extraer solo la fecha yyyy-mm-dd
          end: item.fechaFin.split('T')[0],
          motivo: item.motivo,
          aceptada: item.aceptada,
          createdAt: item.fechaInicio
        }));
        this.loading = false;
      },
      error: () => {
        // Si hay error, mostrar lista vacía
        console.warn('Error cargando ausencias del servidor; mostrando vacío');
        this.absences = [];
        this.loading = false;
      }
    });
  }

  // ===== REGISTRO DE AUSENCIAS =====
  // Validar fechas y preparar ausencia para confirmación
  onRegisterClick() {
    // Validación 1: Verificar que ambas fechas estén seleccionadas
    if (!this.absenceStart || !this.absenceEnd) {
      this.errorMessage = 'Por favor, selecciona fecha de inicio y fin.';
      this.showError = true;
      return;
    }

    // Crear fechas sin hora para comparación (solo año-mes-día)
    const startDate = new Date(this.absenceStart);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(this.absenceEnd);
    endDate.setHours(0, 0, 0, 0);

    const today = this.getTodayDate();

    // Validación 2: No se permiten fechas pasadas
    if (startDate < today) {
      this.showDateWarning = true;
      return;
    }

    // Validación 3: La fecha de fin no puede ser anterior a la de inicio
    if (endDate < startDate) {
      this.showDateError = true;
      return;
    }

    // Obtener el ID del empleado actual desde AuthService
    let empleadoId = 0;
    this.authService.state$.subscribe(state => {
      empleadoId = state.empleadoId || 0;
    }).unsubscribe();

    // Crear objeto de ausencia pendiente para el modal de confirmación
    this.pendingAbsence = {
      id: this.uuid(),
      empleadoId: empleadoId,
      empleadoNombre: '',
      start: this.absenceStart,
      end: this.absenceEnd,
      motivo: (this.absenceReason || '').trim() || 'Sin especificar',
      aceptada: null,  // Estado pendiente al crear
      createdAt: new Date().toISOString()
    };

    // Mostrar modal de confirmación
    this.showConfirm = true;
  }

  // ===== CONTROL DE MODALES: VALIDACIONES =====
  // Cerrar modal de advertencia de fecha pasada
  closeDateWarning() {
    this.showDateWarning = false;
  }

  // Cancelar el registro de ausencia
  cancelConfirm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
  }

  // ===== CONFIRMACIÓN Y REGISTRO =====
  // Confirmar y enviar la ausencia al servidor
  confirmAndEmail() {
    if (!this.pendingAbsence) return;

    // Cerrar el modal de confirmación
    this.showConfirm = false;

    this.loading = true;

    // Crear fechas locales sin conversión UTC (para evitar desfases horarios)
    const fechaInicio = new Date(this.pendingAbsence.start + 'T00:00:00');
    const fechaFin = new Date(this.pendingAbsence.end + 'T23:59:59');

    // Función auxiliar: formatear fecha como ISO local (sin Z)
    const formatLocalISO = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // Crear el DTO (Data Transfer Object) para enviar al backend
    const dto = {
      FechaInicio: formatLocalISO(fechaInicio),
      FechaFin: formatLocalISO(fechaFin),
      Motivo: this.pendingAbsence.motivo
    };

    // Enviar la ausencia al servidor
    this.api.crear(dto).subscribe({
      next: (res) => {
        // Éxito: añadir la ausencia recibida a la lista local
        this.absences.push({
          id: res.id.toString(),
          empleadoId: res.empleadoId,
          empleadoNombre: res.empleadoNombre,
          start: res.fechaInicio.split('T')[0],  // Extraer solo fecha
          end: res.fechaFin.split('T')[0],
          motivo: res.motivo,
          aceptada: res.aceptada,
          createdAt: res.fechaInicio
        });

        this.loading = false;

        // Guardar la ausencia para el modal de confirmación de email
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

        // Mostrar modales de éxito y confirmación de email
        this.showSuccess = true;
        this.showEmailConfirm = true;
        this.resetForm();
      },
      error: (err) => {
        // Error: mostrar modal de error
        this.loading = false;
        this.errorMessage = 'Error al registrar la ausencia en el servidor';
        this.showError = true;
      }
    });
  }

  // ===== ENVÍO DE EMAILS =====
  // Enviar email con los datos de la ausencia
  // Si el empleado tiene datos completos, incluye firma
  private sendEmail(a: Absence) {
    // Formatear las fechas a formato español (dd/mm/yyyy)
    const startStr = this.formatDateES(a.start);
    const endStr = this.formatDateES(a.end);
    const dias = this.getDays(a);

    // Obtener el ID del empleado actual
    const empleadoId = this.authService.empleadoId;

    if (!empleadoId) {
      // Si no hay empleadoId, enviar email sin firma
      this.sendEmailWithoutSignature(startStr, endStr, dias, a.motivo);
      return;
    }

    // Obtener los datos del empleado desde el servidor para incluir firma
    this.empleadosService.getAll().subscribe({
      next: (empleados: EmpleadoDto[]) => {
        const empleado = empleados.find(e => e.id === empleadoId);

        if (!empleado) {
          // Si no se encuentra el empleado, enviar sin firma
          this.sendEmailWithoutSignature(startStr, endStr, dias, a.motivo);
          return;
        }

        // Construir el cuerpo del email con los datos de la ausencia y firma del empleado
        const bodyLines = [
          'Hola,',
          '',
          'Solicito la siguiente ausencia:',
          `· Inicio: ${startStr}`,
          `· Fin: ${endStr}`,
          `· Días: ${dias}`,
          `· Motivo: ${a.motivo}`,
          '',
          'Gracias y un saludo.',
          '',
          '---',
          `${empleado.nombre} ${empleado.apellidos}`,
          `DNI: ${empleado.dni}`,
          `Email: ${empleado.email}`,
          `Teléfono: ${empleado.telefono || 'No especificado'}`
        ];

        const subject = `Solicitud de ausencia: ${startStr} - ${endStr}`;
        const mailto = `mailto:jaime.rodriguez.rafael@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        // Abrir el cliente de correo predeterminado
        window.location.href = mailto;
      },
      error: () => {
        // Si hay error al obtener empleados, enviar sin firma
        this.sendEmailWithoutSignature(startStr, endStr, dias, a.motivo);
      }
    });
  }

  // Enviar email sin firma (cuando no se pueden obtener los datos del empleado)
  private sendEmailWithoutSignature(startStr: string, endStr: string, dias: number, motivo: string) {
    // Construir email básico sin firma
    const bodyLines = [
      'Hola,',
      '',
      'Solicito la siguiente ausencia:',
      `· Inicio: ${startStr}`,
      `· Fin: ${endStr}`,
      `· Días: ${dias}`,
      `· Motivo: ${motivo}`,
      '',
      'Gracias y un saludo.'
    ];

    const subject = `Solicitud de ausencia: ${startStr} - ${endStr}`;
    const mailto = `mailto:jaime.rodriguez.rafael@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    // Abrir cliente de correo
    window.location.href = mailto;
  }

  // ===== ELIMINACIÓN DE AUSENCIAS =====
  // Mostrar modal de confirmación para eliminar
  removeAbsence(id: string) {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

  // Confirmar eliminación y llamar al servidor
  confirmDelete() {
    this.showDeleteConfirm = false;
    this.loading = true;

    this.api.borrar(this.deleteId).subscribe({
      next: () => {
        // Éxito: eliminar de la lista local
        this.absences = this.absences.filter(a => a.id !== this.deleteId);
        this.loading = false;
        this.deleteId = '';
        // Mostrar modal de éxito
        this.showDeleteSuccess = true;
      },
      error: () => {
        // Error: mostrar modal con mensaje
        this.loading = false;
        this.errorMessage = 'Error al eliminar la ausencia del servidor';
        this.showError = true;
        this.deleteId = '';
      }
    });
  }

  // Cancelar eliminación
  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteId = '';
  }

  // ===== CONTROL DE MODALES: CERRAR =====
  closeDeleteSuccess() {
    this.showDeleteSuccess = false;
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

  // ===== CONFIRMACIÓN DE ENVÍO DE EMAIL =====
  // Confirmar y enviar email al registrar ausencia
  confirmEmail() {
    this.showEmailConfirm = false;
    if (this.lastCreatedAbsence) {
      this.sendEmail(this.lastCreatedAbsence);
      this.lastCreatedAbsence = null;
    }
  }

  // Cancelar envío de email
  cancelEmail() {
    this.showEmailConfirm = false;
    this.lastCreatedAbsence = null;
  }

  // ===== UTILIDADES =====
  // Limpiar el formulario después de registrar
  private resetForm() {
    this.showConfirm = false;
    this.pendingAbsence = null;
    this.absenceStart = '';
    this.absenceEnd = '';
    this.absenceReason = '';
  }

  // Calcular el número de días de una ausencia (fecha fin - fecha inicio + 1)
  getDays(a: Absence): number {
    // Extraer solo la parte de fecha (yyyy-mm-dd) si viene con hora
    const startDate = a.start.includes('T') ? a.start.split('T')[0] : a.start;
    const endDate = a.end.includes('T') ? a.end.split('T')[0] : a.end;

    // Crear fechas con hora fija para evitar problemas de zona horaria
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    // Validar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    // Calcular diferencia en milisegundos y convertir a días
    const diff = end.getTime() - start.getTime();
    return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)) + 1, 1);
  }

  // Generar un ID único para nuevas ausencias antes de guardar en servidor
  private uuid(): string {
    // Combinar número aleatorio con timestamp para ID único
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Formatear fecha de yyyy-mm-dd a formato español dd/mm/yyyy
  private formatDateES(yyyyMMdd: string): string {
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Obtener la fecha de hoy como string yyyy-mm-dd
  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Obtener la fecha de hoy como objeto Date sin hora (00:00:00)
  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Sin hora para comparaciones de solo fecha
    return today;
  }

  // ===== FUNCIONALIDAD ADMIN: GESTIÓN DE EMPLEADOS =====

  // Cargar la lista completa de empleados (solo Admin)
  private loadEmpleados() {
    this.empleadosService.getAll().subscribe({
      next: (empleados) => {
        this.empleados = empleados;
        this.filteredEmpleados = empleados;  // Inicialmente mostrar todos
      },
      error: () => {
        console.error('Error cargando empleados');
      }
    });
  }

  // Filtrar empleados según el texto de búsqueda
  onSearchEmpleado() {
    // Si la búsqueda está vacía, ocultar lista
    if (!this.searchQuery.trim()) {
      this.filteredEmpleados = this.empleados;
      this.showEmpleadosList = false;
      return;
    }

    // Filtrar por nombre, apellidos, DNI o email
    const query = this.searchQuery.toLowerCase();
    this.filteredEmpleados = this.empleados.filter(e =>
      e.nombre.toLowerCase().includes(query) ||
      e.apellidos.toLowerCase().includes(query) ||
      e.dni.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query)
    );
    this.showEmpleadosList = true;  // Mostrar lista de resultados
  }

  // Seleccionar un empleado y cargar sus ausencias
  selectEmpleado(empleado: EmpleadoDto) {
    this.selectedEmpleadoId = empleado.id;
    this.searchQuery = `${empleado.nombre} ${empleado.apellidos}`;  // Mostrar nombre en input
    this.showEmpleadosList = false;  // Ocultar lista
    this.loadAbsencesFromServer();   // Cargar ausencias del empleado seleccionado
  }

  // Limpiar selección de empleado y volver a las ausencias propias
  clearEmpleadoSelection() {
    this.selectedEmpleadoId = null;
    this.searchQuery = '';
    this.filteredEmpleados = this.empleados;
    this.showEmpleadosList = false;
    this.loadAbsencesFromServer();  // Volver a cargar ausencias del usuario actual
  }

  // ===== FUNCIONALIDAD ADMIN: APROBAR/DENEGAR AUSENCIAS =====
  // Cambiar el estado de una ausencia (aceptada/denegada)
  toggleAceptada(absence: Absence) {
    if (!this.isAdmin) return;  // Solo admins pueden cambiar el estado

    const nuevoEstado = !absence.aceptada;  // Invertir estado actual

    // Llamar al servidor para actualizar el estado
    this.api.actualizarEstado(absence.id, nuevoEstado).subscribe({
      next: () => {
        // Éxito: actualizar el estado local
        absence.aceptada = nuevoEstado;
        // Guardar para poder enviar email de notificación
        this.pendingStatusChange = { absence, nuevoEstado };
        // Preparar mensaje y mostrar modal de éxito
        this.statusChangeMessage = nuevoEstado ? 'La ausencia ha sido Aceptada' : 'La ausencia ha sido Denegada';
        this.showStatusSuccess = true;
      },
      error: () => {
        // Error: mostrar modal
        this.errorMessage = 'Error al actualizar el estado de la ausencia';
        this.showError = true;
      }
    });
  }

  // Manejar clic en "OK" del modal de éxito al cambiar estado
  handleStatusSuccessOk() {
    this.showStatusSuccess = false;
    // Mostrar modal de confirmación para enviar email al empleado
    this.showStatusEmailConfirm = true;
  }

  // Confirmar y enviar email de notificación de cambio de estado
  confirmStatusEmail() {
    this.showStatusEmailConfirm = false;
    if (!this.pendingStatusChange) return;

    const { absence, nuevoEstado } = this.pendingStatusChange;

    // Enviar email al empleado notificando el cambio de estado
    this.sendStatusChangeEmail(absence, nuevoEstado);
    this.pendingStatusChange = null;
  }

  // Cancelar envío de email de notificación
  cancelStatusEmail() {
    this.showStatusEmailConfirm = false;
    this.pendingStatusChange = null;
  }

  // Enviar email al empleado notificando que su ausencia fue aceptada o denegada
  private sendStatusChangeEmail(absence: Absence, aceptada: boolean) {
    // Formatear fechas y preparar datos
    const startStr = this.formatDateES(absence.start);
    const endStr = this.formatDateES(absence.end);
    const dias = this.getDays(absence);
    const estado = aceptada ? 'ACEPTADA' : 'DENEGADA';

    // Obtener el ID del admin actual para la firma
    const adminId = this.authService.empleadoId;

    // Obtener datos del empleado y del admin para construir el email
    this.empleadosService.getAll().subscribe({
      next: (empleados: EmpleadoDto[]) => {
        // Buscar el empleado al que se notificará
        const empleado = empleados.find(e => e.id === absence.empleadoId);

        if (!empleado || !empleado.email) {
          return;  // No se puede enviar email sin datos del empleado
        }

        // Buscar los datos del admin para incluir firma
        const admin = adminId ? empleados.find(e => e.id === adminId) : null;

        // Construir el cuerpo del email
        const bodyLines = [
          `Hola ${empleado.nombre},`,
          '',
          `Tu solicitud de ausencia ha sido ${estado}:`,
          `· Inicio: ${startStr}`,
          `· Fin: ${endStr}`,
          `· Días: ${dias}`,
          `· Motivo: ${absence.motivo}`,
          '',
          'Saludos cordiales.'
        ];

        // Añadir firma del admin si está disponible
        if (admin) {
          bodyLines.push('');
          bodyLines.push('---');
          bodyLines.push(`${admin.nombre} ${admin.apellidos}`);
          bodyLines.push(`DNI: ${admin.dni}`);
          bodyLines.push(`Email: ${admin.email}`);
          bodyLines.push(`Teléfono: ${admin.telefono || 'No especificado'}`);
        }

        const subject = `Ausencia ${estado}: ${startStr} - ${endStr}`;
        const mailto = `mailto:${empleado.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        // Abrir cliente de correo
        window.location.href = mailto;
      },
      error: () => {
        console.error('Error al obtener datos del empleado para enviar email');
      }
    });
  }
}
