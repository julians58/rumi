import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';
import { useAuthStore } from '../store/auth.store';

const PropertyMap = lazy(() => import('../components/ui/PropertyMap'));


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
  latitude: number | string | null;
  longitude: number | string | null;
  amenities: string[];
  images: PropertyImage[];
  owner: PropertyOwner;
  isActive: boolean;
  createdAt: string;
}

function formatPrice(price: number | string): string {
  return Number(price).toLocaleString('es-CO');
}

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi',
  parking: 'Parqueadero',
  laundry: 'Lavanderia',
  gym: 'Gimnasio',
  pool: 'Piscina',
  security: 'Seguridad',
  elevator: 'Ascensor',
  furnished: 'Amoblado',
  pets_allowed: 'Mascotas',
  balcony: 'Balcon',
  air_conditioning: 'Aire acondicionado',
  hot_water: 'Agua caliente',
};

const amenityIcons: Record<string, string> = {
  wifi: '📶',
  parking: '🅿️',
  laundry: '🧺',
  gym: '💪',
  pool: '🏊',
  security: '🔒',
  elevator: '🛗',
  furnished: '🛋️',
  pets_allowed: '🐾',
  balcony: '🌇',
  air_conditioning: '❄️',
  hot_water: '🚿',
};

export function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get<Property>(`/properties/${id}`)
      .then((res) => {
        setProperty(res.data);
        // Record view silently
        apiClient.post(`/properties/${id}/view`).catch(() => {});
      })
      .catch(() => setError('No se encontro la propiedad'))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = property ? property.owner.id === authUser?.userId : false;

  const handleDelete = async () => {
    if (!id || !window.confirm(t.property.deleteConfirm)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/properties/${id}`);
      navigate('/properties');
    } catch {
      setError('Error al eliminar la propiedad');
      setDeleting(false);
    }
  };

  const handleApply = async () => {
    if (!id) return;
    setApplyError('');
    try {
      await apiClient.post('/applications', {
        propertyId: id,
        message: applicationMessage || undefined,
      });
      setApplied(true);
      setApplying(false);
    } catch {
      setApplyError('Error al enviar la aplicacion');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-rumi-text/60">{t.common.loading}</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="py-12 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          {error || t.common.error}
        </div>
        <div className="mt-4">
          <Link to="/properties" className="text-rumi-primary text-sm font-medium hover:underline">
            ← {t.common.back} a {t.nav.properties}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-rumi-primary font-medium hover:underline mb-4 inline-block"
      >
        ← {t.common.back}
      </button>

      {/* Image Gallery */}
      <div className="rounded-2xl overflow-hidden mb-6 bg-rumi-primary/10">
        {property.images.length > 0 ? (
          <div>
            <div className="h-64 sm:h-80 md:h-96 relative">
              <img
                src={property.images[currentImage].url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((i) => (i > 0 ? i - 1 : property.images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentImage((i) => (i < property.images.length - 1 ? i + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  >
                    ›
                  </button>
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {currentImage + 1} / {property.images.length}
                  </span>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {property.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                      i === currentImage ? 'border-rumi-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-6xl text-rumi-primary/30">
            🏠
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Title & badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                property.listingType === 'RENT' ? 'bg-rumi-primary' : 'bg-rumi-accent'
              }`}>
                {t.property.listingTypes[property.listingType as 'RENT' | 'SALE']}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rumi-primary/10 text-rumi-primary">
                {t.property.types[property.propertyType as 'APARTMENT' | 'HOUSE' | 'ROOM' | 'STUDIO']}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-rumi-text">{property.title}</h1>
            <p className="text-rumi-text/50 mt-1">
              {property.address}
              {property.neighborhood ? `, ${property.neighborhood}` : ''}
              , {property.city}, {property.department}
            </p>
          </div>

          {/* Price */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
            <p className="text-3xl font-bold text-rumi-primary">
              ${formatPrice(property.price)}{' '}
              <span className="text-base font-normal text-rumi-text/50">
                {property.currency}
                {property.listingType === 'RENT' ? t.property.perMonth : ''}
              </span>
            </p>
          </div>

          {/* Specs */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-rumi-text">{property.bedrooms}</p>
                <p className="text-sm text-rumi-text/50">{t.property.bedrooms}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rumi-text">{property.bathrooms}</p>
                <p className="text-sm text-rumi-text/50">{t.property.bathrooms}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rumi-text">{property.area ? `${Number(property.area)}` : '—'}</p>
                <p className="text-sm text-rumi-text/50">{t.property.area}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
            <h2 className="text-lg font-semibold text-rumi-text mb-3">{t.property.description}</h2>
            <p className="text-rumi-text/80 leading-relaxed whitespace-pre-wrap">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
              <h2 className="text-lg font-semibold text-rumi-text mb-3">{t.property.amenities}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-rumi-text/70">
                    <span>{amenityIcons[amenity] || '✓'}</span>
                    <span>{amenityLabels[amenity] || amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Map */}
          {property.latitude && property.longitude && (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
              <h2 className="text-lg font-semibold text-rumi-text mb-3">{t.map.location}</h2>
              <div className="rounded-lg overflow-hidden">
                <Suspense fallback={<div className="h-[300px] bg-rumi-primary/5 rounded-lg animate-pulse" />}>
                  <PropertyMap
                    markers={[{
                      id: property.id,
                      position: [Number(property.latitude), Number(property.longitude)],
                      title: property.title,
                    }]}
                    center={[Number(property.latitude), Number(property.longitude)]}
                    zoom={15}
                    height="300px"
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
            <h3 className="text-sm font-medium text-rumi-text/50 mb-3">{t.property.owner}</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rumi-primary/20 flex items-center justify-center text-lg font-bold text-rumi-primary shrink-0">
                {property.owner.firstName[0]}{property.owner.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-rumi-text">
                  {property.owner.firstName} {property.owner.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Owner Panel or Apply Card */}
          {isOwner ? (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
              <h3 className="text-sm font-medium text-rumi-text/50 mb-3">{t.property.yourProperty}</h3>
              <Link
                to="/applications"
                className="flex items-center justify-between p-3 bg-rumi-primary/5 rounded-lg mb-3 hover:bg-rumi-primary/10 transition-colors"
              >
                <span className="text-sm font-medium text-rumi-text">
                  📋 {t.property.seeApplications}
                </span>
                <span className="text-xs font-semibold text-rumi-primary">
                  {t.common.seeMore} →
                </span>
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? t.common.loading : t.common.delete}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-rumi-primary-light/20">
              {applied ? (
                <div className="text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-rumi-primary font-semibold">Aplicacion enviada</p>
                  <p className="text-sm text-rumi-text/50 mt-1">El propietario revisara tu solicitud</p>
                </div>
              ) : applying ? (
                <div>
                  <h3 className="text-sm font-medium text-rumi-text/50 mb-3">{t.property.apply}</h3>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none resize-none mb-3"
                    placeholder={t.application.message}
                  />
                  {applyError && (
                    <p className="text-red-500 text-xs mb-2">{applyError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleApply}
                      className="flex-1 py-2 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
                    >
                      {t.common.confirm}
                    </button>
                    <button
                      onClick={() => { setApplying(false); setApplyError(''); }}
                      className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setApplying(true)}
                  className="w-full py-3 bg-rumi-primary text-white font-semibold rounded-lg hover:bg-rumi-primary/90 transition-colors"
                >
                  {t.property.apply}
                </button>
              )}
            </div>
          )}

          {/* Published date */}
          <div className="text-center">
            <p className="text-xs text-rumi-text/40">
              {t.property.publishedOn}{' '}
              {new Date(property.createdAt).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
