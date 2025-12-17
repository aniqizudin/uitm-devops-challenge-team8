import { create } from 'zustand'
import type { User, AuthState } from '@/types/auth'
import { setCookie, deleteCookie } from '@/utils/cookies'

// 🔒 HARDCODED BACKEND URL
const API_BASE = 'http://localhost:8000';

// ✅ NEW HELPER: Brute-force delay to ensure localStorage writes before redirect
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AuthActions {
  setPassword: (password: string) => void
  submitLogIn: () => Promise<void>
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setBirthdate: (birthdate: string) => void
  setEmail: (email: string) => void
  setPhone: (phone: string) => void
  setSignUpPassword: (password: string) => void
  submitSignUp: () => Promise<void>
  validateEmail: (email: string) => boolean
  // 🚨 CORRECTED SIGNATURE: Includes optional 'message' for component synchronization
  submitEmailCheck: () => Promise<{ exists: boolean; role: string | null; message?: string } | null>;
  
  setOtp: (otp: string) => void
  submitOtpVerification: () => Promise<boolean>
  resendOtp: () => Promise<boolean>
  // 🚨 FINAL FIX 1: ADDED MISSING SETTER SIGNATURE
  setRequiresOtp: (requires: boolean) => void; 

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  resetForm: () => void
  isLoginFormValid: () => boolean
  isSignUpFormValid: () => boolean
  initializeAuth: () => void
  validateToken: () => Promise<boolean>
  refreshUserData: () => Promise<boolean>
  
  // 🚨 FINAL FIX ACTION
  setSkipInit: (skip: boolean) => void 
}

interface AuthFormState {
  password: string
  firstName: string
  lastName: string
  birthdate: string
  email: string
  phone: string
  signUpPassword: string
  
  otp: string
  requiresOtp: boolean
}

interface AuthGlobalState {
  // 🚨 FINAL FIX STATE
  skipInitialization: boolean
}

