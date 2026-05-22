import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { Customer } from '../../core/models/customer.model';

interface MenuItem {
  label: string;
  route: string;
  shortLabel: string;
}

@Component({
  selector: 'app-client-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-customers.html',
  styleUrl: './client-customers.css'
})
export class ClientCustomersComponent implements OnInit {
  sidebarOpen = true;
  activeRoute = 'clientes';

  menuItems: MenuItem[] = [
    { label: 'Mis Pedidos', route: '/customer/pedidos', shortLabel: 'PE' },
    { label: 'Clientes', route: '/customer/clientes', shortLabel: 'CL' },
    { label: 'Mi Perfil', route: '/customer/perfil', shortLabel: 'PR' }
  ];

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private readonly customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveRoute(route: string): void {
    this.activeRoute = route;
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers ?? [];
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.errorMessage = 'No se pudieron cargar los clientes.';
        this.loading = false;
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredCustomers = [...this.customers];
      return;
    }

    this.filteredCustomers = this.customers.filter((customer) => {
      const company = customer.companyName?.toLowerCase() ?? '';
      const email = customer.email?.toLowerCase() ?? '';
      const taxId = customer.taxId?.toLowerCase() ?? '';
      const country = customer.country?.toLowerCase() ?? '';

      return company.includes(term) || email.includes(term) || taxId.includes(term) || country.includes(term);
    });
  }
}
