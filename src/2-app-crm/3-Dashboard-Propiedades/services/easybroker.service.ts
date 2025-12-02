/**
 * Re-export del servicio Easy Broker para uso en features
 * Mantiene la arquitectura modular del proyecto
 */
export {
  EasyBrokerServiceAPI,
  getEasyBrokerService,
} from '@/1-app-global-core/services/easybroker.service';
export type {
  EasyBrokerPropertiesResponse,
  EasyBrokerProperty,
  EasyBrokerSearchFilters,
  EasyBrokerServiceResult,
} from '@/1-app-global-core/types/easybroker';
