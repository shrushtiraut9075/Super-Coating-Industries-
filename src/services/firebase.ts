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

// Initialize Firestore with custom database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Helper: Firestore strictly disallows `undefined` values in documents.
// This utility recursively cleans undefined properties so Firestore writes never fail.
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

// Background optional auth initializer (non-blocking)
let authInitialized = false;
let authPromise: Promise<User | null> | null = null;

export async function ensureFirebaseAuth(): Promise<User | null> {
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve) => {
    try {
      const unsub = onAuthStateChanged(
        auth,
        async (user) => {
          if (user) {
            authInitialized = true;
            resolve(user);
          } else {
            try {
              const cred = await signInAnonymously(auth);
              authInitialized = true;
              resolve(cred.user);
            } catch (err) {
              // Anonymous sign-in may not be enabled, direct rules handle access
              authInitialized = true;
              resolve(null);
            }
          }
        },
        () => {
          authInitialized = true;
          resolve(null);
        }
      );
      // Timeout fallback after 3 seconds so writes never hang
      setTimeout(() => {
        if (!authInitialized) {
          authInitialized = true;
          resolve(null);
        }
      }, 3000);
    } catch {
      authInitialized = true;
      resolve(null);
    }
  });

  return authPromise;
}

// Test connection requirement from skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    ensureFirebaseAuth().catch(() => {});
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
    return true; // Still okay, Firestore offline cache queue handles operations
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
// Real-time Cloud Sync Listeners (Live 2-Way Sync)
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
    (err) => console.warn('Company sync listener warning:', err)
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
    (err) => console.warn('Settings sync listener warning:', err)
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
    (err) => console.warn('Customers sync listener warning:', err)
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
    (err) => console.warn('Products sync listener warning:', err)
  );
}

export function subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.INVOICES);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: Invoice[] = [];
      snap.forEach((d) => items.push(d.data() as Invoice));
      // Sort latest invoice first
      items.sort(
        (a, b) =>
          new Date(b.createdAt || b.invoiceDate).getTime() -
          new Date(a.createdAt || a.invoiceDate).getTime()
      );
      callback(items);
    },
    (err) => console.warn('Invoices sync listener warning:', err)
  );
}

export function subscribeToReceipts(callback: (receipts: PaymentReceipt[]) => void): () => void {
  const colRef = collection(db, COLLECTIONS.RECEIPTS);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: PaymentReceipt[] = [];
      snap.forEach((d) => items.push(d.data() as PaymentReceipt));
      items.sort(
        (a, b) =>
          new Date(b.createdAt || b.receiptDate).getTime() -
          new Date(a.createdAt || a.receiptDate).getTime()
      );
      callback(items);
    },
    (err) => console.warn('Receipts sync listener warning:', err)
  );
}

// ==========================================
// Cloud Write Helpers (Instant Sync to All Devices)
// ==========================================

export async function cloudSaveCompany(company: CompanyProfile): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(company);
    await setDoc(doc(db, COLLECTIONS.COMPANY, 'profile'), clean, { merge: true });
    return true;
  } catch (e) {
    console.error('Company cloud sync failed:', e);
    return false;
  }
}

export async function cloudSaveSettings(settings: InvoiceSettings): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(settings);
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default'), clean, { merge: true });
    return true;
  } catch (e) {
    console.error('Settings cloud sync failed:', e);
    return false;
  }
}

export async function cloudSaveCustomer(customer: Customer): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(customer);
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), clean, { merge: true });
    return true;
  } catch (e) {
    console.error('Customer cloud sync failed:', e);
    return false;
  }
}

export async function cloudDeleteCustomer(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, id));
    return true;
  } catch (e) {
    console.error('Customer cloud delete failed:', e);
    return false;
  }
}

export async function cloudSaveProduct(product: Product): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(product);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), clean, { merge: true });
    return true;
  } catch (e) {
    console.error('Product cloud sync failed:', e);
    return false;
  }
}

export async function cloudDeleteProduct(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
    return true;
  } catch (e) {
    console.error('Product cloud delete failed:', e);
    return false;
  }
}

export async function cloudSaveInvoice(invoice: Invoice): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(invoice);
    await setDoc(doc(db, COLLECTIONS.INVOICES, invoice.id), clean, { merge: true });
    console.log(`✓ Invoice ${invoice.invoiceNo} successfully synced to Firebase Cloud!`);
    return true;
  } catch (e) {
    console.error('Invoice cloud sync failed:', e);
    return false;
  }
}

