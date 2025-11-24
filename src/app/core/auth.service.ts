/**
 * Servicio de Autenticación
 *
 * Gestiona el estado de autenticación del usuario en toda la aplicación.
 * Guarda el token JWT, el rol (Admin/Empleado) y el ID del empleado en localStorage.
 *
 * Usa BehaviorSubject para que otros componentes puedan suscribirse y reaccionar
 * a los cambios de estado (login/logout).
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

// Tipo de rol del usuario
type Rol = 'Admin' | 'Empleado' | string;

// Estado de autenticación que se guarda
interface AuthState {
  token: string | null;      // Token JWT del backend
  rol: Rol | null;           // Rol del usuario (Admin o Empleado)
  empleadoId: number | null; // ID del empleado en la base de datos
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Claves para guardar en localStorage
  private kTok = 'jwt_token';
  private kRol = 'rol';
  private kEmp = 'empleadoId';

  // Estado reactivo de autenticación
  // Se inicializa con los datos del localStorage (si existen)
  private _state$ = new BehaviorSubject<AuthState>({
    token: localStorage.getItem(this.kTok),
    rol: (localStorage.getItem(this.kRol) as Rol) ?? null,
    empleadoId: localStorage.getItem(this.kEmp) ? Number(localStorage.getItem(this.kEmp)) : null
  });

  // Observable del estado completo (para suscribirse desde componentes)
  readonly state$ = this._state$.asObservable();

  // Observable que indica si el usuario está logueado (true si hay token)
  readonly isLogged$ = this.state$.pipe(map(s => !!s.token));

  // Observable que indica si el usuario es Admin
  readonly isAdmin$ = this.state$.pipe(map(s => s.rol === 'Admin'));

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
   * Limpiar sesión (logout)
   * Borra todo del localStorage y resetea el estado
   */
  clear() {
    localStorage.removeItem(this.kTok);
    localStorage.removeItem(this.kRol);
    localStorage.removeItem(this.kEmp);
    this._state$.next({ token: null, rol: null, empleadoId: null });
  }

  // Métodos síncronos para usar en guards (no requieren suscripción)

  /** Devuelve true si hay un token guardado */
  hasToken(): boolean { return !!this._state$.value.token; }

  /** Devuelve true si el usuario es Admin */
  isAdmin(): boolean { return this._state$.value.rol === 'Admin'; }
}
