/**
 * 🚀 Servicios Unificados - Backend Compartido
 *
 * Todos los servicios están centralizados aquí para ser compartidos
 * entre CRM y Site, evitando duplicación de lógica de negocio.
 */

export { AppointmentsService } from './appointments.service';
export { AvailabilityService } from './availability.service';
export { EasyBrokerServiceAPI, getEasyBrokerService } from './easybroker.service';
export { validatePassword } from './hibp.service';
export { uploadAvatar, deleteAvatar } from './storage.service';

