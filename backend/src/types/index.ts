import type { Request } from "express";

/** User stored in the database */
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "user" | "staff";
  created_at: string;
}

/** Vehicle listing */
export interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  year: number;
  price: number;
  quantity: number;
  mileage: number;
  color: string;
  vin: string;
  status: "available" | "sold" | "pending";
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

/** Customer record */
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

/** Sale transaction */
export interface Sale {
  id: number;
  vehicle_id: number;
  customer_id: number;
  user_id: number;
  sale_price: number;
  sale_date: string;
  notes: string;
  created_at: string;
}

/** Sale with joined vehicle and customer info */
export interface SaleWithDetails extends Sale {
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  user_name: string;
}

/** Monthly sales aggregation */
export interface MonthlySales {
  month: string;
  count: number;
  revenue: number;
}

/** Dashboard statistics */
export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: SaleWithDetails[];
  monthlySales: MonthlySales[];
}

/** JWT token payload */
export interface TokenPayload {
  id: number;
  email: string;
  role: "admin" | "user" | "staff";
}

/** Authenticated request with user info attached */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/** Paginated vehicles response */
export interface PaginatedVehiclesResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  totalPages: number;
}

/** Vehicle query filter parameters */
export interface VehicleQueryParams {
  search?: string;
  make?: string;
  model?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}
