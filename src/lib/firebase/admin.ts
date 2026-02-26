import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

function getApp(): App {
  if (getApps().length === 0) {
    // On Cloud Run / Cloud Functions, ADC (Application Default Credentials) is used automatically.
    // For local dev, set GOOGLE_APPLICATION_CREDENTIALS or use a service account key.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'orderwala-8ac2b'}.firebasestorage.app`,
      });
    } else {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'orderwala-8ac2b',
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'orderwala-8ac2b'}.firebasestorage.app`,
      });
    }
  }
  return getApps()[0];
}

export function getDb(): Firestore {
  const db = getFirestore(getApp());
  return db;
}

export function getStorageBucket() {
  return getStorage(getApp()).bucket();
}

// Helper: generate a UUID (Firestore auto-IDs are 20 chars; this creates UUID-like IDs for compatibility)
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper: Firestore timestamp
export function serverTimestamp() {
  const { FieldValue } = require('firebase-admin/firestore');
  return FieldValue.serverTimestamp();
}

// Helper: Convert Firestore doc to a plain object with id
export function docToObj<T>(doc: FirebaseFirestore.DocumentSnapshot): (T & { id: string }) | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  // Convert Firestore Timestamps to ISO strings
  const converted: Record<string, unknown> = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
      converted[key] = (value as any).toDate().toISOString();
    } else {
      converted[key] = value;
    }
  }
  return converted as T & { id: string };
}

// Helper: Convert array of Firestore docs
export function docsToArray<T>(snapshot: FirebaseFirestore.QuerySnapshot): (T & { id: string })[] {
  return snapshot.docs.map(doc => docToObj<T>(doc)!);
}

// Collection names (matching existing DB schema)
export const Collections = {
  USERS: 'users',
  CATEGORIES: 'categories',
  VENDORS: 'vendors',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ADDRESSES: 'addresses',
  FAVORITES: 'favorites',
  REVIEWS: 'reviews',
  PROMO_CODES: 'promo_codes',
  NOTIFICATIONS: 'notifications',
  OTP_VERIFICATIONS: 'otp_verifications',
  WALLET_TRANSACTIONS: 'wallet_transactions',
} as const;
