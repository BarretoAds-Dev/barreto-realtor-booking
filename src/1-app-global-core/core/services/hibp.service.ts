/**
 * Servicio para validar contraseñas contra Have I Been Pwned (HIBP)
 * Usa k-Anonymity para proteger la privacidad de las contraseñas
 * Compatible con Cloudflare Workers (WinterCG)
 */

const MIN_PASSWORD_LENGTH = 8; // Ajustar a 12+ para política más estricta

/**
 * Convierte un ArrayBuffer a string hexadecimal
 */
function toHex(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Calcula el hash SHA-1 de un string y lo retorna en hexadecimal
 */
async function sha1Hex(input: string): Promise<string> {
	const enc = new TextEncoder();
	const data = enc.encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-1', data);
	return toHex(hashBuffer).toUpperCase();
}

/**
 * Verifica si una contraseña ha sido comprometida usando HIBP k-Anonymity API
 *
 * @param password - La contraseña a verificar
 * @returns true si la contraseña está comprometida, false si es segura
 * @throws Error si el servicio HIBP no está disponible
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
	// k-Anonymity: enviamos solo los primeros 5 caracteres del SHA-1
	// y comparamos los sufijos localmente
	const sha1 = await sha1Hex(password);
	const prefix = sha1.slice(0, 5);
	const suffix = sha1.slice(5);

	const hibpUrl = `https://api.pwnedpasswords.com/range/${prefix}`;

	try {
		const res = await fetch(hibpUrl, {
			method: 'GET',
			headers: {
				'User-Agent': 'inmocrm-hibp-check/1.0',
			},
		});

		if (!res.ok) {
			// En caso de fallo del servicio upstream, fall-safe:
			// tratar como potencialmente comprometida para evitar crear cuentas con seguridad desconocida
			console.error('❌ HIBP lookup failed:', res.status, res.statusText);
			throw new Error('HIBP service unavailable');
		}

		const text = await res.text();
		// La respuesta es líneas de: Suffix:Count
		const lines = text.split(/\r?\n/);

		for (const line of lines) {
			const [remoteSuffix] = line.split(':');
			if (!remoteSuffix) continue;

			// Comparar sufijos (case-insensitive)
			if (remoteSuffix.trim().toUpperCase() === suffix) {
				return true; // Contraseña comprometida
			}
		}

		return false; // Contraseña segura
	} catch (error) {
		console.error('❌ Error en verificación HIBP:', error);
		throw error;
	}
}

/**
 * Valida la longitud mínima de una contraseña
 */
export function validatePasswordLength(password: string): {
	valid: boolean;
	error?: string;
} {
	if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
		return {
			valid: false,
			error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
		};
	}
	return { valid: true };
}

/**
 * Valida una contraseña completa (longitud + HIBP)
 *
 * @param password - La contraseña a validar
 * @returns Objeto con resultado de validación
 */
export async function validatePassword(password: string): Promise<{
	valid: boolean;
	error?: string;
	pwned?: boolean;
}> {
	// Validar longitud primero
	const lengthValidation = validatePasswordLength(password);
	if (!lengthValidation.valid) {
		return lengthValidation;
	}

	// Verificar contra HIBP
	try {
		const pwned = await isPasswordPwned(password);
		if (pwned) {
			return {
				valid: false,
				error: 'Esta contraseña ha aparecido en una filtración de datos conocida. Por favor, elige una contraseña diferente.',
				pwned: true,
			};
		}

		return { valid: true };
	} catch (error) {
		// Si HIBP no está disponible, retornar error de servicio
		return {
			valid: false,
			error: 'No se pudo validar la seguridad de la contraseña. Por favor, intenta nuevamente más tarde.',
		};
	}
}

