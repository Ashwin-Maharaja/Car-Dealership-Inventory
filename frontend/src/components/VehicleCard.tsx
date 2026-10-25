import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onUpdate?: () => void;
}

const statusStyles: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  sold: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

export default function VehicleCard({ vehicle, onUpdate }: VehicleCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const formattedMileage = new Intl.NumberFormat('en-US').format(vehicle.mileage);
  const isOutOfStock = vehicle.quantity <= 0;

  const handlePurchase = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (!window.confirm(`Confirm purchase of ${vehicle.year} ${vehicle.make} ${vehicle.model} for ${formattedPrice}?`)) {
      return;
    }

    setIsPurchasing(true);
    try {
      await apiClient.post(`/vehicles/${vehicle.id}/purchase`, { quantity: 1 });
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 3000);
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to process purchase';
      alert(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="card group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/vehicles/${vehicle.id}`} className="block">
        {/* Image placeholder */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
          {vehicle.imageUrl || vehicle.image_url ? (
            <img
              src={vehicle.imageUrl || vehicle.image_url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl text-slate-400">
              🚗
            </div>
          )}

          {/* Badges */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize shadow-sm ${
                isOutOfStock ? 'bg-red-100 text-red-800' : statusStyles[vehicle.status] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {isOutOfStock ? 'Out of Stock' : vehicle.status}
            </span>

            {vehicle.category && (
              <span className="rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                {vehicle.category}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {vehicle.color} • {formattedMileage} mi
              </p>
            </div>
            <p className="text-lg font-bold text-blue-600">{formattedPrice}</p>
          </div>

          {/* Stock quantity badge */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
            <span className="text-gray-500">Stock Available:</span>
            <span
              className={`font-semibold ${
                vehicle.quantity > 2
                  ? 'text-emerald-600'
                  : vehicle.quantity > 0
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {vehicle.quantity > 0 ? `${vehicle.quantity} in stock` : '0 (Sold Out)'}
            </span>
          </div>
        </div>
      </Link>

      {/* Card Footer with Action */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-3">
        {purchaseSuccess ? (
          <div className="rounded-lg bg-green-50 py-2 text-center text-xs font-semibold text-green-700">
            ✓ Purchased successfully!
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={isOutOfStock || isPurchasing}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isOutOfStock
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm'
            }`}
          >
            <span>{isPurchasing ? 'Processing...' : isOutOfStock ? 'Sold Out' : '🛒 Purchase'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
