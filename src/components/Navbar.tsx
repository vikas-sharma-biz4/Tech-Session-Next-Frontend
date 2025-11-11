'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { ROUTES, BACKEND_BASE_URL } from '@/constants';
import { useRouter } from 'next/navigation';
import UserProfileModal from './UserProfileModal';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <Link 
              href={ROUTES.DASHBOARD} 
              className="flex items-center gap-2 group transition-all"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                  />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Book Marketplace
              </span>
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-4">
            {/* User Profile - Clickable */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden flex-shrink-0 relative">
                {user?.profile_picture_url ? (
                  <>
                    <img 
                      src={user.profile_picture_url.startsWith('http') 
                        ? user.profile_picture_url 
                        : `${BACKEND_BASE_URL}${user.profile_picture_url}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image and show fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.profile-fallback') as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }
                      }}
                    />
                    <span className="profile-fallback text-white text-sm font-semibold absolute inset-0 flex items-center justify-center hidden">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </>
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-gray-900">
                  {user?.name || 'User'}
                </span>
                <span className="text-xs text-gray-500">
                  {user?.email}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Mobile User Info - Clickable */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="sm:hidden flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden flex-shrink-0 relative">
                {user?.profile_picture_url ? (
                  <>
                    <img 
                      src={user.profile_picture_url.startsWith('http') 
                        ? user.profile_picture_url 
                        : `${BACKEND_BASE_URL}${user.profile_picture_url}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image and show fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.profile-fallback') as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }
                      }}
                    />
                    <span className="profile-fallback text-white text-sm font-semibold absolute inset-0 flex items-center justify-center hidden">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </>
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;

