/**
 * Servicio de Empleados
 *
 * Gestiona las operaciones CRUD de empleados (solo para Admins).
 * Se comunica con el backend para crear, listar, modificar y eliminar empleados.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// DTO para crear un nuevo empleado
export interface CreateEmpleadoDto {
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  contrasena: string;       // Contraseña inicial
  telefono?: string | null; // Opcional
  rol: string;              // "Admin" o "User"
}

// DTO para actualizar un empleado existente
// Todos los campos son opcionales (solo se envía lo que se quiere cambiar)
export interface UpdateEmpleadoDto {
  nombre?: string;
  apellidos?: string;
  dni?: string;
  email?: string;
  contrasena?: string;      // Solo si se quiere cambiar
  telefono?: string | null;
  rol?: string;
}

// DTO de empleado completo que devuelve el backend
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
  private base = '/api/Empleados'; // Pasa por el proxy configurado

  /**
   * Crear un nuevo empleado (solo Admin)
   * Endpoint: POST /api/Empleados
   */
  create(dto: CreateEmpleadoDto) {
    return this.http.post<EmpleadoDto>(this.base, dto);
  }

  /**
   * Obtener todos los empleados (solo Admin)
   * Endpoint: GET /api/Empleados
   */
  getAll() {
    return this.http.get<EmpleadoDto[]>(this.base);
  }

  /**
   * Eliminar un empleado (solo Admin)
   * Endpoint: DELETE /api/Empleados/{id}
   */
  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Actualizar un empleado (solo Admin)
   * Endpoint: PUT /api/Empleados/{id}
   */
  update(id: number, dto: UpdateEmpleadoDto) {
    return this.http.put<EmpleadoDto>(`${this.base}/${id}`, dto);
  }
}
