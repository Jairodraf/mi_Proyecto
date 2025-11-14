// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export type Rol = 'Admin' | 'User' | 'Empleado' | string;

interface AuthState {
  token: string | null;
  rol: Rol | null;
  empleadoId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly kTok = 'jwt_token';
  private readonly kRol = 'rol';
  private readonly kEmp = 'empleadoId';

  // Estado inicial desde localStorage
  private _state$ = new BehaviorSubject<AuthState>({
    token: localStorage.getItem(this.kTok),
    rol: (localStorage.getItem(this.kRol) as Rol) ?? null,
    empleadoId: localStorage.getItem(this.kEmp)
      ? Number(localStorage.getItem(this.kEmp))
      : null,
  });

  // Observables para el header/guards
  readonly state$    = this._state$.asObservable();
  readonly isLogged$ = this.state$.pipe(map(s => !!s.token));
  readonly isAdmin$  = this.state$.pipe(map(s => s.rol === 'Admin'));

  // Helpers sincronizados
  hasToken(): boolean { return !!this._state$.value.token; }
  get token(): string | null { return this._state$.value.token; }
  get rol(): Rol | null { return this._state$.value.rol; }
  get empleadoId(): number | null { return this._state$.value.empleadoId; }

  // Guardar credenciales tras login
  setAuth(token: string, rol: Rol, empleadoId: number) {
    localStorage.setItem(this.kTok, token);
    localStorage.setItem(this.kRol, String(rol));
    localStorage.setItem(this.kEmp, String(empleadoId));
    this._state$.next({ token, rol, empleadoId });
  }

  // Cerrar sesión (borra todo y emite estado vacío)
  logout() {
    localStorage.removeItem(this.kTok);
    localStorage.removeItem(this.kRol);
    localStorage.removeItem(this.kEmp);
    this._state$.next({ token: null, rol: null, empleadoId: null });
  }

  // Alias por compatibilidad con código previo
  clear() { this.logout(); }
}
