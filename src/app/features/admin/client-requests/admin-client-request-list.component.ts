import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ClientRequestService } from '../../../core/services/client-request.service';
import { ClientRequest } from '../../../core/models/client-request.model';

type RequestStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type RequestAction = 'approve' | 'reject';
type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-admin-client-request-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-client-request-list.component.html',
  styleUrls: ['./admin-client-request-list.component.css']
})
export class AdminClientRequestListComponent implements OnInit {
  requests: ClientRequest[] = [];
  filteredRequests: ClientRequest[] = [];
  selectedRequest: ClientRequest | null = null;
  actionRequest: ClientRequest | null = null;
  actionMode: RequestAction | null = null;
  statusFilter: RequestStatusFilter = 'ALL';
  searchTerm = '';
  isLoading = false;
  isConfirmOpen = false;
  toastMessage = '';
  toastType: ToastType = 'success';

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly clientRequestService: ClientRequestService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.clientRequestService.getAllRequests().subscribe({
      next: (requests) => {
        this.requests = [...(requests ?? [])].sort((left, right) => {
          const leftDate = new Date(left.requestDate ?? '').getTime();
          const rightDate = new Date(right.requestDate ?? '').getTime();
          return rightDate - leftDate;
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading client requests', error);
        this.requests = [];
        this.filteredRequests = [];
        this.isLoading = false;
        this.showToast('No se pudieron cargar las solicitudes', 'error');
      }
    });
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onStatusChange(value: string): void {
    this.statusFilter = value as RequestStatusFilter;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.applyFilters();
  }

  openDetails(request: ClientRequest): void {
    this.selectedRequest = request;
  }

  closeDetails(): void {
    this.selectedRequest = null;
  }

  openActionConfirmation(request: ClientRequest, action: RequestAction): void {
    this.actionRequest = request;
    this.actionMode = action;
    this.isConfirmOpen = true;
  }

  closeConfirmation(): void {
    this.actionRequest = null;
    this.actionMode = null;
    this.isConfirmOpen = false;
  }

  confirmAction(): void {
    if (!this.actionRequest || !this.actionMode || !this.isPending(this.actionRequest.status)) {
      return;
    }

    const requestId = this.actionRequest.requestId;
    if (requestId == null) {
      this.showToast('La solicitud no tiene un identificador válido', 'error');
      return;
    }

    const reviewedBy = this.authService.currentUserValue?.userId ?? undefined;
    this.isLoading = true;

    const action$ = this.actionMode === 'approve'
      ? this.clientRequestService.approveRequest(requestId, { reviewedBy })
      : this.clientRequestService.rejectRequest(requestId, { reviewedBy });

    action$.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.closeConfirmation();
        this.showToast(response?.message || this.getActionSuccessMessage(), 'success');
        this.loadRequests();
        if (this.selectedRequest?.requestId === requestId) {
          this.closeDetails();
        }
      },
      error: (error) => {
        console.error('Error processing client request', error);
        this.isLoading = false;
        this.showToast(this.getActionErrorMessage(error), 'error');
      }
    });
  }

  trackByRequest(_: number, request: ClientRequest): number {
    return request.requestId ?? 0;
  }

  get totalRequests(): number {
    return this.requests.length;
  }

  get pendingRequests(): number {
    return this.countByStatus('PENDING');
  }

  get approvedRequests(): number {
    return this.countByStatus('APPROVED');
  }

  get rejectedRequests(): number {
    return this.countByStatus('REJECTED');
  }

  get statusOptions(): Array<{ label: string; value: RequestStatusFilter }> {
    return [
      { label: 'Todos los estados', value: 'ALL' },
      { label: 'Pendiente', value: 'PENDING' },
      { label: 'Aprobado', value: 'APPROVED' },
      { label: 'Rechazado', value: 'REJECTED' }
    ];
  }

  getActionTitle(): string {
    return this.actionMode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud';
  }

  getActionMessage(): string {
    return this.actionMode === 'approve'
      ? '¿Está seguro de aprobar esta solicitud?'
      : '¿Está seguro de rechazar esta solicitud?';
  }

  getActionButtonLabel(): string {
    return this.actionMode === 'approve' ? 'Aprobar' : 'Rechazar';
  }

  getActionButtonClass(): string {
    return this.actionMode === 'approve' ? 'action-primary' : 'action-danger';
  }

  getRequestStatusClass(status?: string): string {
    switch (this.normalizeStatus(status)) {
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getRequestStatusLabel(status?: string): string {
    switch (this.normalizeStatus(status)) {
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  }

  isPending(status?: string): boolean {
    return this.normalizeStatus(status) === 'PENDING';
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredRequests = this.requests.filter((request) => {
      const fullName = `${request.firstName ?? ''} ${request.lastName ?? ''}`.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (request.username ?? '').toLowerCase().includes(term) ||
        fullName.includes(term) ||
        (request.companyName ?? '').toLowerCase().includes(term) ||
        (request.email ?? '').toLowerCase().includes(term) ||
        (request.phone ?? '').toLowerCase().includes(term);

      const matchesStatus =
        this.statusFilter === 'ALL' || this.normalizeStatus(request.status) === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  private countByStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED'): number {
    return this.requests.filter((request) => this.normalizeStatus(request.status) === status).length;
  }

  private normalizeStatus(status?: string): 'PENDING' | 'APPROVED' | 'REJECTED' | '' {
    const normalized = (status ?? '').trim().toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'REJECTED' || normalized === 'PENDING') {
      return normalized;
    }
    return normalized ? '' : 'PENDING';
  }

  private getActionSuccessMessage(): string {
    return this.actionMode === 'approve'
      ? 'Solicitud aprobada correctamente'
      : 'Solicitud rechazada correctamente';
  }

  private getActionErrorMessage(error: any): string {
    return error?.error?.message || error?.message || 'No se pudo procesar la solicitud';
  }

  private showToast(message: string, type: ToastType): void {
    this.toastMessage = message;
    this.toastType = type;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }
}