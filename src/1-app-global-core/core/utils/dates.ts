// Utilidades para manipulación de fechas

/**
 * Formatea una fecha a formato YYYY-MM-DD (hora local)
 */
export function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Obtiene el día de la semana en inglés
 */
export function getDayOfWeek(date: Date): string {
	const days = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
	];
	return days[date.getDay()];
}

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDateSpanish(date: Date): string {
	return date.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Normaliza el formato de hora para buscar en la DB
 * Convierte "10:00" a "10:00:00" para coincidir con formato TIME
 */
export function normalizeTime(time: string): string {
	if (!time.includes(':')) return time;
	
	const parts = time.split(':');
	if (parts.length === 2) {
		return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
	} else if (parts.length >= 3) {
		return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
	}
	return time;
}

