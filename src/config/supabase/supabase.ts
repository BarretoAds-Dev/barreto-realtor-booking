import { createClient } from '@supabase/supabase-js';

// Tipos básicos hasta generar los tipos completos con Supabase CLI
type Database = {
	public: {
		Tables: {
			agents: {
				Row: {
					id: string;
					name: string;
					email: string;
					phone: string | null;
					office_location: string | null;
					calendar_integration: Record<string, any> | null;
					created_at: string;
				};
				Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at'>;
				Update: Partial<Database['public']['Tables']['agents']['Insert']>;
			};
			availability_slots: {
				Row: {
					id: string;
					agent_id: string;
					date: string;
					start_time: string;
					end_time: string;
					capacity: number;
					booked: number;
					enabled: boolean;
					metadata: Record<string, any> | null;
					created_at: string;
				};
				Insert: Omit<Database['public']['Tables']['availability_slots']['Row'], 'id' | 'created_at'>;
				Update: Partial<Database['public']['Tables']['availability_slots']['Insert']>;
			};
			appointments: {
				Row: {
					id: string;
					agent_id: string;
					slot_id: string | null;
					client_name: string;
					client_email: string;
					client_phone: string | null;
					operation_type: 'rentar' | 'comprar';
					budget_range: string;
					company: string | null;
					resource_type: string | null;
					resource_details: Record<string, any> | null;
					appointment_date: string;
					appointment_time: string;
					duration_minutes: number;
					status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
					notes: string | null;
					created_at: string;
					updated_at: string;
					confirmed_at: string | null;
					cancelled_at: string | null;
				};
				Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>;
				Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
			};
			holidays: {
				Row: {
					id: string;
					date: string;
					name: string;
					type: 'holiday' | 'vacation' | 'blocked';
					recurring: boolean;
				};
				Insert: Omit<Database['public']['Tables']['holidays']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['holidays']['Insert']>;
			};
		};
	};
};

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('❌ Missing Supabase environment variables');
	console.error('PUBLIC_SUPABASE_URL:', supabaseUrl || 'NOT SET');
	console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
	throw new Error(
		'Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY'
	);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false, // No necesario para formulario público
	},
});

// Tipos exportados para uso en componentes
export type Tables = Database['public']['Tables'];
export type Appointment = Tables['appointments']['Row'];
export type AppointmentInsert = Tables['appointments']['Insert'];
export type AvailabilitySlot = Tables['availability_slots']['Row'];

