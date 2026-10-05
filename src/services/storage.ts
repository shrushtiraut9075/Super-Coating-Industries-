import {
  CompanyProfile,
  Customer,
  Product,
  Invoice,
  InvoiceSettings,
  AppUser,
  PaymentReceipt,
} from '../types';
import {
  cloudSaveCompany,
  cloudSaveSettings,
  cloudSaveCustomer,
  cloudDeleteCustomer,
  cloudSaveProduct,
  cloudDeleteProduct,
  cloudSaveInvoice,
  cloudDeleteInvoice,
  cloudSaveReceipt,
  cloudDeleteReceipt,
} from './firebase';

const STORAGE_KEYS = {
  COMPANY: 'sci_gst_company_v1',
  CUSTOMERS: 'sci_gst_customers_v1',
  PRODUCTS: 'sci_gst_products_v1',
  INVOICES: 'sci_gst_invoices_v1',
  RECEIPTS: 'sci_gst_receipts_v1',
  SETTINGS: 'sci_gst_settings_v1',
  USERS: 'sci_gst_users_v1',
  SESSION: 'sci_gst_session_v1',
};

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    displayName: 'Admin (Super Coating)',
    role: 'admin',
    passwordHash: 'admin123',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'user-operator-2',
    username: 'operator',
    displayName: 'Billing Operator',
    role: 'operator',
    passwordHash: 'operator123',
    createdAt: '2026-09-01T00:00:00Z',
  },
];

export const DEFAULT_COMPANY: CompanyProfile = {
  name: 'SUPER COATING INDUSTRIES',
  tagline: 'Specialist in Industrial Powder Coating & Surface Finishing',
  address: 'Gat No. 243, Jadhav Wasti, Chimbali, Tal-Khed, Dist-Pune, Maharashtra - 412105',
  state: 'Maharashtra',
  stateCode: '27',
  gstin: '27DBAPS9015K1ZA',
  pan: 'DBAPS9015K',
  mobile: '9028214995 / 9370416087',
  email: 'supercoatingindustries@gmail.com',
  bankName: 'Union Bank of India',
  accountNumber: '651601010051212',
  ifsc: 'UBIN0565164',
  branch: 'Kuruli',
  terms: [
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    'Goods once sold will not be taken back unless agreed otherwise.',
    'Payment should be made as per agreed terms.',
    'Subject to Pune Jurisdiction only.',
  ],
};

