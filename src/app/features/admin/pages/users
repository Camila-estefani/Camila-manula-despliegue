import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: Customer[] = [];
  filteredUsers: Customer[] = [];
  customerForm!: FormGroup;
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  searchTerm = '';
  modalTitle = 'Nuevo Cliente';

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      taxId: ['', [Validators.required]],
      country: ['', [Validators.required]],
      address: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      creditLimit: ['', [Validators.required, Validators.min(0)]],
      isActive: [true],
      updated_at: [null],
      deleted_at: [null],
      restored_at: [null]
    });
  }

  loadUsers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
      },
      error: (err) => {
        console.error('Error cargando clientes', err);
        this.users = [];
        this.filteredUsers = [];
      }
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user =>
      user.companyName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.taxId.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterUsers();
  }

  openForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.modalTitle = 'Nuevo Cliente';
    this.customerForm.reset({
      companyName: '',
      taxId: '',
      country: '',
      address: '',
      email: '',
      creditLimit: '',
      isActive: true,
      updated_at: null,
      deleted_at: null,
      restored_at: null
    });
    this.isModalOpen = true;
  }

  closeForm(): void {
    this.isModalOpen = false;
    this.customerForm.markAsPristine();
    this.customerForm.markAsUntouched();
  }

  editUser(user: Customer): void {
    this.isEditing = true;
    this.editingId = user.clientId ?? null;
    this.modalTitle = 'Editar Cliente';
    this.customerForm.patchValue({
      ...user,
      updated_at: this.toDateTimeLocal(user.updated_at),
      deleted_at: this.toDateTimeLocal(user.deleted_at),
      restored_at: this.toDateTimeLocal(user.restored_at)
    });
    this.isModalOpen = true;
  }

  deleteUser(id: number | undefined): void {
    if (id === undefined || id === null) {
      return;
    }
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error('Error eliminando cliente', err)
      });
    }
  }

  restoreUser(id: number | undefined): void {
    if (id === undefined || id === null) {
      return;
    }
    if (confirm('¿Está seguro de que desea restaurar este cliente?')) {
      this.customerService.restoreCustomer(id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => console.error('Error restaurando cliente', err)
      });
    }
  }

  saveUser(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const rawValue = this.customerForm.value;
    const customerData: Customer = {
      ...rawValue,
      updated_at: this.toNullableDateTime(rawValue.updated_at),
      deleted_at: this.toNullableDateTime(rawValue.deleted_at),
      restored_at: this.toNullableDateTime(rawValue.restored_at)
    };

    if (this.isEditing && this.editingId !== null) {
      this.customerService.updateCustomer(this.editingId, customerData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeForm();
        },
        error: (err) => {
          console.error('Error actualizando cliente', err);
        }
      });
    } else {
      this.customerService.createCustomer(customerData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeForm();
        },
        error: (err) => {
          console.error('Error creando cliente', err);
        }
      });
    }
  }

  getError(fieldName: string): string {
    const control = this.customerForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }

    if (control.errors['email']) {
      return 'Ingrese un correo válido';
    }

    if (control.errors['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }

    if (control.errors['min']) {
      return 'El valor no puede ser negativo';
    }

    return 'Campo inválido';
  }

  private toNullableDateTime(value: string | null | undefined): string | null {
    return value ? new Date(value).toISOString() : null;
  }

  private toDateTimeLocal(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
