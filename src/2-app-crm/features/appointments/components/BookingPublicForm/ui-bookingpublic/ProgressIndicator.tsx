/** @jsxImportSource preact */

interface ProgressIndicatorProps {
	currentStep: number;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
	// Calcular progreso: cuando currentStep es 4, el progreso debe ser 100%
	const progress = currentStep >= 4 ? 100 : ((currentStep - 1) / 3) * 100;

	const getStepClass = (stepNum: number) => {
		if (stepNum < currentStep) {
			return 'w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-gray-900 transition-all duration-300';
		} else if (stepNum === currentStep) {
			return 'w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-gray-900 transition-all duration-300 scale-110';
		} else {
			return 'w-10 h-10 rounded-full bg-white text-gray-400 flex items-center justify-center font-bold text-sm border-2 border-gray-200 transition-all duration-300';
		}
	};

	const renderStepContent = (stepNum: number) => {
		if (stepNum < currentStep) {
			return (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
				</svg>
			);
		} else if (stepNum === 4 && stepNum !== currentStep) {
			return (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
				</svg>
			);
		}
		return stepNum.toString();
	};

	return (
		<div className="mb-8 max-w-2xl mx-auto">
			<div className="flex items-center justify-between relative">
				{/* Línea de progreso */}
				<div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10">
					<div
						className="h-full bg-gray-900 transition-all duration-500 ease-out"
						style={{ width: `${progress}%` }}
					></div>
				</div>

				{/* Paso 1: Fecha */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(1)}>
						{renderStepContent(1)}
					</div>
					<span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
						currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
					}`}>Fecha</span>
				</div>

				{/* Paso 2: Hora */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(2)}>
						{renderStepContent(2)}
					</div>
					<span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
						currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
					}`}>Hora</span>
				</div>

				{/* Paso 3: Información */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(3)}>
						{renderStepContent(3)}
					</div>
					<span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
						currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'
					}`}>Información</span>
				</div>

				{/* Paso 4: Confirmación */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(4)}>
						{renderStepContent(4)}
					</div>
					<span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
						currentStep >= 4 ? 'text-gray-900' : 'text-gray-400'
					}`}>Confirmar</span>
				</div>
			</div>
		</div>
	);
}

