/**
 * 🚀 Servicios Unificados - Backend Compartido
 *
 * Todos los servicios están centralizados aquí para ser compartidos
 * entre CRM y Site, evitando duplicación de lógica de negocio.
 *
 * Estructura optimizada:
 * - booking.service.ts: Unifica appointments + availability
 * - easybroker.service.ts: API externa de EasyBroker
 * - security.service.ts: Unifica hibp + storage
 */

// ============================================================================
// Booking Service (Appointments + Availability)
// ============================================================================

export {
	BookingService,
	AppointmentsService,
	AvailabilityService,
} from './booking.service';

// ============================================================================
// EasyBroker Service (External API)
// ============================================================================

export {
	EasyBrokerServiceAPI,
	getEasyBrokerService,
} from './easybroker.service';

// ============================================================================
// Security Service (Password Validation + Storage)
// ============================================================================

export {
	SecurityService,
	validatePassword,
	uploadAvatar,
	deleteAvatar,
} from './security.service';

