/** @jsxImportSource preact */
import type { EasyBrokerProperty } from '../../../core/types/easybroker';
import Button from '../../../shared/ui/atoms/Button';

interface PropertyCardProps {
	property: EasyBrokerProperty;
	onClick?: (property: EasyBrokerProperty) => void;
	onScheduleAppointment?: (property: EasyBrokerProperty) => void;
	onDownloadSheet?: (property: EasyBrokerProperty) => void;
}

/**
 * Card de propiedad siguiendo el diseño de la imagen
 * Muestra imagen, precio, ubicación y características
 */
/**
 * Obtiene la URL de la imagen usando el proxy si es necesario
 */
function getImageUrl(imageUrl: string | null | undefined): string | null {
	if (!imageUrl) return null;

	// Si la imagen es de Easy Broker, usar el proxy para evitar CORS
	if (imageUrl.includes('easybroker.com') || imageUrl.includes('ebimg')) {
		return `/api/easybroker/image-proxy?url=${encodeURIComponent(imageUrl)}`;
	}

	return imageUrl;
}

export function PropertyCard({
	property,
	onClick,
	onScheduleAppointment,
	onDownloadSheet,
}: PropertyCardProps): JSX.Element {
	const mainImageUrl = property.title_image_full || property.images[0]?.url;
	const mainImage = getImageUrl(mainImageUrl);
	const price = property.operations[0];
	const propertyTypeLabel = getPropertyTypeLabel(property.property_type);

	const handleClick = (): void => {
		onClick?.(property);
	};

	const handleScheduleAppointment = (e: Event): void => {
		e.stopPropagation();
		onScheduleAppointment?.(property);
	};

	const handleDownloadSheet = (e: Event): void => {
		e.stopPropagation();
		onDownloadSheet?.(property);
	};

	return (
		<article
			className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer"
			onClick={handleClick}
		>
			{/* Imagen con placeholder si no hay */}
			<div className="relative h-40 w-full overflow-hidden bg-gray-100">
				{mainImage ? (
					<img
						src={mainImage}
						alt={property.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
						onError={(e) => {
							console.warn('⚠️ Error al cargar imagen:', mainImage);
							// Intentar usar la imagen thumb como fallback
							if (property.title_image_thumb && property.title_image_thumb !== mainImageUrl) {
								const thumbUrl = getImageUrl(property.title_image_thumb);
								if (thumbUrl) {
									(e.target as HTMLImageElement).src = thumbUrl;
								}
							}
						}}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-100">
						<svg
							className="h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
				)}
				{/* Tag de tipo de propiedad */}
				{propertyTypeLabel && (
					<div className="absolute right-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
						{propertyTypeLabel}
					</div>
				)}
			</div>

			{/* Contenido */}
			<div className="p-4">
				{/* Título */}
				<h3 className="mb-1.5 text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
					{property.title}
				</h3>

				{/* Precio */}
				{price && (
					<div className="mb-2">
						<span className="text-xl font-bold text-gray-900">
							{price.formatted_amount}
						</span>
						{price.unit && (
							<span className="ml-1 text-xs text-gray-500">
								/ {price.unit}
							</span>
						)}
						{!price.unit && price.currency && (
							<span className="ml-1 text-xs text-gray-500">
								{price.currency}
							</span>
						)}
					</div>
				)}

				{/* Ubicación */}
				<div className="mb-3 flex items-start gap-1 text-xs text-gray-600">
					<svg
						className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					<span className="line-clamp-1 text-xs">
						{formatLocation(property.location)}
					</span>
				</div>

				{/* Características */}
				<div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-600">
					{property.features.bedrooms && (
						<div className="flex items-center gap-1">
							<svg
								className="h-4 w-4 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							<span className="text-xs">
								{property.features.bedrooms}{' '}
								{property.features.bedrooms === 1
									? 'rec.'
									: 'rec.'}
							</span>
						</div>
					)}
					{property.features.bathrooms && (
						<div className="flex items-center gap-1">
							<svg
								className="h-4 w-4 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
								/>
							</svg>
							<span className="text-xs">
								{property.features.bathrooms}{' '}
								{property.features.bathrooms === 1 ? 'baño' : 'baños'}
							</span>
						</div>
					)}
					{property.features.construction_size && (
						<div className="flex items-center gap-1">
							<svg
								className="h-4 w-4 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
								/>
							</svg>
							<span className="text-xs">{property.features.construction_size} m²</span>
						</div>
					)}
				</div>

				{/* Botones de acción */}
				<div className="flex gap-1.5 pt-3 border-t border-gray-200">
					{onScheduleAppointment && (
						<Button
							type="button"
							onClick={handleScheduleAppointment}
							variant="primary"
							size="sm"
							fullWidth
							uppercase={false}
							className="text-[10px] px-2 py-1 bg-gray-900 hover:bg-gray-800 text-white h-7"
						>
							<svg
								className="h-2.5 w-2.5 mr-1"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							Crear Cita
						</Button>
					)}
					{onDownloadSheet && (
						<Button
							type="button"
							onClick={handleDownloadSheet}
							variant="primary"
							size="sm"
							uppercase={false}
							className="text-[10px] px-2 py-1 bg-gray-900 hover:bg-gray-800 text-white h-7"
						>
							<svg
								className="h-2.5 w-2.5 mr-1"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							Ficha
						</Button>
					)}
				</div>
			</div>
		</article>
	);
}

/**
 * Formatea la ubicación de la propiedad
 */
function formatLocation(location: EasyBrokerProperty['location']): string {
	const parts: string[] = [];

	if (location.address) {
		parts.push(location.address);
	}
	if (location.neighborhood) {
		parts.push(location.neighborhood);
	}
	if (location.city) {
		parts.push(location.city);
	}
	if (location.state && location.state !== location.city) {
		parts.push(location.state);
	}

	return parts.length > 0 ? parts.join(', ') : 'Ubicación no disponible';
}

/**
 * Obtiene la etiqueta en español del tipo de propiedad
 */
function getPropertyTypeLabel(propertyType: string): string {
	const type = propertyType.toLowerCase();
	const typeMap: Record<string, string> = {
		house: 'Casa',
		casa: 'Casa',
		villa: 'Casa',
		residencia: 'Casa',
		apartment: 'Departamento',
		departamento: 'Departamento',
		loft: 'Departamento',
		penthouse: 'Departamento',
		land: 'Terreno',
		terreno: 'Terreno',
		lote: 'Terreno',
		commercial: 'Comercial',
		comercial: 'Comercial',
		local: 'Comercial',
		oficina: 'Comercial',
	};

	for (const [key, label] of Object.entries(typeMap)) {
		if (type.includes(key)) {
			return label;
		}
	}

	return propertyType;
}

