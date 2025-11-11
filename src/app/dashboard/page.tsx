'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants';
import Navbar from '@/components/Navbar';
import BooksTable from '@/components/BooksTable/BooksTable';
import { connectSocket, getSocket, disconnectSocket } from '@/utils/socketClient';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, checkAuth } = useAuthStore();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    // Only check auth if we don't already have user data
    if (!user && !loading) {
      checkAuth();
    }
  }, [checkAuth, user, loading]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, loading, router]);

  // Silent refresh mechanism
  useEffect(() => {
    if (!isAuthenticated || loading) return;

    // Setup Socket.IO connection for real-time updates
    const setupSocket = async () => {
      try {
        const socket = await connectSocket();
        socketRef.current = socket;

        // Listen for profile update events
        socket.on('profile:updated', (data: { user: typeof user }) => {
          if (data.user) {
            useAuthStore.getState().updateUser(data.user);
          }
        });

        // Listen for any user-related events
        socket.on('user:updated', (data: { user: typeof user }) => {
          if (data.user) {
            useAuthStore.getState().updateUser(data.user);
          }
        });
      } catch (error) {
        console.error('Failed to connect socket for silent refresh:', error);
      }
    };

    setupSocket();

    // Setup periodic silent refresh (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      // Silently refresh user data without showing loading state
      checkAuth(true).catch((error) => {
        // Silently handle errors - don't disrupt user experience
        console.error('Silent refresh error:', error);
      });
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      // Don't disconnect socket here as it might be used by other components
    };
  }, [isAuthenticated, loading, checkAuth]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Book Listings</h2>
          <BooksTable />
        </div>
      </div>
    </div>
  );
}

