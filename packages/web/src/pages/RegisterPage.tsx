import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import { registerUser } from '../services/auth.service';
import { cognitoRegister, cognitoConfirmRegistration, cognitoLogin } from '../services/cognito-auth.service';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { NATIONALITIES } from '../data/nationalities';

const isLocalDev = (import.meta.env.VITE_STAGE || 'localdev') === 'localdev';

const GENDER_OPTIONS = [
  { value: 'MALE', label: t.gender.MALE },
  { value: 'FEMALE', label: t.gender.FEMALE },
  { value: 'NON_BINARY', label: t.gender.NON_BINARY },
  { value: 'OTHER', label: t.gender.OTHER },
  { value: 'PREFER_NOT_TO_SAY', label: t.gender.PREFER_NOT_TO_SAY },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'SPANISH', label: 'Español' },
  { value: 'ENGLISH', label: 'Ingles' },
  { value: 'OTHER', label: 'Otro' },
] as const;

const inputClass =
  'w-full px-4 py-3 rounded-xl border-2 border-rumi-primary-light/30 bg-white text-sm text-rumi-text placeholder:text-rumi-text/30 focus:outline-none focus:border-rumi-primary focus:ring-4 focus:ring-rumi-primary/10 transition-all duration-200';

const selectClass = `${inputClass} appearance-none`;

const labelClass = 'block text-sm font-medium text-rumi-text/70 mb-1.5';

/** Calculate max date for DOB input (must be 18 years ago) */
function getMaxDobDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

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

export function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    occupation: '',
    nationality: '',
    gender: '',
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cognito verification step
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLocalDev) {
        // Local registration
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          dateOfBirth: form.dateOfBirth || null,
          occupation: form.occupation || null,
          nationality: form.nationality || null,
          gender: (form.gender as 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY') || null,
          language: languages.length > 0 ? languages as ('SPANISH' | 'ENGLISH' | 'OTHER')[] : undefined,
        };
        const res = await registerUser(payload);
        setUser({ sub: res.user.cognitoSub, userId: res.user.id, email: res.user.email, token: res.token });
        navigate('/onboarding', { replace: true });
      } else {
        // Cognito registration
        const result = await cognitoRegister(
          form.email,
          form.password,
          form.firstName,
          form.lastName,
        );

        if (result.needsConfirmation) {
          setNeedsVerification(true);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string; name?: string };

      if (error.name === 'UsernameExistsException') {
        setError('Ya existe una cuenta con este correo electronico');
      } else if (error.name === 'InvalidPasswordException') {
        setError('La contraseña debe tener al menos 8 caracteres, incluyendo mayusculas, minusculas y numeros');
      } else {
        setError(error.response?.data?.message || error.message || 'Error al registrarse');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Confirm the sign-up
      await cognitoConfirmRegistration(form.email, verificationCode);

      // Auto sign-in after confirmation
      const res = await cognitoLogin(form.email, form.password);
      setUser({ sub: res.user.cognitoSub, userId: res.user.id, email: res.user.email, token: res.token });
      navigate('/onboarding', { replace: true });
    } catch (err: unknown) {
      const error = err as { message?: string; name?: string };

      if (error.name === 'CodeMismatchException') {
        setError('Codigo de verificacion incorrecto');
      } else if (error.name === 'ExpiredCodeException') {
        setError('El codigo ha expirado. Solicita uno nuevo.');
      } else {
        setError(error.message || 'Error al verificar el codigo');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verification code screen (Cognito only)
  if (needsVerification) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-rumi-text mb-1">Verifica tu correo</h2>
        <p className="text-sm text-rumi-text/40 mb-6">
          Enviamos un codigo de verificacion a <span className="font-semibold text-rumi-text/70">{form.email}</span>
        </p>

        <ErrorAlert message={error} onDismiss={() => setError('')} className="mb-4" />

        <form className="space-y-4" onSubmit={handleVerification}>
          <div>
            <label className={labelClass}>Codigo de verificacion</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className={inputClass}
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            {loading ? 'Verificando...' : 'Verificar cuenta'}
          </Button>
        </form>

        <div className="border-t border-rumi-primary-light/15 pt-4 mt-6">
          <p className="text-center text-sm text-rumi-text/50">
            ¿No recibiste el codigo?{' '}
            <button
              type="button"
              className="text-rumi-primary font-semibold hover:text-rumi-primary-dark transition-colors"
              onClick={() => {
                setNeedsVerification(false);
                setVerificationCode('');
              }}
            >
              Volver al registro
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-rumi-text mb-1">{t.auth.register}</h2>
      <p className="text-sm text-rumi-text/40 mb-6">Crea tu cuenta para empezar</p>

      <ErrorAlert message={error} onDismiss={() => setError('')} className="mb-4" />

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={handleChange('firstName')}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Apellido *</label>
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
          <label className={labelClass}>{t.auth.email} *</label>
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
          <label className={labelClass}>{t.auth.password} *</label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            className={inputClass}
            minLength={8}
            required
          />
          {!isLocalDev && (
            <p className="text-xs text-rumi-text/30 mt-1">
              Minimo 8 caracteres, con mayusculas, minusculas y numeros
            </p>
          )}
        </div>

        {/* Divider — optional fields only in localdev (Cognito gets them post-signup) */}
        {isLocalDev && (
          <>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-rumi-primary-light/20 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/80 backdrop-blur-sm px-3 text-xs text-rumi-text/40">
                  {t.profile.personalInfo} (opcional)
                </span>
              </div>
            </div>

            {/* Date of birth + Gender row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.profile.dateOfBirth}</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange('dateOfBirth')}
                  max={getMaxDobDate()}
                  className={inputClass}
                />
                <p className="text-xs text-rumi-text/30 mt-1">Debes ser mayor de 18 años</p>
              </div>
              <div>
                <label className={labelClass}>{t.profile.gender}</label>
                <select
                  value={form.gender}
                  onChange={handleChange('gender')}
                  className={selectClass}
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
                <label className={labelClass}>{t.profile.occupation}</label>
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
                <label className={labelClass}>{t.profile.nationality}</label>
                <select
                  value={form.nationality}
                  onChange={handleChange('nationality')}
                  className={selectClass}
                >
                  <option value="">-- Seleccionar --</option>
                  {NATIONALITIES.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language — multi-select via toggle chips */}
            <div>
              <label className={labelClass}>{t.profile.language}</label>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGE_OPTIONS.map((l) => (
                  <ToggleChip
                    key={l.value}
                    label={l.label}
                    selected={languages.includes(l.value)}
                    onClick={() => toggleLanguage(l.value)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg">
          {loading ? 'Registrando...' : t.auth.register}
        </Button>
      </form>

      <div className="border-t border-rumi-primary-light/15 pt-4 mt-6">
        <p className="text-center text-sm text-rumi-text/50">
          {t.auth.hasAccount}{' '}
          <Link to="/login" className="text-rumi-primary font-semibold hover:text-rumi-primary-dark transition-colors">
            {t.auth.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
