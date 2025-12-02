/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps {
	id?: string;
	name?: string;
	value?: string;
	options: SelectOption[];
	required?: boolean;
	disabled?: boolean;
	onChange?: (e: any) => void;
	onBlur?: (e: any) => void;
	error?: string;
	touched?: boolean;
	placeholder?: string;
	className?: string;
	variant?: 'light' | 'dark';
}

export default function Select({
	id,
	name,
	value,
	options,
	required = false,
	disabled = false,
	onChange,
	onBlur,
	error,
	touched = false,
	placeholder,
	className = '',
	variant = 'dark',
}: SelectProps) {
	const hasError = touched && error;

	const baseClasses = variant === 'light'
		? 'w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:ring-gray-900 focus:border-gray-900 appearance-none cursor-pointer'
		: 'w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light appearance-none cursor-pointer';

	const errorClasses = hasError
		? variant === 'light'
			? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
			: 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
		: variant === 'light'
			? ''
			: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70';

	const errorTextClasses = variant === 'light'
		? 'mt-1 text-sm text-red-600'
		: 'mt-1 text-sm text-red-400';

	return (
		<div>
			<select
				id={id}
				name={name}
				value={value}
				required={required}
				disabled={disabled}
				onChange={onChange}
				onBlur={onBlur}
				class={`${baseClasses} ${errorClasses} ${className}`}
				style={variant === 'light' ? 'background-color: white !important; color: #111827 !important;' : ''}
			>
				{placeholder && (
					<option value="" disabled style={variant === 'light' ? 'color: #6b7280;' : ''}>{placeholder}</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value} style={variant === 'light' ? 'color: #111827; background-color: white;' : ''}>
						{option.label}
					</option>
				))}
			</select>
			{hasError && (
				<p class={errorTextClasses}>{error}</p>
			)}
		</div>
	);
}

