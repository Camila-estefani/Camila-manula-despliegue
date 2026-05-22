import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() isEditing = false;
  @Output() saved = new EventEmitter<Product>();
  @Output() closed = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  error: string | null = null;
  categories: Category[] = [];
  loadingCategories = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.product) {
      this.form.patchValue(this.product);
    }
  }

  private loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.error = 'Error al cargar las categorías';
        this.loadingCategories = false;
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      variety: ['', [Validators.maxLength(100)]],
      caliber: ['', [Validators.maxLength(50)]],
      unitMeasure: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]],
      boxWeightKg: [0, [Validators.required, Validators.min(0)]],
      isOwnProduction: [false],
      isActive: [true]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.form.value;

    if (this.isEditing && this.product?.productId) {
      this.productService.updateProduct(this.product.productId, formValue).subscribe({
        next: (updated) => {
          this.saved.emit(updated);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al actualizar producto';
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      this.productService.createProduct(formValue).subscribe({
        next: (created) => {
          this.saved.emit(created);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al crear producto';
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.closed.emit();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control?.touched) {
      return '';
    }
    const labels: Record<string, string> = {
      categoryId: 'La categoría',
      name: 'El nombre',
      variety: 'La variedad',
      caliber: 'El calibre',
      unitMeasure: 'La unidad de medida',
      boxWeightKg: 'El peso de caja'
    };
    if (control.errors['required']) {
      return `${labels[fieldName] ?? fieldName} es requerido`;
    }
    if (control.errors['minlength']) {
      return `${labels[fieldName] ?? fieldName} debe tener mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `${labels[fieldName] ?? fieldName} debe tener como máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['min']) {
      return `${labels[fieldName] ?? fieldName} debe ser mayor o igual a 0`;
    }
    return 'Campo inválido';
  }
}
