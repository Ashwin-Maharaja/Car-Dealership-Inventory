import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import VehicleCard from '../components/VehicleCard';
import VehicleFilters from '../components/VehicleFilters';
import type { Vehicle, VehicleFilters as FiltersType } from '../types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    status: '',
    minPrice: undefined,
    maxPrice: undefined,
    minYear: undefined,
    maxYear: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 12,
  });

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minYear) params.minYear = filters.minYear;
      if (filters.maxYear) params.maxYear = filters.maxYear;
      if (filters.sortBy) {
        // Map createdAt to created_at for backend
        params.sortBy = filters.sortBy === 'createdAt' ? 'created_at' : filters.sortBy;
      }
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const response = await apiClient.get<{
        vehicles?: Vehicle[];
        data?: Vehicle[];
        total: number;
        page: number;
        totalPages: number;
      }>('/vehicles', { params });

      const data = response.data;
      const list = data.vehicles || data.data || [];
      setVehicles(list);
      setTotal(data.total || list.length);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load vehicles.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total === 1 ? 'vehicle' : 'vehicles'} found matching your criteria.
          </p>
        </div>
        <div>
          <Link to="/vehicles/new" className="btn-primary">
            ➕ Add New Vehicle
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Main Grid: Filters + Vehicles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters Panel (1 col) */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6 p-5">
            <VehicleFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Vehicles Display (3 cols) */}
        <div className="space-y-6 lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-80 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : vehicles.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onUpdate={fetchVehicles} />
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl">🔍</span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No vehicles found</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Try adjusting your search criteria or clear active filters to see all available inventory.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    search: '',
                    status: '',
                    minPrice: undefined,
                    maxPrice: undefined,
                    minYear: undefined,
                    maxYear: undefined,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    page: 1,
                    limit: 12,
                  })
                }
                className="btn-secondary mt-5"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                disabled={(filters.page ?? 1) <= 1 || isLoading}
                className="btn-secondary"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page <span className="font-semibold text-gray-900">{filters.page ?? 1}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalPages}</span>
              </span>
              <button
                onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                disabled={(filters.page ?? 1) >= totalPages || isLoading}
                className="btn-secondary"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
