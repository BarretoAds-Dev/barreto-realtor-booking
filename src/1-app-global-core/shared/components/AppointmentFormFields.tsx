/** @jsxImportSource preact */
import {
  BANKS,
  BUDGET_OPTIONS_COMPRAR,
  BUDGET_OPTIONS_RENTAR,
  MODALIDADES_FOVISSSTE,
  MODALIDADES_INFONAVIT,
  OPERATION_TYPES,
  RESOURCE_TYPES,
} from '@/1-app-global-core/config';
import { FormField, Input, Radio, Select } from '@/components';

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
  propertyPrice?: number; // Precio de la propiedad para validar presupuesto
  onBudgetChange?: (
    fieldName: 'budgetRentar' | 'budgetComprar',
    value: string
  ) => void; // Callback para validación en tiempo real
  variant?: 'light' | 'dark'; // Variante de estilo
  allowedOperationType?: 'rentar' | 'comprar' | null; // Si está definido, solo mostrar esta opción
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
  propertyPrice = 0,
  onBudgetChange,
  variant = 'dark',
  allowedOperationType = null,
}: AppointmentFormFieldsProps) {
  const handleBudgetChange = (
    fieldName: 'budgetRentar' | 'budgetComprar',
    value: string
  ) => {
    if (onBudgetChange) {
      onBudgetChange(fieldName, value);
    }
  };

  // Filtrar opciones de operación basado en allowedOperationType
  const availableOperationTypes = allowedOperationType
    ? OPERATION_TYPES.filter((opt) => opt.value === allowedOperationType)
    : OPERATION_TYPES;

  return (
    <>
      {/* Tipo de operación */}
      <FormField
        label="Tipo de operación"
        required
        error={errors.operationType}
        touched={touched.operationType}
        variant={variant}
      >
        <Radio
          name="operationType"
          options={availableOperationTypes}
          value={operationType}
          onChange={onOperationTypeChange}
          error={errors.operationType}
          touched={touched.operationType}
          variant={variant}
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
            variant={variant}
          >
            <select
              name="budgetRentar"
              required
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                handleBudgetChange('budgetRentar', value);
              }}
              onBlur={() => onBlur('budgetRentar')}
              class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${
                touched.budgetRentar && errors.budgetRentar
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50 text-gray-900'
                  : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-900'
              }`}
              style="background-color: white !important; color: #111827 !important;"
            >
              <option value="" style="color: #6b7280;">
                Selecciona un rango
              </option>
              {BUDGET_OPTIONS_RENTAR.map((opt) => {
                const isValid =
                  !propertyPrice ||
                  propertyPrice === 0 ||
                  opt.min >= propertyPrice;
                const isDisabled = !isValid && propertyPrice > 0;
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={isDisabled}
                    style={
                      isDisabled
                        ? { color: '#9ca3af', backgroundColor: '#f9fafb' }
                        : { color: '#111827', backgroundColor: 'white' }
                    }
                  >
                    {opt.label}
                    {isDisabled &&
                      ` (Menor al precio: ${new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(propertyPrice)})`}
                  </option>
                );
              })}
            </select>
            {touched.budgetRentar && errors.budgetRentar && (
              <p class="mt-1 text-sm text-red-600">{errors.budgetRentar}</p>
            )}
            {propertyPrice > 0 && (
              <p class="mt-1 text-xs text-gray-500">
                Precio de la propiedad:{' '}
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(propertyPrice)}
              </p>
            )}
          </FormField>

          <FormField
            label="Empresa donde labora"
            required
            error={errors.company}
            touched={touched.company}
            variant={variant}
          >
            <Input
              name="company"
              type="text"
              placeholder="Ej: Empresa S.A."
              required
              onBlur={() => onBlur('company')}
              error={errors.company}
              touched={touched.company}
              variant={variant}
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
            variant={variant}
          >
            <select
              name="budgetComprar"
              required
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                handleBudgetChange('budgetComprar', value);
              }}
              onBlur={() => onBlur('budgetComprar')}
              class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${
                touched.budgetComprar && errors.budgetComprar
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50 text-gray-900'
                  : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-900'
              }`}
              style="background-color: white !important; color: #111827 !important;"
            >
              <option value="" style="color: #6b7280;">
                Selecciona un rango
              </option>
              {BUDGET_OPTIONS_COMPRAR.map((opt) => {
                const isValid =
                  !propertyPrice ||
                  propertyPrice === 0 ||
                  opt.min >= propertyPrice;
                const isDisabled = !isValid && propertyPrice > 0;
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={isDisabled}
                    style={
                      isDisabled
                        ? { color: '#9ca3af', backgroundColor: '#f9fafb' }
                        : { color: '#111827', backgroundColor: 'white' }
                    }
                  >
                    {opt.label}
                    {isDisabled &&
                      ` (Menor al precio: ${new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(propertyPrice)})`}
                  </option>
                );
              })}
            </select>
            {touched.budgetComprar && errors.budgetComprar && (
              <p class="mt-1 text-sm text-red-600">{errors.budgetComprar}</p>
            )}
            {propertyPrice > 0 && (
              <p class="mt-1 text-xs text-gray-500">
                Precio de la propiedad:{' '}
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(propertyPrice)}
              </p>
            )}
          </FormField>

          <FormField
            label="Tipo de recurso"
            required
            error={errors.resourceType}
            touched={touched.resourceType}
            variant={variant}
          >
            <Select
              name="resourceType"
              options={RESOURCE_TYPES}
              value={resourceType}
              placeholder="Selecciona el origen del recurso"
              required
              onChange={(e) =>
                onResourceTypeChange((e.target as HTMLSelectElement).value)
              }
              onBlur={() => onBlur('resourceType')}
              error={errors.resourceType}
              touched={touched.resourceType}
              variant={variant}
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
                variant={variant}
              >
                <Select
                  name="banco"
                  options={BANKS}
                  placeholder="Selecciona un banco"
                  required
                  onBlur={() => onBlur('banco')}
                  error={errors.banco}
                  touched={touched.banco}
                  variant={variant}
                />
              </FormField>

              <FormField
                label="¿Cuenta con crédito preaprobado?"
                required
                error={errors.creditoPreaprobado}
                touched={touched.creditoPreaprobado}
                variant={variant}
              >
                <Radio
                  name="creditoPreaprobado"
                  options={[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                  ]}
                  value={creditoPreaprobado}
                  onChange={onCreditoPreaprobadoChange}
                  error={errors.creditoPreaprobado}
                  touched={touched.creditoPreaprobado}
                  variant={variant}
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
                variant={variant}
              >
                <Select
                  name="modalidadInfonavit"
                  options={MODALIDADES_INFONAVIT}
                  placeholder="Selecciona una modalidad"
                  required
                  onBlur={() => onBlur('modalidadInfonavit')}
                  error={errors.modalidadInfonavit}
                  touched={touched.modalidadInfonavit}
                  variant={variant}
                />
              </FormField>

              <FormField
                label="Número de trabajador Infonavit"
                optional
                error={errors.numeroTrabajadorInfonavit}
                touched={touched.numeroTrabajadorInfonavit}
                variant={variant}
              >
                <Input
                  name="numeroTrabajadorInfonavit"
                  type="text"
                  placeholder="Ej: 12345678901"
                  onBlur={() => onBlur('numeroTrabajadorInfonavit')}
                  error={errors.numeroTrabajadorInfonavit}
                  touched={touched.numeroTrabajadorInfonavit}
                  variant={variant}
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
                variant={variant}
              >
                <Select
                  name="modalidadFovissste"
                  options={MODALIDADES_FOVISSSTE}
                  placeholder="Selecciona una modalidad"
                  required
                  onBlur={() => onBlur('modalidadFovissste')}
                  error={errors.modalidadFovissste}
                  touched={touched.modalidadFovissste}
                  variant={variant}
                />
              </FormField>

              <FormField
                label="Número de trabajador Fovissste"
                optional
                error={errors.numeroTrabajadorFovissste}
                touched={touched.numeroTrabajadorFovissste}
                variant={variant}
              >
                <Input
                  name="numeroTrabajadorFovissste"
                  type="text"
                  placeholder="Ej: 12345678901"
                  onBlur={() => onBlur('numeroTrabajadorFovissste')}
                  error={errors.numeroTrabajadorFovissste}
                  touched={touched.numeroTrabajadorFovissste}
                  variant={variant}
                />
              </FormField>
            </div>
          )}
        </div>
      )}
    </>
  );
}