export const DEFAULT_SETTINGS: InvoiceSettings = {
  prefix: '2026-27-',
  nextNumber: 357,
  paddingDigits: 3,
  financialYear: '2026-2027',
};

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-mecon-1',
    name: 'MECON SYSTEMS',
    billingAddress: 'GAT NO 62/3/A AT-POST CHIMBLI TAL-KHED DIST PUNE',
    shippingAddress: 'GAT NO 62/3/A AT-POST CHIMBLI TAL-KHED DIST PUNE',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AGJPA8641A1ZR',
    mobile: '9822000000',
    email: 'accounts@meconsystems.com',
    pan: 'AGJPA8641A',
    paymentTerms: '30 Days',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cust-techno-2',
    name: 'TECHNO FABRICATORS PVT LTD',
    billingAddress: 'Plot No. C-14, MIDC Chakan, Phase II, Pune - 410501',
    shippingAddress: 'Plot No. C-14, MIDC Chakan, Phase II, Pune - 410501',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AABCT8921K1ZZ',
    mobile: '9823112233',
    email: 'purchase@technofab.in',
    pan: 'AABCT8921K',
    paymentTerms: '15 Days',
    createdAt: '2026-09-10T11:00:00Z',
  },
  {
    id: 'cust-apex-3',
    name: 'APEX AUTO COMPONENTS',
    billingAddress: 'Survey No. 88, Sanaswadi, Tal-Shirur, Dist-Pune - 412208',
    shippingAddress: 'Survey No. 88, Sanaswadi, Tal-Shirur, Dist-Pune - 412208',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27BAPCA4112L1ZV',
    mobile: '9422556677',
    email: 'apex.billing@gmail.com',
    pan: 'BAPCA4112L',
    paymentTerms: 'Immediate',
    createdAt: '2026-09-15T09:30:00Z',
  },
  {
    id: 'cust-sunmag-1',
    name: 'SUNMAG ENGINEERING SOLUTION PVT LTD',
    billingAddress: 'GAT NO 61 AT POST CHIMBLI TA KHED DIST PUNE',
    shippingAddress: 'GAT NO 61 AT POST CHIMBLI TA KHED DIST PUNE',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AANCS4535J1ZW',
    mobile: '',
    email: '',
    pan: 'AANCS4535J',
    paymentTerms: '30 Days',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cust-harun-2',
    name: 'HARUN ASSOCIATES',
    billingAddress: 'S NO 18BACK TO SAMRAT DHABA DHAWDE WASTI BHORIGAONTHAN PUNE 411039',
    shippingAddress: 'S NO 18BACK TO SAMRAT DHABA DHAWDE WASTI BHORIGAONTHAN PUNE 411039',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27DLZPP3810C1ZT',
    mobile: '',
    email: '',
    pan: 'DLZPP3810C',
    paymentTerms: '30 Days',
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'cust-rapkesh-3',
    name: 'RAPKESH TECNOLOGIES',
    billingAddress: 'PLOT NO. -3 CHIMBLI TA KHED DIST PUNE 412105',
    shippingAddress: 'PLOT NO. -3 CHIMBLI TA KHED DIST PUNE 412105',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AANCR1189BZA',
    mobile: '',
    email: '',
    pan: 'AANCR1189B',
    paymentTerms: '30 Days',
    createdAt: '2026-09-03T10:00:00Z',
  },
  {
    id: 'cust-implenia-5',
    name: 'IMPLENIA INDIA PVT.LTD.',
    billingAddress: 'GATNO.G-22PHASE 3 MIDCKURULI CHAKAN TA. KHED DIST PUNE',
    shippingAddress: 'GATNO.G-22PHASE 3 MIDCKURULI CHAKAN TA. KHED DIST PUNE',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AAECI9963K1ZV',
    mobile: '',
    email: '',
    pan: 'AAECI9963K',
    paymentTerms: '30 Days',
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'cust-hda-6',
    name: 'HDA HIGH DESIGN AUTO',
    billingAddress: 'GAT NO.62 PLOT NO.2 CHIMBLI TA KHED DIST PUNE',
    shippingAddress: 'GAT NO.62 PLOT NO.2 CHIMBLI TA KHED DIST PUNE',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AIDPK9390C1Z6',
    mobile: '9552202618',
    email: '',
    pan: 'AIDPK9390C',
    paymentTerms: '30 Days',
    createdAt: '2026-09-06T10:00:00Z',
  },
  {
    id: 'cust-eminence-7',
    name: 'EMINENCE ENGI-FAB',
    billingAddress: 'K-703 RIVER RESIDENCY NEAR SNBP SCHOOL CHIKALI PUNE',
    shippingAddress: 'K-703 RIVER RESIDENCY NEAR SNBP SCHOOL CHIKALI PUNE',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AAJFE5757F1Z7',
    mobile: '',
    email: '',
    pan: 'AAJFE5757F',
    paymentTerms: '30 Days',
    createdAt: '2026-09-07T10:00:00Z',
  },
  {
    id: 'cust-balaji-8',
    name: 'BALAJI STEEL & ENGINEERING WORK',
    billingAddress: 'TALEGAON CHOUK CHAKAN TA. KHED DIST PUNE 410501',
    shippingAddress: 'TALEGAON CHOUK CHAKAN TA. KHED DIST PUNE 410501',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27CXKPS8809L1ZV',
    mobile: '',
    email: '',
    pan: 'CXKPS8809L',
    paymentTerms: '30 Days',
    createdAt: '2026-09-08T10:00:00Z',
  },
  {
    id: 'cust-automech-9',
    name: 'Auto Mech (India) Private Limited',
    billingAddress: 'Gat No.309,Nanekarwadi,Chakan-410501',
    shippingAddress: 'Gat No.309,Nanekarwadi,Chakan-410501',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AADCA0148D1Z8',
    mobile: '02135-663600',
    email: '',
    pan: 'AADCA0148D',
    paymentTerms: '30 Days',
    createdAt: '2026-09-09T10:00:00Z',
  },
  {
    id: 'cust-anaveey-10',
    name: 'ANAVEEY ENGINEERING PVT.LTD',
    billingAddress: 'GAT NO-8/1/2 & 8/2/2 SHOP NO 01 CHIMBLI TA KHED DIST PUNE 412105',
    shippingAddress: 'GAT NO-8/1/2 & 8/2/2 SHOP NO 01 CHIMBLI TA KHED DIST PUNE 412105',
    state: 'MAHARASHTRA',
    stateCode: '27',
    gstin: '27AAQCA7318E1ZJ',
    mobile: '',
    email: '',
    pan: 'AAQCA7318E',
    paymentTerms: '30 Days',
    createdAt: '2026-09-10T10:00:00Z',
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-ms-frame-1',
    name: 'BASE FRAME / MS FRAME FOR POWDER COATING RAL 7035',
    description: 'Base Frame / Mild Steel Frame with Powder Coating RAL 7035 Light Grey finish',
    hsn: '998898',
    defaultUnit: 'KGS',
    defaultRate: 24.0,
    gstRate: 18,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-enclosure-2',
    name: 'ELECTRICAL ENCLOSURE POWDER COATING MATT BLACK',
    description: 'Electrical control panel box powder coating Matt Black shade',
    hsn: '998898',
    defaultUnit: 'NOS',
    defaultRate: 350.0,
    gstRate: 18,
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'prod-bracket-3',
    name: 'HEAVY FABRICATED BRACKET COATING RAL 9005',
    description: 'Automotive support bracket with dual layer epoxy polyester coating',
    hsn: '998898',
    defaultUnit: 'KGS',
    defaultRate: 28.5,
    gstRate: 18,
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'prod-sheet-4',
    name: 'PERFORATED SHEET POWDER COATING PURE WHITE',
    description: 'Architectural perforated metal panel coating RAL 9010',
    hsn: '998898',
    defaultUnit: 'SQFT',
    defaultRate: 45.0,
    gstRate: 18,
    createdAt: '2026-09-12T10:00:00Z',
  },
];

