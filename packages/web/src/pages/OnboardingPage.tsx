import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserPreferences } from '@rumi/shared';
import { RumiLogo } from '../components/ui/RumiLogo';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import apiClient from '../services/api-client';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleComplete = async (preferences: UserPreferences) => {
    setSaving(true);
    try {
      await apiClient.put('/users/me/preferences', { preferences });
      navigate('/', { replace: true });
    } catch {
      // Silently navigate even on error — preferences can be set later from profile
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSkipAll = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-rumi-bg flex flex-col items-center justify-start px-4 py-8 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rumi-primary/8 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-rumi-accent/6 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 animate-fade-in-down">
          <RumiLogo size="lg" className="mb-2" />
          <p className="text-rumi-text/40 text-sm tracking-wide">
            Personaliza tu experiencia
          </p>
        </div>

        <OnboardingWizard
          onComplete={handleComplete}
          onSkipAll={handleSkipAll}
          saving={saving}
        />
      </div>
    </div>
  );
}
