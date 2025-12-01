/** @jsxImportSource preact */

interface ConfirmationPanelProps {
	appointmentData: {
		date: string;
		time: string;
	} | null;
	onNewAppointment: () => void;
}

export default function ConfirmationPanel({ appointmentData, onNewAppointment }: ConfirmationPanelProps) {
	if (!appointmentData) return null;

	return (
		<div className="max-w-md mx-auto text-center transition-all duration-500">
			<div className="mb-8">
				<div className="w-20 h-20 bg-[#003d82] backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-black/20 animate-bounce border-2 border-[#00a0df]/50">
					<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 className="text-3xl font-bold text-white mb-3 tracking-tight">¡Cita confirmada!</h2>
				<p className="text-gray-200 mb-8 font-light">
					Tu cita ha sido programada exitosamente. Recibirás un correo de confirmación en breve con todos los detalles.
				</p>
				
				<div className="bg-gradient-to-br from-[#003d82]/40 to-[#004C97]/40 backdrop-blur-xl p-6 mb-8 border-2 border-[#00a0df]/30 shadow-md shadow-black/15">
					<div className="flex items-center justify-center gap-3 mb-4">
						<svg className="w-6 h-6 text-[#00a0df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Fecha y hora</p>
					</div>
					<p className="text-xl font-bold text-white">{appointmentData.date} a las {appointmentData.time}</p>
				</div>
				
				<button
					onClick={onNewAppointment}
					className="inline-flex items-center gap-2 px-6 py-3 bg-[#003d82] backdrop-blur-xl text-white font-bold hover:bg-[#004C97] transition-all duration-300 shadow-md shadow-black/25 hover:shadow-md hover:shadow-black/30 border-2 border-[#00a0df]/30 hover:border-[#00a0df]/50 uppercase tracking-wide"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
					</svg>
					Reservar otra cita
				</button>
			</div>
		</div>
	);
}

