// Tipos relacionados con usuarios y autenticación
import type { Database } from './database';

export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export interface User {
	id: string;
	email: string;
	name?: string;
}

export interface AuthSession {
	user: User;
	token: string;
	expiresAt: string;
}

