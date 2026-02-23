// Configuration data for onboarding wizard steps

export interface ChipOption {
  value: string;
  emoji: string;
  label: string;
}

export interface BooleanToggle {
  key: string;
  trueOption: { emoji: string; label: string };
  falseOption: { emoji: string; label: string };
}

// Step 1: Sobre ti — Trabajo
export const WORK_OPTIONS: BooleanToggle = {
  key: 'worksOutside',
  trueOption: { emoji: '💼', label: 'Trabajo fuera' },
  falseOption: { emoji: '🏠', label: 'Trabajo remoto' },
};

// Step 1: Sobre ti — Horario
export const SCHEDULE_OPTIONS: ChipOption[] = [
  { value: 'MORNING', emoji: '🌅', label: 'Madrugador' },
  { value: 'AFTERNOON', emoji: '🌆', label: 'Tarde' },
  { value: 'NIGHT', emoji: '🌙', label: 'Nocturno' },
];

// Step 1: Sobre ti — Convivencia (boolean toggles)
export const LIFESTYLE_TOGGLES: BooleanToggle[] = [
  { key: 'hasPets', trueOption: { emoji: '🐶', label: 'Tengo mascotas' }, falseOption: { emoji: '🚫', label: 'Sin mascotas' } },
  { key: 'hasChildren', trueOption: { emoji: '👶', label: 'Tengo hijos' }, falseOption: { emoji: '🙅', label: 'Sin hijos' } },
  { key: 'smokes', trueOption: { emoji: '🚬', label: 'Fumo' }, falseOption: { emoji: '🚭', label: 'No fumo' } },
  { key: 'hasFrequentVisitors', trueOption: { emoji: '👥', label: 'Visitas frecuentes' }, falseOption: { emoji: '🤫', label: 'Pocas visitas' } },
];

// Step 1: Sobre ti — Bebidas
export const DRINKING_OPTIONS: ChipOption[] = [
  { value: 'NEVER', emoji: '🚫', label: 'Nunca' },
  { value: 'SOCIALLY', emoji: '🍻', label: 'Socialmente' },
  { value: 'FREQUENTLY', emoji: '🥂', label: 'Frecuentemente' },
];

// Step 1: Sobre ti — Orden
export const CLEANLINESS_OPTIONS: ChipOption[] = [
  { value: 'VERY_CLEAN', emoji: '✨', label: 'Muy ordenado' },
  { value: 'CLEAN', emoji: '🧹', label: 'Ordenado' },
  { value: 'MODERATE', emoji: '😌', label: 'Moderado' },
  { value: 'RELAXED', emoji: '🤙', label: 'Relajado' },
];

// Step 1: Sobre ti — Personalidad (multi-select)
export const PERSONALITY_OPTIONS: ChipOption[] = [
  { value: 'INTROVERT', emoji: '📚', label: 'Introvertido' },
  { value: 'EXTROVERT', emoji: '🎉', label: 'Extrovertido' },
  { value: 'CALM', emoji: '🧘', label: 'Tranquilo' },
  { value: 'SOCIAL', emoji: '💬', label: 'Social' },
  { value: 'STUDIOUS', emoji: '📖', label: 'Estudioso' },
  { value: 'ACTIVE', emoji: '🏃', label: 'Activo' },
];

// Step 2: Que buscas en Rumi?
export const LOOKING_FOR_OPTIONS: ChipOption[] = [
  { value: 'ROOMMATE', emoji: '👫', label: 'Compañero de cuarto' },
  { value: 'APARTMENT', emoji: '🏢', label: 'Apartamento' },
  { value: 'ROOM', emoji: '🚪', label: 'Habitación' },
  { value: 'SHARE_EXPENSES', emoji: '💰', label: 'Compartir gastos' },
];

// Step 3: Tu compañero ideal — Horario
export const IDEAL_SCHEDULE_OPTIONS: ChipOption[] = [
  { value: 'MORNING', emoji: '🌅', label: 'Madrugador' },
  { value: 'AFTERNOON', emoji: '🌆', label: 'Tarde' },
  { value: 'NIGHT', emoji: '🌙', label: 'Nocturno' },
  { value: 'ANY', emoji: '🤷', label: 'Cualquiera' },
];

// Step 3: Tu compañero ideal — Tolerancias (boolean)
export const IDEAL_TOLERANCE_TOGGLES: BooleanToggle[] = [
  { key: 'petsOk', trueOption: { emoji: '🐶', label: 'Mascotas OK' }, falseOption: { emoji: '🚫', label: 'Sin mascotas' } },
  { key: 'childrenOk', trueOption: { emoji: '👶', label: 'Hijos OK' }, falseOption: { emoji: '🙅', label: 'Sin hijos' } },
  { key: 'smokingOk', trueOption: { emoji: '🚬', label: 'Fumador OK' }, falseOption: { emoji: '🚭', label: 'No fumador' } },
  { key: 'drinkingOk', trueOption: { emoji: '🍺', label: 'Bebedor OK' }, falseOption: { emoji: '🚫', label: 'No bebedor' } },
  { key: 'visitorsOk', trueOption: { emoji: '👥', label: 'Visitas OK' }, falseOption: { emoji: '🤫', label: 'Pocas visitas' } },
];

// Step 3: Tu compañero ideal — Orden
export const IDEAL_CLEANLINESS_OPTIONS: ChipOption[] = [
  { value: 'VERY_CLEAN', emoji: '✨', label: 'Muy ordenado' },
  { value: 'CLEAN', emoji: '🧹', label: 'Ordenado' },
  { value: 'MODERATE', emoji: '😌', label: 'Moderado' },
  { value: 'ANY', emoji: '🤷', label: 'Cualquiera' },
];

// Step 3: Tu compañero ideal — Genero
export const GENDER_PREF_OPTIONS: ChipOption[] = [
  { value: 'MALE', emoji: '👨', label: 'Hombre' },
  { value: 'FEMALE', emoji: '👩', label: 'Mujer' },
  { value: 'NON_BINARY', emoji: '🧑', label: 'No binario' },
  { value: 'ANY', emoji: '🤷', label: 'Cualquiera' },
];
