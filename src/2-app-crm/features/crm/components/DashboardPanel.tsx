/** @jsxImportSource preact */
import { useState, useEffect, useMemo } from 'preact/hooks';
import { supabaseAuth } from '@/1-app-global-core/core/config/auth';
import { Button } from '@/1-app-global-core/shared/ui';

interface DashboardPanelProps {
	onNavigateToAppointments?: () => void;
}

interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
}

interface Appointment {
	id: string;
	clientName: string;
	clientEmail: string;
	clientPhone: string | null;
	property: string | null;
	date: string;
	time: string;
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
	notes: string | null;
	operationType: 'rentar' | 'comprar';
	budgetRange: string;
	createdAt: string;
}

interface MetricCard {
	icon: string;
	value: string;
	label: string;
	change: string;
	changePositive: boolean;
}

export default function DashboardPanel({ onNavigateToAppointments }: DashboardPanelProps) {
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [currentTime, setCurrentTime] = useState<string>('');
	const [currentDate, setCurrentDate] = useState<string>('');
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [propertiesCount, setPropertiesCount] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(true);

	// Cargar perfil del usuario
	useEffect(() => {
		const loadUserProfile = async () => {
			try {
				const { data: { user }, error } = await supabaseAuth.auth.getUser();

				if (error) {
					console.error('Error al cargar perfil:', error);
					return;
				}

				if (user) {
					setUserProfile({
						id: user.id,
						email: user.email || '',
						full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
					});
				}
			} catch (error) {
				console.error('Error inesperado al cargar perfil:', error);
			}
		};

		loadUserProfile();
	}, []);

	// Actualizar hora y fecha
	useEffect(() => {
		const updateDateTime = () => {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
			const displayHours = hours % 12 || 12;
			const displayMinutes = minutes.toString().padStart(2, '0');

			setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`);

			const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
			const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

			const dayName = days[now.getDay()];
			const day = now.getDate();
			const month = months[now.getMonth()];

			setCurrentDate(`${dayName}, ${day} DE ${month}`);
		};

		updateDateTime();
		const interval = setInterval(updateDateTime, 60000); // Actualizar cada minuto

		return () => clearInterval(interval);
	}, []);

	// Cargar propiedades activas
	useEffect(() => {
		const loadProperties = async () => {
			try {
				// Cargar de Easy Broker
				const easyBrokerResponse = await fetch('/api/easybroker/properties?limit=100');
				let easyBrokerCount = 0;
				if (easyBrokerResponse.ok) {
					const easyBrokerData = await easyBrokerResponse.json();
					easyBrokerCount = easyBrokerData.content?.filter((prop: any) =>
						prop.status === 'active' || prop.status === 'published'
					).length || 0;
				}

				// Cargar de Supabase
				const supabaseResponse = await fetch('/api/properties');
				let supabaseCount = 0;
				if (supabaseResponse.ok) {
					const supabaseData = await supabaseResponse.json();
					supabaseCount = supabaseData.properties?.filter((prop: any) =>
						prop.status === 'active' || !prop.status
					).length || 0;
				}

				setPropertiesCount(easyBrokerCount + supabaseCount);
			} catch (error) {
				console.error('Error al cargar propiedades:', error);
			}
		};

		loadProperties();
	}, []);

	// Cargar citas desde la API
	useEffect(() => {
		const fetchAppointments = async () => {
			setIsLoading(true);
			try {
				const response = await fetch('/api/crm/appointments-list');
				if (response.ok) {
					const data = await response.json();
					setAppointments(data || []);
				} else {
					console.error('Error al cargar citas');
				}
			} catch (error) {
				console.error('Error de conexión:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAppointments();
	}, []);

	// Obtener saludo según la hora
	const getGreeting = (): string => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Buenos días';
		if (hour < 18) return 'Buenas tardes';
		return 'Buenas noches';
	};

	// Calcular métricas basadas en datos reales
	const metrics = useMemo((): MetricCard[] => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const lastMonth = new Date(today);
		lastMonth.setMonth(lastMonth.getMonth() - 1);
		const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
		const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

		// Propiedades Activas: aún no tenemos propiedades, mostrar 0
		const activeProperties = 0;

		// Citas Pendientes: todas las citas con estado pending o confirmed (sin filtrar por fecha)
		const pendingAppointments = appointments.filter(apt =>
			apt.status === 'pending' || apt.status === 'confirmed'
		).length;

		// Clientes únicos: contar emails únicos de todas las citas
		const uniqueClients = new Set(
			appointments
				.filter(apt => apt.clientEmail && apt.clientEmail.trim() !== '')
				.map(apt => apt.clientEmail.toLowerCase().trim())
		).size;

		// Calcular cambios porcentuales (comparar con mes anterior)
		const twoMonthsAgo = new Date(lastMonth);
		twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);
		const twoMonthsAgoStart = new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1);
		const twoMonthsAgoEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 0);

		const lastMonthPending = appointments.filter(apt => {
			const createdDate = new Date(apt.createdAt);
			return createdDate >= twoMonthsAgoStart && createdDate <= twoMonthsAgoEnd &&
				(apt.status === 'pending' || apt.status === 'confirmed');
		}).length;

		// Clientes únicos del mes anterior
		const lastMonthUniqueClients = new Set(
			appointments
				.filter(apt => {
					const createdDate = new Date(apt.createdAt);
					return createdDate >= twoMonthsAgoStart && createdDate <= twoMonthsAgoEnd &&
						apt.clientEmail && apt.clientEmail.trim() !== '';
				})
				.map(apt => apt.clientEmail.toLowerCase().trim())
		).size;

		const calculateChange = (current: number, previous: number): string => {
			if (previous === 0) return current > 0 ? '+100%' : '0%';
			const change = ((current - previous) / previous) * 100;
			return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
		};

		return [
			{
				icon: '🏠',
				value: propertiesCount.toString(),
				label: 'Propiedades Activas',
				change: '0%',
				changePositive: true,
			},
			{
				icon: '⏰',
				value: pendingAppointments.toString(),
				label: 'Citas Pendientes',
				change: calculateChange(pendingAppointments, lastMonthPending),
				changePositive: pendingAppointments >= lastMonthPending,
			},
			{
				icon: '👥',
				value: uniqueClients.toString(),
				label: 'Clientes',
				change: calculateChange(uniqueClients, lastMonthUniqueClients),
				changePositive: uniqueClients >= lastMonthUniqueClients,
			},
		];
	}, [appointments, propertiesCount]);

	// Calcular datos del gráfico semanal: citas nuevas y canceladas
	const weeklyData = useMemo(() => {
		const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
		const now = new Date();

		// Calcular el lunes de esta semana (día 1 = lunes)
		const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
		const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, retroceder 6 días

		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() + diffToMonday);
		startOfWeek.setHours(0, 0, 0, 0);

		// Agrupar por día de la semana
		const dayCounts = days.map((day, index) => {
			const dayDate = new Date(startOfWeek);
			dayDate.setDate(startOfWeek.getDate() + index);
			dayDate.setHours(0, 0, 0, 0);

			// Normalizar la fecha del día para comparación (solo año, mes, día en hora local)
			const dayYear = dayDate.getFullYear();
			const dayMonth = dayDate.getMonth();
			const dayDay = dayDate.getDate();
			const dayDateNormalized = new Date(dayYear, dayMonth, dayDay);

			// Citas nuevas: basadas en createdAt
			const newCount = appointments.filter(apt => {
				if (!apt.createdAt) return false;
				try {
					const createdDate = new Date(apt.createdAt);
					// Verificar que la fecha sea válida
					if (isNaN(createdDate.getTime())) {
						console.warn('Invalid date:', apt.createdAt);
						return false;
					}
					// Normalizar la fecha de creación (solo año, mes, día en hora local)
					const createdYear = createdDate.getFullYear();
					const createdMonth = createdDate.getMonth();
					const createdDay = createdDate.getDate();
					const createdDateNormalized = new Date(createdYear, createdMonth, createdDay);

					// Comparar timestamps normalizados
					const matches = createdDateNormalized.getTime() === dayDateNormalized.getTime();

					// Debug para el día de hoy (lunes, index 0)
					if (index === 0 && matches) {
						console.log('✅ Match found for today:', {
							createdAt: apt.createdAt,
							createdDate: createdDate.toLocaleString('es-ES'),
							createdDateNormalized: createdDateNormalized.toLocaleDateString('es-ES'),
							dayDateNormalized: dayDateNormalized.toLocaleDateString('es-ES'),
							day: day,
							clientName: apt.clientName
						});
					}

					return matches;
				} catch (error) {
					console.error('Error parsing createdAt:', apt.createdAt, error);
					return false;
				}
			}).length;

			// Citas canceladas: basadas en createdAt de citas con status 'cancelled'
			const cancelledCount = appointments.filter(apt => {
				if (apt.status !== 'cancelled' || !apt.createdAt) return false;
				try {
					const createdDate = new Date(apt.createdAt);
					// Verificar que la fecha sea válida
					if (isNaN(createdDate.getTime())) {
						console.warn('Invalid date:', apt.createdAt);
						return false;
					}
					// Normalizar la fecha de creación (solo año, mes, día en hora local)
					const createdYear = createdDate.getFullYear();
					const createdMonth = createdDate.getMonth();
					const createdDay = createdDate.getDate();
					const createdDateNormalized = new Date(createdYear, createdMonth, createdDay);

					// Comparar timestamps normalizados
					return createdDateNormalized.getTime() === dayDateNormalized.getTime();
				} catch (error) {
					console.error('Error parsing createdAt:', apt.createdAt, error);
					return false;
				}
			}).length;

			return { day, newCount, cancelledCount };
		});

		// Debug: mostrar los datos calculados
		console.log('📊 Weekly Data Calculated:', dayCounts);
		console.log('📅 Start of Week:', startOfWeek.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
		console.log('📋 Total Appointments:', appointments.length);
		console.log('📝 Appointments sample (first 5):', appointments.slice(0, 5).map(apt => ({
			id: apt.id,
			clientName: apt.clientName,
			createdAt: apt.createdAt,
			parsedDate: new Date(apt.createdAt).toLocaleDateString('es-ES'),
			parsedTime: new Date(apt.createdAt).toLocaleTimeString('es-ES'),
			status: apt.status
		})));

		// Debug específico para hoy
		const todayIndex = days.findIndex((d, i) => {
			const checkDate = new Date(startOfWeek);
			checkDate.setDate(startOfWeek.getDate() + i);
			const today = new Date();
			return checkDate.getDate() === today.getDate() &&
			       checkDate.getMonth() === today.getMonth() &&
			       checkDate.getFullYear() === today.getFullYear();
		});
		if (todayIndex >= 0) {
			console.log(`🗓️ Today is: ${days[todayIndex]} (index ${todayIndex})`);
			console.log(`📈 Today's counts: New=${dayCounts[todayIndex].newCount}, Cancelled=${dayCounts[todayIndex].cancelledCount}`);
		}

		return dayCounts;
	}, [appointments]);

	// Escala fija hasta 10 para mejor visualización
	const maxValue = Math.max(
		Math.max(...weeklyData.flatMap(d => [d.newCount, d.cancelledCount])),
		10
	); // Mínimo 10 para que siempre se vea la escala completa

	// Debug: mostrar maxValue
	console.log('Max Value:', maxValue);
	console.log('Weekly Data Details:', weeklyData.map((d, i) => ({
		day: d.day,
		newCount: d.newCount,
		cancelledCount: d.cancelledCount,
		dayIndex: i
	})));

	// Función helper para calcular coordenadas Y (invertir para que 0 esté abajo)
	// Escala fija de 0 a 10, donde 0 está en y=200 y 10 está en y=20
	const calculateY = (value: number): number => {
		// Normalizar el valor a la escala de 0-10
		const normalized = Math.min(value, 10) / 10; // Limitar a máximo 10
		// Calcular posición Y: 200 (abajo) - (normalized * 180) (altura útil)
		const yPos = 200 - (normalized * 180); // 180px de altura útil (200 - 20 de margen superior)
		// Asegurar que esté dentro de los límites
		return Math.max(20, Math.min(200, yPos));
	};

	// Función helper para calcular coordenadas X (ajustado para el espacio del eje Y)
	const calculateX = (index: number): number => {
		if (weeklyData.length <= 1) return 200; // Centrar si solo hay un punto
		return (index / (weeklyData.length - 1)) * 350; // 350px de ancho disponible (400 - 50 del eje Y)
	};

	// Próximas citas: las 3 últimas citas agendadas (ordenadas por fecha de creación)
	const upcomingVisits = useMemo(() => {
		const latest = appointments
			.sort((a, b) => {
				// Ordenar por fecha de creación (más recientes primero)
				const dateA = new Date(a.createdAt);
				const dateB = new Date(b.createdAt);
				return dateB.getTime() - dateA.getTime();
			})
			.slice(0, 3) // Últimas 3 citas agendadas
			.map(apt => {
				const aptDateTime = new Date(`${apt.date}T${apt.time}`);
				const hours = aptDateTime.getHours();
				const minutes = aptDateTime.getMinutes();
				const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
				const displayHours = hours % 12 || 12;
				const displayMinutes = minutes.toString().padStart(2, '0');

				return {
					id: apt.id,
					clientName: apt.clientName,
					time: `${displayHours}:${displayMinutes} ${ampm}`,
					date: apt.date,
				};
			});

		return latest;
	}, [appointments]);

	if (isLoading) {
		return (
			<div class="w-full lg:max-w-7xl lg:mx-auto flex items-center justify-center py-12">
				<div class="text-center">
					<svg class="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<p class="text-gray-500 text-sm">Cargando datos del dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div class="w-full lg:max-w-7xl lg:mx-auto space-y-4 sm:space-y-5 md:space-y-6">
			{/* Header superior */}
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
				{/* Saludo y resumen */}
				<div class="flex-1">
					<h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
						{getGreeting()}, {userProfile?.full_name?.split(' ')[0] || 'Usuario'}
					</h1>
					<p class="text-sm sm:text-base text-gray-600">
						Aquí está el resumen de tu actividad en{' '}
						<span class="font-semibold text-gray-900">Coldwell Banker</span>.
					</p>
				</div>

				{/* Hora y fecha */}
				<div class="flex-shrink-0 text-right">
					<div class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
						{currentTime}
					</div>
					<div class="text-xs sm:text-sm text-gray-500 font-medium">
						{currentDate}
					</div>
				</div>
			</div>

			{/* Tarjetas de métricas */}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
				{metrics.map((metric, index) => (
					<div
						key={index}
						class="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150"
					>
						<div class="flex items-start justify-between mb-3">
							<div class="text-2xl sm:text-3xl">{metric.icon}</div>
							<div class={`text-xs sm:text-sm font-semibold flex items-center gap-1 ${
								metric.changePositive ? 'text-green-600' : 'text-red-600'
							}`}>
								<span>{metric.change}</span>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
								</svg>
							</div>
						</div>
						<div class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
							{metric.value}
						</div>
						<div class="text-xs sm:text-sm text-gray-600 font-medium">
							{metric.label}
						</div>
					</div>
				))}
			</div>

			{/* Panel de estadísticas de citas */}
			<div class="bg-gray-50 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
				<h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">
					Estadísticas de Citas
				</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Citas Confirmadas */}
					<div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
									<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div>
									<div class="text-2xl sm:text-3xl font-bold text-gray-900">
										{appointments.filter(apt => apt.status === 'confirmed').length}
									</div>
									<div class="text-sm text-gray-600 font-medium">
										Citas Confirmadas
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Citas Canceladas */}
					<div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
									<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div>
									<div class="text-2xl sm:text-3xl font-bold text-gray-900">
										{appointments.filter(apt => apt.status === 'cancelled').length}
									</div>
									<div class="text-sm text-gray-600 font-medium">
										Citas Canceladas
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Sección inferior: Gráfico y Próximas visitas */}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
				{/* Gráfico de rendimiento semanal */}
				<div class="bg-gray-50 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
					<div class="flex items-center justify-between mb-4 sm:mb-5">
						<h2 class="text-lg sm:text-xl font-bold text-gray-900">
							Rendimiento Semanal
						</h2>
						<div class="flex items-center gap-2 text-xs sm:text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
							<span>Esta semana</span>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</div>

					{/* Leyenda */}
					<div class="flex items-center gap-4 sm:gap-6 mb-4">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-green-600"></div>
							<span class="text-xs sm:text-sm text-gray-600 font-medium">Citas Nuevas</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-red-600"></div>
							<span class="text-xs sm:text-sm text-gray-600 font-medium">Citas Canceladas</span>
						</div>
					</div>

					{/* Gráfico de líneas con SVG */}
					<div class="relative h-48 sm:h-56 md:h-64">
						<svg class="w-full h-full" viewBox="0 0 450 200" preserveAspectRatio="none">
							<defs>
								<linearGradient id="chartGradientNew" x1="0%" y1="0%" x2="0%" y2="100%">
									<stop offset="0%" stop-color="#16a34a" stop-opacity="0.3" />
									<stop offset="100%" stop-color="#16a34a" stop-opacity="0" />
								</linearGradient>
								<linearGradient id="chartGradientCancelled" x1="0%" y1="0%" x2="0%" y2="100%">
									<stop offset="0%" stop-color="#dc2626" stop-opacity="0.3" />
									<stop offset="100%" stop-color="#dc2626" stop-opacity="0" />
								</linearGradient>
							</defs>

							{/* Eje Y con números (0-10) */}
							{Array.from({ length: 11 }, (_, i) => {
								const yValue = 10 - i; // De 10 a 0
								const yPos = 20 + (i * 18); // Distribuir uniformemente (180px / 10 = 18px por unidad)
								return (
									<g key={`y-axis-${i}`}>
										{/* Línea horizontal de guía */}
										<line
											x1="50"
											y1={yPos}
											x2="400"
											y2={yPos}
											stroke="#e5e7eb"
											stroke-width="1"
											stroke-dasharray="2,2"
											opacity="0.5"
										/>
										{/* Etiqueta numérica */}
										<text
											x="45"
											y={yPos + 4}
											fill="#6b7280"
											font-size="10"
											font-weight="500"
											text-anchor="end"
										>
											{yValue}
										</text>
									</g>
								);
							})}

							{/* Línea del eje Y */}
							<line
								x1="50"
								y1="20"
								x2="50"
								y2="200"
								stroke="#9ca3af"
								stroke-width="2"
							/>

							{/* Área bajo la línea de citas nuevas (primero, para que quede debajo) */}
							<polygon
								points={`50,200 ${weeklyData.map((data, index) => {
									const x = calculateX(index) + 50; // Ajustar para el espacio del eje Y
									const y = calculateY(data.newCount);
									return `${x},${y}`;
								}).join(' ')} 400,200`}
								fill="url(#chartGradientNew)"
								opacity="0.3"
							/>

							{/* Área bajo la línea de citas canceladas (primero, para que quede debajo) */}
							<polygon
								points={`50,200 ${weeklyData.map((data, index) => {
									const x = calculateX(index) + 50; // Ajustar para el espacio del eje Y
									const y = calculateY(data.cancelledCount);
									return `${x},${y}`;
								}).join(' ')} 400,200`}
								fill="url(#chartGradientCancelled)"
								opacity="0.3"
							/>

							{/* Línea de citas nuevas (después de las áreas para que quede encima) */}
							<polyline
								points={weeklyData.map((data, index) => {
									const x = calculateX(index) + 50; // Ajustar para el espacio del eje Y
									const y = calculateY(data.newCount);
									return `${x},${y}`;
								}).join(' ')}
								fill="none"
								stroke="#16a34a"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>

							{/* Línea de citas canceladas (después de las áreas para que quede encima) */}
							<polyline
								points={weeklyData.map((data, index) => {
									const x = calculateX(index) + 50; // Ajustar para el espacio del eje Y
									const y = calculateY(data.cancelledCount);
									return `${x},${y}`;
								}).join(' ')}
								fill="none"
								stroke="#dc2626"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>

							{/* Puntos en el gráfico - Citas nuevas (último, para que quede encima de todo) */}
							{weeklyData.map((data, index) => {
								const x = calculateX(index) + 50; // Ajustar para el espacio del eje Y
								const y = calculateY(data.newCount);
								return (
									<circle
										key={`new-${index}`}
										cx={x}
										cy={y}
										r="5"
										fill="#16a34a"
										stroke="#ffffff"
										stroke-width="2"
									/>
								);
							})}

							{/* Puntos en el gráfico - Citas canceladas (último, para que quede encima de todo) */}
							{weeklyData.map((data, index) => {
								const x = calculateX(index) + 50; // Ajustar para el espacio del eje Y
								const y = calculateY(data.cancelledCount);
								return (
									<circle
										key={`cancelled-${index}`}
										cx={x}
										cy={y}
										r="5"
										fill="#dc2626"
										stroke="#ffffff"
										stroke-width="2"
									/>
								);
							})}
						</svg>
						{/* Etiquetas de días */}
						<div class="absolute bottom-0 left-0 right-0 flex justify-between px-2" style="padding-left: 58px;">
							{weeklyData.map((data, index) => (
								<span key={index} class="text-xs text-gray-600 font-medium">
									{data.day}
								</span>
							))}
						</div>
					</div>
				</div>

				{/* Próximas citas */}
				<div class="bg-gray-50 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
					<h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">
						Próximas Citas
					</h2>

					<div class="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
						{upcomingVisits.length === 0 ? (
							<div class="text-center py-8 text-gray-500 text-sm">
								No hay citas agendadas
							</div>
						) : (
							upcomingVisits.map((visit, index) => (
							<div
								key={visit.id}
								class="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150 flex items-center justify-between"
							>
								<div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
									<div class="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
										{index + 2}
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm sm:text-base font-semibold text-gray-900 truncate">
											{visit.clientName}
										</div>
										<div class="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mt-1">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											{visit.time}
										</div>
									</div>
								</div>
							</div>
							))
						)}
					</div>

					<Button
						variant="primary"
						size="md"
						fullWidth
						uppercase={false}
						className="font-normal"
						onClick={onNavigateToAppointments}
					>
						Ver Agenda Completa
					</Button>
				</div>
			</div>
		</div>
	);
}

