export interface User {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  restored_at?: string | null;
}
