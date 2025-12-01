/** @jsxImportSource preact */

interface RadioOption {
	value: string;
	label: string;
	description?: string;
}

interface RadioGroupProps {
	name: string;
	options: RadioOption[];
	value?: string;
	onChange?: (value: string) => void;
	error?: string;
	touched?: boolean;
	className?: string;
}

export default function RadioGroup({
	name,
	options,
	value,
	onChange,
	error,
	touched = false,
	className = '',
}: RadioGroupProps) {
	const hasError = touched && error;
	
	return (
		<div class={className}>
			<div class="space-y-3">
				{options.map((option) => {
					const isSelected = value === option.value;
					return (
						<label
							key={option.value}
							class={`flex items-start p-4 border-2 rounded cursor-pointer transition-all ${
								isSelected
									? 'border-[#00a0df]/70 bg-[#00a0df]/10'
									: hasError
									? 'border-red-500/50 bg-slate-700/30'
									: 'border-slate-600/50 bg-slate-700/20 hover:border-slate-600/70'
							}`}
						>
							<input
								type="radio"
								name={name}
								value={option.value}
								checked={isSelected}
								onChange={() => onChange?.(option.value)}
								class="sr-only"
							/>
							<div class={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 ${
								isSelected
									? 'border-[#00a0df] bg-[#00a0df]'
									: 'border-slate-500'
							}`}>
								{isSelected && (
									<div class="w-2 h-2 rounded-full bg-white"></div>
								)}
							</div>
							<div class="flex-1">
								<div class="text-white font-medium">{option.label}</div>
								{option.description && (
									<div class="text-gray-400 text-xs mt-1">{option.description}</div>
								)}
							</div>
						</label>
					);
				})}
			</div>
			{touched && error && (
				<p class="mt-2 text-sm text-red-400">{error}</p>
			)}
		</div>
	);
}

