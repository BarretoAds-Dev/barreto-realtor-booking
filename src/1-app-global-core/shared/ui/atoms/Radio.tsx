/** @jsxImportSource preact */

interface RadioOption {
	value: string;
	label: string;
	description?: string;
}

interface RadioProps {
	name: string;
	options: RadioOption[];
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
	touched?: boolean;
	className?: string;
	variant?: 'light' | 'dark';
}

export default function Radio({
	name,
	options,
	value,
	onChange,
	error,
	touched = false,
	className = '',
	variant = 'dark',
}: RadioProps) {
	const hasError = touched && error;

	const textClasses = variant === 'light'
		? 'text-gray-900 font-medium'
		: 'text-white font-medium';

	const descriptionClasses = variant === 'light'
		? 'text-gray-500 text-xs mt-1'
		: 'text-gray-400 text-xs mt-1';

	const errorClasses = variant === 'light'
		? 'mt-2 text-sm text-red-600'
		: 'mt-2 text-sm text-red-400';

	return (
		<div class={className}>
			<div class="space-y-3">
				{options.map((option) => {
					const isSelected = value === option.value;

					const labelClasses = variant === 'light'
						? isSelected
							? 'border-gray-900 bg-gray-50'
							: hasError
							? 'border-red-300 bg-white'
							: 'border-gray-300 bg-white hover:border-gray-400'
						: isSelected
						? 'border-[#00a0df]/70 bg-[#00a0df]/10'
						: hasError
						? 'border-red-500/50 bg-slate-700/30'
						: 'border-slate-600/50 bg-slate-700/20 hover:border-slate-600/70';

					const radioCircleClasses = variant === 'light'
						? isSelected
							? 'border-gray-900 bg-gray-900'
							: 'border-gray-400'
						: isSelected
						? 'border-[#00a0df] bg-[#00a0df]'
						: 'border-slate-500';

					return (
						<label
							key={option.value}
							class={`flex items-start p-4 border-2 rounded cursor-pointer transition-all ${labelClasses}`}
						>
							<input
								type="radio"
								name={name}
								value={option.value}
								checked={isSelected}
								onChange={() => onChange?.(option.value)}
								class="sr-only"
							/>
							<div class={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 ${radioCircleClasses}`}>
								{isSelected && (
									<div class="w-2 h-2 rounded-full bg-white"></div>
								)}
							</div>
							<div class="flex-1">
								<div class={textClasses}>{option.label}</div>
								{option.description && (
									<div class={descriptionClasses}>{option.description}</div>
								)}
							</div>
						</label>
					);
				})}
			</div>
			{touched && error && (
				<p class={errorClasses}>{error}</p>
			)}
		</div>
	);
}

