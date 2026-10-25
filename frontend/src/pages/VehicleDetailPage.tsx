import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SaleModal from '../components/SaleModal';
import type { Vehicle } from '../types';

const statusStyles: Record<string, string> = {
  available: 'bg-green-100 text-green-800 border-green-200',
  sold: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const fetchVehicle = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
      setVehicle(response.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Vehicle not found or failed to load.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const handlePurchase = async () => {
    if (!vehicle || vehicle.quantity <= 0) return;

    if (!window.confirm(`Confirm purchase of ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${vehicle.price.toLocaleString()}?`)) {
      return;
    }

    setIsPurchasing(true);
    try {
      await apiClient.post(`/vehicles/${id}/purchase`, { quantity: 1 });
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 3000);
      fetchVehicle();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Purchase failed';
      alert(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestock = async () => {
    const input = window.prompt('Enter quantity of vehicles to add to stock:', '5');
    if (!input) return;
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive integer.');
      return;
    }

    setIsRestocking(true);
    try {
      await apiClient.post(`/vehicles/${id}/restock`, { quantity: qty });
      alert(`Successfully added ${qty} unit(s) to stock.`);
      fetchVehicle();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Restock failed';
      alert(message);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle listing? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.delete(`/vehicles/${id}`);
      navigate('/vehicles');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to delete vehicle.';
      alert(message);
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <span className="text-5xl">⚠️</span>
        <h2 className="mt-4 text-xl font-bold text-gray-900">Vehicle Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">{error || 'Could not locate vehicle details.'}</p>
        <Link to="/vehicles" className="btn-primary mt-6 inline-block">
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  const imageUrl = vehicle.imageUrl || vehicle.image_url;
  const isOutOfStock = vehicle.quantity <= 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/vehicles" className="hover:text-blue-600">
            Vehicles
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Purchase button (Disabled if quantity is zero) */}
          <button
            onClick={handlePurchase}
            disabled={isOutOfStock || isPurchasing}
            className={`btn-primary ${
              isOutOfStock ? 'cursor-not-allowed opacity-50 bg-gray-400' : ''
            }`}
          >
            {isPurchasing
              ? 'Processing...'
              : isOutOfStock
              ? '🚫 Sold Out (0 in stock)'
              : '🛒 Purchase Vehicle'}
          </button>

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <button
                onClick={handleRestock}
                disabled={isRestocking}
                className="btn-secondary text-emerald-700 hover:text-emerald-800"
              >
                {isRestocking ? 'Restocking...' : '📦 Restock'}
              </button>
              <Link to={`/vehicles/${vehicle.id}/edit`} className="btn-secondary">
                ✏️ Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </>
          )}

          {/* Record Sale link for staff */}
          {vehicle.status === 'available' && !isOutOfStock && (
            <button
              onClick={() => setIsSaleModalOpen(true)}
              className="btn-secondary"
            >
              🤝 Custom Deal
            </button>
          )}
        </div>
      </div>

      {purchaseSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          ✓ Purchase completed successfully! Stock count has been reduced.
        </div>
      )}

      {/* Main Details Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Image Area */}
        <div className="card overflow-hidden">
          <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl text-slate-400">
                🚗
              </div>
            )}
            <div className="absolute right-4 top-4 flex gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isOutOfStock ? 'bg-red-100 text-red-800 border-red-200' : statusStyles[vehicle.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {isOutOfStock ? 'Sold Out' : vehicle.status}
              </span>
              {vehicle.category && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  {vehicle.category}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {vehicle.description || 'No detailed description provided for this vehicle.'}
            </p>
          </div>
        </div>

        {/* Right Column: Key Specifications */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {vehicle.category || 'Vehicle'} • {vehicle.year} Model
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    vehicle.quantity > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {vehicle.quantity} Units in Stock
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-2 text-3xl font-black text-blue-600">
                {formatCurrency(vehicle.price)}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-gray-50 p-3.5">
                <span className="text-xs text-gray-500">Category</span>
                <p className="mt-1 font-semibold text-gray-900">{vehicle.category || 'Standard'}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3.5">
                <span className="text-xs text-gray-500">Quantity in Stock</span>
                <p className="mt-1 font-semibold text-gray-900">{vehicle.quantity}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3.5">
                <span className="text-xs text-gray-500">Mileage</span>
                <p className="mt-1 font-semibold text-gray-900">
                  {vehicle.mileage.toLocaleString()} miles
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3.5">
                <span className="text-xs text-gray-500">Color</span>
                <p className="mt-1 font-semibold text-gray-900">{vehicle.color}</p>
              </div>

              <div className="col-span-2 rounded-lg bg-gray-50 p-3.5">
                <span className="text-xs text-gray-500">VIN</span>
                <p className="mt-1 font-mono font-semibold tracking-wide text-gray-900">
                  {vehicle.vin}
                </p>
              </div>
            </div>
          </div>

          {/* Purchasing Info Card */}
          <div className="card bg-slate-50 p-6">
            <h3 className="font-semibold text-gray-900">Purchase Information</h3>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              Every vehicle purchase automatically decrements inventory count in real time.
              When stock reaches zero, the vehicle is marked as Sold Out and further purchases are disabled.
            </p>
          </div>
        </div>
      </div>

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={fetchVehicle}
        preselectedVehicleId={String(vehicle.id)}
      />
    </div>
  );
}
