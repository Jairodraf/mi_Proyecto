// src/app/pages/login/login.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // ⬅️ IMPORTANTE

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  validateForm: FormGroup;
  loading = false;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private msg = inject(NzMessageService);
  private auth = inject(AuthService); // ⬅️ IMPORTANTE

  constructor() {
    this.validateForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Si ya hay sesión, evita volver a /login
    if (this.auth.hasToken()) {
      this.router.navigateByUrl('/');
    }
  }

  submitForm(): void {
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    const { email, contrasena } = this.validateForm.value;
    this.loading = true;

    this.http.post<{ token: string; rol: string; empleadoId: number }>(
      '/api/auth/login', // ⬅️ vía proxy
      { email, contrasena }
    )
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (res) => {
        // 🔐 Guarda token + rol en el AuthService (esto actualiza isAdmin$, isLogged$ del header)
        this.auth.setAuth(res.token, res.rol, res.empleadoId);

        this.msg.success('Sesión iniciada');

        // 🚦 Redirección según rol
        if (res.rol === 'Admin') {
          this.router.navigateByUrl('/empleados/alta'); // o a tu dashboard de admin
        } else {
          this.router.navigateByUrl('/fichaje');        // ruta para usuarios
        }
      },
      error: (err) => {
        this.msg.error(err?.status === 401 ? 'Credenciales inválidas' : 'Error de conexión');
      }
    });
  }
}
