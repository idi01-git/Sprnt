import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let _auth: ReturnType<typeof getAuth> | null = null

function getFirebaseAuth() {
  if (_auth) return _auth

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}'

  let serviceAccount: Record<string, string>
  try {
    serviceAccount = JSON.parse(raw)
  } catch {
    throw new Error(
      '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON env var is not valid JSON. ' +
      'Download service account key from Firebase Console → Project Settings → Service accounts → Generate new private key.'
    )
  }

  if (!serviceAccount.project_id || !serviceAccount.private_key) {
    throw new Error(
      '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields (project_id, private_key). ' +
      'Ensure you pasted the full JSON from Firebase Console.'
    )
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount as any),
    })
  }

  _auth = getAuth()
  return _auth
}

export function getFirebaseAdminAuth() {
  return getFirebaseAuth()
}
