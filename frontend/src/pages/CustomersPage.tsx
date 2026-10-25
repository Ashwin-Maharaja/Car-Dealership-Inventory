import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import type { Customer, CustomerFormData } from '../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalFormData, setModalFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = search ? { search } : {};
      const response = await apiClient.get<Customer[]>('/customers', { params });
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load customers.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setModalFormData({ firstName: '', lastName: '', email: '', phone: '', address: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalFormData({
      firstName: customer.firstName ?? customer.first_name ?? '',
      lastName: customer.lastName ?? customer.last_name ?? '',
      email: customer.email,
      phone: customer.phone ?? '',
      address: customer.address ?? '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) {
      return;
    }

    try {
      await apiClient.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to delete customer.';
      alert(message);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalFormData.firstName || !modalFormData.lastName || !modalFormData.email) {
      setModalError('First name, last name, and email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        first_name: modalFormData.firstName.trim(),
        last_name: modalFormData.lastName.trim(),
        email: modalFormData.email.trim().toLowerCase(),
        phone: modalFormData.phone?.trim() || '',
        address: modalFormData.address?.trim() || '',
      };

      if (editingCustomer) {
        await apiClient.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        await apiClient.post('/customers', payload);
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to save customer.';
      setModalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Directory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer database, contact details, and client profiles.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          ➕ Add Customer
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="card p-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search customers by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Address</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => {
                  const firstName = c.firstName ?? c.first_name ?? '';
                  const lastName = c.lastName ?? c.last_name ?? '';
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {firstName} {lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">
                          {c.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.phone || '—'}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {c.address || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No customers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane"
                    value={modalFormData.firstName}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, firstName: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={modalFormData.lastName}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, lastName: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  value={modalFormData.email}
                  onChange={(e) =>
                    setModalFormData({ ...modalFormData, email: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Phone Number</label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={modalFormData.phone}
                  onChange={(e) =>
                    setModalFormData({ ...modalFormData, phone: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Street Address</label>
                <input
                  type="text"
                  placeholder="123 Main St, Springfield, IL"
                  value={modalFormData.address}
                  onChange={(e) =>
                    setModalFormData({ ...modalFormData, address: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
