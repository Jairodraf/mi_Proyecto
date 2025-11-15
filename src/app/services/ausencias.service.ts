import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AusenciaCreateDto {
  start: string;      // yyyy-mm-dd
  end: string;        // yyyy-mm-dd
  reason: string;
}

export interface AusenciaDto {
  id: string;
  start: string;
  end: string;
  reason: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AusenciasService {
  private readonly base = 'https://TU_API/ausencias'; // ajusta URL

  constructor(private http: HttpClient) {}

  crear(dto: AusenciaCreateDto): Observable<AusenciaDto> {
    return this.http.post<AusenciaDto>(`${this.base}`, dto);
  }

  borrar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listar(): Observable<AusenciaDto[]> {
    return this.http.get<AusenciaDto[]>(`${this.base}`);
  }
}
