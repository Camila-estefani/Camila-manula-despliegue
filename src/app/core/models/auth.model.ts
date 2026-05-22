import { ClientProfileData } from './client-profile.model';

export interface AuthRole {
  roleId?: number;
  name: string;
  description?: string | null;
  userCount?: number;
}

export interface AuthUser {
  userId?: number;
  userTypeId?: number;
  userTypeName?: string | null;
  username: string;
  active?: boolean;
  lastLogin?: string | null;
  createdAt?: string | null;
  workerId?: number | null;
  clientId?: number | null;
  displayName?: string | null;
  client?: ClientProfileData | null;
  roles?: AuthRole[];
}

export interface LoginRequest {
  username: string;
  password: string;
}