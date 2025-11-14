// src/app/pages/registro/registro.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { EmpleadosService, CreateEmpleadoDto, EmpleadoDto } from '../../services/empleados.service';
import { finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
  ],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss'],
})
export class Registro implements OnInit, OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private destroy$ = new Subject<void>();
  private api = inject(EmpleadosService);
  private msg = inject(NzMessageService);

  isConfirmVisible = false;
  isSuccessVisible = false;
  loading = false;

  datosConfirmados: any = {};

  validateForm = this.fb.group({
    nombre: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    apellidos: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    dni: this.fb.control('', [
      Validators.required,
      Validators.minLength(9),
      Validators.maxLength(9),
    ]),
    email: this.fb.control('', [Validators.email, Validators.required]),
    password: this.fb.control('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    ]),
    phoneNumberPrefix: this.fb.control('+34'),
    phoneNumber: this.fb.control('', [
      Validators.required,
      Validators.minLength(9),
      Validators.pattern('^[0-9]{9}$'),
    ]),
    rol: this.fb.control('', [Validators.required, Validators.pattern(/^(admin|user)$/i)]),
  });

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.datosConfirmados = this.validateForm.value;
      this.isConfirmVisible = true;
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleConfirmOk(): void {
    this.isConfirmVisible = false;

    const v = this.validateForm.getRawValue();
    const rol = (v.rol || '').toString().toLowerCase() === 'admin' ? 'Admin' : 'User';
    const telefonoRaw = `${v.phoneNumberPrefix ?? ''}${v.phoneNumber ?? ''}`.replace(/\s+/g, '');
    const telefono = telefonoRaw.length ? telefonoRaw : null;

    const dto: CreateEmpleadoDto = {
      nombre: v.nombre!.trim(),
      apellidos: v.apellidos!.trim(),
      dni: v.dni!.trim().toUpperCase(), // suele pedirse en mayúsculas
      email: v.email!.trim().toLowerCase(),
      contrasena: v.password!, // mapeo correcto
      telefono,
      rol, // "Admin" | "User"
    };

    this.loading = true;
    this.validateForm.reset({ phoneNumberPrefix: '+34', rol: '' });

    this.api
      .create(dto)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.validateForm.enable();
        })
      )
      .subscribe({
        next: (res: EmpleadoDto) => {
          this.msg.success(`Empleado ${res.nombre} creado`);
          this.validateForm.reset({ phoneNumberPrefix: '+34', rol: '' });
          this.isSuccessVisible = true;
        },
        error: (err: HttpErrorResponse) => {
          if (err?.status === 409) {
            this.msg.error('Ya existe un empleado con ese DNI o Email');
          } else if (err?.status === 403 || err?.status === 401) {
            this.msg.error('No autorizado. Debes iniciar sesión como Admin');
          } else {
            this.msg.error('Error al crear el empleado');
          }
        },
      });
  }

  handleConfirmCancel(): void {
    this.isConfirmVisible = false;
  }
  handleSuccessOk(): void {
    this.isSuccessVisible = false;
  }

  confirmationValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return { required: true };
    if (control.value !== this.validateForm.controls.password.value)
      return { confirm: true, error: true };
    return null;
  }
}
