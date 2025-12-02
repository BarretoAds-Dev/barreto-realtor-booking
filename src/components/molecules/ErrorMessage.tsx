/** @jsxImportSource preact */

interface ErrorMessageProps {
	errors: Record<string, string>;
	general?: string;
	variant?: 'light' | 'dark';
}

export default function ErrorMessage({ errors, general, variant = 'dark' }: ErrorMessageProps) {
	const fieldErrors = Object.entries(errors).filter(
		([field, error]) => field !== 'general' && error && error.trim().length > 0
	);

	if (fieldErrors.length === 0 && !general) return null;

	const containerClasses = variant === 'light'
		? 'bg-red-50 border border-red-200 p-4 mb-4 rounded-lg'
		: 'bg-red-500/20 border-2 border-red-500/50 backdrop-blur-xl p-4 mb-4 rounded';

	const titleClasses = variant === 'light'
		? 'text-red-700 text-sm font-semibold mb-2'
		: 'text-red-300 text-sm font-semibold mb-2';

	const generalClasses = variant === 'light'
		? 'text-red-600 text-sm mb-2'
		: 'text-red-200 text-sm mb-2';

	const listClasses = variant === 'light'
		? 'list-disc list-inside text-red-600 text-sm space-y-1'
		: 'list-disc list-inside text-red-200 text-xs space-y-1';

	return (
		<div class={containerClasses}>
			<p class={titleClasses}>Por favor corrige los siguientes errores:</p>
			{general && (
				<p class={generalClasses}>{general}</p>
			)}
			{fieldErrors.length > 0 && (
				<ul class={listClasses}>
					{fieldErrors.map(([field, error]) => (
						<li key={field} class="mt-1">{String(error)}</li>
					))}
				</ul>
			)}
		</div>
	);
}

