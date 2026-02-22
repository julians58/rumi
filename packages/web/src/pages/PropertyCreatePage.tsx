import { useState, lazy, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';

const PropertyMap = lazy(() => import('../components/ui/PropertyMap'));

interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  address: string;
  city: string;
  neighborhood: string;
  department: string;
  amenities: string[];
}

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'ROOM', 'STUDIO'] as const;
const LISTING_TYPES = ['RENT', 'SALE'] as const;
const AMENITIES = [
  'wifi', 'parking', 'laundry', 'gym', 'pool', 'security',
  'elevator', 'furnished', 'pets_allowed', 'balcony', 'air_conditioning', 'hot_water',
] as const;

const DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlantico', 'Bogota D.C.', 'Bolivar',
  'Boyaca', 'Caldas', 'Caqueta', 'Casanare', 'Cauca', 'Cesar', 'Choco',
  'Cordoba', 'Cundinamarca', 'Guainia', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindio',
  'Risaralda', 'San Andres y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupes', 'Vichada',
];

// Default map center: Bogota
const DEFAULT_CENTER: [number, number] = [4.6486, -74.0628];

export function PropertyCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [geocoding, setGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<PropertyFormData>({
    defaultValues: {
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      city: '',
      department: '',
      amenities: [],
    },
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    );
  };

  const handleGeocode = async () => {
    const address = getValues('address');
    const city = getValues('city');
    const department = getValues('department');
    if (!address || !city) return;

    setGeocoding(true);
    try {
      const query = `${address}, ${city}, ${department || ''}, Colombia`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'RumiApp/1.0 (rumi-rental-platform)' } },
      );
      const results = await response.json();
      if (results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        setPinPosition([lat, lon]);
        setMapCenter([lat, lon]);
      }
    } catch {
      // Silently fail — user can still click on the map
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPinPosition([lat, lng]);
  };

  const onSubmit = async (data: PropertyFormData) => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        listingType: data.listingType,
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        area: data.area ? Number(data.area) : undefined,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood || undefined,
        department: data.department,
        latitude: pinPosition ? pinPosition[0] : undefined,
        longitude: pinPosition ? pinPosition[1] : undefined,
        amenities: selectedAmenities,
      };

      const res = await apiClient.post<{ id: string }>('/properties', payload);
      navigate(`/properties/${res.data.id}`, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t.common.error;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none text-sm';

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-rumi-text mb-2">{t.nav.publishProperty}</h1>
      <p className="text-sm text-rumi-text/60 mb-6">{t.property.createSubtitle}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-rumi-primary-light/20 space-y-4">
          <h2 className="text-lg font-semibold text-rumi-text">Informacion basica</h2>

          <div>
            <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.title} *</label>
            <input
              {...register('title', { required: 'Requerido', minLength: { value: 5, message: 'Minimo 5 caracteres' }, maxLength: 200 })}
              className={inputClass}
              placeholder="Ej: Hermoso apartamento en Chapinero"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.description} *</label>
            <textarea
              {...register('description', { required: 'Requerido', minLength: { value: 20, message: 'Minimo 20 caracteres' }, maxLength: 5000 })}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Describe tu inmueble con detalle..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Type + Listing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.type} *</label>
              <select {...register('propertyType', { required: true })} className={`${inputClass} bg-white`}>
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{t.property.types[pt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.listingType} *</label>
              <select {...register('listingType', { required: true })} className={`${inputClass} bg-white`}>
                {LISTING_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{t.property.listingTypes[lt]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price & Specs */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-rumi-primary-light/20 space-y-4">
          <h2 className="text-lg font-semibold text-rumi-text">Precio y caracteristicas</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.price} (COP) *</label>
              <input
                type="number"
                {...register('price', { required: 'Requerido', min: { value: 1, message: 'Debe ser mayor a 0' } })}
                className={inputClass}
                placeholder="Ej: 2500000"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.bedrooms} *</label>
              <input
                type="number"
                min={0}
                max={20}
                {...register('bedrooms', { required: 'Requerido', min: 0, max: 20 })}
                className={inputClass}
                placeholder="3"
              />
              {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.bathrooms} *</label>
              <input
                type="number"
                min={1}
                max={10}
                {...register('bathrooms', { required: 'Requerido', min: 1, max: 10 })}
                className={inputClass}
                placeholder="2"
              />
              {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.area}</label>
            <input
              type="number"
              {...register('area')}
              className={inputClass}
              placeholder="Ej: 85"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-rumi-primary-light/20 space-y-4">
          <h2 className="text-lg font-semibold text-rumi-text">Ubicacion</h2>

          <div>
            <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.address} *</label>
            <input
              {...register('address', { required: 'Requerido', minLength: { value: 5, message: 'Minimo 5 caracteres' } })}
              className={inputClass}
              placeholder="Ej: Calle 63 #7-20"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.city} *</label>
              <input
                {...register('city', { required: 'Requerido', minLength: 2 })}
                className={inputClass}
                placeholder="Ej: Bogota"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.neighborhood}</label>
              <input
                {...register('neighborhood')}
                className={inputClass}
                placeholder="Ej: Chapinero Alto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.property.department} *</label>
              <select
                {...register('department', { required: 'Requerido' })}
                className={`${inputClass} bg-white`}
              >
                <option value="">-- Seleccionar --</option>
                {DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
            </div>
          </div>

          {/* Map Pin */}
          <div className="mt-2">
            <div className="flex items-center gap-3 mb-2">
              <label className="block text-sm font-medium text-rumi-text/70">{t.map.location}</label>
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding}
                className="px-3 py-1.5 text-xs font-medium bg-rumi-primary/10 text-rumi-primary rounded-lg hover:bg-rumi-primary/20 transition-colors disabled:opacity-50"
              >
                {geocoding ? t.common.loading : t.map.searchOnMap}
              </button>
            </div>
            <p className="text-xs text-rumi-text/40 mb-2">{t.map.clickToPlace}</p>
            <div className="rounded-lg overflow-hidden">
              <Suspense fallback={<div className="h-[250px] bg-rumi-primary/5 rounded-lg animate-pulse" />}>
                <PropertyMap
                  markers={pinPosition ? [{
                    id: 'new-property',
                    position: pinPosition,
                    title: getValues('title') || t.map.newPin,
                  }] : []}
                  center={mapCenter}
                  zoom={13}
                  height="250px"
                  onMapClick={handleMapClick}
                />
              </Suspense>
            </div>
            {pinPosition && (
              <p className="text-xs text-rumi-text/40 mt-1">
                {t.map.coordinates}: {pinPosition[0].toFixed(6)}, {pinPosition[1].toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-rumi-primary-light/20">
          <h2 className="text-lg font-semibold text-rumi-text mb-4">{t.property.amenities}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-rumi-primary/10 border-rumi-primary text-rumi-primary'
                    : 'border-gray-300 text-rumi-text/60 hover:border-rumi-primary/40'
                }`}
              >
                {t.property.amenityLabels[amenity as keyof typeof t.property.amenityLabels] || amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-rumi-primary text-white font-semibold rounded-lg hover:bg-rumi-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? t.property.publishing : t.nav.publishProperty}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-rumi-text font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
