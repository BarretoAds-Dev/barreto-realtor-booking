/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { supabaseAuth } from '../../config/supabase/auth';

export default function LoginForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState(false);
	const [emailError, setEmailError] = useState<string | null>(null);

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleEmailChange = (value: string) => {
		setEmail(value);
		if (value && !validateEmail(value)) {
			setEmailError('Por favor ingresa un correo electrónico válido');
		} else {
			setEmailError(null);
		}
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		
		// Validar email antes de enviar
		if (!validateEmail(email)) {
			setEmailError('Por favor ingresa un correo electrónico válido');
			return;
		}
		
		setIsLoading(true);
		setError(null);
		setEmailError(null);
		setIsSuccess(false);

		try {
			const { data, error: signInError } = await supabaseAuth.auth.signInWithPassword({
				email,
				password,
			});

			if (signInError) {
				setError(signInError.message || 'Error al iniciar sesión');
				setIsLoading(false);
				return;
			}

			if (data.user && data.session) {
				// Guardar tokens en localStorage para persistencia
				if (data.session.access_token) {
					localStorage.setItem('sb-access-token', data.session.access_token);
				}
				if (data.session.refresh_token) {
					localStorage.setItem('sb-refresh-token', data.session.refresh_token);
				}
				
				setIsSuccess(true);
				// Redirigir al CRM después de un breve delay con transición suave
				setTimeout(() => {
					window.location.href = '/crm/CRMDashboard';
				}, 800);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
			setIsLoading(false);
		}
	};

	return (
		<div class="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
			<div class="max-w-md w-full">
				{/* Logo y título */}
				<div class="text-center mb-6 sm:mb-8">
					<div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-900 mb-3 sm:mb-4 shadow-sm">
						<svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
					<h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">InmoCRM</h1>
					<p class="text-xs sm:text-sm text-gray-500">Inicia sesión para acceder al panel de asesores</p>
				</div>

				{/* Formulario */}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
					<form onSubmit={handleSubmit} class="space-y-4">
						{/* Mensaje de error */}
						{error && (
							<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
								{error}
							</div>
						)}

						{/* Mensaje de éxito */}
						{isSuccess && (
							<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
								Inicio de sesión exitoso. Redirigiendo...
							</div>
						)}

						{/* Email */}
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
								Correo electrónico
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onInput={(e) => handleEmailChange((e.target as HTMLInputElement).value)}
								required
								disabled={isLoading}
								class={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
									emailError 
										? 'border-red-300 focus:ring-red-500 bg-red-50' 
										: 'border-gray-300 focus:ring-gray-900'
								}`}
								placeholder="asesor@ejemplo.com"
							/>
							{emailError && (
								<p class="mt-1 text-xs text-red-600">{emailError}</p>
							)}
						</div>

						{/* Contraseña */}
						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
								Contraseña
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
								required
								disabled={isLoading}
								class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
								placeholder="••••••••"
							/>
						</div>

						{/* Botón de envío */}
						<button
							type="submit"
							disabled={isLoading}
							class="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<span class="flex items-center justify-center">
									<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Iniciando sesión...
								</span>
							) : (
								'Iniciar sesión'
							)}
						</button>
					</form>
				</div>

				{/* Footer */}
				<p class="mt-6 text-center text-xs text-gray-500">
					¿Problemas para acceder? Contacta al administrador
				</p>
			</div>
		</div>
	);
}

