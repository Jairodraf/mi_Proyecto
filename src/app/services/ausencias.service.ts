import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AusenciaCreateDto {
  FechaInicio: string;      // ISO 8601 format
  FechaFin: string;        // ISO 8601 format
  Motivo: string;
}

export interface AusenciaDto {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  aceptada: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class AusenciasService {
  // Usar ruta relativa para que pase por el proxy
  private readonly base = '/api/Ausencias';

  constructor(private http: HttpClient) {}

  crear(dto: AusenciaCreateDto): Observable<AusenciaDto> {
    // El interceptor adjunta el token automáticamente
    return this.http.post<AusenciaDto>(`${this.base}`, dto);
  }

  borrar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listar(): Observable<AusenciaDto[]> {
    // Si quieres solo las tuyas, usa /mias
    return this.http.get<AusenciaDto[]>(`${this.base}/mias`);
  }

  listarPorEmpleado(empleadoId: number): Observable<AusenciaDto[]> {
    // Para admins: listar ausencias de un empleado específico (según backend)
    return this.http.get<AusenciaDto[]>(`${this.base}/usuario/${empleadoId}`);
  }

  actualizarEstado(id: string, aceptada: boolean): Observable<void> {
    // Según backend: PUT /api/Ausencias/{id}/aprobar { Aceptada: bool }
    return this.http.put<void>(`${this.base}/${id}/aprobar`, { Aceptada: aceptada });
  }
}
