import { getSupabaseAdmin } from '@/1-app-global-core/core/config/supabase';
import type { AvailabilitySlot } from '@/1-app-global-core/core/types';
import type { AppointmentFormData } from '../schemas/appointment.schema';

/**
 * Servicio para gestionar citas
 */
export class AppointmentsService {
  /**
   * Normaliza el formato de hora para buscar en la DB
   * Convierte "10:00" a "10:00:00" para coincidir con formato TIME
   */
  static normalizeTime(time: string): string {
    if (!time.includes(':')) return time;

    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    } else if (parts.length >= 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(
        2,
        '0'
      )}:${parts[2].padStart(2, '0')}`;
    }
    return time;
  }

  /**
   * Busca un slot disponible para la fecha y hora especificadas
   * Versión robusta que maneja diferentes formatos de tiempo y fecha
   */
  static async findAvailableSlot(
    date: string,
    time: string,
    agentId?: string
  ): Promise<{ slot: AvailabilitySlot | null; error: Error | null }> {
    // 1. Asegurar formato de fecha YYYY-MM-DD (cortar si viene ISO completo)
    const cleanDate = date.split('T')[0];

    const defaultAgentId = '00000000-0000-0000-0000-000000000001';
    const finalAgentId = agentId || defaultAgentId;

    // Helper interno para obtener solo HH:MM (ignora segundos, timezone, etc.)
    const getHHMM = (timeStr: string): string => {
      if (!timeStr) return '';
      const trimmed = String(timeStr).trim();

      // Si viene fecha completa ISO, extraer la hora
      if (trimmed.includes('T')) {
        const timePart = trimmed.split('T')[1];
        // Remover timezone offset si existe (+00, -05:00, etc.)
        const timeWithoutTz = timePart.split(/[+-]/)[0];
        return timeWithoutTz.substring(0, 5); // Toma "12:15" de "12:15:00"
      }

      // Si tiene formato HH:MM:SS, tomar solo HH:MM
      if (trimmed.match(/^\d{2}:\d{2}:\d{2}/)) {
        return trimmed.substring(0, 5);
      }

      // Si tiene formato HH:MM, mantenerlo
      if (trimmed.match(/^\d{2}:\d{2}$/)) {
        return trimmed;
      }

      // Intentar parsear otros formatos
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }

      return trimmed.substring(0, 5); // Fallback: tomar primeros 5 caracteres
    };

    const targetHHMM = getHHMM(time);

    console.log('🔍 Buscando slot (Modo Robusto):', {
      originalDate: date,
      cleanDate,
      originalTime: time,
      targetHHMM,
      agentId: finalAgentId,
    });

    try {
      // Usar cliente admin para bypass RLS en operaciones del servidor
      const client = getSupabaseAdmin();

      // 2. Traer TODOS los slots del día (sin límite estricto)
      const { data: slots, error: slotError } = await client
        .from('availability_slots')
        .select('*')
        .eq('date', cleanDate) // Usamos la fecha limpia
        .eq('enabled', true)
        .eq('agent_id', finalAgentId);

      if (slotError) {
        console.error('❌ Error DB buscando slots:', {
          error: slotError.message,
          code: slotError.code,
          details: slotError.details,
          query: { date: cleanDate, enabled: true, agent_id: finalAgentId },
        });
        return { slot: null, error: slotError };
      }

      const typedSlots = (slots || []) as AvailabilitySlot[];

      console.log('📋 Slots encontrados en DB:', {
        total: typedSlots.length,
        slots: typedSlots.map((s) => ({
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          start_time_hhmm: getHHMM(String(s.start_time)),
          enabled: s.enabled,
          agent_id: s.agent_id,
          capacity: s.capacity,
          booked: s.booked,
        })),
      });

      // 3. Filtrado flexible en memoria (ignorando segundos y timezone offsets)
      const matchingSlots = typedSlots.filter((slot) => {
        if (!slot || !slot.start_time) return false;

        // Extraer HH:MM del slot de la DB
        const slotHHMM = getHHMM(String(slot.start_time));

        // Comparación simple y robusta
        const exactMatch = slotHHMM === targetHHMM;

        if (exactMatch) {
          console.log('✅ Slot coincide:', {
            slotId: slot.id,
            slotTime: slot.start_time,
            slotHHMM,
            targetHHMM,
          });
        }

        return exactMatch;
      });

      if (matchingSlots.length === 0) {
        // Recopilar horarios disponibles para el log de error
        const availableOnDb = typedSlots
          .map((s) => getHHMM(String(s.start_time)))
          .filter((t, i, arr) => arr.indexOf(t) === i) // Remover duplicados
          .join(', ');

        console.warn('⚠️ Mismatch de horarios:', {
          buscado: targetHHMM,
          encontradosEnDB: availableOnDb || 'Ninguno',
          fechaUsada: cleanDate,
          slotsEncontrados: typedSlots.length,
        });

        return {
          slot: null,
          error: new Error(
            `No se encontró slot para las ${targetHHMM}. ` +
              `Horarios disponibles en ${cleanDate}: ${
                availableOnDb || 'ninguno'
              }. ` +
              `Verifica que el slot exista y esté habilitado.`
          ),
        };
      }

      // Tomar el primer match
      const targetSlot = matchingSlots[0];

      // 4. Verificar capacidad disponible contando citas activas reales (más confiable que el contador)
      const { data: activeAppointments, error: countError } = await client
        .from('appointments')
        .select('id')
        .eq('slot_id', targetSlot.id)
        .in('status', ['pending', 'confirmed']);

      if (countError) {
        console.warn(
          '⚠️ Error al contar citas activas, usando contador del slot como fallback:',
          countError.message
        );
        // Si hay error, usar el contador del slot como fallback
        if (targetSlot.booked >= targetSlot.capacity) {
          return {
            slot: null,
            error: new Error(
              `El horario ${targetHHMM} ya está lleno según el contador del slot.`
            ),
          };
        }
        // Si el contador indica disponible, confiar en él
        console.log('✅ Slot disponible según contador (fallback):', {
          slotId: targetSlot.id,
          time: targetSlot.start_time,
          capacity: targetSlot.capacity,
          booked: targetSlot.booked,
        });
        return { slot: targetSlot, error: null };
      }

      const actualBookedCount = activeAppointments?.length || 0;
      const isAvailable = actualBookedCount < targetSlot.capacity;

      console.log('🔍 Verificando capacidad del slot:', {
        slotId: targetSlot.id,
        time: targetSlot.start_time,
        timeHHMM: targetHHMM,
        capacity: targetSlot.capacity,
        bookedCounter: targetSlot.booked,
        actualBookedCount,
        isAvailable,
      });

      if (!isAvailable) {
        console.warn('⚠️ Slot encontrado pero sin capacidad disponible:', {
          slotId: targetSlot.id,
          time: targetHHMM,
          capacity: targetSlot.capacity,
          actualBookedCount,
        });
        return {
          slot: null,
          error: new Error(
            `El horario ${targetHHMM} ya está lleno. ` +
              `Capacidad: ${targetSlot.capacity}, Citas activas: ${actualBookedCount}`
          ),
        };
      }

      // Nota: El contador se actualizará automáticamente después de crear la cita
      // o se puede actualizar manualmente llamando a updateSlotBookedCount
      if (targetSlot.booked !== actualBookedCount) {
        console.log(
          '🔄 Contador desactualizado detectado (se corregirá después):',
          {
            slotId: targetSlot.id,
            oldBooked: targetSlot.booked,
            actualBookedCount,
          }
        );
      }

      console.log('✅ Slot encontrado y disponible:', {
        slotId: targetSlot.id,
        date: targetSlot.date,
        time: targetSlot.start_time,
        timeHHMM: targetHHMM,
        capacity: targetSlot.capacity,
        booked: targetSlot.booked,
        actualBookedCount,
        available: targetSlot.capacity - actualBookedCount,
      });

      return { slot: targetSlot, error: null };
    } catch (error) {
      console.error('❌ Excepción al buscar slot:', error);
      return {
        slot: null,
        error:
          error instanceof Error
            ? error
            : new Error('Error desconocido al buscar slot'),
      };
    }
  }

  /**
   * Verifica la disponibilidad real de un slot contando citas activas
   */
  static async checkSlotAvailability(slotId: string): Promise<{
    available: boolean;
    bookedCount: number;
    capacity: number;
    error: Error | null;
  }> {
    try {
      // Usar cliente admin obligatoriamente para bypass RLS en operaciones del servidor
      const client = getSupabaseAdmin();

      // Obtener el slot con su capacidad
      const { data: slot, error: slotError } = await client
        .from('availability_slots')
        .select('capacity, booked')
        .eq('id', slotId)
        .single();

      if (slotError || !slot) {
        return {
          available: false,
          bookedCount: 0,
          capacity: 0,
          error: slotError || new Error('Slot no encontrado'),
        };
      }

      // Type assertion para evitar errores de tipos
      const typedSlot = slot as { capacity: number; booked: number };

      // Contar citas activas reales (usar cliente admin para contar correctamente)
      const { data: activeAppointments, error: countError } = await client
        .from('appointments')
        .select('id, status, created_at, client_email, client_name')
        .eq('slot_id', slotId)
        .in('status', ['pending', 'confirmed']);

      // Type assertion para evitar errores de tipos
      const typedAppointments = (activeAppointments || []) as Array<{
        id: string;
        status: string;
        created_at: string;
        client_email: string;
        client_name: string;
      }>;

      // Si hay error al contar, usar el valor de `booked` del slot como fallback
      // pero no marcar como no disponible automáticamente
      if (countError) {
        console.warn(
          '⚠️ Error al contar citas activas, usando valor del slot:',
          countError.message
        );
        // Si el error es por una columna que no existe, asumir que no hay citas
        if (
          countError.message?.includes('Could not find') ||
          countError.message?.includes('column')
        ) {
          return {
            available: true, // Asumir disponible si hay error de columna
            bookedCount: 0,
            capacity: typedSlot.capacity,
            error: null, // No tratar como error crítico
          };
        }
        // Para otros errores, usar el valor del slot pero marcar como disponible
        return {
          available: typedSlot.booked < typedSlot.capacity,
          bookedCount: typedSlot.booked || 0,
          capacity: typedSlot.capacity,
          error: null, // No bloquear por errores de consulta
        };
      }

      const actualBookedCount = typedAppointments.length;

      // Log detallado de las citas encontradas
      if (actualBookedCount > 0) {
        console.log('📋 Citas activas encontradas en el slot:', {
          slotId,
          count: actualBookedCount,
          citas: typedAppointments.map((apt) => ({
            id: apt.id,
            status: apt.status,
            email: apt.client_email,
            name: apt.client_name,
            created_at: apt.created_at,
          })),
        });
      }
      // Considerar disponible si el contador real es menor a la capacidad
      // El contador del slot puede estar desactualizado, así que confiamos más en el contador real
      const available = actualBookedCount < typedSlot.capacity;

      // Log para debugging
      console.log('📊 Verificación de disponibilidad:', {
        slotId,
        actualBookedCount,
        capacity: typedSlot.capacity,
        slotBooked: typedSlot.booked,
        available,
        reason:
          actualBookedCount >= typedSlot.capacity
            ? 'Contador real >= capacidad'
            : typedSlot.booked >= typedSlot.capacity
            ? 'Contador slot >= capacidad'
            : 'Disponible',
      });

      return {
        available,
        bookedCount: actualBookedCount,
        capacity: typedSlot.capacity,
        error: null,
      };
    } catch (error) {
      return {
        available: false,
        bookedCount: 0,
        capacity: 0,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  }

  /**
   * Crea una nueva cita
   * Gestiona automáticamente la creación/actualización del cliente
   */
  static async createAppointment(
    formData: AppointmentFormData,
    slot: AvailabilitySlot
  ): Promise<{ appointment: any | null; error: Error | null }> {
    const normalizedTime = this.normalizeTime(formData.time);

    // Usar cliente admin obligatoriamente para bypass RLS en operaciones del servidor
    const client = getSupabaseAdmin();
    console.log('🔑 Usando cliente: admin (bypass RLS)');

    // =================================================================
    // 1. GESTIÓN DEL CLIENTE (CREAR O ACTUALIZAR)
    // =================================================================
    let clientId: string | null = null;

    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Intentar upsert del cliente basado en su email
      const { data: clientData, error: clientError } = await client
        .from('clients')
        // @ts-ignore - Supabase types inference issue, pero el upsert funciona correctamente
        .upsert(
          {
            email: normalizedEmail,
            name: formData.name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' } // Requiere que la columna 'email' sea UNIQUE en la DB
        )
        .select('id')
        .single();

      if (clientError) {
        // Si la tabla no existe, no es crítico
        if (clientError.message?.includes('Could not find the table')) {
          console.warn(
            '⚠️ Tabla clients no existe en la base de datos. Saltando creación de cliente.'
          );
        } else {
          console.warn(
            '⚠️ No se pudo gestionar el cliente en la tabla clients:',
            clientError.message
          );
        }
        // No detenemos el proceso, pero el cliente no se creará en su tabla propia
      } else if (clientData) {
        const typedClientData = clientData as { id: string } | null;
        clientId = typedClientData?.id || null;
        console.log('✅ Cliente gestionado correctamente:', {
          clientId,
          email: normalizedEmail,
          name: formData.name,
        });
      }
    } catch (e) {
      console.error('❌ Error gestionando cliente (no crítico):', e);
      // No bloquear la creación de la cita si falla la gestión del cliente
    }

    // =================================================================
    // 2. PREPARACIÓN DE LA CITA
    // =================================================================
    const appointmentData: any = {
      slot_id: slot.id,
      agent_id: slot.agent_id,
      property_id:
        formData.propertyId && formData.propertyId.trim() !== ''
          ? formData.propertyId
          : null,

      // Datos planos (backup por si acaso)
      client_name: formData.name,
      client_email: formData.email.toLowerCase(),
      client_phone: formData.phone || null,

      // VINCULACIÓN CON EL CLIENTE CREADO (opcional si la tabla tiene esta columna)
      client_id: clientId,

      operation_type: formData.operationType,
      budget_range:
        formData.operationType === 'rentar'
          ? 'budgetRentar' in formData
            ? formData.budgetRentar
            : ''
          : 'budgetComprar' in formData
          ? formData.budgetComprar
          : '',
      company:
        formData.operationType === 'rentar' && 'company' in formData
          ? formData.company
          : null,
      resource_type:
        formData.operationType === 'comprar' && 'resourceType' in formData
          ? formData.resourceType
          : null,
      resource_details:
        formData.operationType === 'comprar'
          ? {
              banco: (formData as any).banco || null,
              creditoPreaprobado: (formData as any).creditoPreaprobado || null,
              modalidadInfonavit: (formData as any).modalidadInfonavit || null,
              numeroTrabajadorInfonavit:
                (formData as any).numeroTrabajadorInfonavit || null,
              modalidadFovissste: (formData as any).modalidadFovissste || null,
              numeroTrabajadorFovissste:
                (formData as any).numeroTrabajadorFovissste || null,
            }
          : null,
      appointment_date: formData.date,
      appointment_time: normalizedTime,
      duration_minutes: 45,
      notes: formData.notes || null,
      status: 'pending',
      confirmed_at: null,
      cancelled_at: null,
    };

    // =================================================================
    // 3. CREACIÓN DE LA CITA
    // =================================================================
    try {
      console.log('🔧 Creando cita con datos:', {
        slot_id: appointmentData.slot_id,
        client_email: appointmentData.client_email,
        client_id: clientId,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        hasPropertyId: !!appointmentData.property_id,
      });

      // Intentar insertar con todos los campos
      let { data: appointment, error: insertError } = await client
        .from('appointments')
        .insert(appointmentData as any)
        .select()
        .single();

      // Type assertion para appointment
      const typedAppointmentInitial = appointment as {
        id: string;
        client_email: string;
      } | null;

      console.log('📝 Resultado del insert inicial:', {
        appointment: typedAppointmentInitial
          ? {
              id: typedAppointmentInitial.id,
              email: typedAppointmentInitial.client_email,
            }
          : null,
        error: insertError
          ? { message: insertError.message, code: insertError.code }
          : null,
      });

      // Si falla porque property_id no existe, intentar sin ese campo
      if (
        insertError &&
        insertError.message?.includes("Could not find the 'property_id' column")
      ) {
        console.warn(
          '⚠️ Columna property_id no existe, intentando sin ella...'
        );
        const appointmentDataWithoutProperty = { ...appointmentData };
        delete appointmentDataWithoutProperty.property_id;

        const retryResult = await client
          .from('appointments')
          .insert(appointmentDataWithoutProperty as any)
          .select()
          .single();

        const typedRetryData = retryResult.data as {
          id: string;
          client_email: string;
        } | null;

        console.log('📝 Resultado del retry sin property_id:', {
          appointment: typedRetryData
            ? { id: typedRetryData.id, email: typedRetryData.client_email }
            : null,
          error: retryResult.error
            ? {
                message: retryResult.error.message,
                code: retryResult.error.code,
              }
            : null,
        });

        appointment = retryResult.data;
        insertError = retryResult.error;
      }

      // Si falla porque client_id no existe, intentar sin ese campo
      if (
        insertError &&
        insertError.message?.includes("Could not find the 'client_id' column")
      ) {
        console.warn(
          '⚠️ Columna client_id no existe en appointments, intentando sin ella...'
        );
        const appointmentDataWithoutClientLink = { ...appointmentData };
        delete appointmentDataWithoutClientLink.client_id;

        const retryResult = await client
          .from('appointments')
          .insert(appointmentDataWithoutClientLink as any)
          .select()
          .single();

        const typedRetryData = retryResult.data as {
          id: string;
          client_email: string;
        } | null;

        console.log('📝 Resultado del retry sin client_id:', {
          appointment: typedRetryData
            ? { id: typedRetryData.id, email: typedRetryData.client_email }
            : null,
          error: retryResult.error
            ? {
                message: retryResult.error.message,
                code: retryResult.error.code,
              }
            : null,
        });

        appointment = retryResult.data;
        insertError = retryResult.error;
      }

      if (insertError || !appointment) {
        console.error('❌ Error al crear cita:', {
          error: insertError,
          hasAppointment: !!appointment,
        });
        return {
          appointment: null,
          error: insertError || new Error('No se pudo crear la cita'),
        };
      }

      // Type assertion para evitar errores de tipos
      const typedAppointment = appointment as {
        id: string;
        client_email: string;
        appointment_date: string;
        appointment_time: string;
      };

      console.log('✅ Cita creada exitosamente en DB:', {
        id: typedAppointment.id,
        email: typedAppointment.client_email,
        date: typedAppointment.appointment_date,
        time: typedAppointment.appointment_time,
        clientId: clientId || 'no vinculado',
      });

      // Actualizar contador manualmente como fallback
      await this.updateSlotBookedCount(slot.id);

      return { appointment, error: null };
    } catch (error) {
      return {
        appointment: null,
        error:
          error instanceof Error
            ? error
            : new Error('Error desconocido al crear cita'),
      };
    }
  }

  /**
   * Actualiza una cita existente
   * No verifica disponibilidad del slot porque la cita ya está reservada
   */
  static async updateAppointment(
    appointmentId: string,
    formData: AppointmentFormData,
    slot: AvailabilitySlot
  ): Promise<{ appointment: any | null; error: Error | null }> {
    const normalizedTime = this.normalizeTime(formData.time);
    const client = getSupabaseAdmin();

    try {
      // Verificar que la cita existe
      const { data: existingAppointment, error: fetchError } = await client
        .from('appointments')
        .select('id, slot_id, status')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !existingAppointment) {
        return {
          appointment: null,
          error: new Error('Cita no encontrada'),
        };
      }

      // Gestionar cliente (igual que en createAppointment)
      let clientId: string | null = null;
      try {
        const normalizedEmail = formData.email.toLowerCase().trim();
        const { data: clientData } = await client
          .from('clients')
          // @ts-ignore
          .upsert(
            {
              email: normalizedEmail,
              name: formData.name,
              phone: formData.phone || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          )
          .select('id')
          .single();

        if (clientData) {
          const typedClientData = clientData as { id: string } | null;
          clientId = typedClientData?.id || null;
        }
      } catch (e) {
        console.warn('⚠️ Error gestionando cliente (no crítico):', e);
      }

      // Preparar datos de actualización
      const updateData: any = {
        slot_id: slot.id,
        agent_id: slot.agent_id,
        property_id:
          formData.propertyId && formData.propertyId.trim() !== ''
            ? formData.propertyId
            : null,
        client_name: formData.name,
        client_email: formData.email.toLowerCase(),
        client_phone: formData.phone || null,
        client_id: clientId,
        operation_type: formData.operationType,
        budget_range:
          formData.operationType === 'rentar'
            ? 'budgetRentar' in formData
              ? formData.budgetRentar
              : ''
            : 'budgetComprar' in formData
            ? formData.budgetComprar
            : '',
        company:
          formData.operationType === 'rentar' && 'company' in formData
            ? formData.company
            : null,
        resource_type:
          formData.operationType === 'comprar' && 'resourceType' in formData
            ? formData.resourceType
            : null,
        resource_details:
          formData.operationType === 'comprar'
            ? {
                banco: (formData as any).banco || null,
                creditoPreaprobado: (formData as any).creditoPreaprobado || null,
                modalidadInfonavit: (formData as any).modalidadInfonavit || null,
                numeroTrabajadorInfonavit:
                  (formData as any).numeroTrabajadorInfonavit || null,
                modalidadFovissste: (formData as any).modalidadFovissste || null,
                numeroTrabajadorFovissste:
                  (formData as any).numeroTrabajadorFovissste || null,
              }
            : null,
        appointment_date: formData.date,
        appointment_time: normalizedTime,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Si el slot cambió, actualizar contadores
      const slotChanged = existingAppointment.slot_id !== slot.id;

      // Actualizar la cita
      const { data: updatedAppointment, error: updateError } = await client
        .from('appointments')
        .update(updateData as any)
        .eq('id', appointmentId)
        .select()
        .single();

      if (updateError || !updatedAppointment) {
        return {
          appointment: null,
          error: updateError || new Error('No se pudo actualizar la cita'),
        };
      }

      // Si el slot cambió, actualizar contadores de ambos slots
      if (slotChanged) {
        await this.updateSlotBookedCount(existingAppointment.slot_id);
        await this.updateSlotBookedCount(slot.id);
      } else {
        // Solo actualizar el contador del slot actual
        await this.updateSlotBookedCount(slot.id);
      }

      return { appointment: updatedAppointment, error: null };
    } catch (error) {
      return {
        appointment: null,
        error:
          error instanceof Error
            ? error
            : new Error('Error desconocido al actualizar cita'),
      };
    }
  }

  /**
   * Actualiza el contador de slots reservados (fallback si el trigger no funciona)
   */
  static async updateSlotBookedCount(slotId: string): Promise<void> {
    try {
      // Usar cliente admin obligatoriamente para bypass RLS en operaciones del servidor
      const client = getSupabaseAdmin();

      const { data: activeAppointments, error: countError } = await client
        .from('appointments')
        .select('id')
        .eq('slot_id', slotId)
        .in('status', ['pending', 'confirmed']);

      // Si hay error al contar, no actualizar (para evitar sobrescribir con valores incorrectos)
      if (countError) {
        console.warn(
          '⚠️ Error al contar citas para actualizar contador:',
          countError.message
        );
        return;
      }

      const { data: slot } = await client
        .from('availability_slots')
        .select('capacity')
        .eq('id', slotId)
        .single();

      if (slot) {
        const typedSlot = slot as { capacity: number };
        const newBookedCount = Math.min(
          typedSlot.capacity,
          activeAppointments?.length || 0
        );
        const { error: updateError } = await client
          .from('availability_slots')
          // @ts-ignore - Supabase types inference issue, pero el update funciona correctamente
          .update({ booked: newBookedCount })
          .eq('id', slotId);

        if (updateError) {
          console.warn(
            '⚠️ Error al actualizar contador de slot:',
            updateError.message
          );
        } else {
          console.log('✅ Contador de slot actualizado:', {
            slotId,
            newBookedCount,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error al actualizar contador de slots:', error);
    }
  }
}
