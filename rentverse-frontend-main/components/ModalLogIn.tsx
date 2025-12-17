'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import React, { ChangeEvent, useState } from 'react' 
import { ArrowLeft } from 'lucide-react'
import BoxError from '@/components/BoxError'
import InputPassword from '@/components/InputPassword'
import ButtonFilled from '@/components/ButtonFilled'
import useAuthStore from '@/stores/authStore'

interface ModalLogInProps {
  isModal?: boolean
  isLoginPage?: boolean // 🚨 ADDED
}
// ...
function ModalLogIn({ isModal = true, isLoginPage = false }: ModalLogInProps) { 
// ...
  const {
    password,
    isLoading,
    error,
    email,           
    requiresOtp,     
    otp,             
    setOtp,          
    submitOtpVerification, 
    resendOtp,
    setPassword,
    isLoginFormValid,
    submitLogIn,
    resetForm,
    setEmail,
    submitEmailCheck,
    setError, // ✅ Must be here
    setLoading // ✅ Must be here (fixes Screenshot 21.22.26)
  } = useAuthStore()

  // ... rest of the component
  
  const router = useRouter()
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // --- HANDLERS ---

  const handleBackButton = () => {
    setError(null); // Clear any error messages
    
    // 🚨 FIX: When exiting OTP, only clear OTP-related state, NOT the email.
    if (requiresOtp) {
       // We must call the store's action to clear OTP state without clearing the entire form.
       // The store doesn't have a specific 'resetOtpState' action, so we manually clear it.
       useAuthStore.getState().setOtp(''); // Clear OTP input
       useAuthStore.getState().setRequiresOtp(false); // Manually set requiresOtp to false
       setShowPasswordForm(true); // Return to the password screen
    } 
    // When exiting the Password Form, return to Email Form
    else if (showPasswordForm) {
       setShowPasswordForm(false);
       setPassword('');
       // Keep the email populated
    } 
    // When exiting the Email Form, go back in history
    else {
       router.back();
    }
  }
  


  // 🚨 FINAL CLEAN HANDLER: Submitting the Email Form
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Call the store function 
    const result = await submitEmailCheck();
    
    // Check if result is available and user exists
    if (result && result.exists) {
        // SUCCESS: Transition to the Password screen
        setShowPasswordForm(true);
    } else if (result && result.message) {
        // FAILURE: Display the error message returned from the store
        setError(result.message);
    } else {
        // Catch-all: If the store returned null (which it shouldn't now), show a generic error
        setError("Error during email check. Please check your network.");
    }
  }
  // --- END FINAL DEBUG HANDLER ---



  // Submitting the Password Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await submitLogIn() 
    
    if (useAuthStore.getState().isLoggedIn) {
        router.push('/') 
    }
  }

  // Handler for OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await submitOtpVerification()

    if (success) {
        router.push('/') 
    }
  }

  // ------------------------------------------
  // 1️⃣ OTP SCREEN (Highest priority)
  // ------------------------------------------
  if (requiresOtp) {
    const otpContent = (
      <div className={clsx([
        isModal ? 'shadow-xl' : 'border border-slate-400',
        'bg-white rounded-3xl max-w-md w-full p-8',
      ])}>
        {/* ... (OTP content remains the same) ... */}
         {/* Header */}
        <div className="text-center mb-6 relative">
          <ArrowLeft onClick={handleBackButton} size={20}
                     className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Enter code
          </h2>
          <div className="w-full h-px bg-slate-200 mt-4"></div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-slate-600 text-center mb-6">
            We sent a code to <span className="font-semibold">{email}</span>.
          </p>

          {/* Show success message for real email delivery */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm text-center">
              <strong>✅ Email Sent!</strong> Your verification code has been sent to your email.
            </p>
            <p className="text-green-700 text-center text-sm mt-1">
              Check your inbox for the 6-digit code.
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <BoxError errorTitle={'Verification failed'} errorDescription={error} />
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-900 mb-3">
                6-digit code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className={clsx([
                  'w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 text-center text-lg tracking-widest',
                  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                  'transition-colors duration-200'
                ])}
                required
              />
            </div>

            <ButtonFilled
              type="submit"
              disabled={otp.length < 6 || isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </ButtonFilled>

            {/* Resend Code Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  const success = await resendOtp();
                  if (success) {
                    setError(null); // Clear any errors on success
                  }
                }}
                disabled={isLoading}
                className="text-teal-600 hover:text-teal-700 text-sm underline transition-colors duration-200"
              >
                {isLoading ? 'Sending...' : 'Resend code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )

    if (isModal) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {otpContent}
        </div>
      )
    }
    return <div className="flex items-center justify-center p-4">{otpContent}</div>
  }

  // ------------------------------------------
  // 2️⃣ PASSWORD SCREEN (Shown if showPasswordForm is true)
  // ------------------------------------------
  if (showPasswordForm) {
    const passwordContent = (
      <div className={clsx([
        isModal ? 'shadow-xl' : 'border border-slate-400',
        'bg-white rounded-3xl max-w-md w-full p-8',
      ])}>
        {/* Header */}
        <div className="text-center mb-6 relative">
          <ArrowLeft onClick={handleBackButton} size={20}
                     className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Log in
          </h2>
          <div className="w-full h-px bg-slate-200 mt-4"></div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-slate-600 text-center mb-6">
            Welcome back, <span className="font-semibold">{email}</span>.
          </p>
          
          {error && (
            <div className="mb-6">
              <BoxError errorTitle={'Let\'s try that again'} errorDescription={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-3">
                Password
              </label>
              <InputPassword
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Password"
                required
                showStrengthIndicator={false}
              />
            </div>

            <ButtonFilled
              type="submit"
              disabled={!isLoginFormValid() || isLoading}
            >
              {isLoading ? 'Loading...' : 'Log in'}
            </ButtonFilled>

            <div className="text-center">
              <Link href={'/'} className={'underline text-slate-700 text-sm hover:text-slate-900 transition-colors'}>
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    )

    if (isModal) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {passwordContent}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center p-4">
        {passwordContent}
      </div>
    )
  }

  // ------------------------------------------
  // 3️⃣ EMAIL ENTRY SCREEN (Default View)
  // ------------------------------------------
  const emailContent = (
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      {/* Header */}
      <div className="text-center mb-6 relative">
        <ArrowLeft onClick={handleBackButton} size={20}
                   className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Log in
        </h2>
        <div className="w-full h-px bg-slate-200 mt-4"></div>
      </div>

      {/* Content */}
      <div className="mb-8">
        {error && (
          <div className="mb-6">
            <BoxError errorTitle={'Error'} errorDescription={error} />
          </div>
        )}

        {/* 🚨 CRITICAL FIX: Ensure onSubmit calls the handler */}
        <form onSubmit={handleEmailSubmit} className="space-y-6"> 
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-3">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={clsx([
                'w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
                'transition-colors duration-200'
              ])}
              required
            />
          </div>

          <ButtonFilled
            type="submit"
            disabled={!email || isLoading}
          >
            {isLoading ? 'Checking...' : 'Continue'}
          </ButtonFilled>
          
          <div className="text-center mt-4">
            <Link href={'/auth/signup'} className={'underline text-slate-700 text-sm hover:text-slate-900 transition-colors'}>
              Need an account? Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )

  // Default return renders the Email Entry screen
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        {emailContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      {emailContent}
    </div>
  )
}

export default ModalLogIn