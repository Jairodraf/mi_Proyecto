import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

type Rol = 'Admin' | 'Empleado' | string;

interface AuthState {
  token: string | null;
  rol: Rol | null;
  empleadoId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private kTok = 'jwt_token';
  private kRol = 'rol';
  private kEmp = 'empleadoId';

  private _state$ = new BehaviorSubject<AuthState>({
    token: localStorage.getItem(this.kTok),
    rol: (localStorage.getItem(this.kRol) as Rol) ?? null,
    empleadoId: localStorage.getItem(this.kEmp) ? Number(localStorage.getItem(this.kEmp)) : null
  });

  /** Estado completo (si lo necesitas en otros sitios) */
  readonly state$ = this._state$.asObservable();

  /** Está logueado si hay token */
  readonly isLogged$ = this.state$.pipe(map(s => !!s.token));

  /** Es admin si el rol === 'Admin' */
  readonly isAdmin$ = this.state$.pipe(map(s => s.rol === 'Admin'));

  /** Guardar credenciales tras el login */
  setAuth(token: string, rol: Rol, empleadoId: number) {
    localStorage.setItem(this.kTok, token);
    localStorage.setItem(this.kRol, String(rol));
    localStorage.setItem(this.kEmp, String(empleadoId));
    this._state$.next({ token, rol, empleadoId });
  }

  /** Limpiar sesión */
  clear() {
    localStorage.removeItem(this.kTok);
    localStorage.removeItem(this.kRol);
    localStorage.removeItem(this.kEmp);
    this._state$.next({ token: null, rol: null, empleadoId: null });
  }

  /** Helpers síncronos (por si los necesitas en guards) */
  hasToken(): boolean { return !!this._state$.value.token; }
  isAdmin(): boolean { return this._state$.value.rol === 'Admin'; }
}
