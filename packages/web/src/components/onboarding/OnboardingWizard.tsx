import { useState } from 'react';
import type { UserPreferences } from '@rumi/shared';
import { EmojiChip } from './EmojiChip';
import { Button } from '../ui/Button';
import {
  WORK_OPTIONS,
  SCHEDULE_OPTIONS,
  LIFESTYLE_TOGGLES,
  DRINKING_OPTIONS,
  CLEANLINESS_OPTIONS,
  PERSONALITY_OPTIONS,
  LOOKING_FOR_OPTIONS,
  IDEAL_SCHEDULE_OPTIONS,
  IDEAL_TOLERANCE_TOGGLES,
  IDEAL_CLEANLINESS_OPTIONS,
  GENDER_PREF_OPTIONS,
} from './onboarding-config';

interface OnboardingWizardProps {
  onComplete: (preferences: UserPreferences) => void;
  onSkipAll: () => void;
  saving?: boolean;
  initialPreferences?: UserPreferences | null;
}

const TOTAL_STEPS = 3;

export function OnboardingWizard({ onComplete, onSkipAll, saving, initialPreferences }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);

  // Step 1: Sobre ti
  const [worksOutside, setWorksOutside] = useState<boolean | undefined>(initialPreferences?.myTraits?.worksOutside);
  const [schedule, setSchedule] = useState<string | undefined>(initialPreferences?.myTraits?.schedule);
  const [boolTraits, setBoolTraits] = useState<Record<string, boolean | undefined>>({
    hasPets: initialPreferences?.myTraits?.hasPets,
    hasChildren: initialPreferences?.myTraits?.hasChildren,
    smokes: initialPreferences?.myTraits?.smokes,
    hasFrequentVisitors: initialPreferences?.myTraits?.hasFrequentVisitors,
  });
  const [drinks, setDrinks] = useState<string | undefined>(initialPreferences?.myTraits?.drinks);
  const [cleanliness, setCleanliness] = useState<string | undefined>(initialPreferences?.myTraits?.cleanliness);
  const [personality, setPersonality] = useState<string[]>(initialPreferences?.myTraits?.personality ?? []);

  // Step 2: Que buscas
  const [lookingFor, setLookingFor] = useState<string[]>(initialPreferences?.lookingFor ?? []);

  // Step 3: Companero ideal
  const [idealSchedule, setIdealSchedule] = useState<string | undefined>(initialPreferences?.idealRoommate?.schedulePreference);
  const [idealTolerances, setIdealTolerances] = useState<Record<string, boolean | undefined>>({
    petsOk: initialPreferences?.idealRoommate?.petsOk,
    childrenOk: initialPreferences?.idealRoommate?.childrenOk,
    smokingOk: initialPreferences?.idealRoommate?.smokingOk,
    drinkingOk: initialPreferences?.idealRoommate?.drinkingOk,
    visitorsOk: initialPreferences?.idealRoommate?.visitorsOk,
  });
  const [idealCleanliness, setIdealCleanliness] = useState<string | undefined>(initialPreferences?.idealRoommate?.cleanlinessPreference);
  const [idealPersonality, setIdealPersonality] = useState<string[]>(initialPreferences?.idealRoommate?.personalityPreference ?? []);
  const [ageMin, setAgeMin] = useState<string>(initialPreferences?.idealRoommate?.ageRange?.min?.toString() ?? '');
  const [ageMax, setAgeMax] = useState<string>(initialPreferences?.idealRoommate?.ageRange?.max?.toString() ?? '');
  const [genderPref, setGenderPref] = useState<string[]>(initialPreferences?.idealRoommate?.genderPreference ?? []);

  const toggleMulti = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const toggleBool = (obj: Record<string, boolean | undefined>, key: string, value: boolean, setter: (v: Record<string, boolean | undefined>) => void) => {
    setter({ ...obj, [key]: obj[key] === value ? undefined : value });
  };

  const buildPreferences = (): UserPreferences => {
    const prefs: UserPreferences = {};

    // myTraits
    const myTraits: Record<string, unknown> = {};
    if (worksOutside !== undefined) myTraits.worksOutside = worksOutside;
    if (schedule) myTraits.schedule = schedule;
    if (boolTraits.hasPets !== undefined) myTraits.hasPets = boolTraits.hasPets;
    if (boolTraits.hasChildren !== undefined) myTraits.hasChildren = boolTraits.hasChildren;
    if (boolTraits.smokes !== undefined) myTraits.smokes = boolTraits.smokes;
    if (boolTraits.hasFrequentVisitors !== undefined) myTraits.hasFrequentVisitors = boolTraits.hasFrequentVisitors;
    if (drinks) myTraits.drinks = drinks;
    if (cleanliness) myTraits.cleanliness = cleanliness;
    if (personality.length > 0) myTraits.personality = personality;
    if (Object.keys(myTraits).length > 0) prefs.myTraits = myTraits as UserPreferences['myTraits'];

    // lookingFor
    if (lookingFor.length > 0) prefs.lookingFor = lookingFor as UserPreferences['lookingFor'];

    // idealRoommate
    const ideal: Record<string, unknown> = {};
    if (idealSchedule) ideal.schedulePreference = idealSchedule;
    for (const [key, val] of Object.entries(idealTolerances)) {
      if (val !== undefined) ideal[key] = val;
    }
    if (idealCleanliness) ideal.cleanlinessPreference = idealCleanliness;
    if (idealPersonality.length > 0) ideal.personalityPreference = idealPersonality;
    if (ageMin && ageMax) ideal.ageRange = { min: parseInt(ageMin, 10), max: parseInt(ageMax, 10) };
    if (genderPref.length > 0) ideal.genderPreference = genderPref;
    if (Object.keys(ideal).length > 0) prefs.idealRoommate = ideal as UserPreferences['idealRoommate'];

    return prefs;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      onComplete(buildPreferences());
    }
  };

  const inputClass =
    'w-20 px-3 py-2 rounded-xl border-2 border-rumi-primary-light/30 bg-white text-sm text-rumi-text text-center focus:outline-none focus:border-rumi-primary focus:ring-4 focus:ring-rumi-primary/10 transition-all duration-200';

  return (
    <div className="w-full">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-rumi-primary' : i < step ? 'w-2 bg-rumi-primary/60' : 'w-2 bg-rumi-primary/20'
            }`}
          />
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-rumi-primary-light/10">
        {/* Step 1: Sobre ti */}
        {step === 0 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-rumi-text">🙋 Sobre ti</h2>
              <p className="text-sm text-rumi-text/50 mt-1">Cuéntanos un poco sobre tu estilo de vida</p>
            </div>

            {/* Trabajo */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Trabajo</p>
              <div className="flex gap-3 flex-wrap">
                <EmojiChip
                  emoji={WORK_OPTIONS.trueOption.emoji}
                  label={WORK_OPTIONS.trueOption.label}
                  selected={worksOutside === true}
                  onClick={() => setWorksOutside(worksOutside === true ? undefined : true)}
                />
                <EmojiChip
                  emoji={WORK_OPTIONS.falseOption.emoji}
                  label={WORK_OPTIONS.falseOption.label}
                  selected={worksOutside === false}
                  onClick={() => setWorksOutside(worksOutside === false ? undefined : false)}
                />
              </div>
            </div>

            {/* Horario */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Horario</p>
              <div className="flex gap-3 flex-wrap">
                {SCHEDULE_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={schedule === opt.value}
                    onClick={() => setSchedule(schedule === opt.value ? undefined : opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Convivencia */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Convivencia</p>
              <div className="flex gap-3 flex-wrap">
                {LIFESTYLE_TOGGLES.map((toggle) => (
                  <div key={toggle.key} className="flex gap-2">
                    <EmojiChip
                      emoji={toggle.trueOption.emoji}
                      label={toggle.trueOption.label}
                      selected={boolTraits[toggle.key] === true}
                      onClick={() => toggleBool(boolTraits, toggle.key, true, setBoolTraits)}
                    />
                    <EmojiChip
                      emoji={toggle.falseOption.emoji}
                      label={toggle.falseOption.label}
                      selected={boolTraits[toggle.key] === false}
                      onClick={() => toggleBool(boolTraits, toggle.key, false, setBoolTraits)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bebidas */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Bebidas</p>
              <div className="flex gap-3 flex-wrap">
                {DRINKING_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={drinks === opt.value}
                    onClick={() => setDrinks(drinks === opt.value ? undefined : opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Orden */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Orden</p>
              <div className="flex gap-3 flex-wrap">
                {CLEANLINESS_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={cleanliness === opt.value}
                    onClick={() => setCleanliness(cleanliness === opt.value ? undefined : opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Personalidad */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Personalidad <span className="text-rumi-text/30 font-normal">(puedes elegir varias)</span></p>
              <div className="flex gap-3 flex-wrap">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={personality.includes(opt.value)}
                    onClick={() => toggleMulti(personality, opt.value, setPersonality)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Que buscas en Rumi? */}
        {step === 1 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-rumi-text">🔍 ¿Qué buscas en Rumi?</h2>
              <p className="text-sm text-rumi-text/50 mt-1">Selecciona todo lo que aplique</p>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <EmojiChip
                  key={opt.value}
                  emoji={opt.emoji}
                  label={opt.label}
                  selected={lookingFor.includes(opt.value)}
                  onClick={() => toggleMulti(lookingFor, opt.value, setLookingFor)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Tu companero ideal */}
        {step === 2 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-rumi-text">🤝 Tu compañero ideal</h2>
              <p className="text-sm text-rumi-text/50 mt-1">¿Cómo te gustaría que fuera tu roommate?</p>
            </div>

            {/* Horario preferido */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Horario preferido</p>
              <div className="flex gap-3 flex-wrap">
                {IDEAL_SCHEDULE_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={idealSchedule === opt.value}
                    onClick={() => setIdealSchedule(idealSchedule === opt.value ? undefined : opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Tolerancias */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">¿Qué aceptas?</p>
              <div className="flex gap-3 flex-wrap">
                {IDEAL_TOLERANCE_TOGGLES.map((toggle) => (
                  <div key={toggle.key} className="flex gap-2">
                    <EmojiChip
                      emoji={toggle.trueOption.emoji}
                      label={toggle.trueOption.label}
                      selected={idealTolerances[toggle.key] === true}
                      onClick={() => toggleBool(idealTolerances, toggle.key, true, setIdealTolerances)}
                    />
                    <EmojiChip
                      emoji={toggle.falseOption.emoji}
                      label={toggle.falseOption.label}
                      selected={idealTolerances[toggle.key] === false}
                      onClick={() => toggleBool(idealTolerances, toggle.key, false, setIdealTolerances)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Orden */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Nivel de orden</p>
              <div className="flex gap-3 flex-wrap">
                {IDEAL_CLEANLINESS_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={idealCleanliness === opt.value}
                    onClick={() => setIdealCleanliness(idealCleanliness === opt.value ? undefined : opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Personalidad */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Personalidad <span className="text-rumi-text/30 font-normal">(puedes elegir varias)</span></p>
              <div className="flex gap-3 flex-wrap">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={idealPersonality.includes(opt.value)}
                    onClick={() => toggleMulti(idealPersonality, opt.value, setIdealPersonality)}
                  />
                ))}
              </div>
            </div>

            {/* Rango de edad */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Rango de edad</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={16}
                  max={120}
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className={inputClass}
                />
                <span className="text-rumi-text/40">—</span>
                <input
                  type="number"
                  min={16}
                  max={120}
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className={inputClass}
                />
                <span className="text-xs text-rumi-text/40">años</span>
              </div>
            </div>

            {/* Genero preferido */}
            <div>
              <p className="text-sm font-semibold text-rumi-text/70 mb-2">Preferencia de género</p>
              <div className="flex gap-3 flex-wrap">
                {GENDER_PREF_OPTIONS.map((opt) => (
                  <EmojiChip
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={genderPref.includes(opt.value)}
                    onClick={() => toggleMulti(genderPref, opt.value, setGenderPref)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Atrás
            </Button>
          )}
          {step === 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkipAll}
              className="flex-1"
            >
              Saltar todo
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            loading={step === TOTAL_STEPS - 1 && saving}
            className="flex-1"
          >
            {step < TOTAL_STEPS - 1 ? 'Siguiente →' : 'Finalizar ✨'}
          </Button>
        </div>
      </div>
    </div>
  );
}
