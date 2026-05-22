import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AdminClientForm,
  AdminRole,
  AdminRoleRequest,
  AdminUser,
  AdminUserRequest,
  AdminWorkerForm
} from './admin-users.models';
import { AdminUsersService } from './admin-users.service';

type TabKey = 'users' | 'roles';
type UserTypeKey = 'WORKER' | 'CLIENT' | 'ADMIN';

interface PermissionChip {
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  activeTab: TabKey = 'users';
  searchTerm = '';
  typeFilter: 'ALL' | UserTypeKey = 'ALL';

  users: AdminUser[] = [];
  roles: AdminRole[] = [];
  roleUsers: AdminUser[] = [];
  selectedRole: AdminRole | null = null;
  selectedUserForAssignment: AdminUser | null = null;

  isUserModalOpen = false;
  isRoleAssignModalOpen = false;
  editingUserId: number | null = null;
  editingRoleId: number | null = null;

  userForm: FormGroup;
  roleForm: FormGroup;
  assignRoleForm: FormGroup;
  permissionChips: PermissionChip[] = [
    { label: 'Ver usuarios', checked: true },
    { label: 'Crear usuarios', checked: true },
    { label: 'Editar usuarios', checked: true },
    { label: 'Asignar roles', checked: true }
  ];

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly usersService: AdminUsersService
  ) {
    this.userForm = this.buildUserForm();
    this.roleForm = this.buildRoleForm();
    this.assignRoleForm = this.fb.group({
      roleId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.bindUserTypeState();
    this.loadUsers();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredUsers(): AdminUser[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.users.filter((user) => {
      const matchesType = this.typeFilter === 'ALL' || this.getUserType(user) === this.typeFilter;
      if (!matchesType) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchable = [
        user.displayName,
        user.username,
        user.userTypeName,
        user.worker?.documentNumber,
        user.client?.taxId
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  }

  get userStats() {
    const workerCount = this.users.filter((user) => this.getUserType(user) === 'WORKER').length;
    const clientCount = this.users.filter((user) => this.getUserType(user) === 'CLIENT').length;
    const activeCount = this.users.filter((user) => user.active).length;

    return {
      total: this.users.length,
      workers: workerCount,
      clients: clientCount,
      active: activeCount
    };
  }

  switchTab(tab: TabKey): void {
    this.activeTab = tab;
    if (tab === 'roles' && this.roles.length > 0 && !this.selectedRole) {
      this.selectRole(this.roles[0]);
    }
  }

  loadUsers(): void {
    const sub = this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users = users ?? [];
      },
      error: (error) => {
        console.error('Error loading users', error);
        alert(this.getHttpErrorMessage(error, 'No se pudieron cargar los usuarios.'));
      }
    });

    this.subscriptions.add(sub);
  }

  loadRoles(selectFirst = true): void {
    const sub = this.usersService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles ?? [];
        if (selectFirst && this.roles.length > 0) {
          const currentId = this.selectedRole?.roleId;
          const role = currentId ? this.roles.find((item) => item.roleId === currentId) : this.roles[0];
          if (role) {
            this.selectRole(role);
          }
        } else if (this.selectedRole) {
          const role = this.roles.find((item) => item.roleId === this.selectedRole?.roleId);
          if (role) {
            this.selectRole(role);
          }
        }
      },
      error: (error) => {
        console.error('Error loading roles', error);
        alert(this.getHttpErrorMessage(error, 'No se pudieron cargar los roles.'));
      }
    });

    this.subscriptions.add(sub);
  }

  openCreateUser(): void {
    this.editingUserId = null;
    this.isUserModalOpen = true;
    this.userForm.reset(this.getDefaultUserFormValue());
    this.applySelectedRoleState();
  }

  openEditUser(user: AdminUser): void {
    const sub = this.usersService.getUserById(user.userId).subscribe({
      next: (detail) => {
        this.editingUserId = detail.userId;
        this.isUserModalOpen = true;
        const currentType = this.getUserType(detail);
        const userType: UserTypeKey = currentType === 'ADMIN' ? 'ADMIN' : currentType === 'CLIENT' ? 'CLIENT' : 'WORKER';
        this.userForm.reset(this.getDefaultUserFormValue());
        this.userForm.patchValue({
          roleId: detail.roles?.[0]?.roleId || null, 
          userType,
          username: detail.username,
          password: '',
          active: detail.active,
          worker: this.getWorkerFormValue(detail.worker),
          client: this.getClientFormValue(detail.client)
        });
        this.applySelectedRoleState();
      },
      error: (error) => console.error('Error loading user detail', error)
    });

    this.subscriptions.add(sub);
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
    this.editingUserId = null;
    this.userForm.reset(this.getDefaultUserFormValue());
    this.applySelectedRoleState();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const rawValue = this.userForm.getRawValue();

    if (!this.editingUserId && (!rawValue.password || String(rawValue.password).trim().length < 6)) {
      alert('Para crear usuario, la contraseña es obligatoria y debe tener al menos 6 caracteres.');
      return;
    }

    const userType = this.resolveUserTypeFromRoleName(String(rawValue.userType || this.getSelectedRoleName() || 'WORKER'));
    const request: AdminUserRequest = {
      roleId: Number(rawValue.roleId),
      userType,
      username: rawValue.username,
      password: rawValue.password?.trim() || null,
      active: !!rawValue.active,
      worker: userType === 'WORKER' ? this.cleanWorkerValue(rawValue.worker) : null,
      client: userType === 'CLIENT' ? this.cleanClientValue(rawValue.client) : null
    };

    const request$ = this.editingUserId
      ? this.usersService.updateUser(this.editingUserId, request)
      : this.usersService.createUser(request);

    const sub = request$.subscribe({
      next: () => {
        this.loadUsers();
        this.closeUserModal();
      },
      error: (error) => {
        console.error('Error saving user', error);
        alert(this.getHttpErrorMessage(error, 'No se pudo guardar el usuario.'));
      }
    });

    this.subscriptions.add(sub);
  }

  toggleUserStatus(user: AdminUser): void {
    const sub = this.usersService.toggleStatus(user.userId).subscribe({
      next: () => this.loadUsers(),
      error: (error) => console.error('Error toggling user status', error)
    });

    this.subscriptions.add(sub);
  }

  openAssignRoleModal(user: AdminUser): void {
    this.selectedUserForAssignment = user;
    this.isRoleAssignModalOpen = true;
    this.assignRoleForm.reset({ roleId: this.roles[0]?.roleId ?? null });
  }

  closeAssignRoleModal(): void {
    this.isRoleAssignModalOpen = false;
    this.selectedUserForAssignment = null;
    this.assignRoleForm.reset({ roleId: null });
  }

  confirmAssignRole(): void {
    if (!this.selectedUserForAssignment || this.assignRoleForm.invalid) {
      this.assignRoleForm.markAllAsTouched();
      return;
    }

    const roleId = Number(this.assignRoleForm.get('roleId')?.value);
    const sub = this.usersService.assignRole(this.selectedUserForAssignment.userId, roleId).subscribe({
      next: () => {
        this.loadUsers();
        this.loadRoles(false);
        this.closeAssignRoleModal();
      },
      error: (error) => console.error('Error assigning role', error)
    });

    this.subscriptions.add(sub);
  }

  assignCurrentRoleToSelectedUser(): void {
    if (!this.selectedRole || !this.selectedUserForAssignment) {
      return;
    }

    const sub = this.usersService.assignRole(this.selectedUserForAssignment.userId, this.selectedRole.roleId).subscribe({
      next: () => {
        this.loadUsers();
        this.loadRoles(false);
      },
      error: (error) => console.error('Error assigning role', error)
    });

    this.subscriptions.add(sub);
  }

  selectRole(role: AdminRole): void {
    this.selectedRole = role;
    this.roleForm.reset({
      name: role.name,
      description: role.description ?? ''
    });

    const sub = this.usersService.getRoleUsers(role.roleId).subscribe({
      next: (users) => {
        this.roleUsers = users ?? [];
      },
      error: (error) => {
        console.error('Error loading role users', error);
        this.roleUsers = [];
      }
    });

    this.subscriptions.add(sub);
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const rawValue = this.roleForm.getRawValue();
    const request: AdminRoleRequest = {
      name: rawValue.name,
      description: rawValue.description || null
    };

    const request$ = this.selectedRole?.roleId
      ? this.usersService.updateRole(this.selectedRole.roleId, request)
      : this.usersService.createRole(request);

    const sub = request$.subscribe({
      next: (savedRole) => {
        this.loadRoles(false);
        this.selectRole(savedRole);
      },
      error: (error) => console.error('Error saving role', error)
    });

    this.subscriptions.add(sub);
  }

  deleteSelectedRole(): void {
    if (!this.selectedRole) {
      return;
    }

    const confirmed = confirm(`¿Seguro que quieres eliminar el rol ${this.selectedRole.name}?`);
    if (!confirmed) {
      return;
    }

    const deletingRoleId = this.selectedRole.roleId;
    const sub = this.usersService.deleteRole(deletingRoleId).subscribe({
      next: () => {
        this.selectedRole = null;
        this.roleUsers = [];
        this.loadRoles(true);
      },
      error: (error) => {
        console.error('Error deleting role', error);
        alert('No se pudo eliminar el rol.');
      }
    });

    this.subscriptions.add(sub);
  }

  createRoleFromPanel(): void {
    this.selectedRole = null;
    this.roleForm.reset({ name: '', description: '' });
  }

  getDisplayName(user: AdminUser): string {
    if (user.displayName) {
      return user.displayName;
    }

    if (user.worker?.firstName || user.worker?.lastName) {
      return `${user.worker?.firstName ?? ''} ${user.worker?.lastName ?? ''}`.trim();
    }

    if (user.client?.companyName) {
      return user.client.companyName;
    }

    return user.username;
  }

  getSecondaryLabel(user: AdminUser): string {
    if (this.getUserType(user) === 'WORKER') {
      return user.worker?.documentNumber || user.worker?.email || 'Sin documento';
    }

    return user.client?.taxId || user.client?.email || 'Sin identificador';
  }

  getUserType(user: AdminUser): UserTypeKey | 'UNKNOWN' {
    const roleName = (user.roles ?? []).map((role) => (role.name ?? '').toUpperCase());
    if (roleName.includes('ADMIN')) {
      return 'ADMIN';
    }

    const value = (user.userTypeName || '').toUpperCase();
    if (value.includes('WORK')) {
      return 'WORKER';
    }
    if (value.includes('CLIENT')) {
      return 'CLIENT';
    }
    if (user.workerId) {
      return 'WORKER';
    }
    if (user.clientId) {
      return 'CLIENT';
    }
    return 'UNKNOWN';
  }

  userTypeBadgeClass(user: AdminUser): string {
    return this.getUserType(user) === 'WORKER' ? 'badge-worker' : 'badge-client';
  }

  statusBadgeClass(active: boolean): string {
    return active ? 'badge-active' : 'badge-inactive';
  }

  trackByUser(_: number, item: AdminUser): number {
    return item.userId;
  }

  trackByRole(_: number, item: AdminRole): number {
    return item.roleId;
  }

  private bindUserTypeState(): void {
    const sub = this.userForm.get('roleId')?.valueChanges.subscribe(() => {
      this.applySelectedRoleState();
    });

    if (sub) {
      this.subscriptions.add(sub);
    }

    this.applySelectedRoleState();
  }

  private applySelectedRoleState(): void {
    const selectedRoleName = this.getSelectedRoleName();
    const type = this.resolveUserTypeFromRoleName(selectedRoleName);
    this.userForm.get('userType')?.setValue(type, { emitEvent: false });
    const workerGroup = this.userForm.get('worker') as FormGroup;
    const clientGroup = this.userForm.get('client') as FormGroup;

    if (type === 'WORKER' || type === 'ADMIN') {
      workerGroup.enable({ emitEvent: false });
      clientGroup.disable({ emitEvent: false });
    } else {
      clientGroup.enable({ emitEvent: false });
      workerGroup.disable({ emitEvent: false });
    }
  }

  private buildUserForm(): FormGroup {
    return this.fb.group({
      roleId: [null, Validators.required], 
      userType: ['WORKER', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
      active: [true],
      worker: this.fb.group({
        workerId: [null],
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        address: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(255)]],
        ubigeoId: [null],
        documentType: ['DNI', [Validators.required]],
        documentNumber: ['', [Validators.required, Validators.pattern(/^\d{8,20}$/)]],
        hireDate: [null],
        status: ['ACTIVE'],
        createdAt: [null],
        updatedAt: [null]
      }),
      client: this.fb.group({
        clientId: [null],
        companyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        taxId: ['', [Validators.required, Validators.pattern(/^\d{8,20}$/)]],
        country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        address: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(255)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        creditLimit: [0, [Validators.required, Validators.min(0)]],
        active: [true],
        createdAt: [null],
        updatedAt: [null],
        deletedAt: [null],
        restoredAt: [null]
      })
    });
  }

  private buildRoleForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  private getDefaultUserFormValue() {
    return {
      userType: 'WORKER',
      roleId: null,
      username: '',
      password: '',
      active: true,
      worker: this.getDefaultWorkerValue(),
      client: this.getDefaultClientValue()
    };
  }

  private getDefaultWorkerValue(): AdminWorkerForm {
    return {
      workerId: null,
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      ubigeoId: null,
      documentType: 'DNI',
      documentNumber: '',
      hireDate: null,
      status: 'ACTIVE',
      createdAt: null,
      updatedAt: null
    };
  }

  private getDefaultClientValue(): AdminClientForm {
    return {
      clientId: null,
      companyName: '',
      taxId: '',
      country: '',
      address: '',
      email: '',
      creditLimit: 0,
      active: true,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      restoredAt: null
    };
  }

  private resolveUserTypeFromRoleName(roleName: string): UserTypeKey {
    const normalizedRoleName = (roleName || '').toUpperCase();

    if (normalizedRoleName.includes('ADMIN')) {
      return 'ADMIN';
    }

    if (normalizedRoleName.includes('CLIENT')) {
      return 'CLIENT';
    }

    return 'WORKER';
  }

  private getWorkerFormValue(worker?: AdminUser['worker']): AdminWorkerForm {
    return {
      ...this.getDefaultWorkerValue(),
      ...(worker ?? {})
    };
  }

  private getClientFormValue(client?: AdminUser['client']): AdminClientForm {
    return {
      ...this.getDefaultClientValue(),
      ...(client ?? {})
    };
  }

  private cleanWorkerValue(worker: AdminWorkerForm): AdminWorkerForm {
    return {
      ...worker,
      creditLimit: undefined
    } as unknown as AdminWorkerForm;
  }

  private cleanClientValue(client: AdminClientForm): AdminClientForm {
    return {
      ...client
    };
  }

  getControlError(formGroup: FormGroup, controlPath: string, label: string): string {
    const control = formGroup.get(controlPath);
    if (!control?.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${label} es obligatorio.`;
    }
    if (control.errors['minlength']) {
      return `${label} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    if (control.errors['maxlength']) {
      return `${label} no puede superar ${control.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (control.errors['email']) {
      return `${label} debe tener un correo válido.`;
    }
    if (control.errors['pattern']) {
      if (controlPath === 'worker.phone') {
        return 'El teléfono debe tener exactamente 9 dígitos numéricos.';
      }
      if (controlPath === 'worker.documentNumber') {
        return 'El DNI/documento debe contener solo números entre 8 y 20 dígitos.';
      }
      if (controlPath === 'client.taxId') {
        return 'El RUC/TAX ID debe contener solo números entre 8 y 20 dígitos.';
      }
      return `${label} tiene un formato inválido.`;
    }
    if (control.errors['min']) {
      return `${label} debe ser mayor o igual a 0.`;
    }

    return `${label} es inválido.`;
  }

  getSelectedRoleName(): string {
    const roleId = Number(this.userForm.get('roleId')?.value);
    const role = this.roles.find(r => r.roleId === roleId);
    return role ? role.name.toUpperCase() : '';
  }

  private getHttpErrorMessage(error: any, fallback: string): string {
    return (
      error?.error?.error ||
      error?.error?.causa ||
      error?.error?.mensaje ||
      error?.message ||
      fallback
    );
  }
}