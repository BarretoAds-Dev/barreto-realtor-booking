/** @jsxImportSource preact */
import { Button, Input, Select, FormField, RadioGroup, ErrorMessage } from '../ui';
import {
	BUDGET_OPTIONS_RENTAR,
	BUDGET_OPTIONS_COMPRAR,
	RESOURCE_TYPES,
	BANKS,
	MODALIDADES_INFONAVIT,
	MODALIDADES_FOVISSSTE,
	OPERATION_TYPES,
} from '../../core/constants/appointments';

interface AppointmentFormFieldsProps {
	operationType: 'rentar' | 'comprar' | '';
	resourceType: string;
	creditoPreaprobado: string;
	errors: Record<string, string>;
	touched: Record<string, boolean>;
	onBlur: (field: string) => void;
	onOperationTypeChange: (value: string) => void;
	onResourceTypeChange: (value: string) => void;
	onCreditoPreaprobadoChange: (value: string) => void;
}

export default function AppointmentFormFields({
	operationType,
	resourceType,
	creditoPreaprobado,
	errors,
	touched,
	onBlur,
	onOperationTypeChange,
	onResourceTypeChange,
	onCreditoPreaprobadoChange,
}: AppointmentFormFieldsProps) {
	return (
		<>
			{/* Tipo de operación */}
			<FormField
				label="Tipo de operación"
				required
				error={errors.operationType}
				touched={touched.operationType}
			>
				<RadioGroup
					name="operationType"
					options={OPERATION_TYPES}
					value={operationType}
					onChange={onOperationTypeChange}
					error={errors.operationType}
					touched={touched.operationType}
				/>
			</FormField>

			{/* Campos para RENTAR */}
			{operationType === 'rentar' && (
				<div class="space-y-5 animate-fadeIn">
					<FormField
						label="Presupuesto"
						required
						error={errors.budgetRentar}
						touched={touched.budgetRentar}
					>
						<Select
							name="budgetRentar"
							options={BUDGET_OPTIONS_RENTAR}
							placeholder="Selecciona un rango"
							required
							onBlur={() => onBlur('budgetRentar')}
							error={errors.budgetRentar}
							touched={touched.budgetRentar}
						/>
					</FormField>

					<FormField
						label="Empresa donde labora"
						required
						error={errors.company}
						touched={touched.company}
					>
						<Input
							name="company"
							type="text"
							placeholder="Ej: Empresa S.A."
							required
							onBlur={() => onBlur('company')}
							error={errors.company}
							touched={touched.company}
						/>
					</FormField>
				</div>
			)}

			{/* Campos para COMPRAR */}
			{operationType === 'comprar' && (
				<div class="space-y-5 animate-fadeIn">
					<FormField
						label="Presupuesto"
						required
						error={errors.budgetComprar}
						touched={touched.budgetComprar}
					>
						<Select
							name="budgetComprar"
							options={BUDGET_OPTIONS_COMPRAR}
							placeholder="Selecciona un rango"
							required
							onBlur={() => onBlur('budgetComprar')}
							error={errors.budgetComprar}
							touched={touched.budgetComprar}
						/>
					</FormField>

					<FormField
						label="Tipo de recurso"
						required
						error={errors.resourceType}
						touched={touched.resourceType}
					>
						<Select
							name="resourceType"
							options={RESOURCE_TYPES}
							value={resourceType}
							placeholder="Selecciona el origen del recurso"
							required
							onChange={(e) => onResourceTypeChange((e.target as HTMLSelectElement).value)}
							onBlur={() => onBlur('resourceType')}
							error={errors.resourceType}
							touched={touched.resourceType}
						/>
					</FormField>

					{/* Crédito bancario */}
					{resourceType === 'credito-bancario' && (
						<div class="space-y-5 animate-fadeIn">
							<FormField
								label="Banco"
								required
								error={errors.banco}
								touched={touched.banco}
							>
								<Select
									name="banco"
									options={BANKS}
									placeholder="Selecciona un banco"
									required
									onBlur={() => onBlur('banco')}
									error={errors.banco}
									touched={touched.banco}
								/>
							</FormField>

							<FormField
								label="¿Cuenta con crédito preaprobado?"
								required
								error={errors.creditoPreaprobado}
								touched={touched.creditoPreaprobado}
							>
								<RadioGroup
									name="creditoPreaprobado"
									options={[
										{ value: 'si', label: 'Sí' },
										{ value: 'no', label: 'No' },
									]}
									value={creditoPreaprobado}
									onChange={onCreditoPreaprobadoChange}
									error={errors.creditoPreaprobado}
									touched={touched.creditoPreaprobado}
								/>
							</FormField>
						</div>
					)}

					{/* Infonavit */}
					{resourceType === 'infonavit' && (
						<div class="space-y-5 animate-fadeIn">
							<FormField
								label="Modalidad de préstamo"
								required
								error={errors.modalidadInfonavit}
								touched={touched.modalidadInfonavit}
							>
								<Select
									name="modalidadInfonavit"
									options={MODALIDADES_INFONAVIT}
									placeholder="Selecciona una modalidad"
									required
									onBlur={() => onBlur('modalidadInfonavit')}
									error={errors.modalidadInfonavit}
									touched={touched.modalidadInfonavit}
								/>
							</FormField>

							<FormField
								label="Número de trabajador Infonavit"
								optional
								error={errors.numeroTrabajadorInfonavit}
								touched={touched.numeroTrabajadorInfonavit}
							>
								<Input
									name="numeroTrabajadorInfonavit"
									type="text"
									placeholder="Ej: 12345678901"
									onBlur={() => onBlur('numeroTrabajadorInfonavit')}
									error={errors.numeroTrabajadorInfonavit}
									touched={touched.numeroTrabajadorInfonavit}
								/>
							</FormField>
						</div>
					)}

					{/* Fovissste */}
					{resourceType === 'fovissste' && (
						<div class="space-y-5 animate-fadeIn">
							<FormField
								label="Modalidad de préstamo"
								required
								error={errors.modalidadFovissste}
								touched={touched.modalidadFovissste}
							>
								<Select
									name="modalidadFovissste"
									options={MODALIDADES_FOVISSSTE}
									placeholder="Selecciona una modalidad"
									required
									onBlur={() => onBlur('modalidadFovissste')}
									error={errors.modalidadFovissste}
									touched={touched.modalidadFovissste}
								/>
							</FormField>

							<FormField
								label="Número de trabajador Fovissste"
								optional
								error={errors.numeroTrabajadorFovissste}
								touched={touched.numeroTrabajadorFovissste}
							>
								<Input
									name="numeroTrabajadorFovissste"
									type="text"
									placeholder="Ej: 12345678901"
									onBlur={() => onBlur('numeroTrabajadorFovissste')}
									error={errors.numeroTrabajadorFovissste}
									touched={touched.numeroTrabajadorFovissste}
								/>
							</FormField>
						</div>
					)}
				</div>
			)}
		</>
	);
}

