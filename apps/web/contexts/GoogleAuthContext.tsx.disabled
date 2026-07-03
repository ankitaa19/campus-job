'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  signIn: (userType: 'student' | 'college' | 'recruiter', phone?: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
  error: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google API
    const loadGoogleAPI = async () => {
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };

    loadGoogleAPI();
  }, []);

  const signIn = async (userType: 'student' | 'college' | 'recruiter', phone?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.google) {
        throw new Error('Google API not loaded');
      }

      return new Promise<void>((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: any) => {
            try {
              // Send the token to our backend
              const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/google-signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  idToken: response.credential,
                  userType,
                  phone: userType === 'student' ? phone : undefined,
                }),
              });

              const data = await apiResponse.json();

              if (apiResponse.ok) {
                // Handle successful registration
                if (data.requiresPhoneVerification) {
                  // Redirect to phone verification page
                  window.location.href = `/forgot-password?type=student&otpId=${data.otpId}&phone=${data.phone}&method=webhook`;
                } else {
                  // Complete login
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('userId', data.user.id);
                  localStorage.setItem('role', data.user.role);
                  
                  setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    picture: data.user.profilePicture,
                  });

                  // Redirect to appropriate dashboard
                  if (data.user.role === 'student') {
                    window.location.href = '/dashboard/student';
                  } else if (data.user.role === 'college') {
                    window.location.href = '/dashboard/college';
                  } else if (data.user.role === 'recruiter') {
                    window.location.href = '/dashboard/recruiter';
                  }
                }
                resolve();
              } else {
                throw new Error(data.message || 'Google signup failed');
              }
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Google signup failed');
              reject(error);
            } finally {
              setIsLoading(false);
            }
          },
        });

        window.google.accounts.id.prompt(); // Show the One Tap dialog
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google signup failed');
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('profileData');
  };

  const value = {
    user,
    signIn,
    signOut,
    isLoading,
    error,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

// Extend Window interface for Google API
declare global {
  interface Window {
    google: any;
  }
}

// Default export for better module compatibility
export default { useGoogleAuth, GoogleAuthProvider };
