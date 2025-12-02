import { validateAppointmentClient } from '@/1-app-global-core/utils';
import { useState } from 'preact/hooks';

interface UseAppointmentFormProps {
  selectedDate: Date | string | null;
  selectedTime: string | null;
  formId: string;
}

export function useAppointmentForm({
  selectedDate,
  selectedTime,
  formId,
}: UseAppointmentFormProps) {
  const [operationType, setOperationType] = useState<'rentar' | 'comprar' | ''>(
    ''
  );
  const [resourceType, setResourceType] = useState('');
  const [creditoPreaprobado, setCreditoPreaprobado] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formatDateLocal = (date: Date | string): string => {
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateField = (name: string) => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);

    // Leer operationType del formulario, pero si está vacío, usar el estado
    let formOperationType = formData.get('operationType') as string;
    if (!formOperationType && operationType) {
      formOperationType = operationType;
    }

    const data: any = {
      date: selectedDate ? formatDateLocal(selectedDate) : '',
      time: selectedTime || '',
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      operationType: formOperationType || '',
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

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const form = document.getElementById(formId) as HTMLFormElement;
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
        validateField(fieldName);
      }
    }
  };

  const handleRadioChange = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (fieldName === 'operationType') {
      setOperationType(value as 'rentar' | 'comprar');
      setResourceType('');
      setCreditoPreaprobado('');
      setErrors((prev) => {
        const newErrors = { ...prev };
        // Limpiar error de operationType cuando se actualiza
        delete newErrors.operationType;
        delete newErrors.resourceType;
        delete newErrors.budgetRentar;
        delete newErrors.budgetComprar;
        delete newErrors.company;
        return newErrors;
      });
    }
    validateField(fieldName);
  };

  const handleSelectChange = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (fieldName === 'resourceType') {
      setResourceType(value);
      setCreditoPreaprobado('');
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.banco;
        delete newErrors.creditoPreaprobado;
        delete newErrors.modalidadInfonavit;
        delete newErrors.modalidadFovissste;
        return newErrors;
      });
    } else if (fieldName === 'creditoPreaprobado') {
      setCreditoPreaprobado(value);
    }
    validateField(fieldName);
  };

  const validateForm = async (): Promise<{
    success: boolean;
    data?: any;
    errors?: Record<string, string>;
  }> => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) {
      return {
        success: false,
        errors: { general: 'Formulario no encontrado' },
      };
    }

    const formData = new FormData(form);

    // Leer operationType del formulario, pero si está vacío, usar el estado
    let formOperationType = formData.get('operationType') as string;
    if (!formOperationType && operationType) {
      formOperationType = operationType;
    }

    const data: any = {
      date: selectedDate ? formatDateLocal(selectedDate) : '',
      time: selectedTime || '',
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      phone: formData.get('phone') || '',
      operationType: formOperationType || '',
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

    const validation = validateAppointmentClient(data);
    if (!validation.success) {
      setErrors(validation.errors || {});
      return validation;
    }

    return { success: true, data: validation.data };
  };

  return {
    operationType,
    resourceType,
    creditoPreaprobado,
    isSubmitting,
    setIsSubmitting,
    errors,
    setErrors,
    touched,
    setTouched,
    handleBlur,
    handleRadioChange,
    handleSelectChange,
    validateForm,
  };
}
