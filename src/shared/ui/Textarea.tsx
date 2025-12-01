/** @jsxImportSource preact */

interface TextareaProps {
	id?: string;
	name?: string;
	value?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	rows?: number;
	onChange?: (e: any) => void;
	onBlur?: (e: any) => void;
	error?: string;
	touched?: boolean;
	className?: string;
}

export default function Textarea({
	id,
	name,
	value,
	placeholder,
	required = false,
	disabled = false,
	rows = 4,
	onChange,
	onBlur,
	error,
	touched = false,
	className = '',
}: TextareaProps) {
	const hasError = touched && error;
	
	const baseClasses = 'w-full px-4 py-3 border-2 outline-none transition-all resize-none bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light';
	const errorClasses = hasError
		? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
		: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70';
	
	return (
		<div>
			<textarea
				id={id}
				name={name}
				value={value}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				rows={rows}
				onChange={onChange}
				onBlur={onBlur}
				class={`${baseClasses} ${errorClasses} ${className}`}
			></textarea>
			{hasError && (
				<p class="mt-1 text-sm text-red-400">{error}</p>
			)}
		</div>
	);
}

