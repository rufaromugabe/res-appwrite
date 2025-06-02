'use client'

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Logo from '@/public/hit_logo.png';
import BackgroundImage from '@/public/acbackground.jpg';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { signIn, handleOAuthCallback, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const callbackProcessedRef = useRef(false);
  const searchParams = useSearchParams();  // Handle OAuth callback - check once on mount
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    // Only process if we have URL parameters and haven't processed yet
    if ((success === 'true' || error === 'true') && !callbackProcessedRef.current) {
      callbackProcessedRef.current = true;
      setIsProcessingCallback(true);
      
      if (success === 'true') {
        console.log('OAuth success detected, handling callback...');
        handleOAuthCallback().finally(() => {
          setIsProcessingCallback(false);
        });
      } else if (error === 'true') {
        console.error('OAuth error detected');
        toast.error('Authentication failed. Please try again.');
        // Clear URL parameters on error
        window.history.replaceState({}, '', '/login');
        setIsProcessingCallback(false);
      }
    }
  }, [searchParams, handleOAuthCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn();
     
    } catch (error) {
      toast.error('Failed to log in. Please try again.');
    }
  };
  // Show loading spinner during OAuth callback processing
  if ((loading || isProcessingCallback) && (searchParams.get('success') === 'true' || searchParams.get('error') === 'true')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing authentication...</p>
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
                Please sign in with your HIT account
              </p>
            </motion.div>
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign in with Google
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}