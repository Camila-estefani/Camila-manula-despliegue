import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

type OrderStatusKey = 'Pendiente' | 'Procesado' | 'Entregado';
type OrderStatusFilter = 'ALL' | OrderStatusKey;

interface ClientOption {
  clientId: number;
  companyName: string;
}

interface OrderDetailItem {
  productName: string;
  quantityKg: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderItem {
  orderId: number;
  clientId: number;
  clientName: string;
  orderCode: string;
  orderDate: string;
  incoterm: string;
  status: OrderStatusKey;
  createdAt: string;
  updatedAt: string;
  orderDetails: OrderDetailItem[];
}

interface OrderFormValue {
  clientId: number | string;
  orderCode: string;
  orderDate: string;
  incoterm: string;
  status: OrderStatusKey;
}

interface StatusSummaryItem {
  key: OrderStatusKey;
  label: string;
  total: number;
}

interface ChartBarItem {
  label: string;
  value: number;
}

interface TopProductItem {
  name: string;
  totalKg: number;
  category: string;
}

interface MonthlySalesItem {
  month: string;
  totalOrders: number;
  totalKg: number;
}

interface CategoryDistributionItem {
  category: string;
  percentage: number;
  totalKg: number;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

@Component({
  selector: 'app-admin-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-order-list.component.html',
  styleUrls: ['./admin-order-list.component.css']
})
export class AdminOrderListComponent implements OnInit {
  orders: OrderItem[] = [];
  filteredOrders: OrderItem[] = [];
  clients: ClientOption[] = [];
  selectedOrder: OrderItem | null = null;
  topProducts: TopProductItem[] = [];
  salesByMonth: MonthlySalesItem[] = [];
  categoryDistribution: CategoryDistributionItem[] = [];
  orderForm!: FormGroup;
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  modalTitle = 'Nuevo Pedido';
  searchTerm = '';
  clientFilter: 'ALL' | number = 'ALL';
  statusFilter: OrderStatusFilter = 'ALL';
  private readonly ordersApiUrl = `${environment.apiUrl}/api/orders`;
  private readonly customersApiUrl = `${environment.apiUrl}/v1/api/customer/`;

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadOrders();
  }

  private initForm(): void {
    this.orderForm = this.fb.group({
      clientId: ['', Validators.required],
      orderCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      orderDate: ['', Validators.required],
      incoterm: ['', [Validators.required, Validators.pattern(/^(EXW|FOB|CIF)$/)]],
      status: ['', Validators.required]
    });
  }

  private loadClients(): void {
    this.http.get<any[]>(this.customersApiUrl).subscribe({
      next: (customers) => {
        this.clients = (customers ?? [])
          .filter((customer) => customer.isActive)
          .map((customer) => ({
            clientId: customer.clientId,
            companyName: customer.companyName
          }));
      },
      error: (error) => {
        console.error('Error loading customers', error);
        this.clients = [];
      }
    });
  }

  loadOrders(): void {
    this.http.get<any[]>(this.ordersApiUrl).subscribe({
      next: (ordersFromApi) => {
        this.orders = ordersFromApi.map((order) => ({
          orderId: order.orderId,
          clientId: order.clientId,
          clientName: order.clientName,
          orderCode: order.orderCode,
          orderDate: order.orderDate,
          incoterm: order.incoterm,
          status: order.status,
          createdAt: '',
          updatedAt: '',
          orderDetails: []
        }));
        this.filteredOrders = [...this.orders];
        this.buildAnalytics();
      },
      error: (error) => {
        console.error('Error cargando pedidos reales:', error);
        alert('No se pudieron cargar los pedidos reales. Verifica que el backend esté activo.');
        this.orders = [];
        this.filteredOrders = [];
      }
    });
  }

  private buildAnalytics(): void {
    const productTotals = new Map<string, { totalKg: number; category: string }>();
    const monthTotals = new Map<string, { totalOrders: number; totalKg: number }>();
    const categoryTotals = new Map<string, number>();

    this.orders.forEach((order) => {
      const monthIndex = new Date(order.orderDate).getMonth();
      const monthLabel = MONTH_LABELS[monthIndex] ?? 'Otro';
      const orderKg = order.orderDetails.reduce((sum, item) => sum + item.quantityKg, 0);

      const currentMonth = monthTotals.get(monthLabel) ?? { totalOrders: 0, totalKg: 0 };
      monthTotals.set(monthLabel, {
        totalOrders: currentMonth.totalOrders + 1,
        totalKg: currentMonth.totalKg + orderKg
      });

      const categoryName = this.getCategoryFromOrder(order);
      categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + orderKg);

      order.orderDetails.forEach((detail) => {
        const currentProduct = productTotals.get(detail.productName) ?? { totalKg: 0, category: this.getCategoryFromOrder(order) };
        productTotals.set(detail.productName, {
          totalKg: currentProduct.totalKg + detail.quantityKg,
          category: currentProduct.category
        });
      });
    });

