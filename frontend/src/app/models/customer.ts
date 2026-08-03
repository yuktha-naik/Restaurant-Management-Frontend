export interface Customer {
  customerId?: number;
  name: string;
  email?: string | null;
  phone: string;
  city?: string;
  password?: string;
}