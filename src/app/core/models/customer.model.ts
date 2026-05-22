export interface Customer {
  clientId?: number;
  companyName: string;
  taxId: string;
  country: string;
  phone?: string | null;
  address: string;
  email: string;
  profileImageUrl?: string | null;
  creditLimit: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}
