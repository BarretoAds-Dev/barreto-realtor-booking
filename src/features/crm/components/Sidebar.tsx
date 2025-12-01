/** @jsxImportSource preact */
import LogoutButton from './LogoutButton';

interface SidebarProps {
	currentView: string;
	onViewChange: (view: string) => void;
	isOpen?: boolean;
	onClose?: () => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

export default function Sidebar({ currentView, onViewChange, isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
	const menuItems = [
		{ id: 'dashboard', label: 'Panel General', icon: '📊' },
		{ id: 'properties', label: 'Propiedades', icon: '🏠' },
		{ id: 'appointments', label: 'Clientes y Citas', icon: '👥' },
	];

	return (
		<aside
			class={`
				fixed lg:static left-0 top-0 bottom-0 z-[60]
				bg-white border-r border-gray-200
				shadow-sm
				transform transition-all duration-300 ease-in-out
				${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
				${isCollapsed ? 'lg:w-16' : 'w-56 sm:w-64 lg:w-56'}
				h-screen
				overflow-y-auto
			`}
			style="margin: 0; padding: 0;"
		>
			<div class="h-full flex flex-col px-3 pb-3 pt-3 sm:p-4">
				{/* Header con logo */}
				<div class="mb-4 sm:mb-6 flex-shrink-0">
					{/* Versión expandida - siempre visible en móvil, condicional en desktop */}
					<div class={`flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-6 ${isCollapsed ? 'lg:hidden' : ''}`}>
						<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-900 flex items-center justify-center shadow-sm flex-shrink-0">
							<svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<h1 class="text-sm sm:text-base font-bold text-gray-900 leading-tight">
								InmoCRM<span class="text-gray-600">.</span>
							</h1>
						</div>
					</div>
					{/* Versión colapsada - solo en desktop cuando está colapsado */}
					{isCollapsed && (
						<div class="hidden lg:flex justify-center mb-4 sm:mb-6">
							<div class="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-gray-900 flex items-center justify-center shadow-sm">
								<svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
							</div>
						</div>
					)}
					
					{/* Botón contraer/expandir - Solo visible en desktop (lg:) */}
					{onToggleCollapse && (
						<div class={`hidden lg:flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
							<button
								onClick={onToggleCollapse}
								class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg border border-gray-300"
								aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
								title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
							>
								{isCollapsed ? (
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								) : (
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
									</svg>
								)}
							</button>
						</div>
					)}
					
					{/* Botón cerrar para móvil */}
					<button
						onClick={onClose}
						class="lg:hidden absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-all duration-150 shadow-md hover:shadow-lg"
						aria-label="Cerrar menú"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Encabezado MENU */}
				<div class={`mb-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
					<h2 class="text-xs font-medium text-gray-400 uppercase tracking-wider">MENU</h2>
				</div>

				{/* Navegación */}
				<nav class={`flex-1 ${isCollapsed ? 'space-y-1 lg:space-y-2' : 'space-y-1'}`}>
					{menuItems.map((item) => (
						<button
							key={item.id}
							onClick={() => onViewChange(item.id)}
							class={`
								w-full flex items-center rounded-lg transition-all duration-150
								${isCollapsed ? 'px-2.5 py-2 lg:justify-center lg:px-2 lg:py-2.5' : 'px-2.5 py-2 gap-2.5 text-left'}
								${
									currentView === item.id
										? 'bg-gray-900 text-white shadow-md sm:h-8'
										: 'text-gray-500 hover:bg-gray-200 shadow-sm hover:shadow-md sm:h-8'
								}
							`}
							title={isCollapsed ? 'lg:' + item.label : ''}
						>
							<span class={`
								text-base flex-shrink-0 flex items-center justify-center
								${isCollapsed ? 'lg:w-full' : ''}
								${currentView === item.id ? 'text-white' : 'text-gray-400'}
							`}>
								{item.icon}
							</span>
							{!isCollapsed && (
								<span class={`
									text-xs whitespace-nowrap
									${currentView === item.id ? 'font-medium text-white' : 'font-normal text-gray-600'}
								`}>
									{item.label}
								</span>
							)}
						</button>
					))}
				</nav>

				{/* Botones inferiores */}
				<div class="mt-auto pt-6 border-t border-gray-200 space-y-2">
					{/* Botón de configuración */}
					<button
						onClick={() => onViewChange('settings')}
						class={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg ${
							isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'text-left'
						} ${
							currentView === 'settings'
								? 'bg-gray-900 text-white'
								: 'text-gray-500 hover:bg-gray-50'
						}`}
						title={isCollapsed ? 'Configuración' : ''}
					>
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						{!isCollapsed && (
							<span class={`text-xs whitespace-nowrap font-normal ${
								currentView === 'settings' ? 'text-white' : ''
							}`}>
								Configuración
							</span>
						)}
					</button>
					{/* Botón de cambiar usuario */}
					<div class={isCollapsed ? 'lg:hidden' : ''}>
						<LogoutButton showChangeUser={true} />
					</div>
					{/* Botón de logout */}
					<div class={isCollapsed ? 'lg:hidden' : ''}>
						<LogoutButton />
					</div>
				</div>
			</div>
		</aside>
	);
}

