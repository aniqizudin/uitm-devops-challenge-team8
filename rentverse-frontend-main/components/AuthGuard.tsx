'use client'

import { useEffect, useState } from 'react' // 🚨 ADDED useState
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

/**
 * AuthGuard component to handle client-side authentication redirects
 * - Uses isInitialized state to prevent redirects before localStorage is checked.
 */
export default function AuthGuard({ 
  children, 
  redirectTo = '/', 
  requireAuth = false 
}: AuthGuardProps) {
  const { isLoggedIn, initializeAuth } = useAuthStore()
  const router = useRouter()

  // 🚨 NEW STATE: Tracks if the initialization useEffect has finished.
  const [isInitialized, setIsInitialized] = useState(false); 

  useEffect(() => {
    // 1. Initialize auth state on mount (reads localStorage)
    initializeAuth()
    // 2. Set the flag only AFTER initialization is attempted
    setIsInitialized(true); 
  }, [initializeAuth])

  useEffect(() => {
    // 🚨 CRITICAL FIX: DO NOT REDIRECT until initialization is complete
    if (!isInitialized) return; 

    // 1. Redirect to login if auth is required but user is not logged in
    if (requireAuth && !isLoggedIn) {
      router.replace('/auth/login') 
    } 
    // 2. Redirect away from auth pages (like login/signup) if user is already logged in
    else if (!requireAuth && isLoggedIn) {
      router.replace(redirectTo)
    }
  }, [isLoggedIn, requireAuth, redirectTo, router, isInitialized]) // Added isInitialized dependency


  // 🚨 NEW RENDER LOGIC: Show spinner while initializing to prevent flash redirects
  if (!isInitialized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading authentication state...</p>
            </div>
        </div>
      );
  }

  // Hide the content while redirecting on auth pages
  if (!requireAuth && isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Hide the content while redirecting on protected pages
  if (requireAuth && !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}