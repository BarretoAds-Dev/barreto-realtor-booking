/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: (e: any) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'light';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  fullWidth?: boolean;
  uppercase?: boolean;
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
  uppercase = true,
}: ButtonProps) {
  const textTransform = uppercase ? 'uppercase tracking-wide' : '';
  const baseClasses = `inline-flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg`;

  const variantClasses = {
    primary:
      'bg-slate-950 hover:bg-slate-600 text-white shadow-md hover:shadow-lg font-medium',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-sm hover:shadow-md font-normal',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg font-medium',
    ghost:
      'text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-transparent shadow-md hover:shadow-lg font-normal',
    outline:
      'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow font-normal',
    light:
      'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 shadow-sm hover:shadow font-normal',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${
    sizeClasses[size]
  } ${textTransform} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      class={classes}
    >
      {loading ? (
        <>
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Procesando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