    this.topProducts = [...productTotals.entries()]
      .map(([name, value]) => ({ name, totalKg: value.totalKg, category: value.category }))
      .sort((left, right) => right.totalKg - left.totalKg)
      .slice(0, 5);

    this.salesByMonth = MONTH_LABELS.map((month) => ({
      month,
      totalOrders: monthTotals.get(month)?.totalOrders ?? 0,
      totalKg: monthTotals.get(month)?.totalKg ?? 0
    }));

    const totalCategoryKg = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0) || 1;
    this.categoryDistribution = [...categoryTotals.entries()]
      .map(([category, totalKg]) => ({
        category,
        totalKg,
        percentage: Math.round((totalKg / totalCategoryKg) * 100)
      }))
      .sort((left, right) => right.totalKg - left.totalKg);
  }

  filterOrders(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredOrders = this.orders.filter((order) => {
      const matchesSearch =
        !term ||
        order.orderCode.toLowerCase().includes(term) ||
        order.clientName.toLowerCase().includes(term) ||
        order.incoterm.toLowerCase().includes(term);

      const matchesClient = this.clientFilter === 'ALL' || order.clientId === this.clientFilter;
      const matchesStatus = this.statusFilter === 'ALL' || order.status === this.statusFilter;

      return matchesSearch && matchesClient && matchesStatus;
    });
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.filterOrders();
  }

  onClientFilterChange(value: string): void {
    this.clientFilter = value === 'ALL' ? 'ALL' : Number(value);
    this.filterOrders();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value as OrderStatusFilter;
    this.filterOrders();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.clientFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.filteredOrders = [...this.orders];
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get pendingOrders(): number {
    return this.orders.filter((order) => order.status === 'Pendiente').length;
  }

  get processedOrders(): number {
    return this.orders.filter((order) => order.status === 'Procesado').length;
  }

  get deliveredOrders(): number {
    return this.orders.filter((order) => order.status === 'Entregado').length;
  }

  get monthlyChart(): ChartBarItem[] {
    const counts = [0, 0, 0, 0, 0, 0];
    this.orders.forEach((order) => {
      const month = new Date(order.orderDate).getMonth();
      if (month >= 0 && month < counts.length) {
        counts[month] += 1;
      }
    });

    return MONTH_LABELS.map((label, index) => ({ label, value: counts[index] }));
  }

  get statusChart(): ChartBarItem[] {
    return [
      { label: 'Pendiente', value: this.pendingOrders },
      { label: 'Procesado', value: this.processedOrders },
      { label: 'Entregado', value: this.deliveredOrders }
    ];
  }

  get statusSummaries(): StatusSummaryItem[] {
    return [
      { key: 'Pendiente', label: 'Pendientes', total: this.pendingOrders },
      { key: 'Procesado', label: 'Procesados', total: this.processedOrders },
      { key: 'Entregado', label: 'Entregados', total: this.deliveredOrders }
    ];
  }

  get maxTopProductKg(): number {
    return Math.max(...this.topProducts.map((item) => item.totalKg), 1);
  }

  get maxMonthlySalesKg(): number {
    return Math.max(...this.salesByMonth.map((item) => item.totalKg), 1);
  }

  get maxCategoryDistributionKg(): number {
    return Math.max(...this.categoryDistribution.map((item) => item.totalKg), 1);
  }

  openForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.modalTitle = 'Nuevo Pedido';
    this.orderForm.reset({
      clientId: '',
      orderCode: '',
      orderDate: '',
      incoterm: '',
      status: 'Pendiente'
    });
    this.isModalOpen = true;
  }

  closeForm(): void {
    this.isModalOpen = false;
    this.orderForm.markAsPristine();
    this.orderForm.markAsUntouched();
  }

  openDetail(order: OrderItem): void {
    this.selectedOrder = order;
  }

  closeDetail(): void {
    this.selectedOrder = null;
  }

  editOrder(order: OrderItem): void {
    this.isEditing = true;
    this.editingId = order.orderId;
    this.modalTitle = 'Editar Pedido';
    this.orderForm.patchValue({
      ...order,
      clientId: String(order.clientId)
    });
    this.isModalOpen = true;
  }

  saveOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const formValue = this.orderForm.getRawValue() as OrderFormValue;
    const now = new Date().toISOString();

    if (this.isEditing && this.editingId !== null) {
      this.http.patch<any>(`${this.ordersApiUrl}/update/${this.editingId}`, formValue).subscribe({
        next: (updatedOrder) => {
          this.orders = this.orders.map((order) => {
            if (order.orderId !== this.editingId) {
              return order;
            }

            return {
              ...order,
              clientId: updatedOrder.clientId,
              clientName: updatedOrder.clientName,
              orderCode: updatedOrder.orderCode,
              orderDate: updatedOrder.orderDate,
              incoterm: updatedOrder.incoterm,
              status: updatedOrder.status,
              updatedAt: now
            };
          });

          this.filterOrders();
          this.buildAnalytics();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error actualizando pedido en backend:', error);
          alert('No se pudo actualizar el pedido en el backend.');
        }
      });
      return;
    } else {
      this.http.post<any>(this.ordersApiUrl, formValue).subscribe({
        next: (createdOrder) => {
          const newOrder: OrderItem = {
            orderId: createdOrder.orderId,
            clientId: createdOrder.clientId,
            clientName: createdOrder.clientName,
            orderCode: createdOrder.orderCode,
            orderDate: createdOrder.orderDate,
            incoterm: createdOrder.incoterm,
            status: createdOrder.status,
            createdAt: now,
            updatedAt: now,
            orderDetails: []
          };

          this.orders = [newOrder, ...this.orders];
          this.filterOrders();
          this.buildAnalytics();
          this.closeForm();
        },
        error: (error) => {
          console.error('Error guardando pedido en backend:', error);
          alert('No se pudo guardar el pedido en el backend.');
        }
      });
      return;
    }

    this.filterOrders();
    this.closeForm();
  }

  deleteOrder(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este pedido?')) {
      return;
    }

    this.http.delete(`${this.ordersApiUrl}/${id}`).subscribe({
      next: () => {
        this.orders = this.orders.filter((order) => order.orderId !== id);
        this.filterOrders();
        this.buildAnalytics();
      },
      error: (error) => {
        console.error('Error eliminando pedido en backend:', error);
        alert('No se pudo eliminar el pedido en el backend.');
      }
    });
  }

  downloadOrder(id: number): void {
    const order = this.orders.find((item) => item.orderId === id);
    const fileName = `${order?.orderCode ?? `pedido_${id}`}.pdf`;

    this.http
      .get(`${this.ordersApiUrl}/${id}/pdf`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => this.savePdf(blob, fileName),
        error: (error) => {
          console.error('Error descargando PDF del pedido:', error);
          alert('No se pudo descargar el PDF del pedido. Revisa si el backend está activo y si el pedido existe.');
        }
      });
  }

  downloadReport(): void {
    this.http
      .get(`${this.ordersApiUrl}/report/pdf`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => this.savePdf(blob, 'reporte_pedidos.pdf'),
        error: (error) => {
          console.error('Error descargando reporte de pedidos:', error);
          alert('No se pudo descargar el reporte. Revisa si el backend está activo.');
        }
      });
  }

  private savePdf(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByOrder(_: number, item: OrderItem): number {
    return item.orderId;
  }

  getDetailTotal(order: OrderItem): number {
    return order.orderDetails.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  getCategoryFromOrder(order: OrderItem): string {
    const categoryByProduct: Record<string, string> = {
      Manzana: 'Frutas',
      Plátano: 'Frutas',
      Lechuga: 'Verduras',
      Tomate: 'Verduras',
      Papa: 'Tubérculos'
    };

    return categoryByProduct[order.orderDetails[0]?.productName ?? ''] ?? 'Sin categoría';
  }

  getTopProductWidth(totalKg: number): number {
    return (totalKg / this.maxTopProductKg) * 100;
  }

  getMonthlyBarWidth(totalKg: number): number {
    return (totalKg / this.maxMonthlySalesKg) * 100;
  }

  getCategoryBarWidth(totalKg: number): number {
    return (totalKg / this.maxCategoryDistributionKg) * 100;
  }

  getError(fieldName: string): string {
    const control = this.orderForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }

    if (control.errors['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }

    if (control.errors['maxlength']) {
      return `No puede superar ${control.errors['maxlength'].requiredLength} caracteres`;
    }

    if (control.errors['pattern']) {
      return fieldName === 'incoterm'
        ? 'El incoterm debe ser EXW, FOB o CIF'
        : 'Campo inválido';
    }

    return 'Campo inválido';
  }
}
