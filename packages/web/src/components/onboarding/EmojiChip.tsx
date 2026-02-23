interface EmojiChipProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function EmojiChip({ emoji, label, selected, onClick, disabled }: EmojiChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border-2
        transition-all duration-200 cursor-pointer select-none
        active:scale-[0.97]
        ${selected
          ? 'bg-rumi-primary/10 border-rumi-primary shadow-sm'
          : 'bg-white border-rumi-primary-light/30 hover:border-rumi-primary-light/60'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className={`text-xs font-medium ${selected ? 'text-rumi-primary-dark' : 'text-rumi-text/60'}`}>
        {label}
      </span>
    </button>
  );
}
