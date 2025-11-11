'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { User, UserRole } from '@/interfaces/shared';
import { ROUTES } from '@/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoleSelectionModal from '@/components/RoleSelectionModal';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { updateUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');
    const newUser = searchParams.get('newUser') === 'true';

    if (error) {
      router.push(`${ROUTES.LOGIN}?error=oauth_failed`);
      return;
    }

    if (token && userParam) {
      try {
        const parsedUser: User = JSON.parse(decodeURIComponent(userParam));
        setUser(parsedUser);
        
        // Token is set in httpOnly cookie by backend redirect
        // Set user in store directly since we have the user data from OAuth
        useAuthStore.setState({ user: parsedUser, isAuthenticated: true, loading: false });

        // If new user and role is 'buyer' (default), show role selection
        if (newUser && (!parsedUser.role || parsedUser.role === 'buyer')) {
          setShowRoleSelection(true);
        } else {
          // Redirect based on role
          const userRole = parsedUser.role || 'buyer';
          if (userRole === 'seller' || userRole === 'admin') {
            window.location.href = 'http://localhost:3001/dashboard';
          } else {
            router.push(ROUTES.DASHBOARD);
          }
        }
      } catch (err) {
        router.push(`${ROUTES.LOGIN}?error=oauth_failed`);
      }
    } else {
      router.push(`${ROUTES.LOGIN}?error=oauth_failed`);
    }
  }, [searchParams, router]);

  const handleRoleSelected = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      updateUser(updatedUser);
      useAuthStore.setState({ user: updatedUser });

      // Redirect based on selected role
      if (role === 'seller' || role === 'admin') {
        window.location.href = 'http://localhost:3001/dashboard';
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    }
  };

  if (showRoleSelection) {
    return <RoleSelectionModal onRoleSelected={handleRoleSelected} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

