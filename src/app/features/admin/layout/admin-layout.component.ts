import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  route: string;
  shortLabel: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  sidebarOpen = true;
  activeRoute = '/admin';

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/admin', shortLabel: 'DB' },
    { label: 'Usuarios', route: '/admin/users', shortLabel: 'US' },
    { label: 'Productos', route: '/admin/products', shortLabel: 'PR' },
    { label: 'Pedidos', route: '/admin/orders', shortLabel: 'PE' },
    { label: 'Proveedores', route: '/admin/providers', shortLabel: 'PV' },
    { label: 'Solicitudes', route: '/admin/client-requests', shortLabel: 'SC' },
    { label: 'Configuración', route: '/admin/settings', shortLabel: 'CF' }
  ];

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveRoute(route: string) {
    this.activeRoute = route;
  }
}
