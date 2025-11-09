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
import { Subject, takeUntil } from 'rxjs';
import { NzModalModule } from 'ng-zorro-antd/modal';
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
    NzModalModule
  ],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss'],
})
export class Registro implements OnInit, OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private destroy$ = new Subject<void>();

  // control de modales
  isConfirmVisible = false;
  isSuccessVisible = false;

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
    rol: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern('^(user|admin)$'),
    ]),
  });

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.datosConfirmados = this.validateForm.value;
      this.isConfirmVisible = true; // muestra modal de confirmación
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
    console.log('Registro confirmado:', this.datosConfirmados);
    this.isConfirmVisible = false;
    this.validateForm.reset();
    this.isSuccessVisible = true; // muestra modal de éxito
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
    return {};
  }
}
