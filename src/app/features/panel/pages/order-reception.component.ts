import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-reception',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-reception.component.html',
  styleUrls: ['./order-reception.component.css']
})
export class OrderReceptionComponent implements OnInit {
  orders: Order[] = [];
  allOrders: Order[] = [];
  selectedStatus: string = 'Pending';
  statusOptions = [
    { value: 'Pending', label: 'Pendientes' },
    { value: 'Completed', label: 'Aprobados' },
    { value: 'Cancelled', label: 'Denegados' },
    { value: 'all', label: 'Todos' }
  ];
  loading = false;
  errorMessage = '';
  processingId: number | null = null;

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.loadAllOrders();
  }

  loadAllOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getPendingOrders().subscribe({
      next: (orders) => {
        this.allOrders = orders;
        this.filterByStatus();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los pedidos pendientes.';
        this.loading = false;
      }
    });
  }

  filterByStatus(): void {
    if (this.selectedStatus === 'all') {
      this.orders = this.allOrders;
    } else {
      this.orders = this.allOrders.filter(o => o.status === this.selectedStatus);
    }
  }

  onStatusChange(): void {
    this.filterByStatus();
  }

  accept(order: Order): void {
    if (!order.orderId) {
      return;
    }

    this.processingId = order.orderId;
    this.orderService.approveOrder(order.orderId).subscribe({
      next: () => this.afterAction(),
      error: () => {
        this.errorMessage = 'No se pudo aprobar el pedido.';
        this.processingId = null;
      }
    });
  }

  reject(order: Order): void {
    if (!order.orderId) {
      return;
    }

    this.processingId = order.orderId;
    this.orderService.rejectOrder(order.orderId).subscribe({
      next: () => this.afterAction(),
      error: () => {
        this.errorMessage = 'No se pudo rechazar el pedido.';
        this.processingId = null;
      }
    });
  }

  private afterAction(): void {
    this.processingId = null;
    this.loadAllOrders();
  }
}