/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { supabaseAuth } from '../../config/supabase/auth';

export default function LogoutButton() {
	const [isLoading, setIsLoading] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const handleLogout = async () => {
		setIsLoading(true);
		try {
			const { error } = await supabaseAuth.auth.signOut();
			
			// Limpiar tokens del localStorage
			localStorage.removeItem('sb-access-token');
			localStorage.removeItem('sb-refresh-token');
			
			if (error) {
				console.error('Error al cerrar sesión:', error);
				setIsLoading(false);
				return;
			}

			// Redirigir a login
			window.location.href = '/login';
		} catch (error) {
			console.error('Error al cerrar sesión:', error);
			setIsLoading(false);
		}
	};

	return (
		<>
			{showConfirm && (
				<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
					<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Confirmar cierre de sesión</h3>
						<p class="text-sm text-gray-600 mb-6">
							¿Estás seguro de que deseas cerrar sesión?
						</p>
						<div class="flex gap-3 justify-end">
							<button
								onClick={() => setShowConfirm(false)}
								disabled={isLoading}
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={handleLogout}
								disabled={isLoading}
								class="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
							>
								{isLoading ? (
									<>
										<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
										Cerrando...
									</>
								) : (
									'Cerrar sesión'
								)}
							</button>
						</div>
					</div>
				</div>
			)}
			<button
				onClick={() => setShowConfirm(true)}
				disabled={isLoading}
				class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 text-gray-500 hover:bg-gray-50 shadow-sm hover:shadow disabled:opacity-50"
				title="Cerrar sesión"
			>
				<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
				</svg>
				<span class="text-xs whitespace-nowrap font-normal">
					{isLoading ? 'Cerrando...' : 'Cerrar sesión'}
				</span>
			</button>
		</>
	);
}

