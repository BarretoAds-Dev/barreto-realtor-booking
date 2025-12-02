/**
 * Re-export del servicio Easy Broker para uso en features
 * Mantiene la arquitectura modular del proyecto
 */
export { EasyBrokerServiceAPI, getEasyBrokerService } from '@/1-app-global-core/core/services/easybroker.service';
export type {
	EasyBrokerProperty,
	EasyBrokerPropertiesResponse,
	EasyBrokerSearchFilters,
	EasyBrokerServiceResult,
} from '@/1-app-global-core/core/types/easybroker';

