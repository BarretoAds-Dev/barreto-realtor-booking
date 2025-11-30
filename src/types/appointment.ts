export type Appointment = {
	id: string;
	date: string;
	time: string;
	duration: number;
	client: {
		name: string;
		email: string;
		phone?: string;
		notes?: string;
	};
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	createdAt: string;
};