export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-2026-27-356',
    invoiceNo: '2026-27-356',
    invoiceDate: '2026-09-30',
    challanNo: 'CH-894',
    challanDate: '2026-09-30',
    poNo: 'PO/2026/891',
    poDate: '2026-09-28',
    customerId: 'cust-mecon-1',
    customerName: 'MECON SYSTEMS',
    billingAddress: 'GAT NO 62/3/A AT-POST CHIMBLI TAL-KHED DIST PUNE',
    customerState: 'MAHARASHTRA',
    customerStateCode: '27',
    customerGstin: '27AJGJPA8641A1ZR',
    customerMobile: '9822000000',
    customerEmail: 'accounts@meconsystems.com',
    customerPan: 'AJGPA8641A',
    shipToName: 'MECON SYSTEMS',
    shippingAddress: 'GAT NO 62/3/A AT-POST CHIMBLI TAL-KHED DIST PUNE',
    shipToState: 'MAHARASHTRA',
    shipToStateCode: '27',
    shipToGstin: '27AJGJPA8641A1ZR',
    shipToMobile: '9822000000',
    items: [
      {
        id: 'item-1',
        productId: 'prod-ms-frame-1',
        description: 'MS FRAME FOR POWDER COATING RAL 7035',
        hsn: '998898',
        quantity: 779,
        unit: 'KGS',
        rate: 24.0,
        taxableAmount: 18696.0,
        cgstRate: 9,
        cgstAmount: 1682.64,
        sgstRate: 9,
        sgstAmount: 1682.64,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: 22061.28,
      },
    ],
    totalQuantity: 779,
    taxableAmount: 18696.0,
    cgstTotal: 1682.64,
    sgstTotal: 1682.64,
    igstTotal: 0,
    totalTax: 3365.28,
    roundOff: -0.28,
    grandTotal: 22061.0,
    amountInWords: 'Twenty Two Thousand Sixty One Rupees Only',
    reverseCharge: false,
    vehicleNo: 'MH-14-GH-4521',
    transportMode: 'Tempo / Road',
    notes: 'Job work of powder coating completed as per specifications.',
    terms: DEFAULT_COMPANY.terms,
    paymentStatus: 'Paid',
    paymentMode: 'Bank Transfer',
    copyType: 'Original for Recipient',
    createdAt: '2026-09-30T14:30:00Z',
    updatedAt: '2026-09-30T14:30:00Z',
  },
  {
    id: 'inv-2026-27-355',
    invoiceNo: '2026-27-355',
    invoiceDate: '2026-09-26',
    challanNo: 'CH-871',
    challanDate: '2026-09-26',
    poNo: 'TF/2026/099',
    poDate: '2026-09-22',
    customerId: 'cust-techno-2',
    customerName: 'TECHNO FABRICATORS PVT LTD',
    billingAddress: 'Plot No. C-14, MIDC Chakan, Phase II, Pune - 410501',
    customerState: 'MAHARASHTRA',
    customerStateCode: '27',
    customerGstin: '27AABCT8921K1ZZ',
    customerMobile: '9823112233',
    customerEmail: 'purchase@technofab.in',
    customerPan: 'AABCT8921K',
    shipToName: 'TECHNO FABRICATORS PVT LTD',
    shippingAddress: 'Plot No. C-14, MIDC Chakan, Phase II, Pune - 410501',
    shipToState: 'MAHARASHTRA',
    shipToStateCode: '27',
    shipToGstin: '27AABCT8921K1ZZ',
    shipToMobile: '9823112233',
    items: [
      {
        id: 'item-2',
        productId: 'prod-enclosure-2',
        description: 'ELECTRICAL ENCLOSURE POWDER COATING MATT BLACK',
        hsn: '998898',
        quantity: 120,
        unit: 'NOS',
        rate: 350.0,
        taxableAmount: 42000.0,
        cgstRate: 9,
        cgstAmount: 3780.0,
        sgstRate: 9,
        sgstAmount: 3780.0,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: 49560.0,
      },
    ],
    totalQuantity: 120,
    taxableAmount: 42000.0,
    cgstTotal: 3780.0,
    sgstTotal: 3780.0,
    igstTotal: 0,
    totalTax: 7560.0,
    roundOff: 0.0,
    grandTotal: 49560.0,
    amountInWords: 'Forty Nine Thousand Five Hundred Sixty Rupees Only',
    reverseCharge: false,
    vehicleNo: 'MH-12-PQ-8890',
    transportMode: 'Tempo / Road',
    notes: 'Quality checked and packed in corrugated wrap.',
    terms: DEFAULT_COMPANY.terms,
    paymentStatus: 'Pending',
    paymentMode: 'Bank Transfer',
    copyType: 'Original for Recipient',
    createdAt: '2026-09-26T16:00:00Z',
    updatedAt: '2026-09-26T16:00:00Z',
  },
  {
    id: 'inv-2026-27-354',
    invoiceNo: '2026-27-354',
    invoiceDate: '2026-09-20',
    challanNo: 'CH-850',
    challanDate: '2026-09-20',
    poNo: 'AP/SEP/14',
    poDate: '2026-09-18',
    customerId: 'cust-apex-3',
    customerName: 'APEX AUTO COMPONENTS',
    billingAddress: 'Survey No. 88, Sanaswadi, Tal-Shirur, Dist-Pune - 412208',
    customerState: 'MAHARASHTRA',
    customerStateCode: '27',
    customerGstin: '27BAPCA4112L1ZV',
    customerMobile: '9422556677',
    customerEmail: 'apex.billing@gmail.com',
    customerPan: 'BAPCA4112L',
    shipToName: 'APEX AUTO COMPONENTS',
    shippingAddress: 'Survey No. 88, Sanaswadi, Tal-Shirur, Dist-Pune - 412208',
    shipToState: 'MAHARASHTRA',
    shipToStateCode: '27',
    shipToGstin: '27BAPCA4112L1ZV',
    shipToMobile: '9422556677',
    items: [
      {
        id: 'item-3',
        productId: 'prod-bracket-3',
        description: 'HEAVY FABRICATED BRACKET COATING RAL 9005',
        hsn: '998898',
        quantity: 550,
        unit: 'KGS',
        rate: 28.5,
        taxableAmount: 15675.0,
        cgstRate: 9,
        cgstAmount: 1410.75,
        sgstRate: 9,
        sgstAmount: 1410.75,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: 18496.5,
      },
    ],
    totalQuantity: 550,
    taxableAmount: 15675.0,
    cgstTotal: 1410.75,
    sgstTotal: 1410.75,
    igstTotal: 0,
    totalTax: 2821.5,
    roundOff: -0.5,
    grandTotal: 18496.0,
    amountInWords: 'Eighteen Thousand Four Hundred Ninety Six Rupees Only',
    reverseCharge: false,
    vehicleNo: 'MH-14-DA-1212',
    transportMode: 'Road',
    notes: 'Full payment received.',
    terms: DEFAULT_COMPANY.terms,
    paymentStatus: 'Paid',
    paymentMode: 'UPI',
    copyType: 'Original for Recipient',
    createdAt: '2026-09-20T11:20:00Z',
    updatedAt: '2026-09-20T11:20:00Z',
  },
];

