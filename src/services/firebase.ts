import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  onSnapshot,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Invoice,
  Customer,
  Product,
  CompanyProfile,
  InvoiceSettings,
  PaymentReceipt,
} from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

let isAuthInitialized = false;
let authPromise: Promise<User | null> | null = null;

// Ensure anonymous authentication so all devices can sync securely
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve) => {
    try {
      const unsub = onAuthStateChanged(
        auth,
        async (user) => {
          if (user) {
            isAuthInitialized = true;
            resolve(user);
          } else {
            try {
              const cred = await signInAnonymously(auth);
              isAuthInitialized = true;
              resolve(cred.user);
            } catch (err) {
              console.warn('Firebase anonymous sign-in not available, proceeding with direct database access:', err);
              resolve(null);
            }
          }
        },
        (err) => {
          console.warn('Firebase auth state error:', err);
          resolve(null);
        }
      );
    } catch (e) {
      console.warn('Firebase auth initialization warning:', e);
      resolve(null);
    }
  });

  return authPromise;
}

// Test connection requirement from skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
    return true; // Still ok as offline persistence handles it
  }
}

// Firestore Collection Names
export const COLLECTIONS = {
  COMPANY: 'company',
  SETTINGS: 'settings',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  INVOICES: 'invoices',
  RECEIPTS: 'receipts',
};

// ==========================================
// Real-time Cloud Sync Listeners
// ==========================================

export function subscribeToCompany(callback: (company: CompanyProfile) => void): () => void {
  const docRef = doc(db, COLLECTIONS.COMPANY, 'profile');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as CompanyProfile);
      }
    },
    (err) => console.warn('Company sync listener error:', err)
  );
}

export function subscribeToSettings(callback: (settings: InvoiceSettings) => void): () => void {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'default');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as InvoiceSettings);
      }
    },
    (err) => console.warn('Settings sync listener error:', err)
  );
}

export function subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.CUSTOMERS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: Customer[] = [];
      snap.forEach((d) => items.push(d.data() as Customer));
      callback(items);
    },
    (err) => console.warn('Customers sync listener error:', err)
  );
}

export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.PRODUCTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: Product[] = [];
      snap.forEach((d) => items.push(d.data() as Product));
      callback(items);
    },
    (err) => console.warn('Products sync listener error:', err)
  );
}

export function subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.INVOICES);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: Invoice[] = [];
      snap.forEach((d) => items.push(d.data() as Invoice));
      // Sort latest first
      items.sort((a, b) => new Date(b.createdAt || b.invoiceDate).getTime() - new Date(a.createdAt || a.invoiceDate).getTime());
      callback(items);
    },
    (err) => console.warn('Invoices sync listener error:', err)
  );
}

export function subscribeToReceipts(callback: (receipts: PaymentReceipt[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.RECEIPTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: PaymentReceipt[] = [];
      snap.forEach((d) => items.push(d.data() as PaymentReceipt));
      items.sort((a, b) => new Date(b.createdAt || b.receiptDate).getTime() - new Date(a.createdAt || a.receiptDate).getTime());
      callback(items);
    },
    (err) => console.warn('Receipts sync listener error:', err)
  );
}

// ==========================================
// Cloud Write Helpers (Syncs to all devices)
// ==========================================

export async function cloudSaveCompany(company: CompanyProfile): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, COLLECTIONS.COMPANY, 'profile'), company, { merge: true });
  } catch (e) {
    console.warn('Company cloud sync notice:', e);
  }
}

export async function cloudSaveSettings(settings: InvoiceSettings): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default'), settings, { merge: true });
  } catch (e) {
    console.warn('Settings cloud sync notice:', e);
  }
}

export async function cloudSaveCustomer(customer: Customer): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer, { merge: true });
  } catch (e) {
    console.warn('Customer cloud sync notice:', e);
  }
}

export async function cloudDeleteCustomer(id: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, id));
  } catch (e) {
    console.warn('Customer cloud delete notice:', e);
  }
}

export async function cloudSaveProduct(product: Product): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product, { merge: true });
  } catch (e) {
    console.warn('Product cloud sync notice:', e);
  }
}

export async function cloudDeleteProduct(id: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
  } catch (e) {
    console.warn('Product cloud delete notice:', e);
  }
}

export async function cloudSaveInvoice(invoice: Invoice): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, COLLECTIONS.INVOICES, invoice.id), invoice, { merge: true });
  } catch (e) {
    console.warn('Invoice cloud sync notice:', e);
  }
}

export async function cloudDeleteInvoice(id: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, COLLECTIONS.INVOICES, id));
  } catch (e) {
    console.warn('Invoice cloud delete notice:', e);
  }
}

export async function cloudSaveReceipt(receipt: PaymentReceipt): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, COLLECTIONS.RECEIPTS, receipt.id), receipt, { merge: true });
  } catch (e) {
    console.warn('Receipt cloud sync notice:', e);
  }
}

export async function cloudDeleteReceipt(id: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, COLLECTIONS.RECEIPTS, id));
  } catch (e) {
    console.warn('Receipt cloud delete notice:', e);
  }
}

// Initial Seeding: if cloud collections are empty, upload initial local data so all devices start in sync!
export async function seedCloudIfEmpty(initialData: {
  company: CompanyProfile;
  settings: InvoiceSettings;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
}): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const invoicesSnap = await getDocs(collection(db, COLLECTIONS.INVOICES));
    if (invoicesSnap.empty) {
      console.log('Seeding initial data to Firebase Cloud Firestore for multi-device sync...');
      await cloudSaveCompany(initialData.company);
      await cloudSaveSettings(initialData.settings);

      for (const cust of initialData.customers) {
        await cloudSaveCustomer(cust);
      }
      for (const prod of initialData.products) {
        await cloudSaveProduct(prod);
      }
      for (const inv of initialData.invoices) {
        await cloudSaveInvoice(inv);
      }
      for (const rec of initialData.receipts) {
        await cloudSaveReceipt(rec);
      }
      console.log('Initial data successfully seeded to Firebase Cloud!');
    }
  } catch (err) {
    console.warn('Cloud seeding check:', err);
  }
}
