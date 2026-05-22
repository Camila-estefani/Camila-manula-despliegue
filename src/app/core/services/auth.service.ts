import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/v1/api/auth`;
  private readonly storageKey = 'visons-auth-user';
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/login`, request).pipe(
      tap((user) => this.setSession(user))
    );
  }

  getCurrentSessionUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => this.setSession(user))
    );
  }

  logout(): void {
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  updateCurrentUser(user: AuthUser): void {
    this.setSession(user);
  }

  clearSession(): void {
    this.currentUserSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  getLandingRoute(user?: AuthUser | null): string {
    const role = this.resolveRoleName(user ?? this.currentUserValue);

    if (role === 'CLIENT') {
      return '/customer/pedidos';
    }

    if (role === 'ADMIN') {
      return '/admin';
    }

    if (role === 'EMPLOYEE') {
      return '/panel/dashboard';
    }

    return '/login';
  }

  isAllowedFor(user: AuthUser | null, allowedRoles: readonly string[]): boolean {
    if (!user || allowedRoles.length === 0) {
      return true;
    }

    const currentRole = this.resolveRoleName(user);
    return allowedRoles.some((role) => this.normalizeRole(role) === currentRole);
  }

  getDisplayName(user?: AuthUser | null): string {
    const currentUser = user ?? this.currentUserValue;
    if (!currentUser) {
      return 'Invitado';
    }

    return currentUser.displayName || currentUser.client?.companyName || currentUser.username;
  }

  private setSession(user: AuthUser): void {
    this.currentUserSubject.next(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private readStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const storedUser = localStorage.getItem(this.storageKey);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private resolveRoleName(user?: AuthUser | null): string {
    if (!user) {
      return '';
    }

    const roles = (user.roles ?? []).map((role) => this.normalizeRole(role.name));
    if (roles.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (roles.includes('EMPLOYEE')) {
      return 'EMPLOYEE';
    }
    if (roles.includes('CLIENT')) {
      return 'CLIENT';
    }

    const candidate = user.userTypeName || '';
    return this.normalizeRole(candidate);
  }

  private normalizeRole(role: string): string {
    const normalized = role.trim().toUpperCase();
    return normalized === 'WORKER' ? 'EMPLOYEE' : normalized;
  }
}