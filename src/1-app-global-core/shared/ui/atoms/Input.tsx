/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

interface InputProps {
	id?: string;
	name?: string;
	type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'time';
	value?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	onChange?: (e: any) => void;
	onBlur?: (e: any) => void;
	error?: string;
	touched?: boolean;
	className?: string;
	variant?: 'light' | 'dark';
}

export default function Input({
	id,
	name,
	type = 'text',
	value,
	placeholder,
	required = false,
	disabled = false,
	onChange,
	onBlur,
	error,
	touched = false,
	className = '',
	variant = 'dark',
}: InputProps) {
	const hasError = touched && error;

	// Estilos base según variante
	const baseClasses = variant === 'light'
		? 'w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:ring-gray-900 focus:border-gray-900'
		: 'w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light';

	const errorClasses = hasError
		? variant === 'light'
			? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
			: 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
		: variant === 'light'
			? ''
			: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70';

	return (
		<div>
			<input
				id={id}
				name={name}
				type={type}
				value={value}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				onChange={onChange}
				onBlur={onBlur}
				class={`${baseClasses} ${errorClasses} ${className}`}
			/>
			{hasError && (
				<p class={`mt-1 text-sm ${variant === 'light' ? 'text-red-600' : 'text-red-400'}`}>{error}</p>
			)}
		</div>
	);
}

