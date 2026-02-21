import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';

interface PropertyImage {
  id: string;
  url: string;
  order: number;
}

interface PropertyOwner {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  price: number | string;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number | string | null;
  address: string;
  city: string;
  neighborhood: string | null;
  department: string;
  amenities: string[];
  images: PropertyImage[];
  owner: PropertyOwner;
  isActive: boolean;
  isViewed?: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  city: string;
  propertyType: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
}

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'ROOM', 'STUDIO'] as const;
const LISTING_TYPES = ['RENT', 'SALE'] as const;

function formatPrice(price: number | string): string {
  return Number(price).toLocaleString('es-CO');
}

export function PropertyListPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>({
    city: '',
    propertyType: '',
    listingType: '',
    minPrice: '',
    maxPrice: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetchProperties = async (pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '12');
      if (filters.city) params.set('city', filters.city);
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      if (filters.listingType) params.set('listingType', filters.listingType);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

      const res = await apiClient.get<{ data: Property[]; pagination: Pagination }>(
        `/properties?${params.toString()}`,
      );
      setProperties(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchProperties(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({ city: '', propertyType: '', listingType: '', minPrice: '', maxPrice: '' });
    setPage(1);
    setTimeout(() => fetchProperties(1), 0);
  };

  const handleFilterChange = (field: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-rumi-text">{t.nav.properties}</h1>
          <p className="text-sm text-rumi-text/60 mt-1">{t.property.browseSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sm font-medium border border-rumi-primary/30 text-rumi-primary rounded-lg hover:bg-rumi-primary/5 transition-colors"
          >
            {t.common.filter} {showFilters ? '▲' : '▼'}
          </button>
          <Link
            to="/properties/new"
            className="px-4 py-2 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
          >
            + {t.nav.publishProperty}
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-rumi-primary-light/20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-rumi-text/60 mb-1">{t.property.city}</label>
              <input
                value={filters.city}
                onChange={handleFilterChange('city')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                placeholder="Ej: Bogota"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rumi-text/60 mb-1">{t.property.type}</label>
              <select
                value={filters.propertyType}
                onChange={handleFilterChange('propertyType')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none bg-white"
              >
                <option value="">{t.property.allTypes}</option>
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{t.property.types[pt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-rumi-text/60 mb-1">{t.property.listingType}</label>
              <select
                value={filters.listingType}
                onChange={handleFilterChange('listingType')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none bg-white"
              >
                <option value="">{t.property.allListings}</option>
                {LISTING_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{t.property.listingTypes[lt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-rumi-text/60 mb-1">{t.property.minPrice}</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={handleFilterChange('minPrice')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rumi-text/60 mb-1">{t.property.maxPrice}</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={handleFilterChange('maxPrice')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                placeholder="10,000,000"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
            >
              {t.common.search}
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-rumi-text/60 hover:text-rumi-text transition-colors"
            >
              {t.property.clearFilters}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-6">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <p className="text-rumi-text/60">{t.common.loading}</p>
        </div>
      )}

      {/* Property Grid */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xl text-rumi-text/40 mb-2">🏠</p>
          <p className="text-rumi-text/60">{t.property.noProperties}</p>
        </div>
      )}

      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="bg-white rounded-2xl shadow-md border border-rumi-primary-light/20 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Image */}
              <div className="h-48 bg-rumi-primary/10 relative overflow-hidden">
                {property.images.length > 0 ? (
                  <img
                    src={property.images[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-rumi-primary/30">
                    🏠
                  </div>
                )}
                {/* Listing type badge */}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                  property.listingType === 'RENT' ? 'bg-rumi-primary' : 'bg-rumi-accent'
                }`}>
                  {t.property.listingTypes[property.listingType as 'RENT' | 'SALE']}
                </span>
                {/* Property type badge */}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-rumi-text">
                  {t.property.types[property.propertyType as 'APARTMENT' | 'HOUSE' | 'ROOM' | 'STUDIO']}
                </span>
                {/* Ya visto badge */}
                {property.isViewed && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
                    ✓ {t.property.viewed}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-rumi-text truncate">{property.title}</h3>
                <p className="text-sm text-rumi-text/50 mt-1 truncate">
                  {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                </p>

                {/* Price */}
                <p className="text-lg font-bold text-rumi-primary mt-2">
                  ${formatPrice(property.price)} <span className="text-sm font-normal text-rumi-text/50">{property.currency}{property.listingType === 'RENT' ? t.property.perMonth : ''}</span>
                </p>

                {/* Specs */}
                <div className="flex items-center gap-4 mt-3 text-sm text-rumi-text/60">
                  <span>🛏 {property.bedrooms} {t.property.beds}</span>
                  <span>🚿 {property.bathrooms} {t.property.baths}</span>
                  {property.area && <span>📐 {Number(property.area)} m²</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            {t.common.previous}
          </button>
          <span className="text-sm text-rumi-text/60">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            {t.common.next}
          </button>
        </div>
      )}
    </div>
  );
}
