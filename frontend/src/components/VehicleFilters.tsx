import type { VehicleFilters as VehicleFiltersType } from '../types';

interface VehicleFiltersProps {
  filters: VehicleFiltersType;
  onChange: (filters: VehicleFiltersType) => void;
}

const currentYear = new Date().getFullYear();
const categories = ['Sedan', 'SUV', 'Truck', 'Electric', 'Coupe', 'Crossover'];

export default function VehicleFilters({ filters, onChange }: VehicleFiltersProps) {
  const update = (patch: Partial<VehicleFiltersType>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  const handleReset = () => {
    onChange({
      search: '',
      category: '',
      status: '',
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 12,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Search & Filters</h3>
        <button
          onClick={handleReset}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Reset all
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="label-text">Keywords</label>
        <input
          type="text"
          placeholder="Make, model, color…"
          value={filters.search ?? ''}
          onChange={(e) => update({ search: e.target.value })}
          className="input-field"
        />
      </div>

      {/* Category Filter */}
      <div>
        <label className="label-text">Body Category</label>
        <select
          value={filters.category ?? ''}
          onChange={(e) => update({ category: e.target.value })}
          className="input-field"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="label-text">Availability</label>
        <select
          value={filters.status ?? ''}
          onChange={(e) => update({ status: e.target.value as VehicleFiltersType['status'] })}
          className="input-field"
        >
          <option value="">All Vehicles</option>
          <option value="available">Available in Stock</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold Out</option>
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="label-text">Price Range ($)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={filters.minPrice ?? ''}
            onChange={(e) =>
              update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="input-field"
          />
          <input
            type="number"
            placeholder="Max $"
            value={filters.maxPrice ?? ''}
            onChange={(e) =>
              update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="input-field"
          />
        </div>
      </div>

      {/* Year range */}
      <div>
        <label className="label-text">Year Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="From"
            min={1980}
            max={currentYear + 1}
            value={filters.minYear ?? ''}
            onChange={(e) =>
              update({ minYear: e.target.value ? Number(e.target.value) : undefined })
            }
            className="input-field"
          />
          <input
            type="number"
            placeholder="To"
            min={1980}
            max={currentYear + 1}
            value={filters.maxYear ?? ''}
            onChange={(e) =>
              update({ maxYear: e.target.value ? Number(e.target.value) : undefined })
            }
            className="input-field"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="label-text">Sort By</label>
        <select
          value={filters.sortBy ?? 'createdAt'}
          onChange={(e) =>
            update({ sortBy: e.target.value as VehicleFiltersType['sortBy'] })
          }
          className="input-field"
        >
          <option value="createdAt">Date Added</option>
          <option value="price">Price</option>
          <option value="year">Year</option>
          <option value="mileage">Mileage</option>
        </select>
      </div>

      <div>
        <label className="label-text">Order</label>
        <select
          value={filters.sortOrder ?? 'desc'}
          onChange={(e) =>
            update({ sortOrder: e.target.value as VehicleFiltersType['sortOrder'] })
          }
          className="input-field"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
}