export const DEFAULT_RECEIPTS: PaymentReceipt[] = [
  {
    id: 'rec-2026-27-001',
    receiptNo: 'REC-2026-27-001',
    receiptDate: '2026-09-30',
    customerId: 'cust-mecon-1',
    customerName: 'MECON SYSTEMS',
    customerAddress: 'GAT NO 62/3/A AT-POST CHIMBLI TAL-KHED DIST PUNE',
    customerGstin: '27AJGJPA8641A1ZR',
    customerMobile: '9822000000',
    invoiceId: 'inv-2026-27-356',
    invoiceNo: '2026-27-356',
    invoiceDate: '2026-09-30',
    invoiceTotal: 28202.0,
    amount: 28202.0,
    previousPaid: 0,
    balanceRemaining: 0,
    paymentMode: 'Bank Transfer',
    referenceNo: 'UBIN98712345678',
    bankName: 'Union Bank of India',
    paymentType: 'Full Payment',
    notes: 'Received against Tax Invoice 2026-27-356 in full.',
    amountInWords: 'Twenty Eight Thousand Two Hundred Two Rupees Only',
    createdAt: '2026-09-30T15:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'rec-2026-27-002',
    receiptNo: 'REC-2026-27-002',
    receiptDate: '2026-09-20',
    customerId: 'cust-apex-3',
    customerName: 'APEX AUTO COMPONENTS',
    customerAddress: 'Survey No. 88, Sanaswadi, Tal-Shirur, Dist-Pune - 412208',
    customerGstin: '27BBCPA4412M1Z5',
    customerMobile: '9822889900',
    invoiceId: 'inv-2026-27-354',
    invoiceNo: '2026-27-354',
    invoiceDate: '2026-09-20',
    invoiceTotal: 18496.0,
    amount: 18496.0,
    previousPaid: 0,
    balanceRemaining: 0,
    paymentMode: 'UPI',
    referenceNo: 'UPI/326490128471',
    bankName: 'UPI - Google Pay',
    paymentType: 'Full Payment',
    notes: 'Received via UPI against invoice 2026-27-354.',
    amountInWords: 'Eighteen Thousand Four Hundred Ninety Six Rupees Only',
    createdAt: '2026-09-20T12:00:00Z',
    createdBy: 'admin',
  },
];

