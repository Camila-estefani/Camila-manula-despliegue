import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Provider } from '../../../core/models/provider.model';
import { ProviderService } from '../../../core/services/provider.service';
import { ProviderFormComponent } from '../provider-form/provider-form.component';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProviderFormComponent],
  templateUrl: './provider-list.component.html',
  styleUrls: ['./provider-list.component.css']
})
export class ProviderListComponent implements OnInit {
  providers: Provider[] = [];
  filteredProviders: Provider[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedProvider: Provider | null = null;
  showForm = false;
  isEditing = false;
  private routerSubscription?: Subscription;

  constructor(
    private readonly providerService: ProviderService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProviders();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadProviders();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadProviders(): void {
    this.loading = true;
    this.error = null;
    this.providerService.getAllProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.filteredProviders = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar proveedores';
        console.error(err);
        this.loading = false;
      }
    });
  }

  search(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.filteredProviders = this.providers.filter(p =>
      p.companyName.toLowerCase().includes(this.searchTerm)
    );
  }

  onNew(): void {
    this.selectedProvider = null;
    this.isEditing = false;
    this.showForm = true;
  }

  onEdit(provider: Provider): void {
    this.selectedProvider = { ...provider };
    this.isEditing = true;
    this.showForm = true;
  }

  onDelete(provider: Provider): void {
    if (confirm(`¿Está seguro de que desea eliminar ${provider.companyName}?`)) {
      if (provider.providerId) {
        this.loading = true;
        this.providerService.deleteProvider(provider.providerId).subscribe({
          next: () => {
            console.log('Proveedor eliminado exitosamente');
            this.error = null;
            this.loadProviders();
          },
          error: (err) => {
            this.error = 'Error al eliminar proveedor: ' + (err?.message || 'Error desconocido');
            console.error('Error al eliminar:', err);
            this.loading = false;
          }
        });
      }
    }
  }

  onRestore(provider: Provider): void {
    if (provider.providerId) {
      this.providerService.restoreProvider(provider.providerId).subscribe({
        next: () => {
          this.loadProviders();
        },
        error: (err) => {
          this.error = 'Error al restaurar proveedor';
          console.error(err);
        }
      });
    }
  }

  onFormSaved(provider: Provider): void {
    this.showForm = false;
    this.loadProviders();
  }

  onFormClosed(): void {
    this.showForm = false;
    this.selectedProvider = null;
    this.loadProviders();
  }
}
