export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'sales' | 'manager';
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export type VehicleStatus = 'available' | 'sold' | 'pending';

export interface Vehicle {
  id: string | number;
  make: string;
  model: string;
  category: string;
  year: number;
  price: number;
  quantity: number;
  mileage: number;
  color: string;
  vin: string;
  status: VehicleStatus;
  description: string;
  imageUrl?: string;
  image_url?: string;
  fuelType?: string;
  transmission?: string;
  engineSize?: string;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  category: string;
  year: number;
  price: number;
  quantity: number;
  mileage: number;
  color: string;
  vin: string;
  status: VehicleStatus;
  description: string;
  imageUrl?: string;
  image_url?: string;
  fuelType?: string;
  transmission?: string;
  engineSize?: string;
  features?: string[];
}

export interface Customer {
  id: string | number;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
}

export interface CustomerFormData {
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Sale {
  id: string | number;
  vehicleId?: string | number;
  customerId?: string | number;
  userId?: string | number;
  vehicle_id?: number;
  customer_id?: number;
  user_id?: number;
  salePrice?: number;
  sale_price?: number;
  saleDate?: string;
  sale_date?: string;
  notes?: string;
  vehicle?: Vehicle;
  customer?: Customer;
  user?: User;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  user_name?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
}

export interface SaleFormData {
  vehicleId: string | number;
  customerId: string | number;
  salePrice: number;
  notes?: string;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  totalSales: number;
  totalRevenue: number;
  recentSales?: Sale[];
  monthlySales?: { month: string; count: number; revenue: number }[];
}

export interface PaginatedResponse<T> {
  data?: T[];
  vehicles?: T[];
  total: number;
  page: number;
  limit?: number;
  totalPages: number;
}

export interface VehicleFilters {
  search?: string;
  category?: string;
  status?: VehicleStatus | '';
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  sortBy?: 'price' | 'year' | 'mileage' | 'createdAt' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
