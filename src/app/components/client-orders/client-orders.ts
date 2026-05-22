import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { Order, OrderRequest } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  label: string;
  route: string;
  shortLabel: string;
}

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-orders.html',
  styleUrl: './client-orders.css'
})
export class ClientOrdersComponent implements OnInit {

  // Layout
  sidebarOpen = true;
  activeRoute = 'pedidos';

  menuItems: MenuItem[] = [
    { label: 'Mis Pedidos', route: '/customer/pedidos', shortLabel: '📦' },
    { label: 'Clientes', route: '/customer/clientes', shortLabel: '🏢' },
    { label: 'Mi Perfil',   route: '/customer/perfil',  shortLabel: '👤' }
  ];

  // Pedidos
  listaPedidos: Order[] = [];
  pedidosFiltrados: Order[] = [];
  terminoBusqueda = '';
  cargando = false;
  errorCarga = '';

  // Modal nuevo pedido
  mostrarFormulario = false;
  guardando = false;
  errorGuardar = '';

  // Campos del formulario
  clienteId: number | null = null;
  incotermSeleccionado = 'FOB';
  productoSeleccionado = '';
  cantidadIngresada: number | null = null;

  // Productos disponibles
  productos: Product[] = [];
  cargandoProductos = false;

  // Modal detalle
  mostrarDetalle = false;
  pedidoDetalle: Order | null = null;

  incotermOpciones = ['FOB', 'CIF', 'EXW', 'CFR', 'DAP'];

  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.clienteId = this.getCurrentClientId();

    this.cargarPedidos();
    this.cargarProductos();
  }

  // ===== SIDEBAR =====
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveRoute(route: string): void {
    this.activeRoute = route;
  }

  // ===== CARGAR PEDIDOS =====
  cargarPedidos(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.orderService.getMyOrders().subscribe({
      next: (pedidos) => {
        this.listaPedidos = pedidos;
        this.pedidosFiltrados = pedidos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.errorCarga = 'No se pudo conectar con el servidor. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  // ===== CARGAR PRODUCTOS =====
  cargarProductos(): void {
    this.cargandoProductos = true;
    this.productService.getActiveProducts().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cargandoProductos = false;
      },
      error: () => {
        this.cargandoProductos = false;
      }
    });
  }

  // ===== BÚSQUEDA =====
  filtrarPedidos(): void {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    if (!termino) {
      this.pedidosFiltrados = this.listaPedidos;
      return;
    }
    this.pedidosFiltrados = this.listaPedidos.filter(p =>
      (p.orderCode?.toLowerCase().includes(termino)) ||
      (p.orderDate?.includes(termino)) ||
      (p.status?.toLowerCase().includes(termino)) ||
      (p.clientName?.toLowerCase().includes(termino))
    );
  }

  // ===== MODAL NUEVO PEDIDO =====
  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
  }

  agregarPedido(): void {
    if (!this.clienteId) {
      this.errorGuardar = 'No se pudo identificar el cliente autenticado.';
      return;
    }

    if (!this.productoSeleccionado || !this.cantidadIngresada || this.cantidadIngresada <= 0) {
      this.errorGuardar = 'Completa todos los campos obligatorios.';
      return;
    }

    this.guardando = true;
    this.errorGuardar = '';

    const hoy = new Date().toISOString().split('T')[0];
    const orderCode = `ORD-${Date.now()}`;

    const nuevoPedido: OrderRequest = {
      clientId: this.clienteId,
      orderCode: orderCode,
      orderDate: hoy,
      incoterm: this.incotermSeleccionado,
      status: 'Pending'
    };

    this.orderService.createOrder(nuevoPedido).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.limpiarFormulario();
        this.cargarPedidos();
      },
      error: (err) => {
        console.error('Error al guardar pedido:', err);
        this.errorGuardar = err?.error?.error || 'Error al guardar el pedido. Intenta de nuevo.';
        this.guardando = false;
      }
    });
  }

  limpiarFormulario(): void {
    this.productoSeleccionado = '';
    this.cantidadIngresada = null;
    this.incotermSeleccionado = 'FOB';
    this.errorGuardar = '';
    this.guardando = false;
  }

  // ===== MODAL DETALLE =====
  verDetalle(pedido: Order): void {
    this.pedidoDetalle = pedido;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.pedidoDetalle = null;
  }

  // ===== DESCARGAR PDF =====
  descargarPdf(pedido: Order): void {
    if (!pedido.orderId) return;
    this.orderService.downloadOrderPdf(pedido.orderId).subscribe({
      next: (blob) => {
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedido_${pedido.orderCode || pedido.orderId}.pdf`;
        a.click();
        globalThis.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        alert('No se pudo descargar el PDF.');
      }
    });
  }

  // ===== HELPERS =====
  getStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      'Pending':    'Pendiente',
      'Processing': 'En proceso',
      'Completed':  'Completado',
      'Cancelled':  'Cancelado'
    };
    return status ? (map[status] || status) : '—';
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      'Pending':    'status-pending',
      'Processing': 'status-processing',
      'Completed':  'status-completed',
      'Cancelled':  'status-cancelled'
    };
    return status ? (map[status] || 'status-pending') : 'status-pending';
  }

  getNombreProducto(productId: string): string {
    const prod = this.productos.find(p => String(p.productId) === String(productId));
    return prod ? prod.name : productId;
  }

  private getCurrentClientId(): number | null {
    const currentUser = this.authService.currentUserValue;
    const rawClientId = currentUser?.clientId;

    if (typeof rawClientId === 'number' && Number.isFinite(rawClientId)) {
      return rawClientId;
    }

    return null;
  }
}
