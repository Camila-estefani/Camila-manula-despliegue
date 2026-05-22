import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  userMenu = false;
  readonly today = new Date();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  toggleUserMenu(): void {
    this.userMenu = !this.userMenu;
  }

  goToProfile(): void {
    this.userMenu = false;
    this.router.navigateByUrl('/panel/perfil');
  }

  logout(): void {
    this.userMenu = false;
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  get displayName(): string {
    return this.authService.getDisplayName(this.currentUser);
  }

  get roleLabel(): string {
    const role = this.currentUser?.userTypeName || this.currentUser?.roles?.[0]?.name || 'Empleado';
    return role === 'WORKER' ? 'Empleado' : role;
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }
}
