/**
 * Firebase client-side service.
 * No-op if VITE_FIREBASE_* env vars are not set.
 * Full Firebase SDK can be activated by adding the env vars.
 */

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const isConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId)

let db = null

async function getDb() {
  if (!isConfigured || db) return db
  try {
    const { initializeApp } = await import('firebase/app')
    const { getFirestore } = await import('firebase/firestore')
    const app = initializeApp(FIREBASE_CONFIG)
    db = getFirestore(app)
    console.log('✅ Firebase Firestore initialised (client).')
  } catch (err) {
    console.warn('⚠️ Firebase client init failed:', err.message)
  }
  return db
}

export { isConfigured, getDb }
