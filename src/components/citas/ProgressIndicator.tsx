/** @jsxImportSource preact */

interface ProgressIndicatorProps {
	currentStep: number;
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
	const progress = ((currentStep - 1) / 3) * 100;

	const getStepClass = (stepNum: number) => {
		if (stepNum < currentStep) {
			return 'w-10 h-10 rounded-full bg-[#003d82] backdrop-blur-xl text-white flex items-center justify-center font-bold text-sm shadow-md shadow-black/20 border-2 border-[#00a0df]/60 transition-all duration-300';
		} else if (stepNum === currentStep) {
			return 'w-10 h-10 rounded-full bg-[#003d82] backdrop-blur-xl text-white flex items-center justify-center font-bold text-sm shadow-md shadow-black/20 border-2 border-[#00a0df]/60 transition-all duration-300 scale-110';
		} else {
			return 'w-10 h-10 rounded-full bg-slate-700/50 backdrop-blur-xl text-gray-400 flex items-center justify-center font-bold text-sm border-2 border-slate-600/50 transition-all duration-300';
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
				<div className="absolute top-5 left-0 w-full h-0.5 bg-slate-700/50 backdrop-blur-sm -z-10">
					<div className="h-full bg-[#00a0df] backdrop-blur-sm transition-all duration-500 ease-out shadow-sm shadow-[#00a0df]/15" style={{ width: `${progress}%` }}></div>
				</div>
				
				{/* Paso 1: Fecha */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(1)}>
						{renderStepContent(1)}
					</div>
					<span className="mt-2 text-xs font-semibold text-gray-200 uppercase tracking-wide">Fecha</span>
				</div>
				
				{/* Paso 2: Hora */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(2)}>
						{renderStepContent(2)}
					</div>
					<span className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora</span>
				</div>
				
				{/* Paso 3: Información */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(3)}>
						{renderStepContent(3)}
					</div>
					<span className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Información</span>
				</div>
				
				{/* Paso 4: Confirmación */}
				<div className="flex flex-col items-center flex-1">
					<div className={getStepClass(4)}>
						{renderStepContent(4)}
					</div>
					<span className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirmar</span>
				</div>
			</div>
		</div>
	);
}

