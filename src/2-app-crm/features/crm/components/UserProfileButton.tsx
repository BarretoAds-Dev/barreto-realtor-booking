/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { supabaseAuth } from '@/1-app-global-core/core/config/auth';

interface UserProfileButtonProps {
	isCollapsed?: boolean;
	onClick?: () => void;
	isActive?: boolean;
}

interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
}

export default function UserProfileButton({ isCollapsed = false, onClick, isActive = false }: UserProfileButtonProps) {
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadUserProfile = async () => {
			try {
				const { data: { user }, error } = await supabaseAuth.auth.getUser();

				if (error) {
					console.error('Error al cargar perfil:', error);
					return;
				}

				if (user) {
					const avatarUrl = user.user_metadata?.avatar_url || null;
					setUserProfile({
						id: user.id,
						email: user.email || '',
						full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
						avatar_url: avatarUrl,
					});
				}
			} catch (error) {
				console.error('Error inesperado al cargar perfil:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadUserProfile();

		// Escuchar cambios en el perfil del usuario
		const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
			if (session?.user) {
				const avatarUrl = session.user.user_metadata?.avatar_url || null;
				setUserProfile({
					id: session.user.id,
					email: session.user.email || '',
					full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
					avatar_url: avatarUrl,
				});
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	// Obtener iniciales del usuario
	const getUserInitials = (): string => {
		if (!userProfile?.full_name) {
			return userProfile?.email?.charAt(0).toUpperCase() || 'U';
		}
		const names = userProfile.full_name.trim().split(' ');
		if (names.length >= 2) {
			return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
		}
		return userProfile.full_name.charAt(0).toUpperCase();
	};

	if (isLoading) {
		return (
			<div class={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${
				isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : ''
			}`}>
				<div class="w-7 h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
				{!isCollapsed && (
					<div class="flex-1 space-y-1">
						<div class="h-3 bg-gray-200 rounded animate-pulse w-24" />
						<div class="h-2 bg-gray-200 rounded animate-pulse w-32" />
					</div>
				)}
			</div>
		);
	}

	if (!userProfile) {
		return null;
	}

		return (
		<button
			onClick={onClick}
			class={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg ${
				isActive
					? 'bg-gray-900 border border-gray-800 hover:bg-gray-800'
					: 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
			} ${
				isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'text-left'
			}`}
			title={isCollapsed ? userProfile.full_name || userProfile.email : ''}
		>
			{/* Avatar */}
			<div class="relative flex-shrink-0">
				<div class={`w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-700 border-2 ${
					isActive ? 'border-gray-400' : 'border-white'
				} shadow-md`}>
					{userProfile.avatar_url ? (
						<img
							src={userProfile.avatar_url}
							alt={userProfile.full_name || userProfile.email}
							class="w-full h-full object-cover"
						/>
					) : (
						<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
							<span class="text-xs sm:text-sm font-bold text-white">
								{getUserInitials()}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Información del usuario */}
			{!isCollapsed && (
				<div class="flex-1 min-w-0">
					<div class={`text-xs font-semibold truncate ${
						isActive ? 'text-white' : 'text-gray-900'
					}`}>
						{userProfile.full_name || 'Usuario'}
					</div>
					<div class={`text-xs truncate ${
						isActive ? 'text-gray-300' : 'text-gray-600'
					}`}>
						{userProfile.email}
					</div>
				</div>
			)}
		</button>
	);
}