type AuthStore = AuthState & AuthFormState & AuthGlobalState & AuthActions

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
  password: '',
  firstName: '',
  lastName: '',
  birthdate: '',
  email: '',
  phone: '',
  signUpPassword: '',
  
  otp: '',
  requiresOtp: false,
  // 🚨 FINAL FIX INITIALIZATION
  skipInitialization: false,

  setPassword: (password: string) => set({ password }),
  setFirstName: (firstName: string) => set({ firstName }),
  setLastName: (lastName: string) => set({ lastName }),
  setBirthdate: (birthdate: string) => set({ birthdate }),
  setEmail: (email: string) => set({ email }),
  setPhone: (phone: string) => set({ phone }),
  setSignUpPassword: (signUpPassword: string) => set({ signUpPassword }),
  
  setOtp: (otp: string) => set({ otp }),
  
  // 🚨 FINAL FIX 2: ADDED MISSING SETTER IMPLEMENTATION
  setRequiresOtp: (requires: boolean) => set({ requiresOtp: requires }),

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  
  // 🚨 FINAL FIX SETTER
  setSkipInit: (skip: boolean) => set({ skipInitialization: skip }),

  validateEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isLoginFormValid: () => {
    const { password } = get()
    return password.length >= 6
  },

  isSignUpFormValid: () => {
    const { firstName, lastName, email, signUpPassword, birthdate, phone } = get()
    const { validateEmail } = get()
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      validateEmail(email) &&
      signUpPassword.length >= 6 &&
      birthdate.length > 0 &&
      phone.trim().length > 0
    )
  },

  submitLogIn: async () => {
    const { email, password, setLoading, setError, resetForm } = get() 

    if (!get().isLoginFormValid()) {
      setError('Please enter a valid password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        if (result.data?.requiresOTP) {
          set({ requiresOtp: true, error: null })
          return;
        }
        
        const token = result.data?.token 
                      || result.token 
                      || result.data?.accessToken 
                      || result.accessToken;
                      
        const backendUser = result.data?.user 
                            || result.user; 
        
        if (!token || !backendUser) {
           console.error("Auth Failure: Token or user data missing in response.", result);
           setError("Login failed. Missing token/user data from server.");
           return;
        }

        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName || '',
          lastName: backendUser.lastName || '',
          name: backendUser.name || `${backendUser.firstName} ${backendUser.lastName}`.trim(),
          dateOfBirth: backendUser.dateOfBirth || '',
          phone: backendUser.phone || '',
          role: backendUser.role || 'user',
          birthdate: backendUser.dateOfBirth || undefined,
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', token, 7)
        }
        
        if (typeof window !== 'undefined') {
            await delay(100); 
        }

        set({ user, isLoggedIn: true, password: '', email: '', error: null, requiresOtp: false }) 
        
        resetForm()
        return; 

      } else {
        setError(result.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  },

  submitOtpVerification: async () => {
    const { email, otp, setLoading, setError, resetForm } = get() 
    
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code');
      return false;
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const result = await response.json()

      if (response.ok) {
        
        const token = result.data?.token 
                      || result.token 
                      || result.data?.accessToken 
                      || result.accessToken;
                      
        const backendUser = result.data?.user 
                            || result.user; 
        
        if (!token || !backendUser) {
           console.error("OTP Failure: Token or user data missing in response.", result);
           setError("Verification failed. Missing token/user data from server.");
           return false;
        }

        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.name?.split(' ')[0] || '',
          lastName: backendUser.name?.split(' ')[1] || '',
          name: backendUser.name || '',
          dateOfBirth: '',
          phone: '',
          role: backendUser.role || 'user',
          birthdate: undefined,
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', token, 7)
        }
        
        if (typeof window !== 'undefined') {
            await delay(100); 
        }
        
        set({ 
          user, 
          isLoggedIn: true, 
          password: '', 
          email: '', 
          otp: '',
          requiresOtp: false, 
          error: null 
        })
        
        resetForm()
        return true;
      } else {
        setError(result.message || 'Verification failed')
        return false;
      }
    } catch (error) {
      console.error('OTP error:', error)
      setError('Verification failed. Please try again.')
      return false;
    } finally {
      setLoading(false)
    }
  },

  resendOtp: async () => {
    const { email, setLoading, setError } = get() 
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return true;
      } else {
        setError(result.message || 'Failed to resend verification code')
        return false;
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setError('Failed to resend verification code. Please try again.')
      return false;
    } finally {
      setLoading(false)
    }
  },

  submitSignUp: async () => {
    const { firstName, lastName, email, signUpPassword, birthdate, phone, setLoading, setError, resetForm } = get()
    if (!get().isSignUpFormValid()) { setError('Please fill in all fields correctly'); return }
    setLoading(true); setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: signUpPassword, firstName, lastName, dateOfBirth: birthdate, phone }),
      })
      const result = await response.json()
      if (result.success) {
        
        const token = result.data?.token || result.token; 
        const backendUser = result.data?.user || result.user;
        
        if (!token || !backendUser) {
           console.error("Signup Failure: Token or user data missing in response.", result);
           setError("Signup failed. Missing token/user data from server.");
           return;
        }

        const user: User = {
            id: backendUser.id, email: backendUser.email, firstName: backendUser.firstName || '', lastName: backendUser.lastName || '', name: backendUser.name || '', role: backendUser.role || 'user', dateOfBirth: birthdate, phone: phone
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', token, 7)
        }
        
        if (typeof window !== 'undefined') {
            await delay(100); 
        }

        set({ user, isLoggedIn: true, firstName: '', lastName: '', email: '', phone: '', signUpPassword: '', birthdate: '', error: null })
        resetForm(); 
      } else { setError(result.message || 'Sign up failed') }
    } catch (error) { setError('Sign up failed. Please try again.') } finally { setLoading(false) }
  },

  // 🚨 CORRECTED IMPLEMENTATION: Returns message on failure for component sync
  submitEmailCheck: async () => {
    const { email, validateEmail, setLoading, resetForm } = get() 
    if (!validateEmail(email)) { return { exists: false, role: null, message: 'Please enter a valid email address' } } 
    setLoading(true); 
    try {
      const response = await fetch(`${API_BASE}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      
      if (response.ok && result.success && result.data?.exists) { 
        // SUCCESS PATH: Return only the data payload
        return result.data 
      } 
      else { 
        // FAILURE PATH: Return error message
        resetForm();
        return { 
            exists: false, 
            role: null, 
            message: result.message || 'User not found. Please register.' 
        };
      }
    } catch (error) { 
      resetForm();
      return { exists: false, role: null, message: 'Server error checking email.' };
    } finally { 
      setLoading(false) 
    }
  },

  logout: () => {
    set({ user: null, isLoggedIn: false, error: null, password: '', email: '', phone: '', signUpPassword: '', otp: '', requiresOtp: false })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); deleteCookie('authToken')
    }
  },

  resetForm: () => set({ password: '', firstName: '', lastName: '', birthdate: '', email: '', phone: '', signUpPassword: '', error: null, otp: '', requiresOtp: false }),

  initializeAuth: () => {
    // 🚨 FINAL FIX: If skipInitialization is true (i.e., we are on the login page), do nothing.
    if (get().skipInitialization || typeof window === 'undefined') return
    try {
      const storedToken = localStorage.getItem('authToken'); const storedUser = localStorage.getItem('authUser')
      if (storedToken && storedUser) { set({ user: JSON.parse(storedUser), isLoggedIn: true, error: null }) }
    } catch (error) { localStorage.removeItem('authToken'); localStorage.removeItem('authUser') }
  },

  validateToken: async () => { return false; },
  refreshUserData: async () => { return false; }
}))

export default useAuthStore