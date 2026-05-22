import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductFormComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedProduct: Product | null = null;
  showForm = false;
  isEditing = false;
  private routerSubscription?: Subscription;

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar productos';
        console.error(err);
        this.loading = false;
      }
    });
  }

  search(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(this.searchTerm)
    );
  }

  onNew(): void {
    this.selectedProduct = null;
    this.isEditing = false;
    this.showForm = true;
  }

  onEdit(product: Product): void {
    this.selectedProduct = { ...product };
    this.isEditing = true;
    this.showForm = true;
  }

  onDelete(product: Product): void {
    if (confirm(`¿Está seguro de que desea eliminar ${product.name}?`)) {
      if (product.productId) {
        this.productService.deleteProduct(product.productId).subscribe({
          next: () => {
            this.loadProducts();
          },
          error: (err) => {
            this.error = 'Error al eliminar producto';
            console.error(err);
          }
        });
      }
    }
  }

  onRestore(product: Product): void {
    if (product.productId) {
      this.productService.restoreProduct(product.productId).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          this.error = 'Error al restaurar producto';
          console.error(err);
        }
      });
    }
  }

  onFormSaved(product: Product): void {
    this.showForm = false;
    this.loadProducts();
  }

  onFormClosed(): void {
    this.showForm = false;
    this.selectedProduct = null;
    this.loadProducts();
  }
}
