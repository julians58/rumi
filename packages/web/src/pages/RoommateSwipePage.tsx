import { useEffect, useState, useCallback, useRef } from 'react';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Modal } from '../components/ui/Modal';
import { RangeSlider } from '../components/ui/RangeSlider';
import { IconHeart, IconX, IconSearch, IconMapPin, IconCalendar, IconMoney } from '../components/ui/Icons';

interface Lifestyle {
  smoking?: boolean;
  pets?: boolean;
  schedule?: 'early_bird' | 'night_owl' | 'flexible';
  cleanliness?: 'very_clean' | 'clean' | 'moderate' | 'relaxed';
  guests?: 'often' | 'sometimes' | 'rarely' | 'never';
}

interface RoommateProfile {
  id: string;
  budget: number | string;
  preferredCity: string;
  preferredNeighborhoods: string[];
  moveInDate: string | null;
  bio: string | null;
  occupation: string | null;
  age: number | null;
  lifestyle: Lifestyle | null;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  roommateProfile: RoommateProfile | null;
}

interface Filters {
  ageRange: [number, number];
  city: string;
  smoking: boolean | null;
  pets: boolean | null;
  schedule: string | null;
  cleanliness: string | null;
  guests: string | null;
  gender: string | null;
  language: string[];
}

const DEFAULT_FILTERS: Filters = {
  ageRange: [18, 71],
  city: '',
  smoking: null,
  pets: null,
  schedule: null,
  cleanliness: null,
  guests: null,
  gender: null,
  language: [],
};

function formatBudget(budget: number | string): string {
  return Number(budget).toLocaleString('es-CO');
}

function buildQueryString(filters: Filters): string {
  const params = new URLSearchParams({ limit: '20' });
  if (filters.ageRange[0] !== 18) params.set('ageMin', String(filters.ageRange[0]));
  if (filters.ageRange[1] !== 71) params.set('ageMax', String(filters.ageRange[1]));
  if (filters.city) params.set('city', filters.city);
  if (filters.smoking !== null) params.set('smoking', String(filters.smoking));
  if (filters.pets !== null) params.set('pets', String(filters.pets));
  if (filters.schedule) params.set('schedule', filters.schedule);
  if (filters.cleanliness) params.set('cleanliness', filters.cleanliness);
  if (filters.guests) params.set('guests', filters.guests);
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.language.length > 0) params.set('language', filters.language.join(','));
  return params.toString();
}

function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.ageRange[0] !== 18 ||
    filters.ageRange[1] !== 71 ||
    filters.city !== '' ||
    filters.smoking !== null ||
    filters.pets !== null ||
    filters.schedule !== null ||
    filters.cleanliness !== null ||
    filters.guests !== null ||
    filters.gender !== null ||
    filters.language.length > 0
  );
}

const SWIPE_THRESHOLD = 100;

