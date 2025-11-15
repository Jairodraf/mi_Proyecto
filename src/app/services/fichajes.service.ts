// src/app/services/fichajes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoFichaje = 'Entrada' | 'Salida';

export interface FichajeDto {
  id: string;
  fechaHora: string;
  tipo: TipoFichaje;
  observacion?: string | null;
  empleadoId: number;
  empleadoNombre?: string | null;
}

export interface FichajeCreateDto {
  tipo: TipoFichaje;
  observacion?: string | null;
  fechaHora?: string; // opcional; si no se envía, el back usa UtcNow
}

@Injectable({ providedIn: 'root' })
export class FichajesService {
  private base = '/api/Fichajes';

  constructor(private http: HttpClient) {}

  crear(dto: FichajeCreateDto): Observable<FichajeDto> {
    return this.http.post<FichajeDto>(this.base, dto);
  }

  /*   actualizarObservacion(id: string, observacion: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/observacion`, { observacion });
  } */

  actualizarObservacion(id: string, observacion: string) {
    return this.http.put<void>(`/api/fichajes/${id}/observacion`, { observacion });
  }

  // (opcional) Obtener mis últimos
  misFichajes(limit?: number): Observable<FichajeDto[]> {
    const url = limit ? `${this.base}/mios?limit=${limit}` : `${this.base}/mios`;
    return this.http.get<FichajeDto[]>(url);
  }

  // Obtener todos los fichajes (endpoint para administradores)
  todos(): Observable<FichajeDto[]> {
    return this.http.get<FichajeDto[]>(this.base);
  }
}
