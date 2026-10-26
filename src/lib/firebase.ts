import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Storage with strict retry limits to prevent infinite hanging
export const storage = getStorage(app);
storage.maxUploadRetryTime = 8000;
storage.maxOperationRetryTime = 8000;

export async function checkFirebaseStorageBucket(): Promise<{ exists: boolean; status: number; message: string }> {
  try {
    const bucket = firebaseConfig.storageBucket;
    if (!bucket) {
      return { exists: false, status: 0, message: 'No storageBucket declared in firebase configuration' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.status === 404) {
      return {
        exists: false,
        status: 404,
        message: `Firebase Storage bucket "${bucket}" does not exist yet (HTTP 404). In Firebase Console, go to Build > Storage and click "Get started".`
      };
    }
    return {
      exists: true,
      status: res.status,
      message: `Firebase Storage bucket reachable (HTTP ${res.status}).`
    };
  } catch (err: any) {
    return {
      exists: false,
      status: 0,
      message: `Could not reach Firebase Storage endpoint: ${err?.message || String(err)}`
    };
  }
}

export async function uploadImageToFirebase(
  fileOrBlob: File | Blob,
  filename: string
): Promise<{ url: string; error?: string; diagnostic?: string }> {
  // Ensure Firebase Auth state if possible
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (authErr: any) {
      console.warn('[Firebase Auth] Anonymous sign-in attempt:', authErr?.message);
    }
  }

  const cleanName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `products/${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);
  const timeoutMs = 8000;

  try {
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, fileOrBlob, {
        contentType: fileOrBlob.type || 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable'
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Firebase Storage upload timed out after ${timeoutMs / 1000} seconds. The bucket may not be active or reachable.`));
      }, timeoutMs);
    });

    const url = await Promise.race([uploadPromise, timeoutPromise]);
    return {
      url,
      diagnostic: `Uploaded directly to Firebase Storage: ${storagePath}`
    };
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    const code = (err as any)?.code || '';

    let userFriendlyMsg = rawMsg;
    if (code === 'storage/bucket-not-found' || rawMsg.includes('404') || rawMsg.includes('Not Found')) {
      userFriendlyMsg = `Firebase Storage bucket "${firebaseConfig.storageBucket || 'sturdy-buttress-4pthm.firebasestorage.app'}" does not exist or has not been initialized (HTTP 404). In the Firebase Console, go to Build > Storage and click "Get started".`;
    } else if (code === 'storage/unauthorized') {
      userFriendlyMsg = `Firebase Storage upload rejected (403 Unauthorized). Storage rules require authentication. Sign in with Google in the Admin header or configure Storage security rules for /products.`;
    } else if (code === 'storage/retry-limit-exceeded' || rawMsg.includes('timed out')) {
      userFriendlyMsg = `Firebase Storage upload timed out. The storage bucket did not respond. Verify in the Firebase Console that Storage is enabled.`;
    } else if (code === 'storage/quota-exceeded') {
      userFriendlyMsg = `Firebase Storage quota exceeded. Please check usage in the Firebase Console.`;
    }

    console.error(`[FirebaseStorage] Upload failed (${code}): ${rawMsg}`);
    return {
      url: '',
      error: userFriendlyMsg,
      diagnostic: `Firebase Storage error [${code}]: ${rawMsg}`
    };
  }
}

// Error Handling conforming to Firebase Skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Please check network and Firebase configuration.');
      return false;
    }
    // A permission denied or document not found error still confirms the connection to the server succeeded
    return true;
  }
}

// Initial connection test
testConnection();
