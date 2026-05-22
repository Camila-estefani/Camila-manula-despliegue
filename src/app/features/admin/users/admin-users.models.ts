export interface AdminWorkerForm {
  workerId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  ubigeoId?: number | null;
  documentType?: string | null;
  documentNumber?: string | null;
  hireDate?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminClientForm {
  clientId?: number | null;
  companyName?: string | null;
  taxId?: string | null;
  country?: string | null;
  address?: string | null;
  email?: string | null;
  creditLimit?: number | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

export interface AdminRole {
  roleId: number;
  name: string;
  description?: string | null;
  userCount?: number | null;
}

export interface AdminUser {
  userId: number;
  userTypeId: number;
  userTypeName?: string | null;
  username: string;
  active: boolean;
  lastLogin?: string | null;
  createdAt?: string | null;
  workerId?: number | null;
  clientId?: number | null;
  displayName?: string | null;
  worker?: AdminWorkerForm | null;
  client?: AdminClientForm | null;
  roles?: AdminRole[] | null;
}

export interface AdminUserRequest {
  userType: 'ADMIN' | 'WORKER' | 'CLIENT';
  roleId: number;
  username: string;
  password?: string | null;
  active: boolean;
  worker?: AdminWorkerForm | null;
  client?: AdminClientForm | null;
}

export interface AdminRoleRequest {
  name: string;
  description?: string | null;
}

export interface AssignRoleRequest {
  roleId: number;
}
