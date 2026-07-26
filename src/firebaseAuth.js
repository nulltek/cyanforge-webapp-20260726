import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

let redirectHandledPromise = null

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase auth is not configured yet. Add your VITE_FIREBASE_* values to .env.local.')
  }

  return auth
}

export function listenToAuthState(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }

  if (!redirectHandledPromise) {
    redirectHandledPromise = getRedirectResult(auth).catch((error) => {
      console.error('Firebase redirect sign-in failed', error)
      return null
    })
  }

  let unsubscribe = () => {}
  let cancelled = false

  redirectHandledPromise.finally(() => {
    if (!cancelled) {
      unsubscribe = onAuthStateChanged(auth, callback)
    }
  })

  return () => {
    cancelled = true
    unsubscribe()
  }
}

export async function registerWithEmail({ name, email, password }) {
  const result = await createUserWithEmailAndPassword(requireAuth(), email, password)

  if (name.trim()) {
    await updateProfile(result.user, { displayName: name.trim() })
  }

  return result.user
}

export async function loginWithEmail({ email, password }) {
  const result = await signInWithEmailAndPassword(requireAuth(), email, password)
  return result.user
}

export async function loginWithGoogle() {
  await signInWithRedirect(requireAuth(), googleProvider)
  return null
}

export async function loginWithGoogleCredential(idToken) {
  const credential = GoogleAuthProvider.credential(idToken)
  const result = await signInWithCredential(requireAuth(), credential)
  return result.user
}

export async function logout() {
  await signOut(requireAuth())
}
