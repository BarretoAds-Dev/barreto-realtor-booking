/**
 * Barrel Export - Utilidades Globales
 *
 * Exporta todas las utilidades del sistema de forma centralizada
 *
 * @example
 * ```ts
 * import { formatDateLocal, formatCurrency, validateName, getEasyBrokerPropertyUrl } from '@/1-app-global-core/utils';
 * ```
 */

// ============================================================================
// Formatters (Dates, Currency, URLs)
// ============================================================================

export {
	formatDateLocal,
	getDayOfWeek,
	formatDateSpanish,
	normalizeTime,
	formatCurrency,
	formatBudgetRange,
	capitalize,
	formatBankName,
	getEasyBrokerPropertyUrl,
} from './formatters';

// ============================================================================
// Validators
// ============================================================================

export {
	validateName,
	validateEmail,
	validatePhone,
	validateNotes,
	validateAppointmentClient,
	type ValidationResult,
} from './validators';

