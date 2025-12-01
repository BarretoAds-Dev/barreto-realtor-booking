import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

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

