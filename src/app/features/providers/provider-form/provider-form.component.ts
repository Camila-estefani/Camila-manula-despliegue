import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Provider } from '../../../core/models/provider.model';
import { ProviderService } from '../../../core/services/provider.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './provider-form.component.html',
  styleUrls: ['./provider-form.component.css']
})
export class ProviderFormComponent implements OnInit {
  @Input() provider: Provider | null = null;
  @Input() isEditing = false;
  @Output() saved = new EventEmitter<Provider>();
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly providerService: ProviderService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.provider) {
      this.form.patchValue(this.provider);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      taxId: ['', [Validators.required, Validators.pattern(/^[0-9]{8,20}$/)]],
      productType: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      contactEmail: ['', [Validators.email, Validators.maxLength(150)]],
      contactPhone: ['', [Validators.pattern(/^[0-9+()\-\s]{7,20}$/), Validators.maxLength(20)]],
      address: ['', [Validators.maxLength(255)]],
      isActive: [true]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.form.value;

    if (this.isEditing && this.provider?.providerId) {
      this.providerService.updateProvider(this.provider.providerId, formValue)
        .pipe(timeout(10000))
        .subscribe({
          next: (updated) => {
            this.saved.emit(updated);
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Error al actualizar proveedor: ' + (err?.message || 'Timeout o error de red');
            console.error(err);
            this.loading = false;
          }
        });
    } else {
      this.providerService.createProvider(formValue)
        .pipe(timeout(10000))
        .subscribe({
          next: (created) => {
            this.saved.emit(created);
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Error al crear proveedor: ' + (err?.message || 'Timeout o error de red');
            console.error(err);
            this.loading = false;
          }
        });
    }
  }

  onCancel(): void {
    this.closed.emit();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control?.touched) {
      return '';
    }

    const labels: Record<string, string> = {
      companyName: 'La empresa',
      taxId: 'El RUC',
      productType: 'El tipo de producto',
      contactEmail: 'El correo de contacto',
      contactPhone: 'El teléfono de contacto',
      address: 'La dirección'
    };
    if (control.errors['required']) {
      return `${labels[fieldName] ?? fieldName} es requerido`;
    }
    if (control.errors['minlength']) {
      return `${labels[fieldName] ?? fieldName} debe tener mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `${labels[fieldName] ?? fieldName} debe tener como máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Ingresa un correo válido';
    }
    if (control.errors['pattern']) {
      if (fieldName === 'taxId') {
        return 'El RUC debe contener solo números entre 8 y 20 dígitos';
      }
      if (fieldName === 'contactPhone') {
        return 'El teléfono debe contener solo números y símbolos válidos';
      }
      return `${labels[fieldName] ?? fieldName} tiene un formato inválido`;
    }
    return 'Campo inválido';
  }
}
