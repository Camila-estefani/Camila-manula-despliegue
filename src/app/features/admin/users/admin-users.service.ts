import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminRole,
  AdminRoleRequest,
  AdminUser,
  AdminUserRequest,
  AssignRoleRequest
} from './admin-users.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly usersUrl = `${environment.apiUrl}/v1/api/users`;
  private readonly rolesUrl = `${environment.apiUrl}/roles`;

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.usersUrl);
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.usersUrl}/${id}`);
  }

  createUser(request: AdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.usersUrl, request);
  }

  updateUser(id: number, request: AdminUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.usersUrl}/${id}`, request);
  }

  toggleStatus(id: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.usersUrl}/${id}/status`, {});
  }

  assignRole(userId: number, roleId: number): Observable<AdminUser> {
    const request: AssignRoleRequest = { roleId };
    return this.http.post<AdminUser>(`${this.usersUrl}/${userId}/roles`, request);
  }

  getUserRoles(userId: number): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.usersUrl}/${userId}/roles`);
  }

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(this.rolesUrl);
  }

  getRoleUsers(roleId: number): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.rolesUrl}/${roleId}/users`);
  }

  createRole(request: AdminRoleRequest): Observable<AdminRole> {
    return this.http.post<AdminRole>(this.rolesUrl, request);
  }

  updateRole(id: number, request: AdminRoleRequest): Observable<AdminRole> {
    return this.http.put<AdminRole>(`${this.rolesUrl}/${id}`, request);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rolesUrl}/${id}`);
  }
}