import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../services/api-client';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  age: number | null;
  occupation: string | null;
  nationality: string | null;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  seekingMode: 'NONE' | 'TENANT' | 'ROOMMATE';
  createdAt: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  age: string;
  occupation: string;
  nationality: string;
  gender: string;
}

const genderLabels: Record<string, string> = {
  MALE: t.gender.MALE,
  FEMALE: t.gender.FEMALE,
  NON_BINARY: t.gender.NON_BINARY,
  OTHER: t.gender.OTHER,
  PREFER_NOT_TO_SAY: t.gender.PREFER_NOT_TO_SAY,
};

const seekingLabels: Record<string, string> = {
  NONE: t.seeking.none,
  TENANT: t.seeking.tenant,
  ROOMMATE: t.seeking.roommate,
};

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone || '',
      bio: profile.bio || '',
      age: profile.age?.toString() || '',
      occupation: profile.occupation || '',
      nationality: profile.nationality || '',
      gender: profile.gender || '',
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        bio: data.bio || null,
        age: data.age ? parseInt(data.age, 10) : null,
        occupation: data.occupation || null,
        nationality: data.nationality || null,
        gender: data.gender || null,
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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-rumi-text/60">{t.common.loading}</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
          {error || t.common.error}
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full py-3 bg-rumi-danger text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
        >
          {t.auth.logout}
        </button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-rumi-text">{t.nav.profile}</h1>
        {!editing && (
          <button
            onClick={startEditing}
            className="px-4 py-2 text-sm font-medium text-rumi-primary border border-rumi-primary rounded-lg hover:bg-rumi-primary/5 transition-colors"
          >
            {t.profile.editProfile}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm mb-4">
          {error}
        </div>
      )}

      {editing ? (
        /* ===== EDIT MODE ===== */
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-rumi-primary-light/20 space-y-4">
            <h3 className="text-lg font-semibold text-rumi-text mb-2">{t.profile.personalInfo}</h3>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-rumi-text/70 mb-1">Nombre</label>
                <input
                  {...register('firstName', { required: 'Requerido', minLength: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                />
                {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-rumi-text/70 mb-1">Apellido</label>
                <input
                  {...register('lastName', { required: 'Requerido', minLength: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                />
                {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName.message}</p>}
              </div>
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.profile.age}</label>
                <input
                  type="number"
                  min={16}
                  max={120}
                  {...register('age', {
                    min: { value: 16, message: 'Minimo 16' },
                    max: { value: 120, message: 'Maximo 120' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                  placeholder="Ej: 28"
                />
                {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.profile.gender}</label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {genderLabels[g]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occupation + Nationality row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.profile.occupation}</label>
                <input
                  {...register('occupation', { maxLength: { value: 200, message: 'Maximo 200 caracteres' } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                  placeholder="Ej: Desarrollador de software"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.profile.nationality}</label>
                <input
                  {...register('nationality', { maxLength: { value: 100, message: 'Maximo 100 caracteres' } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                  placeholder="Ej: Colombiana"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.profile.phone}</label>
              <input
                {...register('phone', { maxLength: { value: 20, message: 'Maximo 20 caracteres' } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none"
                placeholder="Ej: +57 300 123 4567"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-rumi-text/70 mb-1">{t.profile.bio}</label>
              <textarea
                {...register('bio', { maxLength: { value: 2000, message: 'Maximo 2000 caracteres' } })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rumi-primary/40 focus:border-rumi-primary outline-none resize-none"
                placeholder="Cuentanos sobre ti..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-rumi-primary text-white font-semibold rounded-lg hover:bg-rumi-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? t.common.loading : t.profile.saveProfile}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="flex-1 py-3 border border-gray-300 text-rumi-text font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        /* ===== VIEW MODE ===== */
        <>
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-rumi-primary-light/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-rumi-primary/20 flex items-center justify-center text-2xl font-bold text-rumi-primary shrink-0">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-rumi-text">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-sm text-rumi-text/60">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Demographics row */}
              <div className="grid grid-cols-2 gap-4">
                {profile.age != null && (
                  <div>
                    <span className="text-sm font-medium text-rumi-text/50">{t.profile.age}</span>
                    <p className="text-rumi-text">{profile.age} {t.profile.yearsOld}</p>
                  </div>
                )}
                {profile.gender && (
                  <div>
                    <span className="text-sm font-medium text-rumi-text/50">{t.profile.gender}</span>
                    <p className="text-rumi-text">{genderLabels[profile.gender] || profile.gender}</p>
                  </div>
                )}
              </div>

              {profile.occupation && (
                <div>
                  <span className="text-sm font-medium text-rumi-text/50">{t.profile.occupation}</span>
                  <p className="text-rumi-text">{profile.occupation}</p>
                </div>
              )}

              {profile.nationality && (
                <div>
                  <span className="text-sm font-medium text-rumi-text/50">{t.profile.nationality}</span>
                  <p className="text-rumi-text">{profile.nationality}</p>
                </div>
              )}

              {profile.phone && (
                <div>
                  <span className="text-sm font-medium text-rumi-text/50">{t.profile.phone}</span>
                  <p className="text-rumi-text">{profile.phone}</p>
                </div>
              )}

              {profile.bio && (
                <div>
                  <span className="text-sm font-medium text-rumi-text/50">{t.profile.bio}</span>
                  <p className="text-rumi-text">{profile.bio}</p>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-rumi-text/50">{t.profile.seekingMode}</span>
                <p className="mt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-rumi-primary/10 text-rumi-primary">
                    {seekingLabels[profile.seekingMode] || profile.seekingMode}
                  </span>
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-rumi-text/50">{t.profile.memberSince}</span>
                <p className="text-rumi-text">
                  {new Date(profile.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-rumi-primary-light/20">
            <h3 className="text-lg font-semibold text-rumi-text mb-3">{t.profile.account}</h3>
            <div className="space-y-2 text-sm text-rumi-text/60">
              <p>
                <span className="font-medium text-rumi-text/50">Correo:</span>{' '}
                {user?.email || profile.email}
              </p>
              <p>
                <span className="font-medium text-rumi-text/50">ID:</span>{' '}
                <span className="font-mono text-xs">{profile.id}</span>
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-rumi-danger text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            {t.auth.logout}
          </button>
        </>
      )}
    </div>
  );
}
