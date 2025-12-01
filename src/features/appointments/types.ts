// Tipos específicos para el feature de appointments
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

