/**
 * Servicio de Ausencias
 *
 * Gestiona todas las operaciones relacionadas con las ausencias de los empleados.
 * Se comunica con el backend (API .NET) para crear, listar, borrar y aprobar ausencias.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// DTO para crear una nueva ausencia
export interface AusenciaCreateDto {
  FechaInicio: string;  // Fecha de inicio en formato ISO (ej: "2025-11-24")
  FechaFin: string;     // Fecha de fin en formato ISO
  Motivo: string;       // Motivo de la ausencia (Vacaciones, Enfermedad, etc.)
}

// DTO de ausencia completa que devuelve el backend
export interface AusenciaDto {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  aceptada: boolean | null; // null = pendiente, true = aceptada, false = denegada
}

@Injectable({ providedIn: 'root' })
export class AusenciasService {
  // URL base del API (pasa por el proxy configurado)
  private readonly base = '/api/Ausencias';

  constructor(private http: HttpClient) {}

  /**
   * Crear una nueva ausencia
   * El empleado logueado solicita una ausencia (estado inicial: pendiente)
   */
  crear(dto: AusenciaCreateDto): Observable<AusenciaDto> {
    // El interceptor añade el token JWT automáticamente
    return this.http.post<AusenciaDto>(`${this.base}`, dto);
  }

  /**
   * Borrar una ausencia
   * Solo el propio empleado puede borrar sus ausencias
   */
  borrar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Listar las ausencias del empleado logueado
   * Endpoint: GET /api/Ausencias/mias
   */
  listar(): Observable<AusenciaDto[]> {
    return this.http.get<AusenciaDto[]>(`${this.base}/mias`);
  }

  /**
   * Listar ausencias de un empleado específico (solo Admin)
   * Endpoint: GET /api/Ausencias/usuario/{empleadoId}
   */
  listarPorEmpleado(empleadoId: number): Observable<AusenciaDto[]> {
    return this.http.get<AusenciaDto[]>(`${this.base}/usuario/${empleadoId}`);
  }

  /**
   * Actualizar el estado de una ausencia: aprobar o denegar (solo Admin)
   * Endpoint: PUT /api/Ausencias/{id}/aprobar
   */
  actualizarEstado(id: string, aceptada: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/aprobar`, { Aceptada: aceptada });
  }
}
