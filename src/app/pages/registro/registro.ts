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
  FormsModule,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { EmpleadosService, CreateEmpleadoDto, UpdateEmpleadoDto, EmpleadoDto } from '../../services/empleados.service';
import { finalize } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpErrorResponse } from '@angular/common/http';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzAutocompleteModule,
    CommonModule,
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
  isUpdateVisible = false;
  loading = false;
  isUpdating = false;

  datosConfirmados: any = {};
  accion: 'crear' | 'actualizar' | 'eliminar' = 'crear';

  // Employee search
  empleados: EmpleadoDto[] = [];
  empleadosFiltrados: EmpleadoDto[] = [];
  busquedaEmpleado = '';
  empleadoSeleccionado: EmpleadoDto | null = null;

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

  ngOnInit(): void {
    // Load all employees for search
    this.api.getAll().subscribe({
      next: (data) => {
        this.empleados = data;
      },
      error: () => {
        this.msg.error('Error al cargar empleados');
      },
    });
  }

  // Filter employees based on search input
  onEmpleadoSearch(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    this.busquedaEmpleado = input;
    if (!input) {
      this.empleadosFiltrados = [];
      return;
    }
    this.empleadosFiltrados = this.empleados.filter(
      (emp) =>
        emp.nombre.toLowerCase().includes(input) ||
        emp.apellidos.toLowerCase().includes(input) ||
        emp.dni.toLowerCase().includes(input) ||
        emp.email.toLowerCase().includes(input)
    );
  }

  selectEmpleado(emp: EmpleadoDto): void {
    this.empleadoSeleccionado = emp;
    this.validateForm.patchValue({
      nombre: emp.nombre,
      apellidos: emp.apellidos,
      dni: emp.dni,
      email: emp.email,
    });
    this.busquedaEmpleado = '';
    this.empleadosFiltrados = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.datosConfirmados = this.validateForm.value;
      this.accion = 'crear';
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
    if (this.accion === 'actualizar') {
      this.handleUpdateOk();
      return;
    }

    if (this.accion === 'eliminar') {
      this.handleDeleteOk();
      return;
    }

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

  updateEmpleado(): void {
    if (!this.empleadoSeleccionado) {
      this.msg.warning('Debes seleccionar un empleado para modificar');
      return;
    }

    // Allow partial updates: merge current empleado data with any non-empty form fields
    const v = this.validateForm.getRawValue();
    const merged: any = {
      nombre: this.empleadoSeleccionado.nombre,
      apellidos: this.empleadoSeleccionado.apellidos,
      dni: this.empleadoSeleccionado.dni,
      email: this.empleadoSeleccionado.email,
      phoneNumberPrefix: this.validateForm.controls['phoneNumberPrefix'].value || '+34',
      phoneNumber: this.empleadoSeleccionado.telefono ?? '',
      rol: this.empleadoSeleccionado.rol,
    };

    if (v.nombre && v.nombre.trim() !== '') merged.nombre = v.nombre.trim();
    if (v.apellidos && v.apellidos.trim() !== '') merged.apellidos = v.apellidos.trim();
    if (v.dni && v.dni.trim() !== '') merged.dni = v.dni.trim();
    if (v.email && v.email.trim() !== '') merged.email = v.email.trim();
    if (v.phoneNumber && v.phoneNumber.trim() !== '') merged.phoneNumber = v.phoneNumber.trim();
    if (v.rol && v.rol.trim() !== '') merged.rol = v.rol.trim();

    this.datosConfirmados = merged;
    this.accion = 'actualizar';
    this.isConfirmVisible = true;
  }

  handleUpdateOk(): void {
    if (!this.empleadoSeleccionado) return;

    this.isConfirmVisible = false;
    this.isUpdating = true;
    const v = this.validateForm.getRawValue();

    // Build a partial dto containing only changed/non-empty fields
    const dto: UpdateEmpleadoDto = {};

    const addIfChanged = (key: keyof UpdateEmpleadoDto, value: any) => {
      if (value === undefined || value === null) return;
      // compare to existing empleadoSeleccionado
      const existing = (this.empleadoSeleccionado as any)[key];
      if (typeof value === 'string') {
        if (value.trim() === '') return;
      }
      // normalize some fields for comparison
      let normalizedNew = value;
      let normalizedExisting = existing;
      if (key === 'dni' && typeof value === 'string') normalizedNew = value.trim().toUpperCase();
      if (key === 'email' && typeof value === 'string') normalizedNew = value.trim().toLowerCase();
      if (key === 'nombre' && typeof value === 'string') normalizedNew = value.trim();
      if (key === 'apellidos' && typeof value === 'string') normalizedNew = value.trim();

      if (normalizedNew !== normalizedExisting) {
        (dto as any)[key] = normalizedNew;
      }
    };

    addIfChanged('nombre', v.nombre);
    addIfChanged('apellidos', v.apellidos);
    addIfChanged('dni', v.dni ? v.dni.toUpperCase() : undefined);
    addIfChanged('email', v.email ? v.email.toLowerCase() : undefined);

    const telefonoRaw = `${v.phoneNumberPrefix ?? ''}${v.phoneNumber ?? ''}`.replace(/\s+/g, '');
    if (telefonoRaw) addIfChanged('telefono', telefonoRaw);

    if (v.rol) addIfChanged('rol', (v.rol || '').toString());

    // Include password only if provided and non-empty
    if (v.password && v.password.trim()) {
      addIfChanged('contrasena', v.password);
    }

    // If no changes, inform user
    if (Object.keys(dto).length === 0) {
      this.isUpdating = false;
      this.msg.info('No hay cambios para actualizar');
      return;
    }

    this.api
      .update(this.empleadoSeleccionado.id, dto)
      .pipe(
        finalize(() => {
          this.isUpdating = false;
        })
      )
      .subscribe({
        next: (res: EmpleadoDto) => {
          this.msg.success(`Empleado ${res.nombre} actualizado correctamente`);
          this.empleadoSeleccionado = res;
          this.validateForm.reset({ phoneNumberPrefix: '+34', rol: '' });
          // Recargar lista de empleados
          this.api.getAll().subscribe({
            next: (data) => {
              this.empleados = data;
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          if (err?.status === 409) {
            this.msg.error('Ya existe un empleado con ese DNI o Email');
          } else if (err?.status === 403 || err?.status === 401) {
            this.msg.error('No autorizado. Solo admins pueden actualizar empleados');
          } else {
            this.msg.error('Error al actualizar el empleado');
          }
        },
      });
  }

  handleDeleteOk(): void {
    if (!this.empleadoSeleccionado) return;

    this.isConfirmVisible = false;
    this.loading = true;

    this.api
      .delete(this.empleadoSeleccionado.id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.msg.success('Empleado eliminado correctamente');
          this.validateForm.reset({ phoneNumberPrefix: '+34', rol: '' });
          this.empleadoSeleccionado = null;
          // Recargar lista de empleados
          this.api.getAll().subscribe({
            next: (data) => {
              this.empleados = data;
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          if (err?.status === 403 || err?.status === 401) {
            this.msg.error('No autorizado. Solo admins pueden eliminar empleados');
          } else {
            this.msg.error('Error al eliminar el empleado');
          }
        },
      });
  }

  deleteEmpleado(): void {
    if (!this.empleadoSeleccionado) {
      this.msg.warning('Debes seleccionar un empleado para eliminar');
      return;
    }

    // Open confirmation modal populated with empleado data
    this.datosConfirmados = {
      nombre: this.empleadoSeleccionado.nombre,
      apellidos: this.empleadoSeleccionado.apellidos,
      dni: this.empleadoSeleccionado.dni,
      email: this.empleadoSeleccionado.email,
      phoneNumber: this.empleadoSeleccionado.telefono ?? '',
    };
    this.accion = 'eliminar' as any;
    this.isConfirmVisible = true;
  }

  confirmationValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return { required: true };
    if (control.value !== this.validateForm.controls.password.value)
      return { confirm: true, error: true };
    return null;
  }
}
