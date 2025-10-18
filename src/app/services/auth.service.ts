import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAdmin = new BehaviorSubject<boolean>(false);
  /** Observable used by templates/components to react to role changes */
  readonly isAdmin$: Observable<boolean> = this._isAdmin.asObservable();

  /** Current synchronous value */
  get isAdmin(): boolean {
    return this._isAdmin.value;
  }

  loginAsAdmin(): void {
    this._isAdmin.next(true);
  }

  loginAsUser(): void {
    this._isAdmin.next(false);
  }

  logout(): void {
    this._isAdmin.next(false);
  }
}