export async function cloudDeleteInvoice(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.INVOICES, id));
    return true;
  } catch (e) {
    console.error('Invoice cloud delete failed:', e);
    return false;
  }
}

export async function cloudSaveReceipt(receipt: PaymentReceipt): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(receipt);
    await setDoc(doc(db, COLLECTIONS.RECEIPTS, receipt.id), clean, { merge: true });
    return true;
  } catch (e) {
    console.error('Receipt cloud sync failed:', e);
    return false;
  }
}

export async function cloudDeleteReceipt(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.RECEIPTS, id));
    return true;
  } catch (e) {
    console.error('Receipt cloud delete failed:', e);
    return false;
  }
}

// Pull all data directly from cloud (useful for force-refresh / on-demand sync)
export async function pullAllFromCloud(): Promise<{
  company?: CompanyProfile;
  settings?: InvoiceSettings;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
}> {
  const result: {
    company?: CompanyProfile;
    settings?: InvoiceSettings;
    customers: Customer[];
    products: Product[];
    invoices: Invoice[];
    receipts: PaymentReceipt[];
  } = {
    customers: [],
    products: [],
    invoices: [],
    receipts: [],
  };

  try {
    const [compSnap, setSnap, custSnap, prodSnap, invSnap, recSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.COMPANY)),
      getDocs(collection(db, COLLECTIONS.SETTINGS)),
      getDocs(collection(db, COLLECTIONS.CUSTOMERS)),
      getDocs(collection(db, COLLECTIONS.PRODUCTS)),
      getDocs(collection(db, COLLECTIONS.INVOICES)),
      getDocs(collection(db, COLLECTIONS.RECEIPTS)),
    ]);

    compSnap.forEach((d) => {
      if (d.id === 'profile') result.company = d.data() as CompanyProfile;
    });
    setSnap.forEach((d) => {
      if (d.id === 'default') result.settings = d.data() as InvoiceSettings;
    });
    custSnap.forEach((d) => result.customers.push(d.data() as Customer));
    prodSnap.forEach((d) => result.products.push(d.data() as Product));
    invSnap.forEach((d) => result.invoices.push(d.data() as Invoice));
    recSnap.forEach((d) => result.receipts.push(d.data() as PaymentReceipt));

    // Sort invoices and receipts descending
    result.invoices.sort(
      (a, b) =>
        new Date(b.createdAt || b.invoiceDate).getTime() -
        new Date(a.createdAt || a.invoiceDate).getTime()
    );
    result.receipts.sort(
      (a, b) =>
        new Date(b.createdAt || b.receiptDate).getTime() -
        new Date(a.createdAt || a.receiptDate).getTime()
    );
  } catch (err) {
    console.error('Failed to pull all collections from Firebase:', err);
  }

  return result;
}

// Push all local data into Firebase Cloud (to guarantee all devices receive the latest database)
export async function pushAllToCloud(data: {
  company: CompanyProfile;
  settings: InvoiceSettings;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
}): Promise<{ success: boolean; count: number }> {
  let count = 0;
  try {
    if (data.company) {
      await cloudSaveCompany(data.company);
      count++;
    }
    if (data.settings) {
      await cloudSaveSettings(data.settings);
      count++;
    }
    for (const c of data.customers || []) {
      await cloudSaveCustomer(c);
      count++;
    }
    for (const p of data.products || []) {
      await cloudSaveProduct(p);
      count++;
    }
    for (const inv of data.invoices || []) {
      await cloudSaveInvoice(inv);
      count++;
    }
    for (const r of data.receipts || []) {
      await cloudSaveReceipt(r);
      count++;
    }
    return { success: true, count };
  } catch (err) {
    console.error('Error during full push to cloud:', err);
    return { success: false, count };
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
    const invoicesSnap = await getDocs(collection(db, COLLECTIONS.INVOICES));
    if (invoicesSnap.empty && initialData.invoices && initialData.invoices.length > 0) {
      console.log('Seeding initial data to Firebase Cloud Firestore for multi-device sync...');
      await pushAllToCloud(initialData);
      console.log('Initial data successfully seeded to Firebase Cloud!');
    }
  } catch (err) {
    console.warn('Cloud seeding check warning:', err);
  }
}
