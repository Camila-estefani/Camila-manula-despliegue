export interface ClientProfileData {
  clientId?: number | null;
  companyName?: string | null;
  taxId?: string | null;
  country?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  creditLimit?: number | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

export interface ClientProfileUpdateRequest {
  companyName?: string | null;
  phone?: string | null;
  address?: string | null;
  profileImageUrl?: string | null;
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmPassword?: string | null;
}