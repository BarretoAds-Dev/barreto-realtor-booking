/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { validateAppointmentClient } from '@/1-app-global-core/core/utils/validation';

type AppointmentFormData = any;

interface AppointmentFormCRMProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onBack: () => void;
  onSubmit: (data: AppointmentFormData) => void;
  preselectedProperty?: {
    id: string;
    title: string;
    address: string;
    price: number;
    property_type: string;
    operations?: Array<{ type: string; amount: number }>;
  } | null;
  allowedOperationType?: 'rentar' | 'comprar' | null; // Si está definido, solo mostrar esta opción
}

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  property_type: string;
  imageUrl?: string | null;
  public_id?: string; // Para propiedades de Easy Broker
}

// Componente para selector de propiedades agrupadas por colonia
function PropertySelector({
  properties,
  selectedPropertyId,
  onPropertyChange,
  isLoading,
}: {
  properties: Property[];
  selectedPropertyId: string;
  onPropertyChange: (id: string) => void;
  isLoading: boolean;
}) {
  // Agrupar propiedades por colonia (extraer de la dirección)
  const groupedProperties = useMemo(() => {
    const groups: Record<string, Property[]> = {};
    const other: Property[] = [];

    properties.forEach((prop) => {
      // Intentar extraer la colonia de la dirección
      // Formato típico: "Colonia, Delegación, Ciudad" o "Dirección, Colonia, Ciudad"
      const addressParts = prop.address.split(',').map((p) => p.trim());
      let colonia = '';

      // Buscar la colonia (generalmente el segundo o tercer elemento)
      if (addressParts.length >= 2) {
        // Si el primer elemento parece una dirección (tiene números), la colonia es el segundo
        if (/\d/.test(addressParts[0])) {
          colonia = addressParts[1] || addressParts[0];
        } else {
          colonia = addressParts[0];
        }
      } else {
        colonia = prop.address;
      }

      // Limpiar la colonia (remover "Col." o "Colonia")
      colonia = colonia.replace(/^(Col\.|Colonia)\s*/i, '').trim();

      if (colonia && colonia.length > 0) {
        if (!groups[colonia]) {
          groups[colonia] = [];
        }
        groups[colonia].push(prop);
      } else {
        other.push(prop);
      }
    });

    // Ordenar colonias alfabéticamente
    const sortedGroups = Object.keys(groups).sort();
    return { groups, sortedGroups, other };
  }, [properties]);

  if (isLoading) {
    return (
      <select
        id="propertyId"
        name="propertyId"
        disabled
        class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
      >
        <option>Cargando propiedades...</option>
      </select>
    );
  }

  return (
    <select
      id="propertyId"
      name="propertyId"
      value={selectedPropertyId}
      onChange={(e) => onPropertyChange((e.target as HTMLSelectElement).value)}
      class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
    >
      <option value="">Seleccionar propiedad (opcional)</option>
      {groupedProperties.sortedGroups.map((colonia) => (
        <optgroup key={colonia} label={`📍 ${colonia}`}>
          {groupedProperties.groups[colonia].map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.title} -{' '}
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(prop.price)}
            </option>
          ))}
        </optgroup>
      ))}
      {groupedProperties.other.length > 0 && (
        <optgroup label="📍 Otras ubicaciones">
          {groupedProperties.other.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.title} -{' '}
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(prop.price)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export default function AppointmentFormCRM({
  selectedDate,
  selectedTime,
  onBack,
  onSubmit,
  preselectedProperty,
  allowedOperationType,
}: AppointmentFormCRMProps) {
  // Si hay una propiedad preseleccionada, usar su ID y determinar el tipo de operación
  const getInitialOperationType = (): 'rentar' | 'comprar' | '' => {
    if (allowedOperationType) return allowedOperationType;
    if (
      preselectedProperty?.operations &&
      preselectedProperty.operations.length > 0
    ) {
      const operationType =
        preselectedProperty.operations[0].type.toLowerCase();
      if (operationType.includes('rent') || operationType.includes('renta')) {
        return 'rentar';
      }
      if (operationType.includes('sale') || operationType.includes('venta')) {
        return 'comprar';
      }
    }
    return '';
  };

  const [operationType, setOperationType] = useState<'rentar' | 'comprar' | ''>(
    getInitialOperationType()
  );
  const [resourceType, setResourceType] = useState('');
  const [creditoPreaprobado, setCreditoPreaprobado] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    preselectedProperty?.id || ''
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Obtener precio de la propiedad seleccionada
  const selectedProperty =
    preselectedProperty || properties.find((p) => p.id === selectedPropertyId);
  const propertyPrice = selectedProperty?.price || 0;

  // Determinar el tipo de operación permitido basado en la propiedad seleccionada
  const getAllowedOperationType = (): 'rentar' | 'comprar' | null => {
    if (!selectedProperty) return null;

    // Si es una propiedad preseleccionada, usar allowedOperationType si está disponible
    if (preselectedProperty && allowedOperationType)
      return allowedOperationType;

    // Si no hay allowedOperationType, intentar determinar desde la propiedad
    // Para propiedades de Easy Broker, buscar en operations
    const property = selectedProperty as any;
    if (property.operations && property.operations.length > 0) {
      const operationType = property.operations[0].type.toLowerCase();
      if (operationType.includes('rent') || operationType.includes('renta')) {
        return 'rentar';
      }
      if (operationType.includes('sale') || operationType.includes('venta')) {
        return 'comprar';
      }
    }

    // Si hay allowedOperationType definido, usarlo
    if (allowedOperationType) return allowedOperationType;

    return null;
  };

  const allowedOperationTypeFromProperty = getAllowedOperationType();

  // Helper: Parsear valor mínimo de un rango de presupuesto
  const getMinBudgetFromRange = (range: string): number => {
    if (!range) return 0;
    if (range.includes('-')) {
      const parts = range.split('-');
      return parseInt(parts[0], 10) || 0;
    }
    if (range.startsWith('mas-')) {
      const value = range.replace('mas-', '');
      return parseInt(value, 10) || 0;
    }
    return 0;
  };

  // Helper: Validar si un rango es válido para el precio de la propiedad
  const isBudgetRangeValid = (range: string): boolean => {
    if (!propertyPrice || propertyPrice === 0) return true; // Sin propiedad, permitir todos
    const minBudget = getMinBudgetFromRange(range);
    return minBudget >= propertyPrice;
  };

  // Rangos de presupuesto para RENTAR
  const rentarBudgetOptions = [
    { value: '20000-30000', label: '$20,000 - $30,000 MXN', min: 20000 },
    { value: '30000-40000', label: '$30,000 - $40,000 MXN', min: 30000 },
    { value: '40000-50000', label: '$40,000 - $50,000 MXN', min: 40000 },
    { value: '50000-60000', label: '$50,000 - $60,000 MXN', min: 50000 },
    { value: '60000-80000', label: '$60,000 - $80,000 MXN', min: 60000 },
    { value: '80000-100000', label: '$80,000 - $100,000 MXN', min: 80000 },
    { value: '100000-150000', label: '$100,000 - $150,000 MXN', min: 100000 },
    { value: 'mas-150000', label: 'Más de $150,000 MXN', min: 150000 },
  ];

  // Rangos de presupuesto para COMPRAR
  const comprarBudgetOptions = [
    {
      value: '2500000-3000000',
      label: '$2,500,000 - $3,000,000 MXN',
      min: 2500000,
    },
    {
      value: '3000000-3500000',
      label: '$3,000,000 - $3,500,000 MXN',
      min: 3000000,
    },
    {
      value: '3500000-4000000',
      label: '$3,500,000 - $4,000,000 MXN',
      min: 3500000,
    },
    {
      value: '4000000-5000000',
      label: '$4,000,000 - $5,000,000 MXN',
      min: 4000000,
    },
    {
      value: '5000000-6000000',
      label: '$5,000,000 - $6,000,000 MXN',
      min: 5000000,
    },
    {
      value: '6000000-8000000',
      label: '$6,000,000 - $8,000,000 MXN',
      min: 6000000,
    },
    {
      value: '8000000-10000000',
      label: '$8,000,000 - $10,000,000 MXN',
      min: 8000000,
    },
    { value: 'mas-10000000', label: 'Más de $10,000,000 MXN', min: 10000000 },
  ];

  // Filtrar opciones válidas basadas en el precio de la propiedad
  const getValidRentarOptions = () => {
    if (!propertyPrice || propertyPrice === 0) return rentarBudgetOptions;
    return rentarBudgetOptions.filter((opt) => opt.min >= propertyPrice);
  };

  const getValidComprarOptions = () => {
    if (!propertyPrice || propertyPrice === 0) return comprarBudgetOptions;
    return comprarBudgetOptions.filter((opt) => opt.min >= propertyPrice);
  };

  // Helper: Obtener min de un rango desde el array de opciones
  const getMinFromOptions = (
    value: string,
    operationType: 'rentar' | 'comprar'
  ): number => {
    const options =
      operationType === 'rentar' ? rentarBudgetOptions : comprarBudgetOptions;
    const option = options.find((opt) => opt.value === value);
    return option?.min || getMinBudgetFromRange(value);
  };

  // Validar presupuesto en tiempo real
  const validateBudget = (
    fieldName: 'budgetRentar' | 'budgetComprar',
    value: string
  ) => {
    if (!value) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return;
    }

    // Obtener el min del rango desde el array de opciones (más confiable que parsear)
    const operationType = fieldName === 'budgetRentar' ? 'rentar' : 'comprar';
    const minBudget = getMinFromOptions(value, operationType);
    const isValid =
      !propertyPrice || propertyPrice === 0 || minBudget >= propertyPrice;

    if (!isValid) {
      const formattedPrice = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(propertyPrice);

      setErrors((prev) => ({
        ...prev,
        [fieldName]: `El rango seleccionado es menor al precio de la propiedad (${formattedPrice}). Por favor selecciona un rango adecuado.`,
      }));
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Validar presupuesto cuando cambia la propiedad o el precio
  useEffect(() => {
    if (propertyPrice > 0) {
      const form = document.getElementById(
        'appointmentFormCRM'
      ) as HTMLFormElement;
      if (form) {
        const budgetRentar = form.querySelector(
          '[name="budgetRentar"]'
        ) as HTMLSelectElement;
        const budgetComprar = form.querySelector(
          '[name="budgetComprar"]'
        ) as HTMLSelectElement;

        if (budgetRentar?.value) {
          validateBudget('budgetRentar', budgetRentar.value);
        }
        if (budgetComprar?.value) {
          validateBudget('budgetComprar', budgetComprar.value);
        }
      }
    }
  }, [propertyPrice, selectedPropertyId]);

  // Cargar propiedades disponibles
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      try {
        // Cargar de Easy Broker y Supabase
        const [easyBrokerRes, supabaseRes] = await Promise.all([
          fetch('/api/easybroker/properties?limit=100').catch(() => null),
          fetch('/api/properties').catch(() => null),
        ]);

        const allProperties: Property[] = [];

        if (easyBrokerRes?.ok) {
          const easyBrokerData = await easyBrokerRes.json();
          if (easyBrokerData.content) {
            easyBrokerData.content.forEach((prop: any) => {
              // Obtener precio de operations[0].amount
              const price =
                prop.operations?.[0]?.amount ||
                prop.price?.amount ||
                prop.price ||
                0;
              allProperties.push({
                id: prop.public_id || prop.id,
                title: prop.title,
                address:
                  typeof prop.location === 'string'
                    ? prop.location
                    : prop.location?.address ||
                      prop.location?.city ||
                      prop.address ||
                      'Dirección no disponible',
                price: price,
                property_type: prop.property_type || 'casa',
                imageUrl:
                  prop.title_image_thumb ||
                  prop.title_image_full ||
                  prop.images?.[0]?.url ||
                  null,
                public_id: prop.public_id,
              });
            });
          }
        }

        if (supabaseRes?.ok) {
          const supabaseData = await supabaseRes.json();
          if (supabaseData.properties) {
            supabaseData.properties.forEach((prop: any) => {
              allProperties.push({
                id: prop.id,
                title: prop.title,
                address: prop.address,
                price: prop.price,
                property_type: prop.property_type || 'casa',
                imageUrl: null, // Propiedades de Supabase no tienen imagen por ahora
                public_id: prop.features?.easybroker_public_id || null,
              });
            });
          }
        }

        setProperties(allProperties);
      } catch (error) {
        console.error('Error al cargar propiedades:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

  const validateField = (name: string, value: any) => {
    const form = document.getElementById(
      'appointmentFormCRM'
    ) as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const data: any = {
      date: selectedDate ? formatDateLocal(selectedDate) : '',
      time: selectedTime || '',
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      operationType: formData.get('operationType') || '',
      notes: formData.get('notes') || '',
    };

    if (operationType === 'rentar') {
      data.budgetRentar = formData.get('budgetRentar') || '';
      data.company = formData.get('company') || '';
    } else if (operationType === 'comprar') {
      data.budgetComprar = formData.get('budgetComprar') || '';
      data.resourceType = formData.get('resourceType') || '';

      if (resourceType === 'credito-bancario') {
        data.banco = formData.get('banco') || '';
        data.creditoPreaprobado = formData.get('creditoPreaprobado') || '';
      } else if (resourceType === 'infonavit') {
        data.modalidadInfonavit = formData.get('modalidadInfonavit') || '';
        data.numeroTrabajadorInfonavit =
          formData.get('numeroTrabajadorInfonavit') || '';
      } else if (resourceType === 'fovissste') {
        data.modalidadFovissste = formData.get('modalidadFovissste') || '';
        data.numeroTrabajadorFovissste =
          formData.get('numeroTrabajadorFovissste') || '';
      }
    }

    const result = validateAppointmentClient(data);
    if (!result.success && result.errors) {
      const errorMessage = result.errors[name];
      if (errorMessage && String(errorMessage).trim().length > 0) {
        setErrors((prev) => ({ ...prev, [name]: String(errorMessage) }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const form = document.getElementById(
      'appointmentFormCRM'
    ) as HTMLFormElement;
    if (form) {
      const radioButtons = form.querySelectorAll(
        `[name="${fieldName}"]`
      ) as NodeListOf<HTMLInputElement>;
      let value = '';
      if (radioButtons.length > 0) {
        const selected = Array.from(radioButtons).find(
          (radio) => radio.checked
        );
        value = selected?.value || '';
      } else {
        const field = form.querySelector(`[name="${fieldName}"]`) as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;
        value = field?.value || '';
      }
      if (value) {
        validateField(fieldName, value);
      }
    }
  };

  const handleRadioChange = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (fieldName === 'creditoPreaprobado') {
      setCreditoPreaprobado(value);
    }
    if (fieldName === 'operationType') {
      setOperationType(value as 'rentar' | 'comprar');
      setResourceType('');
      setCreditoPreaprobado('');
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.resourceType;
        delete newErrors.budgetRentar;
        delete newErrors.budgetComprar;
        delete newErrors.company;
        delete newErrors.operationType; // Limpiar error de operationType
        return newErrors;
      });
    }
    validateField(fieldName, value);
  };

  // Handler para cuando cambia la propiedad seleccionada
  const handlePropertyChange = (id: string) => {
    setSelectedPropertyId(id);
    // Resetear campos de presupuesto y tipo de recurso al cambiar la propiedad
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.budgetRentar;
      delete newErrors.budgetComprar;
      delete newErrors.resourceType;
      delete newErrors.company;
      return newErrors;
    });
    setTouched((prev) => ({
      ...prev,
      budgetRentar: false,
      budgetComprar: false,
      resourceType: false,
      company: false,
    }));
  };

  // Actualizar operationType automáticamente cuando se selecciona una propiedad
  useEffect(() => {
    if (
      allowedOperationTypeFromProperty &&
      operationType !== allowedOperationTypeFromProperty
    ) {
      // Limpiar el error inmediatamente antes de actualizar
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.operationType;
        return newErrors;
      });

      // Actualizar el estado usando handleRadioChange
      handleRadioChange('operationType', allowedOperationTypeFromProperty);

      // Actualizar el radio button en el DOM para sincronización
      setTimeout(() => {
        const form = document.getElementById(
          'appointmentFormCRM'
        ) as HTMLFormElement;
        if (form) {
          // Desmarcar todos los radios primero
          const allRadios = form.querySelectorAll(
            'input[name="operationType"]'
          ) as NodeListOf<HTMLInputElement>;
          allRadios.forEach((radio) => {
            radio.checked = false;
          });

          // Marcar el radio correcto
          const targetRadio = form.querySelector(
            `input[name="operationType"][value="${allowedOperationTypeFromProperty}"]`
          ) as HTMLInputElement;
          if (targetRadio) {
            targetRadio.checked = true;
            // Disparar evento change para que Preact lo detecte
            targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, 0);
    } else if (selectedPropertyId === '' && operationType) {
      // Si se deselecciona la propiedad, limpiar el operationType si estaba restringido
      // Pero solo si no hay propiedad preseleccionada
      if (!preselectedProperty && !allowedOperationType) {
        setOperationType('');
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.operationType;
          return newErrors;
        });
      }
    }
  }, [allowedOperationTypeFromProperty, selectedPropertyId, operationType]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const dateStr = formatDateLocal(selectedDate);

    // Obtener información de la propiedad seleccionada para incluir en las notas
    const selectedProperty =
      preselectedProperty ||
      properties.find((p) => p.id === selectedPropertyId);
    let notesWithProperty = formData.get('notes') || '';

    if (selectedProperty) {
      const propertyInfo = [
        `\n\nPropiedad: ${selectedProperty.title}`,
        selectedProperty.address
          ? `\nDirección: ${selectedProperty.address}`
          : '',
        (selectedProperty as any).public_id
          ? `\nEasy Broker ID: ${(selectedProperty as any).public_id}`
          : '',
        (selectedProperty as any).imageUrl
          ? `\nImagen: ${(selectedProperty as any).imageUrl}`
          : '',
      ]
        .filter(Boolean)
        .join('');
      notesWithProperty = `${notesWithProperty}${propertyInfo}`.trim();
    }

    // Normalizar el formato de tiempo (asegurar que tenga el formato correcto)
    const normalizeTime = (time: string): string => {
      if (!time) return time;
      // Si ya tiene formato HH:MM:SS, mantenerlo
      if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
      // Si tiene formato HH:MM, agregar :00
      if (time.match(/^\d{2}:\d{2}$/)) return `${time}:00`;
      // Si tiene otro formato, intentar parsearlo
      const parts = time.split(':');
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}:00`;
      }
      return time;
    };

    // Validar que propertyId sea un UUID válido (no un public_id de Easy Broker)
    const isValidUUID = (str: string | null | undefined): boolean => {
      if (!str || typeof str !== 'string') return false;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const rawPropertyId = preselectedProperty?.id || selectedPropertyId || null;
    const propertyId =
      rawPropertyId && isValidUUID(rawPropertyId) ? rawPropertyId : null;

    const appointmentData: any = {
      date: dateStr,
      time: normalizeTime(selectedTime || ''),
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      operationType: formData.get('operationType') || '',
      notes: notesWithProperty,
      propertyId: propertyId,
    };

    // Log para debugging
    console.log('📤 Datos de cita a enviar:', {
      date: appointmentData.date,
      time: appointmentData.time,
      selectedTimeOriginal: selectedTime,
      normalizedTime: appointmentData.time,
    });

    if (operationType === 'rentar') {
      appointmentData.budgetRentar = formData.get('budgetRentar') || '';
      appointmentData.company = formData.get('company') || '';
    } else if (operationType === 'comprar') {
      appointmentData.budgetComprar = formData.get('budgetComprar') || '';
      appointmentData.resourceType = formData.get('resourceType') || '';

      if (resourceType === 'credito-bancario') {
        appointmentData.banco = formData.get('banco') || '';
        appointmentData.creditoPreaprobado =
          formData.get('creditoPreaprobado') || '';
      } else if (resourceType === 'infonavit') {
        appointmentData.modalidadInfonavit =
          formData.get('modalidadInfonavit') || '';
        appointmentData.numeroTrabajadorInfonavit =
          formData.get('numeroTrabajadorInfonavit') || '';
      } else if (resourceType === 'fovissste') {
        appointmentData.modalidadFovissste =
          formData.get('modalidadFovissste') || '';
        appointmentData.numeroTrabajadorFovissste =
          formData.get('numeroTrabajadorFovissste') || '';
      }
    }

    const validation = validateAppointmentClient(appointmentData);

    if (!validation.success) {
      const validationErrors = validation.errors || {};
      const filteredErrors: Record<string, string> = {};
      Object.entries(validationErrors).forEach(([key, value]) => {
        if (value && String(value).trim().length > 0) {
          filteredErrors[key] = String(value);
        }
      });

      setErrors(filteredErrors);
      setIsSubmitting(false);
      const allFields = Object.keys(filteredErrors);
      const touchedFields: Record<string, boolean> = {};
      allFields.forEach((field) => {
        touchedFields[field] = true;
      });
      setTouched(touchedFields);

      if (allFields.length > 0) {
        const firstErrorField = document.querySelector(
          `[name="${allFields[0]}"]`
        );
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          (firstErrorField as HTMLElement).focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', result);
        console.error('📋 Detalles del error:', {
          status: response.status,
          error: result.error,
          details: result.details,
          debug: result.debug,
          dateSent: appointmentData.date,
          timeSent: appointmentData.time,
        });

        // Construir mensaje de error más descriptivo
        let errorMessage =
          result.error ||
          'Error al crear la cita. Por favor intenta nuevamente.';

        if (result.details) {
          errorMessage = `${errorMessage}: ${result.details}`;
        }

        // Si hay información de debug, agregarla al mensaje
        if (result.debug) {
          errorMessage += `\n\nInformación técnica: ${JSON.stringify(
            result.debug,
            null,
            2
          )}`;
        }

        setErrors({
          general: errorMessage,
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Cita creada exitosamente:', result);

      // Si la validación fue exitosa, llamar a onSubmit
      if (validation.data) {
        onSubmit({
          ...validation.data,
          appointmentId: result.appointment.id,
        });
      } else {
        // Si no hay validation.data pero la respuesta fue exitosa, llamar a onSubmit con los datos enviados
        onSubmit({
          ...appointmentData,
          appointmentId: result.appointment.id,
        });
      }
    } catch (error) {
      console.error('Error al enviar cita:', error);
      setErrors({
        general:
          'Error de conexión. Por favor verifica tu conexión e intenta nuevamente.',
      });
      setIsSubmitting(false);
    }
  };

  if (!selectedDate || !selectedTime) return null;

  const dateStr = selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div class="max-w-xl mx-auto transition-all duration-500">
      <div class="text-center mb-6">
        <button
          onClick={onBack}
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors font-semibold uppercase tracking-wide"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Cambiar hora
        </button>
        <h2 class="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Información de contacto
        </h2>
        <p class="text-gray-600 text-sm">
          Completa los datos para confirmar la cita
        </p>
      </div>

      {/* Resumen de selección */}
      <div class="bg-gray-100 p-4 mb-6 border border-gray-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 mb-1">Fecha seleccionada</p>
            <p class="text-sm font-semibold text-gray-900">
              {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 mb-1">Hora seleccionada</p>
            <p class="text-sm font-bold text-gray-900">{selectedTime}</p>
          </div>
        </div>
      </div>

      <form id="appointmentFormCRM" onSubmit={handleSubmit} class="space-y-5">
        {Object.keys(errors).length > 0 && (
          <div class="bg-red-50 border border-red-200 p-4 mb-4 rounded-lg">
            <p class="text-red-700 text-sm font-semibold mb-2">
              Por favor corrige los siguientes errores:
            </p>
            {errors.general ? (
              <p class="text-red-600 text-sm mb-2">{errors.general}</p>
            ) : null}
            <ul class="list-disc list-inside text-red-600 text-sm space-y-1">
              {Object.entries(errors)
                .filter(
                  ([field, error]) =>
                    field !== 'general' && error && error.trim().length > 0
                )
                .map(([field, error]) => (
                  <li key={field} class="mt-1">
                    {String(error)}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Selector de Propiedad (Opcional) - Solo mostrar si no hay propiedad preseleccionada */}
        {!preselectedProperty && (
          <div>
            <label
              htmlFor="propertyId"
              class="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Propiedad de interés{' '}
              <span class="text-gray-400 text-xs">(Opcional)</span>
            </label>
            <PropertySelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={handlePropertyChange}
              isLoading={isLoadingProperties}
            />
          </div>
        )}

        {/* Mostrar propiedad preseleccionada */}
        {preselectedProperty && (
          <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Propiedad seleccionada
            </label>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-gray-900">
                {preselectedProperty.title}
              </p>
              <p class="text-xs text-gray-600">{preselectedProperty.address}</p>
              {preselectedProperty.price > 0 && (
                <p class="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(preselectedProperty.price)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Nombre */}
        <div>
          <label
            htmlFor="name"
            class="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Nombre completo <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            onBlur={() => handleBlur('name')}
            class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
              touched.name && errors.name
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
            }`}
            placeholder="Ej: Juan Pérez"
          />
          {touched.name && errors.name && (
            <p class="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            class="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Correo electrónico <span class="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            onBlur={() => handleBlur('email')}
            class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
              touched.email && errors.email
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
            }`}
            placeholder="Ej: juan@ejemplo.com"
          />
          {touched.email && errors.email && (
            <p class="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="phone"
            class="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Teléfono{' '}
            <span class="text-gray-500 text-xs font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            onBlur={() => handleBlur('phone')}
            class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
              touched.phone && errors.phone
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
            }`}
            placeholder="Ej: +52 555 123 4567"
          />
          {touched.phone && errors.phone && (
            <p class="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Tipo de operación */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de operación <span class="text-red-500">*</span>
          </label>
          <div
            class={`grid gap-3 ${
              allowedOperationTypeFromProperty ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {(!allowedOperationTypeFromProperty ||
              allowedOperationTypeFromProperty === 'rentar') && (
              <label
                class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                  operationType === 'rentar'
                    ? 'border-gray-900 bg-gray-50'
                    : touched.operationType && errors.operationType
                    ? 'border-red-300 bg-white'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="operationType"
                  value="rentar"
                  checked={operationType === 'rentar'}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target) {
                      handleRadioChange('operationType', target.value);
                    }
                  }}
                  required
                  class="mr-2"
                />
                <span class="font-medium text-gray-900">Rentar</span>
              </label>
            )}
            {(!allowedOperationTypeFromProperty ||
              allowedOperationTypeFromProperty === 'comprar') && (
              <label
                class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                  operationType === 'comprar'
                    ? 'border-gray-900 bg-gray-50'
                    : touched.operationType && errors.operationType
                    ? 'border-red-300 bg-white'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="operationType"
                  value="comprar"
                  checked={operationType === 'comprar'}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target) {
                      setOperationType(target.value as 'comprar');
                      handleBlur('operationType');
                    }
                  }}
                  required
                  class="mr-2"
                />
                <span class="font-medium text-gray-900">Comprar</span>
              </label>
            )}
          </div>
          {touched.operationType && errors.operationType && (
            <p class="mt-2 text-sm text-red-600">{errors.operationType}</p>
          )}
        </div>

        {/* Campos para RENTAR */}
        {operationType === 'rentar' && (
          <div class="space-y-4">
            <div>
              <label
                htmlFor="budgetRentar"
                class="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Presupuesto <span class="text-red-500">*</span>
              </label>
              <select
                id="budgetRentar"
                name="budgetRentar"
                required
                onChange={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  validateBudget('budgetRentar', value);
                }}
                onBlur={() => handleBlur('budgetRentar')}
                class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  touched.budgetRentar && errors.budgetRentar
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                }`}
              >
                <option value="">Selecciona un rango</option>
                {rentarBudgetOptions.map((opt) => {
                  // Usar opt.min directamente en lugar de parsear el string
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
                      style={isDisabled ? { color: '#9ca3af' } : {}}
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
            </div>
            <div>
              <label
                htmlFor="company"
                class="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Empresa donde labora <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                required
                onBlur={() => handleBlur('company')}
                class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  touched.company && errors.company
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                }`}
                placeholder="Ej: Empresa S.A."
              />
              {touched.company && errors.company && (
                <p class="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>
          </div>
        )}

        {/* Campos para COMPRAR */}
        {operationType === 'comprar' && (
          <div class="space-y-4">
            <div>
              <label
                htmlFor="budgetComprar"
                class="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Presupuesto <span class="text-red-500">*</span>
              </label>
              <select
                id="budgetComprar"
                name="budgetComprar"
                required
                onChange={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  validateBudget('budgetComprar', value);
                }}
                onBlur={() => handleBlur('budgetComprar')}
                class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  touched.budgetComprar && errors.budgetComprar
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                }`}
              >
                <option value="">Selecciona un rango</option>
                {comprarBudgetOptions.map((opt) => {
                  // Usar opt.min directamente en lugar de parsear el string
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
                      style={isDisabled ? { color: '#9ca3af' } : {}}
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
            </div>
            <div>
              <label
                htmlFor="resourceType"
                class="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Tipo de recurso <span class="text-red-500">*</span>
              </label>
              <select
                id="resourceType"
                name="resourceType"
                value={resourceType}
                onChange={(e) => {
                  const target = e.target as HTMLSelectElement;
                  if (target) {
                    setResourceType(target.value);
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.banco;
                      delete newErrors.creditoPreaprobado;
                      delete newErrors.modalidadInfonavit;
                      delete newErrors.modalidadFovissste;
                      return newErrors;
                    });
                  }
                }}
                onBlur={() => handleBlur('resourceType')}
                required
                class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  touched.resourceType && errors.resourceType
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                }`}
              >
                <option value="">Selecciona el origen del recurso</option>
                <option value="recursos-propios">Recursos propios</option>
                <option value="credito-bancario">Crédito bancario</option>
                <option value="infonavit">Infonavit</option>
                <option value="fovissste">Fovissste</option>
              </select>
              {touched.resourceType && errors.resourceType && (
                <p class="mt-1 text-sm text-red-600">{errors.resourceType}</p>
              )}
            </div>

            {/* Crédito bancario */}
            {resourceType === 'credito-bancario' && (
              <div class="space-y-4">
                <div>
                  <label
                    htmlFor="banco"
                    class="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Banco <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="banco"
                    name="banco"
                    required
                    onBlur={() => handleBlur('banco')}
                    class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                      touched.banco && errors.banco
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                    }`}
                  >
                    <option value="">Selecciona un banco</option>
                    <option value="bbva">BBVA</option>
                    <option value="banamex">Citibanamex</option>
                    <option value="santander">Santander</option>
                    <option value="hsbc">HSBC</option>
                    <option value="banorte">Banorte</option>
                    <option value="scotiabank">Scotiabank</option>
                    <option value="banco-azteca">Banco Azteca</option>
                    <option value="bancoppel">Bancoppel</option>
                    <option value="inbursa">Banco Inbursa</option>
                    <option value="banregio">Banregio</option>
                    <option value="banco-del-bajio">Banco del Bajío</option>
                    <option value="banco-multiva">Banco Multiva</option>
                    <option value="otro-banco">Otro banco</option>
                  </select>
                  {touched.banco && errors.banco && (
                    <p class="mt-1 text-sm text-red-600">{errors.banco}</p>
                  )}
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    ¿Ya cuenta con un crédito preaprobado?{' '}
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="grid grid-cols-2 gap-3">
                    <label
                      class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                        creditoPreaprobado === 'si'
                          ? 'border-gray-900 bg-gray-50'
                          : touched.creditoPreaprobado &&
                            errors.creditoPreaprobado
                          ? 'border-red-300 bg-white'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="creditoPreaprobado"
                        value="si"
                        checked={creditoPreaprobado === 'si'}
                        required
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          handleRadioChange('creditoPreaprobado', target.value);
                        }}
                        class="mr-2"
                      />
                      <span class="text-gray-900">Sí</span>
                    </label>
                    <label
                      class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                        creditoPreaprobado === 'no'
                          ? 'border-gray-900 bg-gray-50'
                          : touched.creditoPreaprobado &&
                            errors.creditoPreaprobado
                          ? 'border-red-300 bg-white'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="creditoPreaprobado"
                        value="no"
                        checked={creditoPreaprobado === 'no'}
                        required
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          handleRadioChange('creditoPreaprobado', target.value);
                        }}
                        class="mr-2"
                      />
                      <span class="text-gray-900">No</span>
                    </label>
                  </div>
                  {touched.creditoPreaprobado && errors.creditoPreaprobado && (
                    <p class="mt-2 text-sm text-red-600">
                      {errors.creditoPreaprobado}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Infonavit */}
            {resourceType === 'infonavit' && (
              <div class="space-y-4">
                <div>
                  <label
                    htmlFor="modalidadInfonavit"
                    class="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Modalidad de préstamo <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="modalidadInfonavit"
                    name="modalidadInfonavit"
                    required
                    onBlur={() => handleBlur('modalidadInfonavit')}
                    class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                      touched.modalidadInfonavit && errors.modalidadInfonavit
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                    }`}
                  >
                    <option value="">Selecciona una modalidad</option>
                    <option value="tradicional">Tradicional</option>
                    <option value="cofinavit">Cofinavit</option>
                    <option value="mejoravit">Mejoravit</option>
                    <option value="tu-casa">Tu Casa</option>
                  </select>
                  {touched.modalidadInfonavit && errors.modalidadInfonavit && (
                    <p class="mt-1 text-sm text-red-600">
                      {errors.modalidadInfonavit}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="numeroTrabajadorInfonavit"
                    class="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Número de trabajador Infonavit{' '}
                    <span class="text-gray-500 text-xs font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="numeroTrabajadorInfonavit"
                    name="numeroTrabajadorInfonavit"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="Ej: 12345678901"
                  />
                </div>
              </div>
            )}

            {/* Fovissste */}
            {resourceType === 'fovissste' && (
              <div class="space-y-4">
                <div>
                  <label
                    htmlFor="modalidadFovissste"
                    class="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Modalidad de préstamo <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="modalidadFovissste"
                    name="modalidadFovissste"
                    required
                    onBlur={() => handleBlur('modalidadFovissste')}
                    class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                      touched.modalidadFovissste && errors.modalidadFovissste
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                    }`}
                  >
                    <option value="">Selecciona una modalidad</option>
                    <option value="tradicional">Tradicional</option>
                    <option value="cofinavit">Cofinavit</option>
                    <option value="mi-vivienda">Mi Vivienda</option>
                  </select>
                  {touched.modalidadFovissste && errors.modalidadFovissste && (
                    <p class="mt-1 text-sm text-red-600">
                      {errors.modalidadFovissste}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="numeroTrabajadorFovissste"
                    class="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Número de trabajador Fovissste{' '}
                    <span class="text-gray-500 text-xs font-normal">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="numeroTrabajadorFovissste"
                    name="numeroTrabajadorFovissste"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="Ej: 12345678901"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        <div>
          <label
            htmlFor="notes"
            class="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Notas adicionales{' '}
            <span class="text-gray-500 text-xs font-normal">(opcional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
            placeholder="Notas adicionales sobre la cita..."
          ></textarea>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-md transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando...
            </span>
          ) : (
            <>
              <span>Crear Cita</span>
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
