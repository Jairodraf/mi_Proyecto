/**
 * Servicio de Fichajes
 *
 * Gestiona las operaciones de fichaje de entrada y salida de los empleados.
 * Se comunica con el backend para registrar fichajes, consultar el historial
 * y actualizar observaciones.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Tipo de fichaje: Entrada o Salida
export type TipoFichaje = 'Entrada' | 'Salida';

// DTO de fichaje completo que devuelve el backend
export interface FichajeDto {
  id: string;
  fechaHora: string;            // Fecha y hora del fichaje (formato ISO)
  tipo: TipoFichaje;            // Entrada o Salida
  observacion?: string | null;  // Nota opcional del fichaje
  empleadoId: number;
  empleadoNombre?: string | null;
}

// DTO para crear un nuevo fichaje
export interface FichajeCreateDto {
  tipo: TipoFichaje;            // Entrada o Salida
  observacion?: string | null;  // Nota opcional
  fechaHora?: string;           // Opcional: si no se envía, el backend usa la hora actual
}

@Injectable({ providedIn: 'root' })
export class FichajesService {
  private base = '/api/Fichajes'; // Pasa por el proxy configurado

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo fichaje (Entrada o Salida)
   * El backend valida que no haya dos entradas seguidas sin salida
   * Endpoint: POST /api/Fichajes
   */
  crear(dto: FichajeCreateDto): Observable<FichajeDto> {
    return this.http.post<FichajeDto>(this.base, dto);
  }

  /**
   * Actualizar la observación de un fichaje existente
   * Endpoint: PUT /api/fichajes/{id}/observacion
   */
  actualizarObservacion(id: string, observacion: string) {
    return this.http.put<void>(`/api/fichajes/${id}/observacion`, { observacion });
  }

  /**
   * Obtener mis fichajes (del empleado logueado)
   * Se puede limitar la cantidad con el parámetro limit
   * Endpoint: GET /api/Fichajes/mios?limit={limit}
   */
  misFichajes(limit?: number): Observable<FichajeDto[]> {
    const url = limit ? `${this.base}/mios?limit=${limit}` : `${this.base}/mios`;
    return this.http.get<FichajeDto[]>(url);
  }

  /**
   * Obtener todos los fichajes (solo Admin)
   * Endpoint: GET /api/Fichajes?all=true
   */
  todos(): Observable<FichajeDto[]> {
    return this.http.get<FichajeDto[]>(`${this.base}?all=true`);
  }
}
