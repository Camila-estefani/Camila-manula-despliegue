import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerFormComponent],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedCustomer: Customer | null = null;
  showForm = false;
  isEditing = false;
  private routerSubscription?: Subscription;

  constructor(
    private readonly customerService: CustomerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadCustomers();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;
    this.customerService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar clientes';
        console.error(err);
        this.loading = false;
      }
    });
  }

  search(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      (c.companyName ?? '').toLowerCase().includes(this.searchTerm) ||
      (c.email ?? '').toLowerCase().includes(this.searchTerm) ||
      (c.taxId ?? '').toLowerCase().includes(this.searchTerm) ||
      (c.country ?? '').toLowerCase().includes(this.searchTerm)
    );
  }

  onNew(): void {
    this.selectedCustomer = null;
    this.isEditing = false;
    this.showForm = true;
  }

  onEdit(customer: Customer): void {
    this.selectedCustomer = { ...customer };
    this.isEditing = true;
    this.showForm = true;
  }

  onDelete(customer: Customer): void {
    if (confirm(`¿Está seguro de que desea eliminar a ${customer.companyName}?`)) {
      if (customer.clientId) {
        this.customerService.deleteCustomer(customer.clientId).subscribe({
          next: () => {
            this.loadCustomers();
          },
          error: (err) => {
            this.error = 'Error al eliminar cliente';
            console.error(err);
          }
        });
      }
    }
  }

  onRestore(customer: Customer): void {
    if (customer.clientId) {
      this.customerService.restoreCustomer(customer.clientId).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (err) => {
          this.error = 'Error al restaurar cliente';
          console.error(err);
        }
      });
    }
  }

  onFormSaved(customer: Customer): void {
    this.showForm = false;
    this.loadCustomers();
  }

  onFormClosed(): void {
    this.showForm = false;
    this.selectedCustomer = null;
    this.loadCustomers();
  }
}
