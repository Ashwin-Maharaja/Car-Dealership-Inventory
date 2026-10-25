import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import type { Customer, Vehicle, SaleFormData } from '../types';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedVehicleId?: string;
}

export default function SaleModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedVehicleId,
}: SaleModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SaleFormData>({
    vehicleId: preselectedVehicleId ?? '',
    customerId: '',
    salePrice: 0,
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [customersRes, vehiclesRes] = await Promise.all([
          apiClient.get<Customer[]>('/customers'),
          apiClient.get<Vehicle[]>('/vehicles', { params: { status: 'available', limit: 100 } }),
        ]);
        setCustomers(
          Array.isArray(customersRes.data)
            ? customersRes.data
            : (customersRes.data as { data?: Customer[] }).data ?? []
        );
        const vData = vehiclesRes.data as unknown;
        const vList = Array.isArray(vData)
          ? vData
          : (vData as { vehicles?: Vehicle[]; data?: Vehicle[] }).vehicles ??
            (vData as { vehicles?: Vehicle[]; data?: Vehicle[] }).data ??
            [];
        setVehicles(vList);
      } catch {
        setError('Failed to load customers or vehicles.');
      }
    };

    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (preselectedVehicleId) {
      setFormData((prev) => ({ ...prev, vehicleId: preselectedVehicleId }));
    }
  }, [preselectedVehicleId]);

  useEffect(() => {
    const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);
    if (selectedVehicle && formData.salePrice === 0) {
      setFormData((prev) => ({ ...prev, salePrice: selectedVehicle.price }));
    }
  }, [formData.vehicleId, vehicles, formData.salePrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.vehicleId || !formData.customerId || formData.salePrice <= 0) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/sales', formData);
      setFormData({ vehicleId: '', customerId: '', salePrice: 0, notes: '' });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to create sale.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Record a Sale</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Vehicle *</label>
            <select
              value={formData.vehicleId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vehicleId: e.target.value, salePrice: 0 }))
              }
              className="input-field"
              required
              disabled={!!preselectedVehicleId}
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} — ${v.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Customer *</label>
            <select
              value={formData.customerId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customerId: e.target.value }))
              }
              className="input-field"
              required
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName ?? c.first_name} {c.lastName ?? c.last_name} — {c.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Sale Price *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.salePrice || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, salePrice: Number(e.target.value) }))
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label-text">Notes</label>
            <textarea
              value={formData.notes ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="input-field resize-none"
              placeholder="Additional notes about the sale…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Recording…' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
