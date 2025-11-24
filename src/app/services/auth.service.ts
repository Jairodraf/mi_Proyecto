/**
 * Servicio de Autenticación
 *
 * Gestiona el estado de autenticación del usuario en toda la aplicación.
 * Guarda el token JWT, el rol (Admin/Empleado) y el ID del empleado en localStorage.
 *
 * Usa BehaviorSubject para que los componentes puedan suscribirse y reaccionar
 * automáticamente a los cambios de estado (login/logout).
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

// Tipo de rol del usuario
export type Rol = 'Admin' | 'User' | 'Empleado' | string;

// Estado de autenticación que se guarda
interface AuthState {
  token: string | null;      // Token JWT del backend
  rol: Rol | null;           // Rol del usuario (Admin o Empleado)
  empleadoId: number | null; // ID del empleado en la base de datos
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Claves para guardar en localStorage
  private readonly kTok = 'jwt_token';
  private readonly kRol = 'rol';
  private readonly kEmp = 'empleadoId';

  // Estado reactivo de autenticación
  // Se inicializa con los datos del localStorage (si existen)
  private _state$ = new BehaviorSubject<AuthState>({
    token: localStorage.getItem(this.kTok),
    rol: (localStorage.getItem(this.kRol) as Rol) ?? null,
    empleadoId: localStorage.getItem(this.kEmp)
      ? Number(localStorage.getItem(this.kEmp))
      : null,
  });

  // Observables públicos para que los componentes se suscriban
  readonly state$    = this._state$.asObservable();         // Estado completo
  readonly isLogged$ = this.state$.pipe(map(s => !!s.token)); // ¿Está logueado?
  readonly isAdmin$  = this.state$.pipe(map(s => s.rol === 'Admin')); // ¿Es Admin?

  // Métodos síncronos (para guards y validaciones rápidas)
  hasToken(): boolean { return !!this._state$.value.token; }
  get token(): string | null { return this._state$.value.token; }
  get rol(): Rol | null { return this._state$.value.rol; }
  get empleadoId(): number | null { return this._state$.value.empleadoId; }

  /**
   * Guardar credenciales después de un login exitoso
   * Guarda en localStorage y actualiza el estado reactivo
   */
  setAuth(token: string, rol: Rol, empleadoId: number) {
    localStorage.setItem(this.kTok, token);
    localStorage.setItem(this.kRol, String(rol));
    localStorage.setItem(this.kEmp, String(empleadoId));
    this._state$.next({ token, rol, empleadoId });
  }

  /**
   * Cerrar sesión (logout)
   * Borra todo del localStorage y resetea el estado
   */
  logout() {
    localStorage.removeItem(this.kTok);
    localStorage.removeItem(this.kRol);
    localStorage.removeItem(this.kEmp);
    this._state$.next({ token: null, rol: null, empleadoId: null });
  }

  // Alias de logout() para compatibilidad con código anterior
  clear() { this.logout(); }
}
