import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { UserPreferences } from '@rumi/shared';
import { t } from '../i18n/es';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../services/api-client';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { IconEdit, IconLogout, IconTrash } from '../components/ui/Icons';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { NATIONALITIES } from '../data/nationalities';
import {
  LOOKING_FOR_OPTIONS,
  SCHEDULE_OPTIONS,
  DRINKING_OPTIONS,
  CLEANLINESS_OPTIONS,
  PERSONALITY_OPTIONS,
  WORK_OPTIONS,
  LIFESTYLE_TOGGLES,
  IDEAL_SCHEDULE_OPTIONS,
  IDEAL_TOLERANCE_TOGGLES,
  IDEAL_CLEANLINESS_OPTIONS,
  GENDER_PREF_OPTIONS,
} from '../components/onboarding/onboarding-config';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  age: number | null;
  dateOfBirth: string | null;
  occupation: string | null;
  nationality: string | null;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  language: string[];
  seekingMode: 'NONE' | 'TENANT' | 'ROOMMATE';
  preferences: UserPreferences | null;
  createdAt: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  occupation: string;
  nationality: string;
  gender: string;
}

const genderLabels: Record<string, string> = {
  MALE: t.gender.MALE, FEMALE: t.gender.FEMALE, NON_BINARY: t.gender.NON_BINARY,
  OTHER: t.gender.OTHER, PREFER_NOT_TO_SAY: t.gender.PREFER_NOT_TO_SAY,
};

const languageLabels: Record<string, string> = {
  SPANISH: 'Español',
  ENGLISH: 'Ingles',
  OTHER: 'Otro',
};

const seekingLabels: Record<string, string> = {
  NONE: t.seeking.none, TENANT: t.seeking.tenant, ROOMMATE: t.seeking.roommate,
};

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

const LANGUAGE_OPTIONS = [
  { value: 'SPANISH', label: 'Español' },
  { value: 'ENGLISH', label: 'Inglés' },
  { value: 'OTHER', label: 'Otro' },
] as const;

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
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

const inputClass =
  'w-full px-4 py-3 rounded-xl border-2 border-rumi-primary-light/30 bg-white text-sm text-rumi-text placeholder:text-rumi-text/30 focus:outline-none focus:border-rumi-primary focus:ring-4 focus:ring-rumi-primary/10 transition-all duration-200';

const labelClass = 'block text-sm font-medium text-rumi-text/70 mb-1.5';

// Small read-only chip for displaying selected preferences
function ReadOnlyChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rumi-primary/8 text-xs font-medium text-rumi-primary-dark">
      <span>{emoji}</span> {label}
    </span>
  );
}

