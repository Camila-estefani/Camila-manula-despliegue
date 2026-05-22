import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {
  @Input() customer: Customer | null = null;
  @Input() isEditing = false;
  @Output() saved = new EventEmitter<Customer>();
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.customer) {
      this.form.patchValue(this.customer);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      taxId: ['', [Validators.required, Validators.pattern(/^[0-9]{8,20}$/)]],
      country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phone: ['', [Validators.pattern(/^[0-9+()\-\s]{7,20}$/)]],
      address: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      creditLimit: ['', [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Por favor, complete todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.error = null;

    const customerData: Customer = {
      ...this.customer,
      ...this.form.value,
      creditLimit: Number(this.form.value.creditLimit ?? 0)
    };

    const request = this.isEditing && this.customer?.clientId
      ? this.customerService.updateCustomer(this.customer.clientId, customerData)
      : this.customerService.createCustomer(customerData);

    request.subscribe({
      next: (response) => {
        this.loading = false;
        this.saved.emit(response);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.isEditing ? 'Error al actualizar cliente' : 'Error al crear cliente';
        console.error(err);
      }
    });
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
      companyName: 'El nombre de la empresa',
      taxId: 'El RUC/TAX ID',
      country: 'El país',
      phone: 'El teléfono',
      address: 'La dirección',
      email: 'El email',
      creditLimit: 'El límite de crédito'
    };

    if (control.errors['required']) {
      return `${labels[fieldName] ?? fieldName} es requerido`;
    }
    if (control.errors['minlength']) {
      return `${labels[fieldName] ?? fieldName} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `${labels[fieldName] ?? fieldName} debe tener como máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Ingrese un email válido';
    }
    if (control.errors['pattern']) {
      if (fieldName === 'taxId') {
        return 'El RUC/TAX ID debe contener solo números entre 8 y 20 dígitos';
      }
      if (fieldName === 'phone') {
        return 'El teléfono debe tener entre 7 y 20 caracteres válidos';
      }
      return `${labels[fieldName] ?? fieldName} tiene un formato inválido`;
    }
    if (control.errors['min']) {
      return `${labels[fieldName] ?? fieldName} debe ser mayor o igual a 0`;
    }

    return '';
  }
}
