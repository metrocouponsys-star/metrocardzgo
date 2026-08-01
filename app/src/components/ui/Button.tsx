/**
 * Button — canonical typed button component using the Metro Cardz premium design system.
 *
 * Usage:
 *   <Button variant="filled">Save Changes</Button>
 *   <Button variant="outlined" size="sm" loading={saving}>Saving...</Button>
 *   <Button variant="text" icon="delete" onClick={handleDelete}>Delete</Button>
 *
 * Variants:
 *   filled   — high emphasis (gold fill, white text, soft shadow on hover)
 *   tonal    — medium emphasis (soft gold tint bg, dark gold text)
 *   outlined — medium emphasis (white bg, border, charcoal text)
 *   text     — low emphasis (gold text, no bg)
 *   danger   — destructive actions (uses error palette)
 */
import React from 'react';

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Material Symbols icon name rendered before the label */
  icon?: string;
  /** Material Symbols icon name rendered after the label */
  trailingIcon?: string;
  /** Shows a spinner and disables the button */
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Gold fill — THE primary action button
  filled:   'bg-[#B8941F] text-white hover:bg-[#9A7A18] active:bg-[#7A5C12] shadow-sm hover:shadow-[0_4px_12px_rgba(184,148,31,0.3)]',
  // Soft gold tint — secondary action
  tonal:    'bg-[#F5EDD0] text-[#7A5C12] hover:bg-[#EDE0B5] active:bg-[#E0D0A0]',
  // White + border — medium emphasis
  outlined: 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#9CA3AF] active:bg-[#F3F4F6]',
  // Text only — low emphasis
  text:     'text-[#B8941F] hover:bg-primary/8 bg-transparent active:bg-primary/12',
  // Danger — destructive
  danger:   'bg-red-600 text-white hover:bg-[#9B1313] active:bg-[#7A0F0F] shadow-sm',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1',
  md: 'px-4 py-2.5 text-sm gap-1.5',
  lg: 'px-6 py-3 text-sm gap-2',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[19px]',
};

export function Button({
  variant = 'filled',
  size = 'md',
  icon,
  trailingIcon,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-xl',
        'transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span
          className={`material-symbols-outlined animate-spin ${ICON_SIZE[size]}`}
          aria-hidden="true"
        >
          progress_activity
        </span>
      ) : icon ? (
        <span className={`material-symbols-outlined ${ICON_SIZE[size]}`} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {!loading && trailingIcon && (
        <span className={`material-symbols-outlined ${ICON_SIZE[size]}`} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}

