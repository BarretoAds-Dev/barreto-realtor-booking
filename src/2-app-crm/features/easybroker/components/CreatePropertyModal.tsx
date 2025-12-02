/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { render } from 'preact';

interface CreatePropertyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface PropertyFormData {
	title: string;
	address: string;
	price: string;
	propertyType: string;
	bedrooms: string;
	bathrooms: string;
	area: string;
	features: string;
	description: string;
}

export function CreatePropertyModal({
	isOpen,
	onClose,
	onSuccess,
}: CreatePropertyModalProps): JSX.Element | null {
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<PropertyFormData>({
		title: '',
		address: '',
		price: '',
		propertyType: 'casa',
		bedrooms: '',
		bathrooms: '',
		area: '',
		features: '',
		description: '',
	});

	// Manejar el portal del modal
	useEffect(() => {
		if (!isOpen) {
			const existingModal = document.getElementById('create-property-modal-root');
			if (existingModal) {
				render(null, existingModal);
				existingModal.remove();
			}
			setModalRoot(null);
			// Resetear formulario al cerrar
			setFormData({
				title: '',
				address: '',
				price: '',
				propertyType: 'casa',
				bedrooms: '',
				bathrooms: '',
				area: '',
				features: '',
				description: '',
			});
			return;
		}

		let root = document.getElementById('create-property-modal-root');
		if (!root) {
			root = document.createElement('div');
			root.id = 'create-property-modal-root';
			root.style.cssText =
				'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;';
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

	const handleSubmit = async (e: Event): Promise<void> => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch('/api/properties', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: formData.title,
					address: formData.address,
					price: parseFloat(formData.price.replace(/[^0-9.]/g, '')),
					property_type: formData.propertyType,
					bedrooms: parseInt(formData.bedrooms, 10) || null,
					bathrooms: parseFloat(formData.bathrooms) || null,
					area: parseFloat(formData.area) || null,
					features: formData.features,
					description: formData.description,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Error al crear la propiedad');
			}

			onSuccess();
			onClose();
		} catch (error) {
			console.error('Error al crear propiedad:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Error al crear la propiedad. Intenta nuevamente.'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		if (!modalRoot || !isOpen) return;

		const ModalContent = () => (
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto z-50"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onClose();
					}
				}}
			>
				<div
					className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-bold text-white">
									Nueva Propiedad
								</h2>
								<p className="text-blue-100 text-sm mt-1">
									Ingresa los detalles para generar la ficha técnica.
								</p>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
						<div className="space-y-5">
							{/* Título */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Título de la Publicación
								</label>
								<input
									type="text"
									required
									value={formData.title}
									onInput={(e) =>
										setFormData({
											...formData,
											title: (e.target as HTMLInputElement).value,
										})
									}
									placeholder="Ej: Residencia de lujo en..."
									className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
								/>
							</div>

							{/* Dirección */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Dirección Completa
								</label>
								<input
									type="text"
									required
									value={formData.address}
									onInput={(e) =>
										setFormData({
											...formData,
											address: (e.target as HTMLInputElement).value,
										})
									}
									placeholder="Ej: Calle Principal 123, Colonia, Ciudad"
									className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
								/>
							</div>

							{/* Precio y Tipo */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Precio (MXN)
									</label>
									<input
										type="text"
										required
										value={formData.price}
										onInput={(e) =>
											setFormData({
												...formData,
												price: (e.target as HTMLInputElement).value,
											})
										}
										placeholder="Ej: 5,000,000"
										className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Tipo
									</label>
									<select
										required
										value={formData.propertyType}
										onChange={(e) =>
											setFormData({
												...formData,
												propertyType: (e.target as HTMLSelectElement).value,
											})
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
									>
										<option value="casa">Casa</option>
										<option value="departamento">Departamento</option>
										<option value="terreno">Terreno</option>
										<option value="comercial">Comercial</option>
									</select>
								</div>
							</div>

							{/* Características */}
							<div className="grid grid-cols-3 gap-4">
								<div>
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
										RECÁMARAS
									</label>
									<input
										type="number"
										min="0"
										value={formData.bedrooms}
										onInput={(e) =>
											setFormData({
												...formData,
												bedrooms: (e.target as HTMLInputElement).value,
											})
										}
										placeholder="0"
										className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
										BAÑOS
									</label>
									<input
										type="number"
										min="0"
										step="0.5"
										value={formData.bathrooms}
										onInput={(e) =>
											setFormData({
												...formData,
												bathrooms: (e.target as HTMLInputElement).value,
											})
										}
										placeholder="0"
										className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
										ÁREA (M²)
									</label>
									<input
										type="number"
										min="0"
										value={formData.area}
										onInput={(e) =>
											setFormData({
												...formData,
												area: (e.target as HTMLInputElement).value,
											})
										}
										placeholder="0"
										className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</div>
							</div>

							{/* Características Clave */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Características Clave
								</label>
								<input
									type="text"
									value={formData.features}
									onInput={(e) =>
										setFormData({
											...formData,
											features: (e.target as HTMLInputElement).value,
										})
									}
									placeholder="Ej: Vista al mar, cocina integral, seguridad 24/7"
									className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
								/>
							</div>

							{/* Descripción */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Descripción
								</label>
								<textarea
									value={formData.description}
									onInput={(e) =>
										setFormData({
											...formData,
											description: (e.target as HTMLTextAreaElement).value,
										})
									}
									rows={4}
									placeholder="Describe la propiedad en detalle..."
									className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
								/>
							</div>
						</div>

						{/* Botones */}
						<div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isSubmitting ? 'Guardando...' : 'Guardar Propiedad'}
							</button>
						</div>
					</form>
				</div>
			</div>
		);

		render(<ModalContent />, modalRoot);
	}, [modalRoot, isOpen, formData, isSubmitting, onClose, onSuccess]);

	return null;
}

