import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/pages/dashboard.component';
import { AdminDashboardComponent } from './features/admin/pages/admin-dashboard.component';
import { AdminLayoutComponent } from './core/layouts/admin-layout.component';
import { AdminUsersComponent } from './features/admin/pages/admin-users.component';
import { AdminProductListComponent } from './features/admin/pages/admin-product-list.component';
import { AdminOrderListComponent } from './features/admin/pages/admin-order-list.component';
import { AdminProviderListComponent } from './features/admin/pages/admin-provider-list.component';
import { AdminClientRequestListComponent } from './features/admin/pages/admin-client-request-list.component';
import { AdminSettingsComponent } from './features/admin/pages/admin-settings.component';
import { MainLayoutComponent } from './core/layouts/main-layout.component';
import { CustomerListComponent } from './features/customers/pages/customer-list.component';
import { ProductListComponent } from './features/products/pages/product-list.component';
import { ProviderListComponent } from './features/providers/pages/provider-list.component';
import { WorkerProfileComponent } from './features/panel/pages/worker-profile.component';
import { OrderReceptionComponent } from './features/panel/pages/order-reception.component';

import { ClientLayoutComponent } from './features/customer/components/client-layout.component';
import { ClientOrdersComponent } from './features/customer/pages/client-orders.component';
import { ClientProfileComponent } from './features/customer/pages/client-profile.component';
import { ClientCustomersComponent } from './features/customer/pages/client-customers.component';

import { LandingComponent } from './features/landing/pages/landing.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'panel',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE'] },
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'customers', component: CustomerListComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'providers', component: ProviderListComponent },
      { path: 'perfil', component: WorkerProfileComponent },
      { path: 'orders-reception', component: OrderReceptionComponent },
      { path: 'client-requests', component: AdminClientRequestListComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'products', component: AdminProductListComponent },
      { path: 'orders', component: AdminOrderListComponent },
      { path: 'providers', component: AdminProviderListComponent },
      { path: 'client-requests', component: AdminClientRequestListComponent },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  },
  {
    path: 'customer',
    component: ClientLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['CLIENT'] },
    children: [
      { path: 'pedidos', component: ClientOrdersComponent },
      { path: 'clientes', component: ClientCustomersComponent },
      { path: 'perfil', component: ClientProfileComponent },
      { path: '', redirectTo: 'pedidos', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];