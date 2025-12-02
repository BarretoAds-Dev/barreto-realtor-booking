// Utilidades para formateo de datos

/**
 * Formatea un número como moneda mexicana
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN',
	}).format(amount);
}

/**
 * Formatea un rango de presupuesto para mostrar
 */
export function formatBudgetRange(range: string): string {
	if (range.startsWith('mas-')) {
		const amount = range.replace('mas-', '').replace(/\D/g, '');
		return `Más de ${formatCurrency(Number(amount))}`;
	}
	
	const [min, max] = range.split('-').map(Number);
	return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea un nombre de banco para mostrar
 */
export function formatBankName(bankKey: string): string {
	const bankNames: Record<string, string> = {
		'bbva': 'BBVA',
		'banamex': 'Banamex',
		'santander': 'Santander',
		'hsbc': 'HSBC',
		'banorte': 'Banorte',
		'scotiabank': 'Scotiabank',
		'banco-azteca': 'Banco Azteca',
		'bancoppel': 'Bancoppel',
		'inbursa': 'Inbursa',
		'banregio': 'Banregio',
		'banco-del-bajio': 'Banco del Bajío',
		'banco-multiva': 'Banco Multiva',
		'otro-banco': 'Otro banco',
	};
	return bankNames[bankKey] || capitalize(bankKey.replace(/-/g, ' '));
}