// Helper to find option label by value from config arrays
function findOption(options: { value: string; emoji: string; label: string }[], value: string) {
  return options.find((o) => o.value === value);
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const { register, handleSubmit, reset, formState: { errors: formErrors } } = useForm<ProfileFormData>();

  useEffect(() => {
    apiClient
      .get<UserProfile>('/users/me')
      .then((res) => setProfile(res.data))
      .catch(() => setError('Error al cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const startEditing = () => {
    if (!profile) return;
    reset({
      firstName: profile.firstName, lastName: profile.lastName,
      phone: profile.phone || '', bio: profile.bio || '',
      occupation: profile.occupation || '',
      nationality: profile.nationality || '', gender: profile.gender || '',
    });
    setEditLanguages(profile.language || []);
    setEditing(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const payload = {
        firstName: data.firstName, lastName: data.lastName,
        phone: data.phone || null, bio: data.bio || null,
        occupation: data.occupation || null, nationality: data.nationality || null,
        gender: data.gender || null,
        language: editLanguages,
        preferences: profile?.preferences ?? null,
      };
      const res = await apiClient.put<UserProfile>('/users/me', payload);
      setProfile(res.data);
      setEditing(false);
    } catch {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (prefs: UserPreferences) => {
    setSavingPrefs(true);
    try {
      await apiClient.put('/users/me/preferences', { preferences: prefs });
      setProfile((prev) => prev ? { ...prev, preferences: prefs } : prev);
      setEditingPrefs(false);
    } catch {
      setError('Error al guardar preferencias');
    } finally {
      setSavingPrefs(false);
    }
  };

  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiClient.delete('/users/me');
      logout();
      navigate('/login', { replace: true });
    } catch {
      setError(t.common.error);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <LoadingState text={t.common.loading} />;

  if (error && !profile) {
    return (
      <div className="py-12 max-w-2xl mx-auto">
        <ErrorAlert message={error || t.common.error} />
        <Button variant="danger" fullWidth onClick={handleLogout} className="mt-6">
          {t.auth.logout}
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  const prefs = profile.preferences;

  // Render read-only preference chips
  const renderPreferencesView = () => {
    if (!prefs) {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-rumi-text/40 mb-3">Completa tus preferencias para mejorar tu matching</p>
          <Button variant="outline" size="sm" onClick={() => setEditingPrefs(true)}>
            Agregar preferencias
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Sobre mi */}
        {prefs.myTraits && (
          <div>
            <p className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider mb-2">Sobre mí</p>
            <div className="flex gap-2 flex-wrap">
              {prefs.myTraits.worksOutside === true && <ReadOnlyChip emoji={WORK_OPTIONS.trueOption.emoji} label={WORK_OPTIONS.trueOption.label} />}
              {prefs.myTraits.worksOutside === false && <ReadOnlyChip emoji={WORK_OPTIONS.falseOption.emoji} label={WORK_OPTIONS.falseOption.label} />}
              {prefs.myTraits.schedule && (() => { const o = findOption(SCHEDULE_OPTIONS, prefs.myTraits!.schedule!); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })()}
              {LIFESTYLE_TOGGLES.map((toggle) => {
                const val = prefs.myTraits?.[toggle.key as keyof typeof prefs.myTraits];
                if (val === true) return <ReadOnlyChip key={toggle.key} emoji={toggle.trueOption.emoji} label={toggle.trueOption.label} />;
                if (val === false) return <ReadOnlyChip key={toggle.key} emoji={toggle.falseOption.emoji} label={toggle.falseOption.label} />;
                return null;
              })}
              {prefs.myTraits.drinks && (() => { const o = findOption(DRINKING_OPTIONS, prefs.myTraits!.drinks!); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })()}
              {prefs.myTraits.cleanliness && (() => { const o = findOption(CLEANLINESS_OPTIONS, prefs.myTraits!.cleanliness!); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })()}
              {prefs.myTraits.personality?.map((p) => { const o = findOption(PERSONALITY_OPTIONS, p); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })}
            </div>
          </div>
        )}

        {/* Que busco */}
        {prefs.lookingFor && prefs.lookingFor.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider mb-2">Busco</p>
            <div className="flex gap-2 flex-wrap">
              {prefs.lookingFor.map((lf) => { const o = findOption(LOOKING_FOR_OPTIONS, lf); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })}
            </div>
          </div>
        )}

        {/* Companero ideal */}
        {prefs.idealRoommate && (
          <div>
            <p className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider mb-2">Compañero ideal</p>
            <div className="flex gap-2 flex-wrap">
              {prefs.idealRoommate.schedulePreference && (() => { const o = findOption(IDEAL_SCHEDULE_OPTIONS, prefs.idealRoommate!.schedulePreference!); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })()}
              {IDEAL_TOLERANCE_TOGGLES.map((toggle) => {
                const val = prefs.idealRoommate?.[toggle.key as keyof typeof prefs.idealRoommate];
                if (val === true) return <ReadOnlyChip key={toggle.key} emoji={toggle.trueOption.emoji} label={toggle.trueOption.label} />;
                if (val === false) return <ReadOnlyChip key={toggle.key} emoji={toggle.falseOption.emoji} label={toggle.falseOption.label} />;
                return null;
              })}
              {prefs.idealRoommate.cleanlinessPreference && (() => { const o = findOption(IDEAL_CLEANLINESS_OPTIONS, prefs.idealRoommate!.cleanlinessPreference!); return o ? <ReadOnlyChip key={o.value} emoji={o.emoji} label={o.label} /> : null; })()}
              {prefs.idealRoommate.personalityPreference?.map((p) => { const o = findOption(PERSONALITY_OPTIONS, p); return o ? <ReadOnlyChip key={`ideal-${o.value}`} emoji={o.emoji} label={o.label} /> : null; })}
              {prefs.idealRoommate.ageRange && <ReadOnlyChip emoji="🎂" label={`${prefs.idealRoommate.ageRange.min}-${prefs.idealRoommate.ageRange.max} años`} />}
              {prefs.idealRoommate.genderPreference?.map((g) => { const o = findOption(GENDER_PREF_OPTIONS, g); return o ? <ReadOnlyChip key={`gp-${o.value}`} emoji={o.emoji} label={o.label} /> : null; })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={t.nav.profile}
        action={
          !editing && !editingPrefs ? (
            <Button variant="outline" size="sm" icon={<IconEdit className="w-4 h-4" />} onClick={startEditing}>
              {t.profile.editProfile}
            </Button>
          ) : undefined
        }
      />

      <ErrorAlert message={error} className="mb-4" />

      {/* Preferences editing mode */}
      {editingPrefs ? (
        <div className="mb-6">
          <OnboardingWizard
            onComplete={handleSavePreferences}
            onSkipAll={() => setEditingPrefs(false)}
            saving={savingPrefs}
            initialPreferences={prefs}
          />
        </div>
      ) : editing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card variant="bordered" padding="md" className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-rumi-text">{t.profile.personalInfo}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre</label>
                <input {...register('firstName', { required: 'Requerido' })} className={inputClass} />
                {formErrors.firstName && <p className="text-xs text-rumi-danger mt-1.5">{formErrors.firstName.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Apellido</label>
                <input {...register('lastName', { required: 'Requerido' })} className={inputClass} />
                {formErrors.lastName && <p className="text-xs text-rumi-danger mt-1.5">{formErrors.lastName.message}</p>}
              </div>
            </div>

            {/* DOB is read-only — show it but don't allow editing */}
            {profile.dateOfBirth && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.profile.dateOfBirth}</label>
                  <p className="px-4 py-3 rounded-xl border-2 border-rumi-primary-light/15 bg-rumi-bg text-sm text-rumi-text/60">
                    {new Date(profile.dateOfBirth).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-rumi-text/30 mt-1">La fecha de nacimiento no se puede modificar</p>
                </div>
                <div>
                  <label className={labelClass}>{t.profile.age}</label>
                  <p className="px-4 py-3 rounded-xl border-2 border-rumi-primary-light/15 bg-rumi-bg text-sm text-rumi-text/60">
                    {profile.age} {t.profile.yearsOld}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.profile.gender}</label>
                <select {...register('gender')} className={`${inputClass} appearance-none`}>
                  <option value="">-- Seleccionar --</option>
                  {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{genderLabels[g]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t.profile.language}</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {LANGUAGE_OPTIONS.map((l) => (
                    <ToggleChip
                      key={l.value}
                      label={l.label}
                      selected={editLanguages.includes(l.value)}
                      onClick={() => setEditLanguages((prev) =>
                        prev.includes(l.value) ? prev.filter((v) => v !== l.value) : [...prev, l.value]
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.profile.occupation}</label>
                <input {...register('occupation', { maxLength: 200 })} className={inputClass} placeholder="Ej: Desarrollador de software" />
              </div>
              <div>
                <label className={labelClass}>{t.profile.nationality}</label>
                <select {...register('nationality')} className={`${inputClass} appearance-none`}>
                  <option value="">-- Seleccionar --</option>
                  {NATIONALITIES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t.profile.phone}</label>
              <input {...register('phone', { maxLength: 20 })} className={inputClass} placeholder="Ej: +57 300 123 4567" />
            </div>

            <div>
              <label className={labelClass}>{t.profile.bio}</label>
              <textarea {...register('bio', { maxLength: 2000 })} rows={3} className={`${inputClass} resize-none`} placeholder="Cuentanos sobre ti..." />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" loading={saving} className="flex-1" size="lg">
              {saving ? t.common.loading : t.profile.saveProfile}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="flex-1" size="lg">
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <Card variant="elevated" padding="none" className="mb-6 overflow-hidden">
            {/* Gradient banner */}
            <div className="h-24 bg-gradient-to-r from-rumi-primary/10 to-rumi-accent/10" />
            <div className="px-6 pb-6">
              <div className="-mt-10 flex items-end gap-4 mb-4">
                <Avatar
                  src={profile.avatarUrl}
                  name={`${profile.firstName} ${profile.lastName}`}
                  size="xl"
                  className="ring-4 ring-white"
                />
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-rumi-text">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-sm text-rumi-text/40">{profile.email}</p>
                </div>
              </div>

              <Badge variant="primary" dot className="mb-4">
                {seekingLabels[profile.seekingMode] || profile.seekingMode}
              </Badge>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {profile.dateOfBirth && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.dateOfBirth}</span>
                    <p className="text-sm text-rumi-text mt-0.5">
                      {new Date(profile.dateOfBirth).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
                {profile.age != null && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.age}</span>
                    <p className="text-sm text-rumi-text mt-0.5">{profile.age} {t.profile.yearsOld}</p>
                  </div>
                )}
                {profile.gender && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.gender}</span>
                    <p className="text-sm text-rumi-text mt-0.5">{genderLabels[profile.gender] || profile.gender}</p>
                  </div>
                )}
                {profile.language && profile.language.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.language}</span>
                    <p className="text-sm text-rumi-text mt-0.5">{profile.language.map((l) => languageLabels[l] || l).join(', ')}</p>
                  </div>
                )}
                {profile.occupation && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.occupation}</span>
                    <p className="text-sm text-rumi-text mt-0.5">{profile.occupation}</p>
                  </div>
                )}
                {profile.nationality && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.nationality}</span>
                    <p className="text-sm text-rumi-text mt-0.5">{profile.nationality}</p>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.phone}</span>
                    <p className="text-sm text-rumi-text mt-0.5">{profile.phone}</p>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div className="mt-4 pt-4 border-t border-rumi-primary-light/10">
                  <span className="text-xs font-semibold text-rumi-text/40 uppercase tracking-wider">{t.profile.bio}</span>
                  <p className="text-sm text-rumi-text/70 mt-1">{profile.bio}</p>
                </div>
              )}

              <p className="text-xs text-rumi-text/25 mt-4">
                {t.profile.memberSince}{' '}
                {new Date(profile.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </Card>

          {/* Preferences section */}
          <Card variant="bordered" padding="md" className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-rumi-text/40 uppercase tracking-wider">Mis preferencias</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingPrefs(true)}>
                <IconEdit className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            </div>
            {renderPreferencesView()}
          </Card>

          <Card variant="default" padding="md" className="mb-6">
            <h3 className="text-sm font-semibold text-rumi-text/40 uppercase tracking-wider mb-3">{t.profile.account}</h3>
            <div className="space-y-1.5 text-sm text-rumi-text/50">
              <p><span className="text-rumi-text/40">Correo:</span> {user?.email || profile.email}</p>
              <p><span className="text-rumi-text/40">ID:</span> <span className="font-mono text-xs">{profile.id}</span></p>
            </div>
          </Card>

          <Button variant="danger" fullWidth size="lg" icon={<IconLogout className="w-4 h-4" />} onClick={handleLogout}>
            {t.auth.logout}
          </Button>

          <Button
            variant="outline"
            fullWidth
            size="lg"
            icon={<IconTrash className="w-4 h-4" />}
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-3 !border-red-300 !text-red-600 hover:!bg-red-50"
          >
            {t.profile.deleteAccount}
          </Button>

          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteAccount}
            title={t.profile.deleteAccountConfirm}
            message={t.profile.deleteAccountMessage}
            confirmLabel={t.profile.deleteAccount}
            cancelLabel={t.common.cancel}
            variant="danger"
            loading={deleting}
          />
        </>
      )}
    </div>
  );
}
