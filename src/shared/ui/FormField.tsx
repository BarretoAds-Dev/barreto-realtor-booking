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
}

export default function FormField({
	label,
	required = false,
	error,
	touched = false,
	optional = false,
	children,
	className = '',
}: FormFieldProps) {
	return (
		<div class={className}>
			<label class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
				{label}
				{required && <span class="text-red-400"> *</span>}
				{optional && <span class="text-gray-400 text-xs font-normal normal-case"> (opcional)</span>}
			</label>
			{children}
			{touched && error && (
				<p class="mt-1 text-sm text-red-400">{error}</p>
			)}
		</div>
	);
}

