/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

interface FormFieldProps {
	label: string;
	required?: boolean;
	error?: string;
	touched?: boolean;
	optional?: boolean;
	children: ComponentChildren;
	className?: string;
	variant?: 'light' | 'dark';
}

export default function FormField({
	label,
	required = false,
	error,
	touched = false,
	optional = false,
	children,
	className = '',
	variant = 'dark',
}: FormFieldProps) {
	const labelClasses = variant === 'light'
		? 'block text-sm font-medium text-gray-700 mb-1.5'
		: 'block text-sm font-bold text-white mb-2 uppercase tracking-wide';

	const requiredSpanClasses = variant === 'light'
		? 'text-red-500'
		: 'text-red-400';

	const optionalSpanClasses = variant === 'light'
		? 'text-gray-500 text-xs font-normal normal-case'
		: 'text-gray-400 text-xs font-normal normal-case';

	const errorClasses = variant === 'light'
		? 'mt-1 text-sm text-red-600'
		: 'mt-1 text-sm text-red-400';

	return (
		<div class={className}>
			<label class={labelClasses}>
				{label}
				{required && <span class={requiredSpanClasses}> *</span>}
				{optional && <span class={optionalSpanClasses}> (opcional)</span>}
			</label>
			{children}
			{touched && error && (
				<p class={errorClasses}>{error}</p>
			)}
		</div>
	);
}

