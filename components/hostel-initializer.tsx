'use client';

import { useEffect, useRef } from 'react';
import { checkAndInitializeHostels } from '@/utils/initialize-hostels';
import { useAuthContext } from '@/hooks/useAuthContext';

/**
 * Component that checks and initializes hostels when the app starts
 * This component renders nothing but performs the initialization in the background
 */
export function HostelInitializer() {
  const hasInitialized = useRef(false);
  const { user, role } = useAuthContext();

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('Hostel initialization already attempted, skipping...');
      return;
    }

    // Only try to initialize hostels if user is authenticated and has admin role
    if (!user) {
      console.log('User not authenticated yet, skipping hostel initialization...');
      return;
    }

    // Delay the initialization to ensure authentication is fully processed
    const initializeHostels = async () => {
      try {
        hasInitialized.current = true;
        console.log('Starting hostel initialization...');
        
        // Wait a bit to ensure user profile is loaded
        setTimeout(async () => {
          // Check if user has admin role
          if (role === 'admin') {
            console.log('Admin user detected, initializing hostels...');
            await checkAndInitializeHostels();
          } else {
            console.log('Non-admin user detected, skipping hostel initialization');
          }
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize hostels:', error);
        // Reset flag on error so it can be retried
        hasInitialized.current = false;
      }
    };

    initializeHostels();
  }, [user, role]);

  // This component renders nothing
  return null;
}
