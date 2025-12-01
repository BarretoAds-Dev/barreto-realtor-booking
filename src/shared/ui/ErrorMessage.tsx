/** @jsxImportSource preact */

interface ErrorMessageProps {
	errors: Record<string, string>;
	general?: string;
}

export default function ErrorMessage({ errors, general }: ErrorMessageProps) {
	const fieldErrors = Object.entries(errors).filter(
		([field, error]) => field !== 'general' && error && error.trim().length > 0
	);
	
	if (fieldErrors.length === 0 && !general) return null;
	
	return (
		<div class="bg-red-500/20 border-2 border-red-500/50 backdrop-blur-xl p-4 mb-4 rounded">
			<p class="text-red-300 text-sm font-semibold mb-2">Por favor corrige los siguientes errores:</p>
			{general && (
				<p class="text-red-200 text-sm mb-2">{general}</p>
			)}
			{fieldErrors.length > 0 && (
				<ul class="list-disc list-inside text-red-200 text-xs space-y-1">
					{fieldErrors.map(([field, error]) => (
						<li key={field} class="mt-1">{String(error)}</li>
					))}
				</ul>
			)}
		</div>
	);
}

