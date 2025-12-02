// Constantes globales del sistema

// Constantes para formularios de citas
export const BUDGET_OPTIONS_RENTAR = [
	{ value: '20000-30000', label: '$20,000 - $30,000 MXN', min: 20000 },
	{ value: '30000-40000', label: '$30,000 - $40,000 MXN', min: 30000 },
	{ value: '40000-50000', label: '$40,000 - $50,000 MXN', min: 40000 },
	{ value: '50000-60000', label: '$50,000 - $60,000 MXN', min: 50000 },
	{ value: '60000-80000', label: '$60,000 - $80,000 MXN', min: 60000 },
	{ value: '80000-100000', label: '$80,000 - $100,000 MXN', min: 80000 },
	{ value: '100000-150000', label: '$100,000 - $150,000 MXN', min: 100000 },
	{ value: 'mas-150000', label: 'Más de $150,000 MXN', min: 150000 },
];

export const BUDGET_OPTIONS_COMPRAR = [
	{ value: '2500000-3000000', label: '$2,500,000 - $3,000,000 MXN', min: 2500000 },
	{ value: '3000000-3500000', label: '$3,000,000 - $3,500,000 MXN', min: 3000000 },
	{ value: '3500000-4000000', label: '$3,500,000 - $4,000,000 MXN', min: 3500000 },
	{ value: '4000000-5000000', label: '$4,000,000 - $5,000,000 MXN', min: 4000000 },
	{ value: '5000000-6000000', label: '$5,000,000 - $6,000,000 MXN', min: 5000000 },
	{ value: '6000000-8000000', label: '$6,000,000 - $8,000,000 MXN', min: 6000000 },
	{ value: '8000000-10000000', label: '$8,000,000 - $10,000,000 MXN', min: 8000000 },
	{ value: 'mas-10000000', label: 'Más de $10,000,000 MXN', min: 10000000 },
];

export const RESOURCE_TYPES = [
	{ value: 'recursos-propios', label: 'Recursos propios' },
	{ value: 'credito-bancario', label: 'Crédito bancario' },
	{ value: 'infonavit', label: 'Infonavit' },
	{ value: 'fovissste', label: 'Fovissste' },
];

export const BANKS = [
	{ value: 'bbva', label: 'BBVA' },
	{ value: 'banamex', label: 'Banamex' },
	{ value: 'santander', label: 'Santander' },
	{ value: 'hsbc', label: 'HSBC' },
	{ value: 'banorte', label: 'Banorte' },
	{ value: 'scotiabank', label: 'Scotiabank' },
	{ value: 'banco-azteca', label: 'Banco Azteca' },
	{ value: 'bancoppel', label: 'Bancoppel' },
	{ value: 'inbursa', label: 'Inbursa' },
	{ value: 'banregio', label: 'Banregio' },
	{ value: 'banco-del-bajio', label: 'Banco del Bajío' },
	{ value: 'banco-multiva', label: 'Banco Multiva' },
	{ value: 'otro-banco', label: 'Otro banco' },
];

export const MODALIDADES_INFONAVIT = [
	{ value: 'tradicional', label: 'Tradicional' },
	{ value: 'cofinavit', label: 'Cofinavit' },
	{ value: 'mejoravit', label: 'Mejoravit' },
	{ value: 'tu-casa', label: 'Tu Casa' },
];

export const MODALIDADES_FOVISSSTE = [
	{ value: 'tradicional', label: 'Tradicional' },
	{ value: 'cofinavit', label: 'Cofinavit' },
	{ value: 'mi-vivienda', label: 'Mi Vivienda' },
];

export const OPERATION_TYPES = [
	{ value: 'rentar', label: 'Rentar' },
	{ value: 'comprar', label: 'Comprar' },
];

// Constantes de configuración de la aplicación
export const DEFAULT_AGENT_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_SLOT_DURATION = 45; // minutos
export const DEFAULT_BUFFER_TIME = 5; // minutos

