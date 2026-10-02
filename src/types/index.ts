export type PaymentStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Cancelled';
export type PaymentMode = 'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'NEFT/RTGS' | 'Credit';
export type InvoiceCopyType = 'Original for Recipient' | 'Duplicate for Transporter' | 'Triplicate for Supplier';

export interface CompanyProfile {
  name: string;
  tagline?: string;
  logoUrl?: string; // Custom admin-uploaded logo (data URI or image URL)
  address: string;
  state: string;
  stateCode: string;
  gstin: string;
  pan: string;
  mobile: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  terms: string[];
}

export interface Customer {
  id: string;
  name: string;
  billingAddress: string;
  shippingAddress: string;
  state: string;
  stateCode: string;
  gstin: string;
  mobile: string;
  email?: string;
  pan?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  hsn: string;
  defaultUnit: string;
  defaultRate: number;
  gstRate: number; // e.g. 18 for 18%
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  taxableAmount: number;
  isTaxable?: boolean; // Customer GST preference: true = YES (Taxable), false = NO (Non-GST)
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string; // YYYY-MM-DD
  challanNo?: string;
  challanDate?: string;
  poNo?: string;
  poDate?: string;
  
  customerId?: string;
  customerName: string;
  billingAddress: string;
  customerState: string;
  customerStateCode: string;
  customerGstin: string;
  customerMobile: string;
  customerEmail?: string;
  customerPan?: string;

  shipToName?: string;
  shippingAddress?: string;
  shipToState?: string;
  shipToStateCode?: string;
  shipToGstin?: string;
  shipToMobile?: string;

  items: InvoiceItem[];

  totalQuantity: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  isGstApplicable?: boolean; // Yes or No for GST
  reverseCharge: boolean;
  vehicleNo?: string;
  transportMode?: string;
  notes?: string;
  terms: string[];
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  copyType: InvoiceCopyType;

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSettings {
  prefix: string; // e.g. "2026-27-"
  nextNumber: number; // e.g. 357
  paddingDigits: number; // e.g. 3 => 001 or 357
  financialYear: string; // e.g. "2026-2027"
}

export type ActiveTab = 
  | 'dashboard'
  | 'invoices'
  | 'new-invoice'
  | 'edit-invoice'
  | 'view-invoice'
  | 'receipts'
  | 'customers'
  | 'products'
  | 'reports'
  | 'settings'
  | 'sync';

export interface PaymentReceipt {
  id: string;
  receiptNo: string; // e.g. "REC-2026-27-001"
  receiptDate: string; // YYYY-MM-DD
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  customerGstin?: string;
  customerMobile?: string;
  invoiceId?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceTotal?: number;
  amount: number; // Received amount
  previousPaid?: number; // Total received before this
  balanceRemaining?: number; // Remaining balance on invoice
  paymentMode: PaymentMode;
  referenceNo?: string; // Cheque No / UTR / UPI Ref ID
  chequeDate?: string;
  bankName?: string;
  paymentType: 'Full Payment' | 'Part Payment' | 'Advance Payment' | 'On Account';
  notes?: string;
  amountInWords: string;
  createdAt: string;
  createdBy?: string;
}

export type UserRole = 'admin' | 'operator';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string; // Stored password string
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
}

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  exportedBy: string;
  company: CompanyProfile;
  settings: InvoiceSettings;
  invoices: Invoice[];
  receipts?: PaymentReceipt[];
  customers: Customer[];
  products: Product[];
  users: AppUser[];
}