// Filter chip component
function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
        selected
          ? 'bg-rumi-primary text-white border-rumi-primary'
          : 'bg-white text-rumi-text/60 border-rumi-primary-light/30 hover:border-rumi-primary/40'
      }`}
    >
      {label}
    </button>
  );
}

export function RoommateSwipePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swiping, setSwiping] = useState(false);
  const [showMatch, setShowMatch] = useState<Candidate | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...DEFAULT_FILTERS });

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchCandidates = useCallback(async (filtersToUse: Filters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const qs = buildQueryString(filtersToUse);
      const res = await apiClient.get<Candidate[]>(`/roommates/candidates?${qs}`);
      setCandidates(res.data);
      setCurrentIndex(0);
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) return;
      }
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCandidates(DEFAULT_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCandidate = candidates[currentIndex] ?? null;
  const isEmpty = !loading && !currentCandidate;

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setShowFilters(false);
    fetchCandidates(filters);
  };

  const handleClearFilters = () => {
    const cleared = { ...DEFAULT_FILTERS };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setShowFilters(false);
    fetchCandidates(cleared);
  };

  const handleSwipe = async (action: 'LIKE' | 'PASS') => {
    if (!currentCandidate || swiping) return;
    setSwiping(true);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(action === 'LIKE' ? 'right' : 'left');

    try {
      const res = await apiClient.post<{ matched: boolean; matchId?: string }>('/roommates/swipe', {
        candidateId: currentCandidate.id,
        action,
      });

      await new Promise((r) => setTimeout(r, 300));
      setSwipeDirection(null);

      if (res.data.matched) {
        setShowMatch(currentCandidate);
      }

      setCurrentIndex((prev) => prev + 1);

      if (currentIndex >= candidates.length - 3) {
        const qs = buildQueryString(appliedFilters);
        const more = await apiClient.get<Candidate[]>(`/roommates/candidates?${qs}`);
        if (more.data.length > 0) {
          setCandidates((prev) => [...prev, ...more.data]);
        }
      }
    } catch {
      setError(t.common.error);
      setSwipeDirection(null);
    } finally {
      setSwiping(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (swiping) return;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || swiping) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    setDragOffset({ x: dx, y: dy * 0.3 });
  };

  const handleTouchEnd = () => {
    if (!isDragging || swiping) return;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleSwipe(dragOffset.x > 0 ? 'LIKE' : 'PASS');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (swiping) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || swiping) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setDragOffset({ x: dx, y: dy * 0.3 });
    },
    [isDragging, swiping],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || swiping) return;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      handleSwipe(dragOffset.x > 0 ? 'LIKE' : 'PASS');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, swiping, dragOffset.x]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showMatch || showFilters) return;
      if (e.key === 'ArrowLeft') handleSwipe('PASS');
      if (e.key === 'ArrowRight') handleSwipe('LIKE');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCandidate, swiping, showMatch, showFilters]);

  const rotation = dragOffset.x * 0.1;
  const likeOpacity = Math.min(Math.max(dragOffset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-dragOffset.x / SWIPE_THRESHOLD, 0), 1);

  const cardStyle = swipeDirection
    ? undefined
    : {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
      };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-4 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-rumi-text">{t.roommate.lookingFor}</h1>
        <p className="text-sm text-rumi-text/50 mt-1">{t.roommate.subtitle}</p>
      </div>

      {/* Filter toggle button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => { setShowFilters(!showFilters); if (!showFilters) setFilters({ ...appliedFilters }); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
            hasActiveFilters(appliedFilters)
              ? 'bg-rumi-primary text-white border-rumi-primary'
              : 'bg-white text-rumi-text/60 border-rumi-primary-light/30 hover:border-rumi-primary/40'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {hasActiveFilters(appliedFilters) && (
            <span className="w-2 h-2 rounded-full bg-white" />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-rumi-primary-light/15 p-5 mb-6 animate-fade-in-up space-y-5">
          {/* Age range */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Rango de edad</p>
            <RangeSlider
              min={18}
              max={71}
              value={filters.ageRange}
              onChange={(val) => setFilters({ ...filters, ageRange: val })}
              minLabel="18"
              maxLabel="70+"
              formatValue={(v) => (v >= 71 ? '70+' : String(v))}
            />
          </div>

          {/* City */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Ciudad</p>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Ej: Bogota, Medellin..."
              className="w-full px-4 py-2 rounded-xl border-2 border-rumi-primary-light/30 bg-white text-sm text-rumi-text focus:outline-none focus:border-rumi-primary focus:ring-4 focus:ring-rumi-primary/10 transition-all"
            />
          </div>

          {/* Smoking */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Fumador</p>
            <div className="flex gap-2 flex-wrap">
              <FilterChip label="No fuma" selected={filters.smoking === false} onClick={() => setFilters({ ...filters, smoking: filters.smoking === false ? null : false })} />
              <FilterChip label="Fuma" selected={filters.smoking === true} onClick={() => setFilters({ ...filters, smoking: filters.smoking === true ? null : true })} />
            </div>
          </div>

          {/* Pets */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Mascotas</p>
            <div className="flex gap-2 flex-wrap">
              <FilterChip label="Sin mascotas" selected={filters.pets === false} onClick={() => setFilters({ ...filters, pets: filters.pets === false ? null : false })} />
              <FilterChip label="Con mascotas" selected={filters.pets === true} onClick={() => setFilters({ ...filters, pets: filters.pets === true ? null : true })} />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Horario</p>
            <div className="flex gap-2 flex-wrap">
              {([['early_bird', 'Madrugador'], ['night_owl', 'Nocturno'], ['flexible', 'Flexible']] as const).map(([val, label]) => (
                <FilterChip key={val} label={label} selected={filters.schedule === val} onClick={() => setFilters({ ...filters, schedule: filters.schedule === val ? null : val })} />
              ))}
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Orden</p>
            <div className="flex gap-2 flex-wrap">
              {([['very_clean', 'Muy ordenado'], ['clean', 'Ordenado'], ['moderate', 'Moderado'], ['relaxed', 'Relajado']] as const).map(([val, label]) => (
                <FilterChip key={val} label={label} selected={filters.cleanliness === val} onClick={() => setFilters({ ...filters, cleanliness: filters.cleanliness === val ? null : val })} />
              ))}
            </div>
          </div>

          {/* Guests */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Invitados</p>
            <div className="flex gap-2 flex-wrap">
              {([['often', 'Frecuentemente'], ['sometimes', 'A veces'], ['rarely', 'Raramente'], ['never', 'Nunca']] as const).map(([val, label]) => (
                <FilterChip key={val} label={label} selected={filters.guests === val} onClick={() => setFilters({ ...filters, guests: filters.guests === val ? null : val })} />
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Genero</p>
            <div className="flex gap-2 flex-wrap">
              {([['MALE', 'Masculino'], ['FEMALE', 'Femenino'], ['NON_BINARY', 'No binario']] as const).map(([val, label]) => (
                <FilterChip key={val} label={label} selected={filters.gender === val} onClick={() => setFilters({ ...filters, gender: filters.gender === val ? null : val })} />
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-sm font-semibold text-rumi-text/70 mb-2">Idioma</p>
            <div className="flex gap-2 flex-wrap">
              {([['SPANISH', 'Español'], ['ENGLISH', 'Inglés'], ['OTHER', 'Otro']] as const).map(([val, label]) => (
                <FilterChip
                  key={val}
                  label={label}
                  selected={filters.language.includes(val)}
                  onClick={() => setFilters({ ...filters, language: filters.language.includes(val) ? filters.language.filter((l) => l !== val) : [...filters.language, val] })}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button variant="primary" fullWidth onClick={handleApplyFilters}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      <ErrorAlert message={error} className="mb-6" />

      {loading && <LoadingState text={t.common.loading} />}

      {isEmpty && (
        <EmptyState
          icon={<IconSearch className="w-10 h-10" />}
          title={t.roommate.noMoreCandidates}
          description={t.roommate.noMoreSubtitle}
          action={{ label: t.common.search, onClick: () => fetchCandidates(appliedFilters) }}
        />
      )}

      {/* Card */}
      {!loading && currentCandidate && (
        <div className="relative">
          <div
            ref={cardRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            style={cardStyle}
            className={`bg-white rounded-3xl shadow-xl border border-rumi-primary-light/15 overflow-hidden select-none cursor-grab active:cursor-grabbing ${
              swipeDirection === 'left'
                ? '-translate-x-[150%] opacity-0 rotate-[-20deg] transition-all duration-300'
                : swipeDirection === 'right'
                  ? 'translate-x-[150%] opacity-0 rotate-[20deg] transition-all duration-300'
                  : ''
            }`}
          >
            {/* LIKE / PASS overlay indicators */}
            {!swipeDirection && (likeOpacity > 0 || passOpacity > 0) && (
              <>
                <div
                  className="absolute top-6 left-6 z-10 px-4 py-2 border-4 border-green-500 rounded-xl"
                  style={{ opacity: likeOpacity, transform: `rotate(-20deg)` }}
                >
                  <span className="text-green-500 text-2xl font-black tracking-wider">LIKE</span>
                </div>
                <div
                  className="absolute top-6 right-6 z-10 px-4 py-2 border-4 border-red-500 rounded-xl"
                  style={{ opacity: passOpacity, transform: `rotate(20deg)` }}
                >
                  <span className="text-red-500 text-2xl font-black tracking-wider">NOPE</span>
                </div>
              </>
            )}

            {/* Avatar / Photo */}
            <div className="h-64 bg-gradient-to-br from-rumi-primary/15 to-rumi-accent/15 flex items-center justify-center relative pointer-events-none">
              {currentCandidate.avatarUrl ? (
                <img
                  src={currentCandidate.avatarUrl}
                  alt={currentCandidate.firstName}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <Avatar
                  name={`${currentCandidate.firstName} ${currentCandidate.lastName}`}
                  size="xl"
                  className="ring-0 w-24 h-24 text-3xl"
                />
              )}
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h2 className="text-2xl font-bold text-white">
                  {currentCandidate.firstName} {currentCandidate.lastName}
                  {currentCandidate.roommateProfile?.age && (
                    <span className="font-normal text-lg ml-2">{currentCandidate.roommateProfile.age} {t.profile.yearsOld}</span>
                  )}
                </h2>
                {currentCandidate.roommateProfile?.occupation && (
                  <p className="text-white/80 text-sm mt-0.5">{currentCandidate.roommateProfile.occupation}</p>
                )}
              </div>
            </div>

            {/* Profile info */}
            <div className="p-5 space-y-4">
              {/* Key details */}
              {currentCandidate.roommateProfile ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="primary" size="md" icon={<IconMoney className="w-3.5 h-3.5" />}>
                      ${formatBudget(currentCandidate.roommateProfile.budget)} /mes
                    </Badge>
                    <Badge variant="accent" size="md" icon={<IconMapPin className="w-3.5 h-3.5" />}>
                      {currentCandidate.roommateProfile.preferredCity}
                    </Badge>
                    {currentCandidate.roommateProfile.moveInDate && (
                      <Badge variant="success" size="md" icon={<IconCalendar className="w-3.5 h-3.5" />}>
                        {new Date(currentCandidate.roommateProfile.moveInDate).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                      </Badge>
                    )}
                  </div>

                  {/* Bio */}
                  {currentCandidate.roommateProfile.bio && (
                    <p className="text-rumi-text/60 text-sm leading-relaxed">
                      {currentCandidate.roommateProfile.bio}
                    </p>
                  )}

                  {/* Neighborhoods */}
                  {currentCandidate.roommateProfile.preferredNeighborhoods.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider mb-1.5">Barrios preferidos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCandidate.roommateProfile.preferredNeighborhoods.map((n) => (
                          <Badge key={n} variant="neutral" size="sm">{n}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lifestyle tags */}
                  {currentCandidate.roommateProfile.lifestyle && (
                    <div>
                      <p className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider mb-1.5">{t.roommate.lifestyle}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCandidate.roommateProfile.lifestyle.smoking !== undefined && (
                          <Badge variant="neutral" size="sm">
                            {currentCandidate.roommateProfile.lifestyle.smoking ? 'Fuma' : 'No fuma'}
                          </Badge>
                        )}
                        {currentCandidate.roommateProfile.lifestyle.pets !== undefined && (
                          <Badge variant="neutral" size="sm">
                            Mascotas: {currentCandidate.roommateProfile.lifestyle.pets ? t.roommate.yes : t.roommate.no}
                          </Badge>
                        )}
                        {currentCandidate.roommateProfile.lifestyle.schedule && (
                          <Badge variant="neutral" size="sm">
                            {t.roommate.scheduleValues[currentCandidate.roommateProfile.lifestyle.schedule]}
                          </Badge>
                        )}
                        {currentCandidate.roommateProfile.lifestyle.cleanliness && (
                          <Badge variant="neutral" size="sm">
                            {t.roommate.cleanlinessValues[currentCandidate.roommateProfile.lifestyle.cleanliness]}
                          </Badge>
                        )}
                        {currentCandidate.roommateProfile.lifestyle.guests && (
                          <Badge variant="neutral" size="sm">
                            Invitados: {t.roommate.guestsValues[currentCandidate.roommateProfile.lifestyle.guests]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-rumi-text/40 text-sm italic">Perfil de compañero aún no completado</p>
              )}
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="flex justify-center gap-8 mt-6">
            <button
              onClick={() => handleSwipe('PASS')}
              disabled={swiping}
              className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-red-200 flex items-center justify-center text-red-400 hover:scale-110 hover:shadow-xl hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-50 disabled:hover:scale-100"
              title={t.roommate.swipeLeft}
            >
              <IconX className="w-7 h-7" />
            </button>
            <button
              onClick={() => handleSwipe('LIKE')}
              disabled={swiping}
              className="w-16 h-16 rounded-full bg-rumi-primary shadow-lg shadow-rumi-primary/25 border-2 border-rumi-primary flex items-center justify-center text-white hover:scale-110 hover:shadow-xl hover:shadow-rumi-primary/30 transition-all disabled:opacity-50 disabled:hover:scale-100"
              title={t.roommate.swipeRight}
            >
              <IconHeart className="w-7 h-7" />
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-rumi-text/25 mt-3">
            &larr; {t.roommate.swipeLeft} &nbsp;|&nbsp; {t.roommate.swipeRight} &rarr;
          </p>
        </div>
      )}

      {/* Match modal */}
      <Modal isOpen={!!showMatch} onClose={() => setShowMatch(null)} size="sm">
        {showMatch && (
          <div className="-mx-6 -mt-6">
            <div className="bg-gradient-to-br from-rumi-primary to-rumi-accent p-8 text-center rounded-t-2xl">
              <div className="text-5xl mb-3 animate-gentle-float">&#127881;</div>
              <h2 className="text-2xl font-bold text-white">{t.roommate.itsAMatch}</h2>
              <p className="text-white/80 mt-2">{t.roommate.matchMessage}</p>
            </div>
            <div className="p-6 text-center">
              <Avatar
                src={showMatch.avatarUrl}
                name={`${showMatch.firstName} ${showMatch.lastName}`}
                size="xl"
                className="mx-auto mb-3"
              />
              <p className="text-lg font-semibold text-rumi-text">
                {showMatch.firstName} {showMatch.lastName}
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <Link to="/matches">
                  <Button variant="primary" fullWidth>
                    {t.roommate.startChat}
                  </Button>
                </Link>
                <Button variant="ghost" fullWidth onClick={() => setShowMatch(null)}>
                  {t.roommate.keepSwiping}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
