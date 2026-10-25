import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Vehicle, VehicleFormData, VehicleStatus } from '../types';

const categories = ['Sedan', 'SUV', 'Truck', 'Electric', 'Coupe', 'Crossover', 'Van', 'Wagon'];

export default function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    category: 'Sedan',
    year: new Date().getFullYear(),
    price: 0,
    quantity: 1,
    mileage: 0,
    color: '',
    vin: '',
    status: 'available',
    description: '',
    imageUrl: '',
  });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;

    const fetchVehicle = async () => {
      try {
        const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
        const v = response.data;
        setFormData({
          make: v.make || '',
          model: v.model || '',
          category: v.category || 'Sedan',
          year: v.year || new Date().getFullYear(),
          price: v.price || 0,
          quantity: v.quantity ?? 1,
          mileage: v.mileage || 0,
          color: v.color || '',
          vin: v.vin || '',
          status: v.status || 'available',
          description: v.description || '',
          imageUrl: v.imageUrl || v.image_url || '',
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Failed to load vehicle data.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.make || !formData.model || !formData.category || !formData.price) {
      setError('Please fill in make, model, category, and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        category: formData.category.trim(),
        year: Number(formData.year) || new Date().getFullYear(),
        price: Number(formData.price),
        quantity: Number(formData.quantity ?? 1),
        mileage: Number(formData.mileage || 0),
        color: formData.color?.trim() || 'Black',
        vin: (formData.vin?.trim() || `VIN${Date.now()}`).toUpperCase(),
        status: Number(formData.quantity) === 0 ? 'sold' : formData.status,
        description: formData.description?.trim() || '',
        image_url: formData.imageUrl?.trim() || '',
      };

      if (isEditing) {
        await apiClient.put(`/vehicles/${id}`, payload);
        navigate(`/vehicles/${id}`);
      } else {
        const response = await apiClient.post<Vehicle>('/vehicles', payload);
        navigate(`/vehicles/${response.data.id}`);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to save vehicle.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Vehicle Listing' : 'Add New Vehicle'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing
              ? 'Update the specifications, inventory stock, and details of this vehicle.'
              : 'Register a new vehicle into dealership inventory.'}
          </p>
        </div>
        <Link to={isEditing ? `/vehicles/${id}` : '/vehicles'} className="btn-secondary">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Make */}
          <div>
            <label className="label-text">Make *</label>
            <input
              type="text"
              required
              placeholder="e.g. Toyota"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Model */}
          <div>
            <label className="label-text">Model *</label>
            <input
              type="text"
              required
              placeholder="e.g. Camry"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Category */}
          <div>
            <label className="label-text">Body Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity in stock */}
          <div>
            <label className="label-text">Quantity in Stock *</label>
            <input
              type="number"
              required
              min={0}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          {/* Price */}
          <div>
            <label className="label-text">Listing Price ($) *</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              placeholder="25000"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          {/* Year */}
          <div>
            <label className="label-text">Year</label>
            <input
              type="number"
              min={1900}
              max={new Date().getFullYear() + 2}
              value={formData.year || ''}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          {/* Color */}
          <div>
            <label className="label-text">Color</label>
            <input
              type="text"
              placeholder="e.g. Midnight Black"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Mileage */}
          <div>
            <label className="label-text">Mileage (mi)</label>
            <input
              type="number"
              min={0}
              placeholder="15000"
              value={formData.mileage || ''}
              onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          {/* VIN */}
          <div>
            <label className="label-text">VIN (Optional)</label>
            <input
              type="text"
              maxLength={17}
              placeholder="Auto-generated if empty"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              className="input-field font-mono"
            />
          </div>

          {/* Status */}
          <div>
            <label className="label-text">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
              className="input-field"
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {/* Image URL */}
          <div className="sm:col-span-2">
            <label className="label-text">Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="label-text">Description</label>
            <textarea
              rows={3}
              placeholder="Include details about package options, trim levels, history, and conditions..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <Link
            to={isEditing ? `/vehicles/${id}` : '/vehicles'}
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
