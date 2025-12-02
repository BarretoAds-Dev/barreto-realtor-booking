/**
 * Barrel Export - Configuración Global
 *
 * Exporta todas las configuraciones del sistema de forma centralizada
 *
 * @example
 * ```ts
 * import { supabase, supabaseAuth, easybrokerConfig, BUDGET_OPTIONS_RENTAR } from '@/1-app-global-core/config';
 * ```
 */

// ============================================================================
// Database Configuration (Supabase)
// ============================================================================

export {
	supabase,
	supabaseAdmin,
	supabaseAuth,
	getSupabaseAdmin,
} from './database.config';

// ============================================================================
// External APIs Configuration
// ============================================================================

export {
	easybrokerConfig,
	validateEasyBrokerConfig,
	getEasyBrokerApiKey,
	getEasyBrokerBaseUrl,
} from './external-apis.config';

// ============================================================================
// Application Configuration (Constants & Validation)
// ============================================================================

export {
	BUDGET_OPTIONS_RENTAR,
	BUDGET_OPTIONS_COMPRAR,
	RESOURCE_TYPES,
	BANKS,
	MODALIDADES_INFONAVIT,
	MODALIDADES_FOVISSSTE,
	OPERATION_TYPES,
	DEFAULT_AGENT_ID,
	DEFAULT_SLOT_DURATION,
	DEFAULT_BUFFER_TIME,
	VALIDATION_RULES,
	VALIDATION_MESSAGES,
} from './app.config';
