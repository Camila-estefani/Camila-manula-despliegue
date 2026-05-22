import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-profile.component.html',
  styleUrls: ['./worker-profile.component.css']
})
export class WorkerProfileComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get user(): AuthUser | null {
    return this.authService.currentUserValue;
  }

  get fullName(): string {
    return this.authService.getDisplayName(this.user);
  }

  get email(): string {
    return this.user?.username ?? 'No registrado';
  }

  get role(): string {
    const candidate = this.user?.userTypeName || this.user?.roles?.[0]?.name || 'Empleado';
    return candidate === 'WORKER' ? 'Empleado' : candidate;
  }

  get status(): string {
    return this.user?.active === false ? 'Inactivo' : 'Activo';
  }

  get phone(): string {
    return this.user?.client?.phone?.trim() || 'No registrado';
  }

  get createdAt(): string {
    if (!this.user?.createdAt) {
      return 'No registrado';
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(this.user.createdAt));
  }

  goBack(): void {
    this.router.navigateByUrl('/panel/dashboard');
  }
}