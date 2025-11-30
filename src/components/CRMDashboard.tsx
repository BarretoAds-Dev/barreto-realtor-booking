/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import PropertiesSection from './PropertiesSection';
import AppointmentsSection from './AppointmentsSection';
import ClientsSection from './ClientsSection';
import { Appointment } from '../types/appointment';

interface Property {
	id: string;
	title: string;
	type: string;
	operation: string;
	price: number;
	address: string;
	bedrooms: number;
	bathrooms: number;
	area: number;
	status: string;
	description: string;
	features: string[];
	createdAt: string;
}

interface Client {
	id: string;
	name: string;
	email: string;
	phone: string;
	appointmentsCount: number;
	lastAppointment: string;
}

interface CRMDashboardProps {
	appointments: Appointment[];
	properties: Property[];
	clients: Client[];
}

type Tab = 'overview' | 'properties' | 'appointments' | 'clients';

export default function CRMDashboard({ appointments, properties, clients }: CRMDashboardProps) {
	const [activeTab, setActiveTab] = useState<Tab>('overview');

	const handleTabChange = (tabId: Tab) => {
		console.log('Changing tab to:', tabId);
		setActiveTab(tabId);
	};

	// Calcular estadísticas generales
	const stats = {
		totalProperties: properties.length,
		availableProperties: properties.filter(p => p.status === 'disponible').length,
		soldProperties: properties.filter(p => p.status === 'vendido' || p.status === 'rentado').length,
		totalAppointments: appointments.length,
		upcomingAppointments: appointments.filter(a => {
			const aptDate = new Date(`${a.date}T${a.time}`);
			return aptDate > new Date() && a.status !== 'cancelled' && a.status !== 'completed';
		}).length,
		totalClients: clients.length,
		newClients: clients.filter(c => {
			const lastApt = new Date(c.lastAppointment);
			const weekAgo = new Date();
			weekAgo.setDate(weekAgo.getDate() - 7);
			return lastApt >= weekAgo;
		}).length
	};

	const tabs = [
		{ id: 'overview' as Tab, label: 'Resumen', icon: '📊' },
		{ id: 'properties' as Tab, label: 'Propiedades', icon: '🏠' },
		{ id: 'appointments' as Tab, label: 'Citas', icon: '📅' },
		{ id: 'clients' as Tab, label: 'Clientes', icon: '👥' }
	];

	return (
		<div class="space-y-6">
			{/* Tabs Navigation */}
			<div class="bg-slate-800/40 backdrop-blur-xl border-2 border-slate-700/50 shadow-md shadow-black/20">
				<div class="flex flex-wrap gap-2 p-4">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabChange(tab.id)}
							class={`px-6 py-3 font-bold uppercase tracking-wide transition-all border-2 cursor-pointer ${
								activeTab === tab.id
									? 'bg-[#003d82] border-[#00a0df]/60 text-white shadow-md shadow-black/20'
									: 'bg-slate-700/40 border-slate-600/50 text-gray-300 hover:bg-slate-700/60 hover:border-[#00a0df]/40'
							}`}
						>
							<span class="mr-2">{tab.icon}</span>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			{activeTab === 'overview' && (
				<div class="space-y-6">
					{/* Estadísticas generales */}
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
							<div class="text-sm text-gray-400 mb-2 uppercase tracking-wide">Propiedades</div>
							<div class="text-3xl font-bold text-white mb-1">{stats.totalProperties}</div>
							<div class="text-xs text-gray-500">{stats.availableProperties} disponibles</div>
						</div>
						<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
							<div class="text-sm text-gray-400 mb-2 uppercase tracking-wide">Vendidas/Rentadas</div>
							<div class="text-3xl font-bold text-green-400 mb-1">{stats.soldProperties}</div>
							<div class="text-xs text-gray-500">Cerradas</div>
						</div>
						<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
							<div class="text-sm text-gray-400 mb-2 uppercase tracking-wide">Citas</div>
							<div class="text-3xl font-bold text-[#00a0df] mb-1">{stats.totalAppointments}</div>
							<div class="text-xs text-gray-500">{stats.upcomingAppointments} próximas</div>
						</div>
						<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
							<div class="text-sm text-gray-400 mb-2 uppercase tracking-wide">Clientes</div>
							<div class="text-3xl font-bold text-purple-400 mb-1">{stats.totalClients}</div>
							<div class="text-xs text-gray-500">{stats.newClients} nuevos esta semana</div>
						</div>
					</div>

					{/* Resumen rápido */}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Próximas citas */}
						<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
							<h3 class="text-lg font-bold text-white mb-4 uppercase tracking-wide">Próximas Citas</h3>
							<div class="space-y-3">
								{appointments
									.filter(a => {
										const aptDate = new Date(`${a.date}T${a.time}`);
										return aptDate > new Date() && a.status !== 'cancelled' && a.status !== 'completed';
									})
									.slice(0, 5)
									.map((apt) => (
										<div class="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/30">
											<div>
												<div class="text-sm font-semibold text-white">{apt.client.name}</div>
												<div class="text-xs text-gray-400">
													{new Date(`${apt.date}T${apt.time}`).toLocaleString('es-ES', {
														day: '2-digit',
														month: '2-digit',
														hour: '2-digit',
														minute: '2-digit'
													})}
												</div>
											</div>
											<span class={`px-2 py-1 text-xs font-bold uppercase rounded border ${
												apt.status === 'confirmed' 
													? 'bg-green-500/20 text-green-400 border-green-500/30'
													: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
											}`}>
												{apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
											</span>
										</div>
									))}
								{appointments.filter(a => {
									const aptDate = new Date(`${a.date}T${a.time}`);
									return aptDate > new Date() && a.status !== 'cancelled' && a.status !== 'completed';
								}).length === 0 && (
									<p class="text-gray-400 text-sm">No hay citas próximas</p>
								)}
							</div>
						</div>

						{/* Propiedades recientes */}
						<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
							<h3 class="text-lg font-bold text-white mb-4 uppercase tracking-wide">Propiedades Recientes</h3>
							<div class="space-y-3">
								{properties
									.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
									.slice(0, 5)
									.map((prop) => (
										<div class="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600/30">
											<div>
												<div class="text-sm font-semibold text-white">{prop.title}</div>
												<div class="text-xs text-gray-400">
													{prop.operation === 'venta' ? 'Venta' : 'Renta'} • {prop.type}
												</div>
											</div>
											<div class="text-right">
												<div class="text-sm font-bold text-[#00a0df]">
													${prop.operation === 'venta' 
														? (prop.price / 1000000).toFixed(1) + 'M'
														: prop.price.toLocaleString()}
												</div>
												<span class={`text-xs px-2 py-1 rounded border ${
													prop.status === 'disponible'
														? 'bg-green-500/20 text-green-400 border-green-500/30'
														: prop.status === 'vendido' || prop.status === 'rentado'
														? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
														: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
												}`}>
													{prop.status}
												</span>
											</div>
										</div>
									))}
								{properties.length === 0 && (
									<p class="text-gray-400 text-sm">No hay propiedades registradas</p>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{activeTab === 'properties' && (
				<PropertiesSection properties={properties} />
			)}

			{activeTab === 'appointments' && (
				<AppointmentsSection appointments={appointments} />
			)}

			{activeTab === 'clients' && (
				<ClientsSection clients={clients} />
			)}
		</div>
	);
}

