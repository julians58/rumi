import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n/es';
import apiClient from '../services/api-client';

interface RoommateProfile {
  budget: number | string;
  preferredCity: string;
  bio: string | null;
  occupation: string | null;
  age: number | null;
}

interface MatchedUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  roommateProfile: RoommateProfile | null;
}

interface Match {
  id: string;
  createdAt: string;
  matchedUser: MatchedUser;
  conversationId: string | null;
}

function formatBudget(budget: number | string): string {
  return Number(budget).toLocaleString('es-CO');
}

export function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null);
  const [confirmUnmatch, setConfirmUnmatch] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<Match[]>('/matches');
      setMatches(res.data);
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleUnmatch = async (matchId: string) => {
    setUnmatchingId(matchId);
    try {
      await apiClient.delete(`/matches/${matchId}`);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setConfirmUnmatch(null);
    } catch {
      setError(t.common.error);
    } finally {
      setUnmatchingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-rumi-text">{t.nav.matches}</h1>
          <p className="text-sm text-rumi-text/60 mt-1">
            {matches.length > 0
              ? `${matches.length} match${matches.length === 1 ? '' : 'es'}`
              : ''}
          </p>
        </div>
        <Link
          to="/roommates"
          className="px-4 py-2 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
        >
          {t.roommate.goSwipe}
        </Link>
      </div>

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

      {/* Empty state */}
      {!loading && matches.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">💜</p>
          <p className="text-lg font-medium text-rumi-text/60">{t.roommate.noMatches}</p>
          <p className="text-sm text-rumi-text/40 mt-2">{t.roommate.noMatchesSubtitle}</p>
          <Link
            to="/roommates"
            className="inline-block mt-6 px-6 py-2.5 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
          >
            {t.roommate.goSwipe}
          </Link>
        </div>
      )}

      {/* Match list */}
      {!loading && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl shadow-md border border-rumi-primary-light/20 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-rumi-primary/10 flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden">
                  {match.matchedUser.avatarUrl ? (
                    <img
                      src={match.matchedUser.avatarUrl}
                      alt={match.matchedUser.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '👤'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-rumi-text">
                    {match.matchedUser.firstName} {match.matchedUser.lastName}
                  </h3>

                  {/* Quick details */}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {match.matchedUser.roommateProfile?.age && (
                      <span className="text-xs text-rumi-text/50">
                        {match.matchedUser.roommateProfile.age} {t.profile.yearsOld}
                      </span>
                    )}
                    {match.matchedUser.roommateProfile?.occupation && (
                      <span className="text-xs text-rumi-text/50">
                        &bull; {match.matchedUser.roommateProfile.occupation}
                      </span>
                    )}
                    {match.matchedUser.roommateProfile?.preferredCity && (
                      <span className="text-xs text-rumi-text/50">
                        &bull; 📍 {match.matchedUser.roommateProfile.preferredCity}
                      </span>
                    )}
                  </div>

                  {/* Budget */}
                  {match.matchedUser.roommateProfile && (
                    <p className="text-sm text-rumi-primary font-medium mt-1">
                      ${formatBudget(match.matchedUser.roommateProfile.budget)} /mes
                    </p>
                  )}

                  {/* Bio snippet */}
                  {match.matchedUser.roommateProfile?.bio && (
                    <p className="text-sm text-rumi-text/60 mt-1.5 line-clamp-2">
                      {match.matchedUser.roommateProfile.bio}
                    </p>
                  )}

                  {/* Match date */}
                  <p className="text-xs text-rumi-text/30 mt-2">
                    {t.roommate.matchDate} {new Date(match.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Actions bar */}
              <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
                {match.conversationId ? (
                  <Link
                    to={`/messages/${match.conversationId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-rumi-primary text-white rounded-lg hover:bg-rumi-primary/90 transition-colors"
                  >
                    💬 {t.roommate.startChat}
                  </Link>
                ) : (
                  <span className="text-xs text-rumi-text/30">—</span>
                )}

                {/* Unmatch button */}
                {confirmUnmatch === match.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500">{t.roommate.unmatchConfirm}</span>
                    <button
                      onClick={() => handleUnmatch(match.id)}
                      disabled={unmatchingId === match.id}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {unmatchingId === match.id ? '...' : t.common.confirm}
                    </button>
                    <button
                      onClick={() => setConfirmUnmatch(null)}
                      className="px-3 py-1 text-xs font-medium text-rumi-text/50 hover:text-rumi-text transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmUnmatch(match.id)}
                    className="text-xs text-rumi-text/30 hover:text-red-400 transition-colors"
                  >
                    {t.roommate.unmatch}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
