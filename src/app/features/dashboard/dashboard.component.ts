import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Customer } from '../../core/models/customer.model';
import { Product } from '../../core/models/product.model';
import { Order } from '../../core/models/order.model';
import { Provider } from '../../core/models/provider.model';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { ProviderService } from '../../core/services/provider.service';

interface ManagementMetric {
  label: string;
  value: number;
  note: string;
  route: string;
  icon: string;
  accentClass: string;
}

interface QuickLink {
  label: string;
  description: string;
  route: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  readonly dashboardDate = new Date();
  readonly quickLinks: QuickLink[] = [
    {
      label: 'Clientes',
      description: 'Gestionar registros, crédito y estado activo.',
      route: '/panel/customers',
      icon: 'ion-person-stalker',
      tone: 'tone-customers'
    },
    {
      label: 'Productos',
      description: 'Revisar catálogo, categoría y producción propia.',
      route: '/panel/products',
      icon: 'ion-leaf',
      tone: 'tone-products'
    },
    {
      label: 'Proveedores',
      description: 'Administrar proveedores y su tipo de producto.',
      route: '/panel/providers',
      icon: 'ion-briefcase',
      tone: 'tone-providers'
    }
  ];

  quickForm: FormGroup;

  totalCustomers = 0;
  activeCustomers = 0;
  totalProducts = 0;
  activeProducts = 0;
  totalProviders = 0;
  activeProviders = 0;
  totalOrders = 0;
  pendingOrders = 0;
  loading = true;
  errorMessage = '';

  recentCustomers: Customer[] = [];
  recentProducts: Product[] = [];
  recentProviders: Provider[] = [];
  recentOrders: Order[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly customerService: CustomerService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly providerService: ProviderService
  ) {
    this.quickForm = this.fb.group({
      searchTerm: ['', [Validators.required, Validators.minLength(3)]],
      area: ['customers', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      customers: this.customerService.getAllCustomers().pipe(catchError(() => of([] as Customer[]))),
      products: this.productService.getAllProducts().pipe(catchError(() => of([] as Product[]))),
      providers: this.providerService.getAllProviders().pipe(catchError(() => of([] as Provider[]))),
      orders: this.orderService.getAllOrders().pipe(catchError(() => of([] as Order[])))
    }).subscribe({
      next: ({ customers, products, providers, orders }) => {
        this.recentCustomers = [...customers].slice(0, 4);
        this.recentProducts = [...products].slice(0, 4);
        this.recentProviders = [...providers].slice(0, 4);
        this.recentOrders = [...orders].slice(0, 4);

        this.totalCustomers = customers.length;
        this.activeCustomers = customers.filter((customer) => customer.isActive !== false).length;
        this.totalProducts = products.length;
        this.activeProducts = products.filter((product) => product.isActive !== false).length;
        this.totalProviders = providers.length;
        this.activeProviders = providers.filter((provider) => provider.isActive !== false).length;
        this.totalOrders = orders.length;
        this.pendingOrders = orders.filter((order) => (order.status ?? '').toUpperCase() === 'PENDING').length;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las estadísticas del panel.';
        this.loading = false;
      }
    });
  }

  get metrics(): ManagementMetric[] {
    return [
      {
        label: 'Clientes activos',
        value: this.activeCustomers,
        note: `${this.totalCustomers} registrados en total`,
        route: '/panel/customers',
        icon: 'ion-person-stalker',
        accentClass: 'accent-customers'
      },
      {
        label: 'Productos activos',
        value: this.activeProducts,
        note: `${this.totalProducts} productos en catálogo`,
        route: '/panel/products',
        icon: 'ion-leaf',
        accentClass: 'accent-products'
      },
      {
        label: 'Proveedores activos',
        value: this.activeProviders,
        note: `${this.totalProviders} proveedores registrados`,
        route: '/panel/providers',
        icon: 'ion-briefcase',
        accentClass: 'accent-providers'
      },
      {
        label: 'Órdenes pendientes',
        value: this.pendingOrders,
        note: `${this.totalOrders} órdenes en total`,
        route: '/panel/customers',
        icon: 'ion-clipboard',
        accentClass: 'accent-orders'
      }
    ];
  }

  submitQuickSearch(): void {
    if (this.quickForm.invalid) {
      this.quickForm.markAllAsTouched();
      return;
    }

    const area = this.quickForm.value.area ?? 'customers';
    const searchTerm = this.quickForm.value.searchTerm?.trim() ?? '';
    let route = '/panel/customers';

    if (area === 'products') {
      route = '/panel/products';
    } else if (area === 'providers') {
      route = '/panel/providers';
    }

    this.router.navigate([route], { queryParams: { search: searchTerm } });
  }

  get searchTermControl() {
    return this.quickForm.get('searchTerm');
  }

  get areaControl() {
    return this.quickForm.get('area');
  }

  formatCount(value: number): string {
    return value.toLocaleString('es-PE');
  }
}
