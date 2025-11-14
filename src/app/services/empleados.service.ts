// src/app/services/empleados.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface CreateEmpleadoDto {
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  contrasena: string;
  telefono?: string | null;
  rol: string; // "Admin" | "User"
}

export interface EmpleadoDto {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono?: string | null;
  rol: 'Admin' | 'User';
}

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  private http = inject(HttpClient);
  private base = '/api/Empleados'; // via proxy

  create(dto: CreateEmpleadoDto) {
    return this.http.post<EmpleadoDto>(this.base, dto);
  }

  getAll() {
    return this.http.get<EmpleadoDto[]>(this.base);
  }
}
