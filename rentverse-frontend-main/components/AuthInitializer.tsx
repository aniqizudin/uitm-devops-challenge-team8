'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import useAuthStore from '@/stores/authStore'

function AuthInitializer(): null {
  const initializedRef = useRef(false);
  
  // Use usePathname at the root level as it's a dedicated client hook
  const pathname = usePathname();

  useEffect(() => {
    // Check if running on the client (final safety measure)
    if (typeof window === 'undefined') return;

    // Guard against running twice in Strict Mode
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // 🚨 FINAL FIX: Use the static method to access actions, bypassing the SSR hook entirely.
    const { initializeAuth, setSkipInit } = useAuthStore.getState();

    // 1. Check if we are on an authentication route
    const isAuthRoute = pathname.startsWith('/auth');

    // 2. CRITICAL FIX: Set the skip flag for the store.
    setSkipInit(isAuthRoute); 

    // 3. Initialize auth state.
    initializeAuth();
    
    // 4. Cleanup: Reset skipInit when the component unmounts
    return () => {
        setSkipInit(false);
    };

  }, [pathname]) 
  // Dependency array only needs pathname now, as the store actions are pulled statically

  // This component doesn't render anything
  return null
}

export default AuthInitializer