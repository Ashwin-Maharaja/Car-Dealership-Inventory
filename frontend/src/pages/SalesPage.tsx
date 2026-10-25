import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import SaleModal from '../components/SaleModal';
import type { Sale } from '../types';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get<Sale[]>('/sales');
      setSales(Array.isArray(response.data) ? response.data : []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load sales history.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  const totalRevenue = sales.reduce((acc, s) => acc + (s.sale_price ?? s.salePrice ?? 0), 0);
  const averageDeal = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Historical ledger of all closed deals, transaction values, and customer records.
          </p>
        </div>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="btn-primary"
        >
          💰 Record New Sale
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Deals Closed
          </span>
          <p className="mt-2 text-2xl font-extrabold text-gray-900">{sales.length}</p>
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Cumulative Revenue
          </span>
          <p className="mt-2 text-2xl font-extrabold text-blue-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Average Deal Size
          </span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {formatCurrency(averageDeal)}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3.5">Transaction Date</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Sales Rep</th>
                <th className="px-6 py-3.5 text-right">Sale Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => {
                  const vehicleTitle = sale.vehicle_make
                    ? `${sale.vehicle_year ?? ''} ${sale.vehicle_make} ${sale.vehicle_model ?? ''}`
                    : sale.vehicle
                    ? `${sale.vehicle.year} ${sale.vehicle.make} ${sale.vehicle.model}`
                    : `Vehicle #${sale.vehicle_id ?? sale.vehicleId}`;

                  const customerTitle = sale.customer_first_name
                    ? `${sale.customer_first_name} ${sale.customer_last_name ?? ''}`
                    : sale.customer
                    ? `${sale.customer.firstName ?? sale.customer.first_name} ${sale.customer.lastName ?? sale.customer.last_name}`
                    : `Customer #${sale.customer_id ?? sale.customerId}`;

                  const salePrice = sale.sale_price ?? sale.salePrice ?? 0;
                  const dateStr = sale.sale_date ?? sale.saleDate ?? sale.created_at ?? sale.createdAt;

                  return (
                    <tr key={sale.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-xs font-medium text-gray-500">
                        {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {vehicleTitle}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{customerTitle}</div>
                        {sale.customer_email && (
                          <div className="text-xs text-gray-400">{sale.customer_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {sale.user_name || sale.user?.name || 'Staff Member'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(salePrice)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No sales recorded yet. Click "Record New Sale" to log your first transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={fetchSales}
      />
    </div>
  );
}