// Helper to safely read from localStorage
function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

// Helper to safely write to localStorage
function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Initialize default data if empty and merge new parties
export function initStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.COMPANY)) {
    setStoredItem(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
  }

  // Ensure all 10 DEFAULT_CUSTOMERS from invoices exist in customer storage
  const currentCustomers = getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  let updated = false;

  DEFAULT_CUSTOMERS.forEach((dc) => {
    const existingIndex = currentCustomers.findIndex(
      (c) =>
        (c.gstin && dc.gstin && c.gstin.trim().toUpperCase() === dc.gstin.trim().toUpperCase()) ||
        c.name.trim().toLowerCase() === dc.name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      // Refresh with latest exact details from official invoice images
      currentCustomers[existingIndex] = {
        ...currentCustomers[existingIndex],
        name: dc.name,
        gstin: dc.gstin,
        pan: dc.pan,
        billingAddress: dc.billingAddress,
        shippingAddress: dc.shippingAddress,
        mobile: dc.mobile || currentCustomers[existingIndex].mobile || '',
      };
      updated = true;
    } else {
      currentCustomers.push(dc);
      updated = true;
    }
  });

  if (updated || !localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setStoredItem(STORAGE_KEYS.CUSTOMERS, currentCustomers);
  }

  // Ensure invoices exist, restore default invoices if empty
  const storedInvoices = getStoredItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  if (!storedInvoices || !Array.isArray(storedInvoices) || storedInvoices.length === 0) {
    setStoredItem(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
  }

  // Ensure receipts exist, restore default receipts if empty
  const storedReceipts = getStoredItem<PaymentReceipt[]>(STORAGE_KEYS.RECEIPTS, []);
  if (!storedReceipts || !Array.isArray(storedReceipts) || storedReceipts.length === 0) {
    setStoredItem(STORAGE_KEYS.RECEIPTS, DEFAULT_RECEIPTS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setStoredItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setStoredItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStoredItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }
}

// Company Profile API
export function getCompanyProfile(): CompanyProfile {
  return getStoredItem<CompanyProfile>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  setStoredItem(STORAGE_KEYS.COMPANY, profile);
  cloudSaveCompany(profile);
}

// Settings API
export function getInvoiceSettings(): InvoiceSettings {
  return getStoredItem<InvoiceSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveInvoiceSettings(settings: InvoiceSettings): void {
  setStoredItem(STORAGE_KEYS.SETTINGS, settings);
  cloudSaveSettings(settings);
}

export function getNextInvoiceNumber(): string {
  const settings = getInvoiceSettings();
  const numStr = String(settings.nextNumber).padStart(settings.paddingDigits, '0');
  return `${settings.prefix}${numStr}`;
}

export function incrementInvoiceNumber(): void {
  const settings = getInvoiceSettings();
  settings.nextNumber += 1;
  saveInvoiceSettings(settings);
}

// Customers API
export function getCustomers(): Customer[] {
  return getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
}

export function getCustomerById(id: string): Customer | undefined {
  const customers = getCustomers();
  return customers.find((c) => c.id === id);
}

export function saveCustomer(customer: Customer): Customer {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customer.id);
  let saved: Customer;
  if (index >= 0) {
    saved = { ...customer, updatedAt: new Date().toISOString() };
    customers[index] = saved;
  } else {
    saved = { ...customer, createdAt: new Date().toISOString() };
    customers.unshift(saved);
  }
  setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  cloudSaveCustomer(saved);
  return saved;
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id);
  setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  cloudDeleteCustomer(id);
}

// Products API
export function getProducts(): Product[] {
  return getStoredItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
}

export function getProductById(id: string): Product | undefined {
  const products = getProducts();
  return products.find((p) => p.id === id);
}

export function saveProduct(product: Product): Product {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  let saved: Product;
  if (index >= 0) {
    saved = { ...product, updatedAt: new Date().toISOString() };
    products[index] = saved;
  } else {
    saved = { ...product, createdAt: new Date().toISOString() };
    products.unshift(saved);
  }
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  cloudSaveProduct(saved);
  return saved;
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  cloudDeleteProduct(id);
}

// Invoices API
export function getInvoices(): Invoice[] {
  const invs = getStoredItem<Invoice[]>(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
  if (!invs || !Array.isArray(invs) || invs.length === 0) {
    setStoredItem(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    return DEFAULT_INVOICES;
  }
  return invs;
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = getInvoices();
  return invoices.find((inv) => inv.id === id);
}

export function saveInvoice(invoice: Invoice, autoIncrementSetting = true): Invoice {
  const invoices = getInvoices();
  const index = invoices.findIndex((inv) => inv.id === invoice.id);
  const now = new Date().toISOString();
  let saved: Invoice;

  if (index >= 0) {
    saved = { ...invoice, updatedAt: now };
    invoices[index] = saved;
  } else {
    // New invoice
    saved = { ...invoice, createdAt: now, updatedAt: now };
    invoices.unshift(saved);

    // If auto increment enabled, update settings if this matches or exceeds nextNumber
    if (autoIncrementSetting) {
      const settings = getInvoiceSettings();
      // Try to parse number from invoice number
      const numMatch = invoice.invoiceNo.match(/\d+$/);
      if (numMatch) {
        const invNum = parseInt(numMatch[0], 10);
        if (invNum >= settings.nextNumber) {
          settings.nextNumber = invNum + 1;
          saveInvoiceSettings(settings);
        }
      }
    }
  }

  setStoredItem(STORAGE_KEYS.INVOICES, invoices);
  cloudSaveInvoice(saved);
  return saved;
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter((inv) => inv.id !== id);
  setStoredItem(STORAGE_KEYS.INVOICES, invoices);
  cloudDeleteInvoice(id);
}

export function duplicateInvoice(id: string): Invoice | null {
  const source = getInvoiceById(id);
  if (!source) return null;

  const nextNumber = getNextInvoiceNumber();
  const duplicated: Invoice = {
    ...source,
    id: `inv-${Date.now()}`,
    invoiceNo: nextNumber,
    invoiceDate: new Date().toISOString().split('T')[0],
    challanNo: '',
    challanDate: '',
    paymentStatus: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveInvoice(duplicated, true);
  return duplicated;
}

// ==========================================
// Payment Receipts API (पेमेंट पावती)
// ==========================================

export function getReceipts(): PaymentReceipt[] {
  const recs = getStoredItem<PaymentReceipt[]>(STORAGE_KEYS.RECEIPTS, DEFAULT_RECEIPTS);
  if (!recs || !Array.isArray(recs) || recs.length === 0) {
    setStoredItem(STORAGE_KEYS.RECEIPTS, DEFAULT_RECEIPTS);
    return DEFAULT_RECEIPTS;
  }
  return recs;
}

export function getReceiptById(id: string): PaymentReceipt | undefined {
  const receipts = getReceipts();
  return receipts.find((r) => r.id === id);
}

export function getNextReceiptNumber(): string {
  const receipts = getReceipts();
  const settings = getInvoiceSettings();
  const fyPrefix = settings.prefix || '2026-27-'; // e.g. "2026-27-"
  const prefix = `REC-${fyPrefix}`;

  // Find maximum numeric suffix for current prefix
  let maxNum = 0;
  receipts.forEach((r) => {
    if (r.receiptNo && r.receiptNo.startsWith(prefix)) {
      const numPart = parseInt(r.receiptNo.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    } else if (r.receiptNo && r.receiptNo.startsWith('REC-')) {
      const match = r.receiptNo.match(/(\d+)$/);
      if (match) {
        const numPart = parseInt(match[1], 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export function saveReceipt(
  receipt: PaymentReceipt,
  updateInvoiceStatus = true
): PaymentReceipt {
  const receipts = getReceipts();
  const index = receipts.findIndex((r) => r.id === receipt.id);

  if (index >= 0) {
    receipts[index] = { ...receipt };
  } else {
    receipts.unshift(receipt);
  }
  setStoredItem(STORAGE_KEYS.RECEIPTS, receipts);
  cloudSaveReceipt(receipt);

  // If linked to an invoice, auto-update invoice payment status
  if (receipt.invoiceId && updateInvoiceStatus) {
    try {
      const invoice = getInvoiceById(receipt.invoiceId);
      if (invoice) {
        // Calculate total amount received for this invoice across all receipts
        const totalReceivedForInvoice = receipts
          .filter((r) => r.invoiceId === invoice.id)
          .reduce((sum, r) => sum + (r.amount || 0), 0);

        if (totalReceivedForInvoice >= invoice.grandTotal - 1) {
          invoice.paymentStatus = 'Paid';
        } else if (totalReceivedForInvoice > 0) {
          invoice.paymentStatus = 'Partially Paid';
        }
        invoice.updatedAt = new Date().toISOString();
        saveInvoice(invoice, false);
      }
    } catch (e) {
      console.warn('Could not auto-update invoice payment status:', e);
    }
  }

  return receipt;
}

export function deleteReceipt(id: string): void {
  const receipts = getReceipts().filter((r) => r.id !== id);
  setStoredItem(STORAGE_KEYS.RECEIPTS, receipts);
  cloudDeleteReceipt(id);
}

// ==========================================
// Cloud-to-Local Synchronization Helpers
// ==========================================

export function syncLocalCompany(company: CompanyProfile): void {
  setStoredItem(STORAGE_KEYS.COMPANY, company);
}

export function syncLocalSettings(settings: InvoiceSettings): void {
  setStoredItem(STORAGE_KEYS.SETTINGS, settings);
}

export function syncLocalCustomers(customers: Customer[]): void {
  setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
}

export function syncLocalProducts(products: Product[]): void {
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
}

export function syncLocalInvoices(invoices: Invoice[]): void {
  if (invoices && Array.isArray(invoices)) {
    setStoredItem(STORAGE_KEYS.INVOICES, invoices);
  }
}

export function syncLocalReceipts(receipts: PaymentReceipt[]): void {
  if (receipts && Array.isArray(receipts)) {
    setStoredItem(STORAGE_KEYS.RECEIPTS, receipts);
  }
}

export function syncAllFromCloudObject(data: {
  company?: CompanyProfile;
  settings?: InvoiceSettings;
  customers?: Customer[];
  products?: Product[];
  invoices?: Invoice[];
  receipts?: PaymentReceipt[];
}): void {
  if (data.company && data.company.name) syncLocalCompany(data.company);
  if (data.settings && data.settings.prefix) syncLocalSettings(data.settings);
  if (data.customers && Array.isArray(data.customers)) syncLocalCustomers(data.customers);
  if (data.products && Array.isArray(data.products)) syncLocalProducts(data.products);
  if (data.invoices && Array.isArray(data.invoices)) syncLocalInvoices(data.invoices);
  if (data.receipts && Array.isArray(data.receipts)) syncLocalReceipts(data.receipts);
}

// ==========================================
// User Management & Authentication Storage
// ==========================================

export function getUsers(): AppUser[] {
  const users = getStoredItem<AppUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  if (!users || !Array.isArray(users) || users.length === 0) {
    setStoredItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  return users;
}

export function saveUser(user: AppUser): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    users[index] = { ...user };
  } else {
    users.push(user);
  }
  setStoredItem(STORAGE_KEYS.USERS, users);
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  // Prevent deleting the last admin
  const userToDelete = users.find((u) => u.id === id);
  if (userToDelete?.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (adminCount <= 1) {
      return false; // Cannot delete the sole admin
    }
  }
  const filtered = users.filter((u) => u.id !== id);
  setStoredItem(STORAGE_KEYS.USERS, filtered);
  return true;
}

export function authenticateUser(username: string, password: string): AppUser | null {
  const users = getUsers();
  const trimmedUser = username.trim().toLowerCase();
  const found = users.find(
    (u) => u.username.toLowerCase() === trimmedUser && u.passwordHash === password
  );

  if (found) {
    // Update lastLoginAt
    found.lastLoginAt = new Date().toISOString();
    saveUser(found);
    setCurrentSession(found);
    return found;
  }
  return null;
}

export function getCurrentSession(): AppUser | null {
  const session = getStoredItem<AppUser | null>(STORAGE_KEYS.SESSION, null);
  if (!session) {
    // Default to admin on first run for seamless experience
    return DEFAULT_USERS[0];
  }
  // Verify user still exists in DB
  const users = getUsers();
  const exists = users.find((u) => u.id === session.id);
  return exists || DEFAULT_USERS[0];
}

export function setCurrentSession(user: AppUser | null): void {
  if (user) {
    setStoredItem(STORAGE_KEYS.SESSION, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// ==========================================
// Full Backup and Restore (Sync Across Devices)
// ==========================================

export function exportAllData(): string {
  const payload = {
    appName: 'Super Coating Industries - GST Billing',
    exportVersion: '2.0',
    exportedAt: new Date().toISOString(),
    exportedBy: getCurrentSession()?.username || 'system',
    company: getCompanyProfile(),
    settings: getInvoiceSettings(),
    customers: getCustomers(),
    products: getProducts(),
    invoices: getInvoices(),
    receipts: getReceipts(),
    users: getUsers(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importAllData(jsonString: string): { success: boolean; message: string; count?: number } {
  try {
    const data = JSON.parse(jsonString);
    let invoiceCount = 0;
    let receiptCount = 0;

    if (data.company) setStoredItem(STORAGE_KEYS.COMPANY, data.company);
    if (data.settings) setStoredItem(STORAGE_KEYS.SETTINGS, data.settings);
    if (Array.isArray(data.customers)) setStoredItem(STORAGE_KEYS.CUSTOMERS, data.customers);
    if (Array.isArray(data.products)) setStoredItem(STORAGE_KEYS.PRODUCTS, data.products);
    if (Array.isArray(data.invoices)) {
      setStoredItem(STORAGE_KEYS.INVOICES, data.invoices);
      invoiceCount = data.invoices.length;
    }
    if (Array.isArray(data.receipts)) {
      setStoredItem(STORAGE_KEYS.RECEIPTS, data.receipts);
      receiptCount = data.receipts.length;
    }
    if (Array.isArray(data.users) && data.users.length > 0) {
      setStoredItem(STORAGE_KEYS.USERS, data.users);
    }

    return {
      success: true,
      message: `डेटा यशस्वीरित्या सिंक झाला! (${invoiceCount} इन्व्हॉइसेस, ${receiptCount} पावत्या, ${data.customers?.length || 0} ग्राहक, ${data.products?.length || 0} उत्पादने)`,
      count: invoiceCount,
    };
  } catch (err) {
    console.error('Failed to import backup data:', err);
    return {
      success: false,
      message: 'अवैध फाईल किंवा फॉरमॅट! कृपया योग्य .json बॅकअप फाईल निवडा.',
    };
  }
}

export function resetToDefaults(): void {
  setStoredItem(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
  setStoredItem(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  setStoredItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  setStoredItem(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
  setStoredItem(STORAGE_KEYS.RECEIPTS, DEFAULT_RECEIPTS);
  setStoredItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  setStoredItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
  setCurrentSession(DEFAULT_USERS[0]);
}
