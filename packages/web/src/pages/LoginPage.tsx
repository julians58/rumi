import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n/es';
import { loginUser } from '../services/auth.service';
import { cognitoLogin } from '../services/cognito-auth.service';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { ErrorAlert } from '../components/ui/ErrorAlert';

const isLocalDev = (import.meta.env.VITE_STAGE || 'localdev') === 'localdev';

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLocalDev) {
        // Local JWT auth
        const res = await loginUser({ email, password });
        setUser({ sub: res.user.cognitoSub, userId: res.user.id, email: res.user.email, token: res.token });
      } else {
        // Cognito auth
        const res = await cognitoLogin(email, password);
        setUser({ sub: res.user.cognitoSub, userId: res.user.id, email: res.user.email, token: res.token });
      }
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string; name?: string };

      // Handle Cognito-specific errors
      if (error.name === 'NotAuthorizedException') {
        setError('Correo o contraseña incorrectos');
      } else if (error.name === 'UserNotFoundException') {
        setError('No existe una cuenta con este correo');
      } else if (error.name === 'UserNotConfirmedException' || error.message === 'CONFIRM_SIGN_UP_REQUIRED') {
        setError('Tu cuenta no ha sido verificada. Revisa tu correo electronico.');
      } else {
        setError(error.response?.data?.message || error.message || 'Error al iniciar sesion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-rumi-text mb-1">{t.auth.login}</h2>
      <p className="text-sm text-rumi-text/40 mb-6">Ingresa a tu cuenta para continuar</p>

      <ErrorAlert message={error} onDismiss={() => setError('')} className="mb-4" />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-rumi-text/70 mb-1.5">
            {t.auth.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-rumi-primary-light/30 bg-white text-sm text-rumi-text placeholder:text-rumi-text/30 focus:outline-none focus:border-rumi-primary focus:ring-4 focus:ring-rumi-primary/10 transition-all duration-200"
            placeholder="tu@correo.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-rumi-text/70 mb-1.5">
            {t.auth.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-rumi-primary-light/30 bg-white text-sm text-rumi-text placeholder:text-rumi-text/30 focus:outline-none focus:border-rumi-primary focus:ring-4 focus:ring-rumi-primary/10 transition-all duration-200"
            required
          />
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          {loading ? 'Ingresando...' : t.auth.login}
        </Button>
      </form>

      <div className="border-t border-rumi-primary-light/15 pt-4 mt-6">
        <p className="text-center text-sm text-rumi-text/50">
          {t.auth.noAccount}{' '}
          <Link to="/register" className="text-rumi-primary font-semibold hover:text-rumi-primary-dark transition-colors">
            {t.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
