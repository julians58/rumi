import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { IconStar, IconArrowLeft } from '../components/ui/Icons';

interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  occupation: string | null;
  nationality: string | null;
  gender: string | null;
  preferences: Record<string, unknown> | null;
  createdAt: string;
}

interface RatingBreakdown {
  average: number | null;
  count: number;
}

interface UserRatings {
  overall: number | null;
  landlord: RatingBreakdown;
  tenant: RatingBreakdown;
  roommate: RatingBreakdown;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <IconStar
          key={star}
          className={`w-4 h-4 ${star <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-rumi-text/15'}`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-rumi-text">{score.toFixed(1)}</span>
    </div>
  );
}

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [ratings, setRatings] = useState<UserRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, ratingsRes] = await Promise.all([
          apiClient.get<PublicProfile>(`/users/${id}`),
          apiClient.get<UserRatings>(`/users/${id}/ratings`),
        ]);
        setProfile(profileRes.data);
        setRatings(ratingsRes.data);
      } catch {
        setError(t.common.error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <LoadingState text={t.common.loading} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-lg text-rumi-text/40 hover:text-rumi-text hover:bg-rumi-text/5 transition-colors"
          >
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-rumi-text">Perfil</h1>
        </div>
        <ErrorAlert message={error || 'Usuario no encontrado'} />
      </div>
    );
  }

  const prefs = profile.preferences as {
    myTraits?: {
      worksOutside?: boolean;
      schedule?: string;
      hasPets?: boolean;
      hasChildren?: boolean;
      smokes?: boolean;
      drinks?: string;
      hasFrequentVisitors?: boolean;
      cleanliness?: string;
      personality?: string[];
    };
  } | null;

  const traitBadges: { label: string; variant: 'primary' | 'accent' | 'success' | 'neutral' }[] = [];
  if (prefs?.myTraits) {
    const traits = prefs.myTraits;
    if (traits.smokes === true) traitBadges.push({ label: 'Fuma', variant: 'neutral' });
    if (traits.smokes === false) traitBadges.push({ label: 'No fuma', variant: 'success' });
    if (traits.hasPets === true) traitBadges.push({ label: 'Tiene mascotas', variant: 'neutral' });
    if (traits.hasPets === false) traitBadges.push({ label: 'Sin mascotas', variant: 'neutral' });
    if (traits.schedule === 'MORNING') traitBadges.push({ label: 'Madrugador', variant: 'primary' });
    if (traits.schedule === 'AFTERNOON') traitBadges.push({ label: 'Diurno', variant: 'primary' });
    if (traits.schedule === 'NIGHT') traitBadges.push({ label: 'Nocturno', variant: 'primary' });
    if (traits.cleanliness) {
      const cleanMap: Record<string, string> = { VERY_CLEAN: 'Muy ordenado', CLEAN: 'Ordenado', MODERATE: 'Moderado', RELAXED: 'Relajado' };
      traitBadges.push({ label: cleanMap[traits.cleanliness] ?? traits.cleanliness, variant: 'accent' });
    }
    if (traits.personality) {
      const persMap: Record<string, string> = { INTROVERT: 'Introvertido', EXTROVERT: 'Extrovertido', CALM: 'Tranquilo', SOCIAL: 'Social', STUDIOUS: 'Estudioso', ACTIVE: 'Activo' };
      for (const p of traits.personality) {
        traitBadges.push({ label: persMap[p] ?? p, variant: 'accent' });
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-lg text-rumi-text/40 hover:text-rumi-text hover:bg-rumi-text/5 transition-colors"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-rumi-text">Perfil del usuario</h1>
      </div>

      <Card variant="elevated" padding="lg" className="animate-fade-in-up">
        {/* Header */}
        <div className="flex items-start gap-5">
          <Avatar
            src={profile.avatarUrl}
            name={`${profile.firstName} ${profile.lastName}`}
            size="xl"
            className="ring-4 ring-rumi-primary/10"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-rumi-text">
              {profile.firstName} {profile.lastName}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.age && (
                <Badge variant="primary" size="md">{profile.age} {t.profile.yearsOld}</Badge>
              )}
              {profile.gender && (
                <Badge variant="accent" size="md">{t.gender[profile.gender as keyof typeof t.gender] ?? profile.gender}</Badge>
              )}
              {profile.occupation && (
                <Badge variant="neutral" size="md">{profile.occupation}</Badge>
              )}
              {profile.nationality && (
                <Badge variant="neutral" size="md">{profile.nationality}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-rumi-text/50 uppercase tracking-wider mb-2">{t.profile.bio}</p>
            <p className="text-rumi-text/70 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Traits */}
        {traitBadges.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-rumi-text/50 uppercase tracking-wider mb-2">Estilo de vida</p>
            <div className="flex flex-wrap gap-2">
              {traitBadges.map((badge, i) => (
                <Badge key={i} variant={badge.variant} size="md">{badge.label}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        {ratings && ratings.overall !== null && (
          <div className="mt-6 pt-6 border-t border-rumi-primary-light/15">
            <p className="text-sm font-semibold text-rumi-text/50 uppercase tracking-wider mb-3">{t.rating.overall}</p>
            <StarRating score={ratings.overall} />

            <div className="grid grid-cols-3 gap-4 mt-4">
              {ratings.landlord.count > 0 && (
                <div className="text-center">
                  <p className="text-xs text-rumi-text/40 mb-1">{t.rating.asLandlord}</p>
                  <p className="text-lg font-bold text-rumi-text">{ratings.landlord.average?.toFixed(1)}</p>
                  <p className="text-xs text-rumi-text/30">({ratings.landlord.count})</p>
                </div>
              )}
              {ratings.tenant.count > 0 && (
                <div className="text-center">
                  <p className="text-xs text-rumi-text/40 mb-1">{t.rating.asTenant}</p>
                  <p className="text-lg font-bold text-rumi-text">{ratings.tenant.average?.toFixed(1)}</p>
                  <p className="text-xs text-rumi-text/30">({ratings.tenant.count})</p>
                </div>
              )}
              {ratings.roommate.count > 0 && (
                <div className="text-center">
                  <p className="text-xs text-rumi-text/40 mb-1">{t.rating.asRoommate}</p>
                  <p className="text-lg font-bold text-rumi-text">{ratings.roommate.average?.toFixed(1)}</p>
                  <p className="text-xs text-rumi-text/30">({ratings.roommate.count})</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Member since */}
        <div className="mt-6 pt-4 border-t border-rumi-primary-light/15">
          <p className="text-xs text-rumi-text/30">
            {t.profile.memberSince} {new Date(profile.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </Card>
    </div>
  );
}
