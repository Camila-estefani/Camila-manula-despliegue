export interface Order {
  orderId?: number;
  clientId?: number;
  clientName?: string;
  orderCode?: string;
  orderDate?: string;
  incoterm?: string;
  status?: string;
}

export interface OrderRequest {
  clientId: number;
  orderCode: string;
  orderDate: string;
  incoterm?: string;
  status?: string;
}
