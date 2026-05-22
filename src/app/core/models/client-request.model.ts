export interface ClientRequest {
  requestId?: number;
  username: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  taxId?: string;
  email: string;
  phone?: string;
  address?: string;
  ubigeoId?: number;
  status?: string;
  requestDate?: string;
  reviewedBy?: number;
  comments?: string;
}

export interface ClientRequestActionRequest {
  reviewedBy?: number | null;
  comments?: string | null;
}

export interface ClientRequestActionResponse {
  message: string;
  requestId?: number;
  status?: string;
  clientId?: number | null;
  userId?: number | null;
  loginUsername?: string | null;
}
