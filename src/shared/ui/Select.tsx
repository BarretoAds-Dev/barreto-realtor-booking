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
}: SelectProps) {
	const hasError = touched && error;
	
	const baseClasses = 'w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light appearance-none cursor-pointer';
	const errorClasses = hasError
		? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
		: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70';
	
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
			>
				{placeholder && (
					<option value="" disabled>{placeholder}</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{hasError && (
				<p class="mt-1 text-sm text-red-400">{error}</p>
			)}
		</div>
	);
}

