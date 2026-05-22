export interface Provider {
  providerId?: number;
  companyName: string;
  taxId: string;
  productType?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
