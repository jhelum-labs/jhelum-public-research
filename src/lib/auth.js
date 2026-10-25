import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth'

// Firebase configuration from environment variables (.env)
export const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
  )
}

let app = null
let auth = null
let googleProvider = null

if (typeof window !== 'undefined') {
  if (isFirebaseConfigured()) {
    try {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig)
      auth = getAuth(app)
      googleProvider = new GoogleAuthProvider()
      googleProvider.setCustomParameters({ prompt: 'select_account' })
    } catch (err) {
      console.error('Failed to initialize Firebase Auth:', err)
    }
  }
}

// Local storage key for instant user state restoration across pages
const USER_CACHE_KEY = 'jl_auth_user'

export const getCachedUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setCachedUser = (user) => {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      const data = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        providerId: user.providerData?.[0]?.providerId || 'password',
      }
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data))
      window.dispatchEvent(new CustomEvent('jl-auth-changed', { detail: data }))
    } else {
      localStorage.removeItem(USER_CACHE_KEY)
      window.dispatchEvent(new CustomEvent('jl-auth-changed', { detail: null }))
    }
  } catch {}
}

/**
 * Sign in or Sign up with Google OAuth
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error('CONFIG_MISSING')
  }
  if (!auth) {
    throw new Error('Authentication is not initialized.')
  }
  try {
    const result = await signInWithPopup(auth, googleProvider)
    setCachedUser(result.user)
    return result.user
  } catch (error) {
    // If popup was blocked by browser, attempt redirect as fallback
    if (error.code === 'auth/popup-blocked') {
      return signInWithRedirect(auth, googleProvider)
    }
    throw error
  }
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email, password, displayName) {
  if (!isFirebaseConfigured()) {
    throw new Error('CONFIG_MISSING')
  }
  if (!auth) {
    throw new Error('Authentication is not initialized.')
  }
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName })
  }
  setCachedUser(result.user)
  return result.user
}

/**
 * Log in with Email and Password
 */
export async function logInWithEmail(email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error('CONFIG_MISSING')
  }
  if (!auth) {
    throw new Error('Authentication is not initialized.')
  }
  const result = await signInWithEmailAndPassword(auth, email, password)
  setCachedUser(result.user)
  return result.user
}

/**
 * Log out
 */
export async function logOut() {
  if (auth && isFirebaseConfigured()) {
    await signOut(auth)
  }
  setCachedUser(null)
}

/**
 * Send password reset email
 */
export async function sendResetPassword(email) {
  if (!isFirebaseConfigured()) {
    throw new Error('CONFIG_MISSING')
  }
  if (!auth) {
    throw new Error('Authentication is not initialized.')
  }
  return sendPasswordResetEmail(auth, email)
}

/**
 * Subscribe to user state changes
 */
export function onUserChange(callback) {
  if (typeof window === 'undefined') return () => {}

  // 1. Immediately fire with cached user if present
  const cached = getCachedUser()
  callback(cached)

  // 2. Listen to custom event for same-tab / multi-tab changes
  const handleCustom = (e) => callback(e.detail)
  window.addEventListener('jl-auth-changed', handleCustom)

  const handleStorage = (e) => {
    if (e.key === USER_CACHE_KEY) {
      try {
        callback(e.newValue ? JSON.parse(e.newValue) : null)
      } catch {
        callback(null)
      }
    }
  }
  window.addEventListener('storage', handleStorage)

  // 3. Listen to live Firebase auth state if available
  let unsubscribeFirebase = () => {}
  if (auth) {
    unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCachedUser(user)
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || null,
          providerId: user.providerData?.[0]?.providerId || 'password',
        })
      } else {
        setCachedUser(null)
        callback(null)
      }
    })
  }

  return () => {
    window.removeEventListener('jl-auth-changed', handleCustom)
    window.removeEventListener('storage', handleStorage)
    unsubscribeFirebase()
  }
}

export { auth }
