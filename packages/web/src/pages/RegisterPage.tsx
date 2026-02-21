import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import { registerUser } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

const GENDER_OPTIONS = [
  { value: 'MALE', label: t.gender.MALE },
  { value: 'FEMALE', label: t.gender.FEMALE },
  { value: 'NON_BINARY', label: t.gender.NON_BINARY },
  { value: 'OTHER', label: t.gender.OTHER },
  { value: 'PREFER_NOT_TO_SAY', label: t.gender.PREFER_NOT_TO_SAY },
] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    age: '',
    occupation: '',
    nationality: '',
    gender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        age: form.age ? parseInt(form.age, 10) : null,
        occupation: form.occupation || null,
        nationality: form.nationality || null,
        gender: (form.gender as 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY') || null,
      };
      const res = await registerUser(payload);
      setUser({ sub: res.user.cognitoSub, email: res.user.email, token: res.token });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al registrarse';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-rumi-primary-light/40 focus:outline-none focus:ring-2 focus:ring-rumi-primary';

  return (
    <div>
      <h2 className="text-2xl font-bold text-rumi-text mb-6">{t.auth.register}</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-rumi-text/80 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={handleChange('firstName')}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-rumi-text/80 mb-1">Apellido *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={handleChange('lastName')}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-rumi-text/80 mb-1">
            {t.auth.email} *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            className={inputClass}
            placeholder="tu@correo.com"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-rumi-text/80 mb-1">
            {t.auth.password} *
          </label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            className={inputClass}
            minLength={8}
            required
          />
        </div>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rumi-primary-light/30" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-rumi-text/50">{t.profile.personalInfo} (opcional)</span>
          </div>
        </div>

        {/* Age + Gender row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-rumi-text/80 mb-1">{t.profile.age}</label>
            <input
              type="number"
              min={16}
              max={120}
              value={form.age}
              onChange={handleChange('age')}
              className={inputClass}
              placeholder="Ej: 28"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-rumi-text/80 mb-1">{t.profile.gender}</label>
            <select
              value={form.gender}
              onChange={handleChange('gender')}
              className={`${inputClass} bg-white`}
            >
              <option value="">-- Seleccionar --</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Occupation + Nationality row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-rumi-text/80 mb-1">{t.profile.occupation}</label>
            <input
              type="text"
              value={form.occupation}
              onChange={handleChange('occupation')}
              className={inputClass}
              placeholder="Ej: Desarrollador"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-rumi-text/80 mb-1">{t.profile.nationality}</label>
            <input
              type="text"
              value={form.nationality}
              onChange={handleChange('nationality')}
              className={inputClass}
              placeholder="Ej: Colombiana"
              maxLength={100}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-rumi-primary text-white font-semibold rounded-lg hover:bg-rumi-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Registrando...' : t.auth.register}
        </button>
      </form>
      <p className="text-center text-sm text-rumi-text/60 mt-4">
        {t.auth.hasAccount}{' '}
        <Link to="/login" className="text-rumi-primary font-medium">
          {t.auth.login}
        </Link>
      </p>
    </div>
  );
}
