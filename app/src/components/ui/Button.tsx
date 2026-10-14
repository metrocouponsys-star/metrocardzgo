/**
 * Button — canonical typed button component using the Metro Cardz design system.
 *
 * Usability guarantees (per non-technical user requirements):
 *   - All buttons have a visible ACTIVE/pressed state (scale + darker shade)
 *   - Disabled state is visually distinct (opacity-40, cursor-not-allowed)
 *   - Loading shows spinner + text change so user knows something is happening
 *   - Minimum 44px height on md/lg to meet touch-target requirements for counter use
 *
 * Usage:
 *   <Button variant="filled">Save Changes</Button>
 *   <Button variant="outlined" size="sm" loading={saving}>Saving...</Button>
 *   <Button variant="text" icon="delete" onClick={handleDelete}>Delete</Button>
 *
 * Variants follow Material Design 3 naming:
 *   filled   — high emphasis (primary action)
 *   tonal    — medium emphasis (secondary action)
 *   outlined — medium emphasis (secondary, outlined)
 *   text     — low emphasis (tertiary action)
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
  filled:   'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/75 active:scale-95 shadow-sm',
  tonal:    'bg-primary-container text-on-primary-container hover:bg-primary-container/80 active:bg-primary-container/60 active:scale-95',
  outlined: 'border-2 border-outline text-primary hover:bg-primary/8 active:bg-primary/15 active:scale-95 bg-transparent',
  text:     'text-primary hover:bg-primary/8 active:bg-primary/15 active:scale-95 bg-transparent',
  danger:   'bg-error text-on-error hover:bg-error/90 active:bg-error/75 active:scale-95 shadow-sm',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-label-md gap-1 min-h-[36px]',
  md: 'px-4 py-2.5 text-label-md gap-1.5 min-h-[44px]',   // 44px min-touch-target
  lg: 'px-6 py-3.5 text-body-md gap-2 min-h-[52px]',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'text-[16px]',
  md: 'text-[20px]',
  lg: 'text-[22px]',
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
        // Disabled state is visually distinct from active: lower opacity + no hover effects + not-allowed cursor
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none',
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
