'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '@/constants';
import { User } from '@/interfaces/shared';
import { connectSocket, disconnectSocket, getSocket } from '@/utils/socketClient';
import { Socket } from 'socket.io-client';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const uploadIdRef = useRef<string>('');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfilePicture(user.profile_picture_url || null);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      // Connect to Socket.IO for upload progress
      const setupSocket = async () => {
        try {
          const socket = await connectSocket();
          socketRef.current = socket;

          socket.on('upload:progress', (data: { uploadId: string; progress: number; status: string; fileUrl?: string }) => {
            if (data.uploadId === uploadIdRef.current) {
              setUploadProgress(data.progress);
              if (data.status === 'completed' && data.fileUrl) {
                setProfilePicture(data.fileUrl);
                setIsUploading(false);
                // Update user in store
                updateUser({ ...user, profile_picture_url: data.fileUrl });
              } else if (data.status === 'error') {
                setIsUploading(false);
                setError('Upload failed');
              }
            }
          });

          socket.on('upload:error', (data: { uploadId: string; error: string }) => {
            if (data.uploadId === uploadIdRef.current) {
              setIsUploading(false);
              setError(data.error || 'Upload failed');
            }
          });
        } catch (error) {
          console.error('Socket connection error:', error);
        }
      };

      setupSocket();
    }

    return () => {
      // Don't disconnect socket on close, keep it connected for other uses
      // Only disconnect if component unmounts
    };
  }, [isOpen, user, updateUser]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please select an image file (JPEG, PNG, GIF, or WEBP).');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size is 5MB.');
      return;
    }

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setProfilePicture(previewUrl);
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    uploadIdRef.current = `upload-${Date.now()}-${Math.random()}`;

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('uploadId', uploadIdRef.current);

      // Notify socket about upload start
      const socket = getSocket();
      if (socket) {
        socket.emit('upload:start', {
          uploadId: uploadIdRef.current,
          fileName: file.name,
        });
      }

      const response = await api.post<{ message: string; fileUrl: string }>(
        API_ENDPOINTS.PROFILE_PICTURE.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Revoke the preview URL and set the actual uploaded URL
      URL.revokeObjectURL(previewUrl);
      setProfilePicture(response.data.fileUrl);
      updateUser({ ...user!, profile_picture_url: response.data.fileUrl });
      setUploadProgress(100);
      setIsUploading(false);
    } catch (err) {
      // Revoke preview URL on error
      URL.revokeObjectURL(previewUrl);
      setProfilePicture(user?.profile_picture_url || null);
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload profile picture';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Only send name since email is read-only
      const response = await api.put<{ message: string; user: User }>(
        API_ENDPOINTS.USER.PROFILE,
        { name, email: user?.email } // Use original email from user object
      );

      // Update the user in the store
      updateUser(response.data.user);
      setSuccess(true);
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setLoading(false);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Profile Settings</h3>
              <p className="text-sm text-gray-500 mt-0.5">Update your account information</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-all"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-600">Profile updated successfully!</p>
              </div>
            )}

            {/* Profile Picture Upload */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                Profile Picture
              </label>
              <div className="flex justify-center">
                <div className="relative flex-shrink-0">
                  <div className="flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden shadow-md ring-2 ring-blue-100">
                    {profilePicture ? (
                      <img 
                        src={profilePicture.startsWith('http') 
                          ? profilePicture 
                          : `${BACKEND_BASE_URL}${profilePicture}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-4xl font-semibold">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload Progress Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-full backdrop-blur-sm">
                      <svg className="animate-spin h-8 w-8 text-white mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-white text-sm font-semibold">{uploadProgress}%</span>
                    </div>
                  )}

                  {/* Pencil Icon Button - Bottom Left */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 left-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Update profile picture"
                  >
                    <svg 
                      className="w-5 h-5 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      />
                    </svg>
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                JPG, PNG, GIF or WEBP. Max size 5MB
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="profile-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                placeholder="Enter your name"
              />
            </div>

            {/* Email Field - Read Only */}
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Enter your email"
              />
              <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
            </div>

            {/* Member Since */}
            {user?.created_at && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-700">Member since:</span>{' '}
                  <span className="text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-sm min-h-[42px] flex items-center justify-center"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Updating...</span>
                  </span>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

