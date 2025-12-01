/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

interface ButtonProps {
	children: ComponentChildren;
	onClick?: (e: any) => void;
	type?: 'button' | 'submit' | 'reset';
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
	className?: string;
	fullWidth?: boolean;
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
}: ButtonProps) {
	const baseClasses = 'inline-flex items-center justify-center font-semibold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
	
	const variantClasses = {
		primary: 'bg-gradient-to-r from-[#003d82] to-[#004C97] hover:from-[#004C97] hover:to-[#003d82] text-white border-2 border-[#00a0df]/30 shadow-md shadow-black/20 hover:shadow-lg',
		secondary: 'bg-slate-700/40 backdrop-blur-xl text-white border-2 border-slate-600/50 hover:bg-slate-700/60',
		danger: 'bg-red-600/80 hover:bg-red-600 text-white border-2 border-red-500/50',
		ghost: 'text-gray-300 hover:text-[#00a0df] bg-transparent border-none',
	};
	
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2.5 text-sm',
		lg: 'px-6 py-3 text-base',
	};
	
	const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
	
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			class={classes}
		>
			{loading ? (
				<>
					<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Procesando...
				</>
			) : (
				children
			)}
		</button>
	);
}

