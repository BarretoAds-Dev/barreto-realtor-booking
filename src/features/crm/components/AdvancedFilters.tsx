/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { render } from 'preact';

interface AdvancedFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    onReset: () => void;
}

export interface FilterState {
    name: string;
    email: string;
    phone: string;
    dateFrom: string;
    dateTo: string;
    propertyType: string;
    operationType: string;
    priceRange: string;
    status: string;
}

export default function AdvancedFilters({ isOpen, onClose, onApply, onReset }: AdvancedFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        name: '',
        email: '',
        phone: '',
        dateFrom: '',
        dateTo: '',
        propertyType: '',
        operationType: '',
        priceRange: '',
        status: 'all',
    });
    const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            const existingModal = document.getElementById('advanced-filters-modal-root');
            if (existingModal) {
                render(null, existingModal);
                existingModal.remove();
            }
            setModalRoot(null);
            return;
        }

        let root = document.getElementById('advanced-filters-modal-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'advanced-filters-modal-root';
            root.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9998;';
            document.body.appendChild(root);
        }
        setModalRoot(root);

        return () => {
            if (root && root.parentNode) {
                render(null, root);
                root.remove();
            }
        };
    }, [isOpen]);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        const emptyFilters: FilterState = {
            name: '',
            email: '',
            phone: '',
            dateFrom: '',
            dateTo: '',
            propertyType: '',
            operationType: '',
            priceRange: '',
            status: 'all',
        };
        setFilters(emptyFilters);
        onReset();
        onClose();
    };

    const hasActiveFilters = () => {
        return filters.name !== '' ||
            filters.email !== '' ||
            filters.phone !== '' ||
            filters.dateFrom !== '' ||
            filters.dateTo !== '' ||
            filters.propertyType !== '' ||
            filters.operationType !== '' ||
            filters.priceRange !== '' ||
            filters.status !== 'all';
    };

    const countActiveFilters = () => {
        let count = 0;
        if (filters.name) count++;
        if (filters.email) count++;
        if (filters.phone) count++;
        if (filters.dateFrom || filters.dateTo) count++;
        if (filters.propertyType) count++;
        if (filters.operationType) count++;
        if (filters.priceRange) count++;
        if (filters.status !== 'all') count++;
        return count;
    };

    // ✅ SOLUCIÓN: Renderizar solo cuando se abre el modal o cambia modalRoot
    useEffect(() => {
        if (!modalRoot || !isOpen) return;

        const ModalContent = () => {
            const activeFilterCount = countActiveFilters();

            return (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con gradiente */}
                        <div className="relative px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">
                                        Filtros Avanzados
                                    </h2>
                                    {activeFilterCount > 0 && (
                                        <p className="text-sm text-gray-300">
                                            {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Contenido con scroll */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="space-y-4">
                                {/* Sección 1: Información del Cliente */}
                                <div className="bg-white rounded-xl border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-3 border-b border-blue-200 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-blue-900">Información del Cliente</h3>
                                            <p className="text-xs text-blue-700">Busca por datos del cliente</p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="filter-name" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Nombre
                                                </label>
                                                <input
                                                    type="text"
                                                    id="filter-name"
                                                    value={filters.name}
                                                    onChange={(e) => {
                                                        const target = e.currentTarget as HTMLInputElement;
                                                        setFilters({ ...filters, name: target.value });
                                                    }}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    placeholder="Ej: Juan Pérez"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="filter-email" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    id="filter-email"
                                                    value={filters.email}
                                                    onChange={(e) => {
                                                        const target = e.currentTarget as HTMLInputElement;
                                                        setFilters({ ...filters, email: target.value });
                                                    }}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    placeholder="Ej: juan@email.com"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label htmlFor="filter-phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Teléfono
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="filter-phone"
                                                    value={filters.phone}
                                                    onChange={(e) => {
                                                        const target = e.currentTarget as HTMLInputElement;
                                                        setFilters({ ...filters, phone: target.value });
                                                    }}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    placeholder="Ej: 5512345678"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 2: Rango de Fechas */}
                                <div className="bg-white rounded-xl border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-5 py-3 border-b border-purple-200 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-purple-900">Rango de Fechas</h3>
                                            <p className="text-xs text-purple-700">Filtra citas por período</p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="filter-date-from" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Desde
                                                </label>
                                                <input
                                                    type="date"
                                                    id="filter-date-from"
                                                    value={filters.dateFrom}
                                                    onChange={(e) => {
                                                        const target = e.currentTarget as HTMLInputElement;
                                                        setFilters({ ...filters, dateFrom: target.value });
                                                    }}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="filter-date-to" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Hasta
                                                </label>
                                                <input
                                                    type="date"
                                                    id="filter-date-to"
                                                    value={filters.dateTo}
                                                    onChange={(e) => {
                                                        const target = e.currentTarget as HTMLInputElement;
                                                        setFilters({ ...filters, dateTo: target.value });
                                                    }}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 3: Tipo de Operación */}
                                <div className="bg-white rounded-xl border-2 border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 px-5 py-3 border-b border-green-200 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-green-900">Tipo de Operación</h3>
                                            <p className="text-xs text-green-700">Operación y recursos</p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="filter-operation-type" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Operación
                                                </label>
                                                <select
                                                    id="filter-operation-type"
                                                    value={filters.operationType}
                                                    onChange={(e) => setFilters({ ...filters, operationType: (e.target as HTMLSelectElement).value })}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                                                >
                                                    <option value="">Todas</option>
                                                    <option value="rentar">🏠 Rentar</option>
                                                    <option value="comprar">💰 Comprar</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="filter-property-type" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Tipo de Recurso
                                                </label>
                                                <select
                                                    id="filter-property-type"
                                                    value={filters.propertyType}
                                                    onChange={(e) => setFilters({ ...filters, propertyType: (e.target as HTMLSelectElement).value })}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                                                >
                                                    <option value="">Todos</option>
                                                    <option value="recursos-propios">💵 Recursos Propios</option>
                                                    <option value="credito-bancario">🏦 Crédito Bancario</option>
                                                    <option value="infonavit">🏗️ Infonavit</option>
                                                    <option value="fovissste">🏛️ Fovissste</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 4: Presupuesto */}
                                <div className="bg-white rounded-xl border-2 border-amber-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-5 py-3 border-b border-amber-200 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-amber-900">Rango de Precio</h3>
                                            <p className="text-xs text-amber-700">Presupuesto del cliente</p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <label htmlFor="filter-price-range" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Presupuesto
                                        </label>
                                        <select
                                            id="filter-price-range"
                                            value={filters.priceRange}
                                            onChange={(e) => setFilters({ ...filters, priceRange: (e.target as HTMLSelectElement).value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
                                        >
                                            <option value="">Todos los rangos</option>
                                            <optgroup label="💵 Renta">
                                                <option value="20000-30000">$20,000 - $30,000 MXN</option>
                                                <option value="30000-40000">$30,000 - $40,000 MXN</option>
                                                <option value="40000-50000">$40,000 - $50,000 MXN</option>
                                                <option value="50000-60000">$50,000 - $60,000 MXN</option>
                                                <option value="60000-80000">$60,000 - $80,000 MXN</option>
                                                <option value="80000-100000">$80,000 - $100,000 MXN</option>
                                                <option value="100000-150000">$100,000 - $150,000 MXN</option>
                                                <option value="mas-150000">Más de $150,000 MXN</option>
                                            </optgroup>
                                            <optgroup label="🏠 Compra">
                                                <option value="2500000-3000000">$2,500,000 - $3,000,000 MXN</option>
                                                <option value="3000000-3500000">$3,000,000 - $3,500,000 MXN</option>
                                                <option value="3500000-4000000">$3,500,000 - $4,000,000 MXN</option>
                                                <option value="4000000-5000000">$4,000,000 - $5,000,000 MXN</option>
                                                <option value="5000000-6000000">$5,000,000 - $6,000,000 MXN</option>
                                                <option value="6000000-8000000">$6,000,000 - $8,000,000 MXN</option>
                                                <option value="8000000-10000000">$8,000,000 - $10,000,000 MXN</option>
                                                <option value="mas-10000000">Más de $10,000,000 MXN</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                {/* Sección 5: Estado */}
                                <div className="bg-white rounded-xl border-2 border-rose-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="bg-gradient-to-r from-rose-50 to-rose-100 px-5 py-3 border-b border-rose-200 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-rose-900">Estado de la Cita</h3>
                                            <p className="text-xs text-rose-700">Estado actual del proceso</p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <label htmlFor="filter-status" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Estado de la Cita
                                        </label>
                                        <select
                                            id="filter-status"
                                            value={filters.status}
                                            onChange={(e) => setFilters({ ...filters, status: (e.target as HTMLSelectElement).value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all bg-white"
                                        >
                                            <option value="all">📋 Todos</option>
                                            <option value="pending">⏳ Pendientes</option>
                                            <option value="confirmed">✅ Confirmadas</option>
                                            <option value="cancelled">❌ Canceladas</option>
                                            <option value="completed">🎉 Completadas</option>
                                            <option value="no-show">👻 No Show</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer con botones mejorados */}
                        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 border-t-2 border-gray-200 bg-white">
                            <button
                                onClick={handleReset}
                                className="group px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Limpiar Filtros
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-all duration-200 shadow-sm hover:shadow"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleApply}
                                    className={`px-3 py-1.5 text-xs font-medium text-white rounded-md transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1.5 ${
                                        hasActiveFilters()
                                            ? 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700'
                                            : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={!hasActiveFilters()}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Aplicar Filtros
                                    {activeFilterCount > 0 && (
                                        <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        // ✅ Renderizar cuando cambian los filtros para actualizar el botón
        render(<ModalContent />, modalRoot);
    }, [modalRoot, isOpen, filters, onClose, onApply, onReset]);

    return null;
}
