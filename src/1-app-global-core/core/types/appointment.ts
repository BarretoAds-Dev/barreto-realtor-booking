// Tipos relacionados con citas
import type { Database } from './database';

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
export type OperationType = 'rentar' | 'comprar';

export interface AppointmentFormData {
	date: string;
	time: string;
	name: string;
	email: string;
	phone?: string;
	operationType: OperationType;
	notes?: string;
	propertyId?: string | null; // ID de la propiedad relacionada
	// Campos para rentar
	budgetRentar?: string;
	company?: string;
	// Campos para comprar
	budgetComprar?: string;
	resourceType?: string;
	banco?: string;
	creditoPreaprobado?: string;
	modalidadInfonavit?: string;
	numeroTrabajadorInfonavit?: string;
	modalidadFovissste?: string;
	numeroTrabajadorFovissste?: string;
}

export interface AvailableSlot {
	date: string;
	dayOfWeek: string;
	slots: Array<{
		time: string;
		available: boolean;
		capacity: number;
		booked: number;
	}>;
	metadata?: {
		notes?: string;
		specialHours?: boolean;
	};
}

export interface AppointmentConfig {
	slotDuration: number;
	bufferTime: number;
	businessHours: Record<string, any>;
}

export type AppointmentStep = 1 | 2 | 3 | 4;

