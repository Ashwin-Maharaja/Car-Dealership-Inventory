import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import StatsCard from '../components/StatsCard';
import VehicleCard from '../components/VehicleCard';
import SaleModal from '../components/SaleModal';
import type { DashboardStats, Sale, Vehicle } from '../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsRes, vehiclesRes] = await Promise.all([
        apiClient.get<DashboardStats>('/dashboard/stats'),
        apiClient.get<{ vehicles?: Vehicle[]; data?: Vehicle[] }>('/vehicles', {
          params: { status: 'available', limit: 6 },
        }),
      ]);
      setStats(statsRes.data);
      const vList = vehiclesRes.data.vehicles || vehiclesRes.data.data || [];
      setAvailableVehicles(Array.isArray(vList) ? vList : []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load dashboard data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of inventory, sales performance, and recent transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="btn-primary"
          >
            💰 Record a Sale
          </button>
          <Link to="/vehicles/new" className="btn-secondary">
            ➕ Add Vehicle
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-gray-100 p-6" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon="🚗"
            label="Total Vehicles"
            value={stats.totalVehicles}
            color="blue"
          />
          <StatsCard
            icon="✅"
            label="Available in Stock"
            value={stats.availableVehicles}
            color="green"
          />
          <StatsCard
            icon="🤝"
            label="Total Sales"
            value={stats.totalSales}
            color="amber"
          />
          <StatsCard
            icon="💵"
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            color="purple"
          />
        </div>
      ) : null}

      {/* Available Vehicles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Available Vehicles in Stock</h2>
            <p className="text-xs text-gray-500">Live inventory ready for instant customer purchase</p>
          </div>
          <Link to="/vehicles" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View full inventory catalog ({stats?.totalVehicles ?? 0}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : availableVehicles.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {availableVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onUpdate={fetchStats} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-500">
            No vehicles currently in stock.
          </div>
        )}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions (2 cols) */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Sales</h2>
              <p className="text-xs text-gray-500">Latest completed customer purchases</p>
            </div>
            <Link
              to="/sales"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      Loading recent sales...
                    </td>
                  </tr>
                ) : stats?.recentSales && stats.recentSales.length > 0 ? (
                  stats.recentSales.map((sale: Sale) => {
                    const vehicleName = sale.vehicle_make
                      ? `${sale.vehicle_year ?? ''} ${sale.vehicle_make} ${sale.vehicle_model ?? ''}`
                      : sale.vehicle
                      ? `${sale.vehicle.year} ${sale.vehicle.make} ${sale.vehicle.model}`
                      : `Vehicle #${sale.vehicle_id ?? sale.vehicleId}`;

                    const customerName = sale.customer_first_name
                      ? `${sale.customer_first_name} ${sale.customer_last_name ?? ''}`
                      : sale.customer
                      ? `${sale.customer.firstName ?? sale.customer.first_name} ${sale.customer.lastName ?? sale.customer.last_name}`
                      : `Customer #${sale.customer_id ?? sale.customerId}`;

                    const salePrice = sale.sale_price ?? sale.salePrice ?? 0;
                    const saleDate = sale.sale_date ?? sale.saleDate ?? '';

                    return (
                      <tr key={sale.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {vehicleName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{customerName}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {saleDate ? new Date(saleDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(salePrice)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links / Monthly Revenue Overview (1 col) */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900">Monthly Performance</h2>
            <p className="mt-1 text-xs text-gray-500">Revenue in recent months</p>

            <div className="mt-4 space-y-3">
              {stats?.monthlySales && stats.monthlySales.length > 0 ? (
                stats.monthlySales.map((m) => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-600">{m.month}</span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(m.revenue)}</span>
                      <span className="ml-2 text-xs text-gray-400">({m.count} deals)</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No monthly data available yet.</p>
              )}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white">
            <h3 className="font-bold text-lg">Inventory Actions</h3>
            <p className="mt-1 text-xs text-slate-300">
              Manage your stock and streamline dealership operations.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/vehicles"
                className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <span>Browse Inventory</span>
                <span>→</span>
              </Link>
              <Link
                to="/customers"
                className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <span>View Customer Directory</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
}
