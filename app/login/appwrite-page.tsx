'use client'

import { useState, useEffect } from 'react';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Logo from '@/public/hit_logo.png';
import BackgroundImage from '@/public/acbackground.jpg';
import { motion } from 'framer-motion';

export default function AppwriteLoginPage() {
  const { signInWithGoogle, handleOAuthCallback, loading } = useAppwriteAuth();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      handleOAuthCallback();
    } else if (error) {
      toast.error('Authentication failed. Please try again.');
    }
  }, [searchParams, handleOAuthCallback]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Failed to initiate sign-in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side with background image */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Image
          src={BackgroundImage}
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0"
        />
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-gradient-to-b from-blue-600/50 to-blue-900/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <motion.h1 
            className="text-4xl font-bold mb-4 text-center text-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Welcome to the HIT Accommodation Application Portal
          </motion.h1>
          <motion.p 
            className="text-xl text-center text-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Sign in to access your account
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Right side with login form and animated background */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 z-0"
          animate={{
            background: [
              'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
              'linear-gradient(45deg, #e5e7eb, #d1d5db)',
              'linear-gradient(45deg, #d1d5db, #f3f4f6)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        <div className="w-full max-w-md z-10">
          <motion.div 
            className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl px-8 py-10 space-y-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <motion.div 
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Image src={Logo} alt="logo" width={100} height={100} className="mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-600 mt-2">
                Please sign in with your Google account
              </p>
            </motion.div>

            <motion.div 
              className="space-y-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Redirecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 1c2.68 0 5.16.98 7.06 2.69l-3.18 3.18C14.68 5.19 13.39 4.5 12 4.5c-2.86 0-5.29 1.93-6.16 4.53H2.18V6.21C3.99 3.47 7.7 1 12 1z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </motion.button>

              <div className="text-center text-sm text-gray-500">
                <p>
                  By signing in, you agree to our terms of service and privacy policy.
                </p>
                <p className="mt-2">
                  Having trouble? Contact support at{' '}
                  <a href="mailto:support@hit.ac.zw" className="text-blue-600 hover:underline">
                    support@hit.ac.zw
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
