import { useEffect, useState, useCallback, useRef } from 'react';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';
import { Link } from 'react-router-dom';

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
  roommateProfile: RoommateProfile;
}

function formatBudget(budget: number | string): string {
  return Number(budget).toLocaleString('es-CO');
}

const SWIPE_THRESHOLD = 100; // px to trigger swipe

export function RoommateSwipePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swiping, setSwiping] = useState(false);
  const [showMatch, setShowMatch] = useState<Candidate | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Touch/drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<Candidate[]>('/roommates/candidates?limit=20');
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
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const currentCandidate = candidates[currentIndex] ?? null;
  const isEmpty = !loading && !currentCandidate;

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
        const more = await apiClient.get<Candidate[]>('/roommates/candidates?limit=20');
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

  // Mouse drag handlers (for desktop drag)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showMatch) return;
      if (e.key === 'ArrowLeft') handleSwipe('PASS');
      if (e.key === 'ArrowRight') handleSwipe('LIKE');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCandidate, swiping, showMatch]);

  // Card transform based on drag or swipe animation
  const rotation = dragOffset.x * 0.1;
  const likeOpacity = Math.min(Math.max(dragOffset.x / SWIPE_THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-dragOffset.x / SWIPE_THRESHOLD, 0), 1);

  const cardStyle = swipeDirection
    ? undefined // CSS classes handle the fly-off animation
    : {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
      };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-rumi-text">{t.roommate.lookingFor}</h1>
        <p className="text-sm text-rumi-text/60 mt-1">{t.roommate.subtitle}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-6">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <p className="text-rumi-text/60">{t.common.loading}</p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium text-rumi-text/60">{t.roommate.noMoreCandidates}</p>
          <p className="text-sm text-rumi-text/40 mt-2">{t.roommate.noMoreSubtitle}</p>
          <button
            onClick={fetchCandidates}
            className="mt-6 px-6 py-2.5 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
          >
            {t.common.search}
          </button>
        </div>
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
            className={`bg-white rounded-2xl shadow-lg border border-rumi-primary-light/20 overflow-hidden select-none cursor-grab active:cursor-grabbing ${
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
                  className="absolute top-6 left-6 z-10 px-4 py-2 border-4 border-green-500 rounded-lg"
                  style={{ opacity: likeOpacity, transform: `rotate(-20deg)` }}
                >
                  <span className="text-green-500 text-2xl font-black tracking-wider">LIKE</span>
                </div>
                <div
                  className="absolute top-6 right-6 z-10 px-4 py-2 border-4 border-red-500 rounded-lg"
                  style={{ opacity: passOpacity, transform: `rotate(20deg)` }}
                >
                  <span className="text-red-500 text-2xl font-black tracking-wider">NOPE</span>
                </div>
              </>
            )}

            {/* Avatar / Photo */}
            <div className="h-64 bg-gradient-to-br from-rumi-primary/20 to-rumi-accent/20 flex items-center justify-center relative pointer-events-none">
              {currentCandidate.avatarUrl ? (
                <img
                  src={currentCandidate.avatarUrl}
                  alt={currentCandidate.firstName}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <span className="text-7xl">👤</span>
              )}
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h2 className="text-2xl font-bold text-white">
                  {currentCandidate.firstName} {currentCandidate.lastName}
                  {currentCandidate.roommateProfile.age && (
                    <span className="font-normal text-lg ml-2">{currentCandidate.roommateProfile.age} {t.profile.yearsOld}</span>
                  )}
                </h2>
                {currentCandidate.roommateProfile.occupation && (
                  <p className="text-white/80 text-sm mt-0.5">{currentCandidate.roommateProfile.occupation}</p>
                )}
              </div>
            </div>

            {/* Profile info */}
            <div className="p-5 space-y-4">
              {/* Key details */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rumi-primary/10 text-rumi-primary text-sm font-medium">
                  💰 ${formatBudget(currentCandidate.roommateProfile.budget)} /mes
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rumi-accent/10 text-rumi-accent text-sm font-medium">
                  📍 {currentCandidate.roommateProfile.preferredCity}
                </span>
                {currentCandidate.roommateProfile.moveInDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                    📅 {new Date(currentCandidate.roommateProfile.moveInDate).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Bio */}
              {currentCandidate.roommateProfile.bio && (
                <p className="text-rumi-text/70 text-sm leading-relaxed">
                  {currentCandidate.roommateProfile.bio}
                </p>
              )}

              {/* Neighborhoods */}
              {currentCandidate.roommateProfile.preferredNeighborhoods.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-rumi-text/50 mb-1.5">Barrios preferidos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCandidate.roommateProfile.preferredNeighborhoods.map((n) => (
                      <span key={n} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-rumi-text/70">{n}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle tags */}
              {currentCandidate.roommateProfile.lifestyle && (
                <div>
                  <p className="text-xs font-medium text-rumi-text/50 mb-1.5">{t.roommate.lifestyle}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCandidate.roommateProfile.lifestyle.smoking !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-rumi-text/70">
                        {currentCandidate.roommateProfile.lifestyle.smoking ? '🚬' : '🚭'} {currentCandidate.roommateProfile.lifestyle.smoking ? t.roommate.yes : t.roommate.no}
                      </span>
                    )}
                    {currentCandidate.roommateProfile.lifestyle.pets !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-rumi-text/70">
                        🐾 {currentCandidate.roommateProfile.lifestyle.pets ? t.roommate.yes : t.roommate.no}
                      </span>
                    )}
                    {currentCandidate.roommateProfile.lifestyle.schedule && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-rumi-text/70">
                        🕐 {t.roommate.scheduleValues[currentCandidate.roommateProfile.lifestyle.schedule]}
                      </span>
                    )}
                    {currentCandidate.roommateProfile.lifestyle.cleanliness && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-rumi-text/70">
                        🧹 {t.roommate.cleanlinessValues[currentCandidate.roommateProfile.lifestyle.cleanliness]}
                      </span>
                    )}
                    {currentCandidate.roommateProfile.lifestyle.guests && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-rumi-text/70">
                        👥 {t.roommate.guestsValues[currentCandidate.roommateProfile.lifestyle.guests]}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Swipe buttons */}
          <div className="flex justify-center gap-6 mt-6">
            <button
              onClick={() => handleSwipe('PASS')}
              disabled={swiping}
              className="w-16 h-16 rounded-full bg-white shadow-lg border border-red-200 flex items-center justify-center text-2xl hover:scale-110 hover:shadow-xl transition-all disabled:opacity-50 disabled:hover:scale-100"
              title={t.roommate.swipeLeft}
            >
              ✕
            </button>
            <button
              onClick={() => handleSwipe('LIKE')}
              disabled={swiping}
              className="w-16 h-16 rounded-full bg-rumi-primary shadow-lg border border-rumi-primary flex items-center justify-center text-2xl text-white hover:scale-110 hover:shadow-xl transition-all disabled:opacity-50 disabled:hover:scale-100"
              title={t.roommate.swipeRight}
            >
              ♥
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-rumi-text/30 mt-3">
            ← {t.roommate.swipeLeft} &nbsp;|&nbsp; {t.roommate.swipeRight} →
          </p>
        </div>
      )}

      {/* Match modal */}
      {showMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-[bounce-in_0.4s_ease-out]">
            <div className="bg-gradient-to-br from-rumi-primary to-rumi-accent p-8 text-center">
              <p className="text-5xl mb-3">🎉</p>
              <h2 className="text-2xl font-bold text-white">{t.roommate.itsAMatch}</h2>
              <p className="text-white/80 mt-2">{t.roommate.matchMessage}</p>
            </div>

            <div className="p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-rumi-primary/10 flex items-center justify-center text-4xl mb-3">
                {showMatch.avatarUrl ? (
                  <img src={showMatch.avatarUrl} alt={showMatch.firstName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <p className="text-lg font-semibold text-rumi-text">
                {showMatch.firstName} {showMatch.lastName}
              </p>

              <div className="flex flex-col gap-3 mt-6">
                <Link
                  to="/matches"
                  className="px-6 py-2.5 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
                >
                  {t.roommate.startChat}
                </Link>
                <button
                  onClick={() => setShowMatch(null)}
                  className="px-6 py-2.5 text-sm font-medium text-rumi-text/60 hover:text-rumi-text transition-colors"
                >
                  {t.roommate.keepSwiping}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
