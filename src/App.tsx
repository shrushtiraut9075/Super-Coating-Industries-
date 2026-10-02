import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Invoice,
  Customer,
  Product,
  CompanyProfile,
  InvoiceSettings,
  AppUser,
  PaymentReceipt,
} from './types';
import {
  initStorage,
  getCompanyProfile,
  saveCompanyProfile,
  getInvoiceSettings,
  saveInvoiceSettings,
  getNextInvoiceNumber,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getProducts,
  saveProduct,
  deleteProduct,
  getInvoices,
  saveInvoice,
  deleteInvoice,
  duplicateInvoice,
  getReceipts,
  saveReceipt,
  deleteReceipt,
  exportAllData,
  importAllData,
  resetToDefaults,
  getCurrentSession,
  setCurrentSession,
  syncLocalCompany,
  syncLocalSettings,
  syncLocalCustomers,
  syncLocalProducts,
  syncLocalInvoices,
  syncLocalReceipts,
} from './services/storage';
import {
  testFirebaseConnection,
  seedCloudIfEmpty,
  subscribeToCompany,
  subscribeToSettings,
  subscribeToCustomers,
  subscribeToProducts,
  subscribeToInvoices,
  subscribeToReceipts,
} from './services/firebase';
import { ToastProvider, useToast } from './components/Toast';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { InvoiceListView } from './components/InvoiceListView';
import { InvoiceFormView } from './components/InvoiceFormView';
import { InvoicePrintView } from './components/InvoicePrintView';
import { ReceiptsListView } from './components/ReceiptsListView';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';
import { ReceiptFormModal } from './components/ReceiptFormModal';
import { CustomerMasterView } from './components/CustomerMasterView';
import { ProductMasterView } from './components/ProductMasterView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { SyncModal } from './components/SyncModal';

function AppContent() {
  const { showToast } = useToast();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getCurrentSession);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  // Primary State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile);
  const [settings, setSettings] = useState<InvoiceSettings>(getInvoiceSettings);
  const [customers, setCustomers] = useState<Customer[]>(getCustomers);
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(getInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment Receipts State
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(getReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptPrintModalOpen, setIsReceiptPrintModalOpen] = useState(false);
  const [isReceiptFormOpen, setIsReceiptFormOpen] = useState(false);
  const [receiptTargetInvoice, setReceiptTargetInvoice] = useState<Invoice | null>(null);
  const [receiptTargetCustomer, setReceiptTargetCustomer] = useState<Customer | null>(null);

  // Cloud connection state
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Initialize storage & Firebase multi-device real-time sync
  useEffect(() => {
    initStorage();
    refreshAllData();
    setCurrentUser(getCurrentSession());

    // 1. Validate connection to Firestore
    testFirebaseConnection().then((connected) => {
      setIsCloudSynced(connected);
    });

    // 2. Seed cloud with existing data if database is fresh
    seedCloudIfEmpty({
      company: getCompanyProfile(),
      settings: getInvoiceSettings(),
      customers: getCustomers(),
      products: getProducts(),
      invoices: getInvoices(),
      receipts: getReceipts(),
    });

    // 3. Real-time subscriptions across all devices (Mobile, PC, Tablet)
    const unsubCompany = subscribeToCompany((cloudCompany) => {
      if (cloudCompany && cloudCompany.name) {
        setCompany(cloudCompany);
        syncLocalCompany(cloudCompany);
      }
    });

    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings && cloudSettings.prefix) {
        setSettings(cloudSettings);
        syncLocalSettings(cloudSettings);
      }
    });

    const unsubCustomers = subscribeToCustomers((cloudCustomers) => {
      if (cloudCustomers && Array.isArray(cloudCustomers) && cloudCustomers.length > 0) {
        setCustomers(cloudCustomers);
        syncLocalCustomers(cloudCustomers);
      }
    });

    const unsubProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        syncLocalProducts(cloudProducts);
      }
    });

    const unsubInvoices = subscribeToInvoices((cloudInvoices) => {
      if (cloudInvoices && Array.isArray(cloudInvoices) && cloudInvoices.length > 0) {
        setInvoices(cloudInvoices);
        syncLocalInvoices(cloudInvoices);
      }
    });

    const unsubReceipts = subscribeToReceipts((cloudReceipts) => {
      if (cloudReceipts && Array.isArray(cloudReceipts) && cloudReceipts.length > 0) {
        setReceipts(cloudReceipts);
        syncLocalReceipts(cloudReceipts);
      }
    });

    return () => {
      unsubCompany();
      unsubSettings();
      unsubCustomers();
      unsubProducts();
      unsubInvoices();
      unsubReceipts();
    };
  }, []);

  const refreshAllData = () => {
    setCompany(getCompanyProfile());
    setSettings(getInvoiceSettings());
    setCustomers(getCustomers());
    setProducts(getProducts());
    setInvoices(getInvoices());
    setReceipts(getReceipts());
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setCurrentSession(user);
    setIsLoginOpen(false);
    showToast(
      'लॉगिन यशस्वी!',
      `${user.displayName || user.username} म्हणून लॉगिन झाले (${user.role.toUpperCase()})`,
      'success'
    );
  };

  // Handlers for Invoices
  const handleSaveInvoice = (invoiceToSave: Invoice, andView = false) => {
    saveInvoice(invoiceToSave, true);
    refreshAllData();

    if (andView) {
      setSelectedInvoice(invoiceToSave);
      setActiveTab('view-invoice');
      showToast('Invoice Saved', `Invoice ${invoiceToSave.invoiceNo} ready for printing`, 'success');
    } else {
      setActiveTab('invoices');
      showToast('Invoice Saved', `Invoice ${invoiceToSave.invoiceNo} saved successfully`, 'success');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('edit-invoice');
  };

  const handleDuplicateInvoice = (id: string) => {
    const duplicated = duplicateInvoice(id);
    if (duplicated) {
      refreshAllData();
      setSelectedInvoice(duplicated);
      setActiveTab('view-invoice');
      showToast('Invoice Duplicated', `Created new invoice ${duplicated.invoiceNo}`, 'success');
    }
  };

  const handleDeleteInvoice = (id: string) => {
    deleteInvoice(id);
    refreshAllData();
    if (selectedInvoice?.id === id) {
      setSelectedInvoice(null);
      setActiveTab('invoices');
    }
  };

  // Handlers for Payment Receipts
  const handleOpenNewReceipt = (targetInvoice?: Invoice, targetCustomer?: Customer) => {
    setReceiptTargetInvoice(targetInvoice || null);
    setReceiptTargetCustomer(targetCustomer || null);
    setIsReceiptFormOpen(true);
  };

  const handleSaveReceipt = (receiptToSave: PaymentReceipt, andPrint = false) => {
    saveReceipt(receiptToSave, true);
    refreshAllData();
    setIsReceiptFormOpen(false);
    showToast(
      'पेमेंट पावती जतन झाली!',
      `पावती ${receiptToSave.receiptNo} यशस्वीरित्या नोंदवली गेली.`,
      'success'
    );

    if (andPrint) {
      setSelectedReceipt(receiptToSave);
      setIsReceiptPrintModalOpen(true);
    }
  };

  const handleViewReceipt = (receipt: PaymentReceipt) => {
    setSelectedReceipt(receipt);
    setIsReceiptPrintModalOpen(true);
  };

  const handleDeleteReceipt = (id: string) => {
    deleteReceipt(id);
    refreshAllData();
    if (selectedReceipt?.id === id) {
      setSelectedReceipt(null);
      setIsReceiptPrintModalOpen(false);
    }
  };

  // Handlers for Customers
  const handleSaveCustomer = (cust: Customer) => {
    saveCustomer(cust);
    refreshAllData();
  };

  const handleDeleteCustomer = (id: string) => {
    deleteCustomer(id);
    refreshAllData();
  };

  // Handlers for Products
  const handleSaveProduct = (prod: Product) => {
    saveProduct(prod);
    refreshAllData();
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    refreshAllData();
  };

  // Handlers for Settings & Company
  const handleSaveCompany = (updatedCompany: CompanyProfile) => {
    saveCompanyProfile(updatedCompany);
    setCompany(updatedCompany);
  };

  const handleSaveSettings = (updatedSettings: InvoiceSettings) => {
    saveInvoiceSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SuperCoating_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup Exported', 'Full JSON database exported', 'success');
  };

  const handleImportBackup = (jsonString: string): boolean => {
    const ok = importAllData(jsonString);
    if (ok) {
      refreshAllData();
      return true;
    }
    return false;
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    refreshAllData();
    setSelectedInvoice(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-900">
      {/* Sidebar & Mobile Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'new-invoice') {
            setSelectedInvoice(null);
          }
          setActiveTab(tab);
        }}
        invoiceCount={invoices.length}
        receiptCount={receipts.length}
        isCloudSynced={isCloudSynced}
        company={company}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              customers={customers}
              products={products}
              receipts={receipts}
              onNavigate={(tab) => {
                if (tab === 'new-invoice') setSelectedInvoice(null);
                setActiveTab(tab);
              }}
              onViewInvoice={handleViewInvoice}
              onCreateReceipt={() => handleOpenNewReceipt()}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceListView
              invoices={invoices}
              currentUser={currentUser}
              onViewInvoice={handleViewInvoice}
              onEditInvoice={handleEditInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onCreateNew={() => {
                setSelectedInvoice(null);
                setActiveTab('new-invoice');
              }}
              onCreateReceipt={handleOpenNewReceipt}
              onRestoreDefaults={handleResetDefaults}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsListView
              receipts={receipts}
              currentUser={currentUser}
              company={company}
              onCreateNew={() => handleOpenNewReceipt()}
              onViewReceipt={handleViewReceipt}
              onDeleteReceipt={handleDeleteReceipt}
            />
          )}

          {activeTab === 'new-invoice' && (
            <InvoiceFormView
              company={company}
              customers={customers}
              products={products}
              nextInvoiceNumber={getNextInvoiceNumber()}
              onSave={handleSaveInvoice}
              onCancel={() => setActiveTab('invoices')}
              onQuickAddCustomer={handleSaveCustomer}
            />
          )}

          {activeTab === 'edit-invoice' && selectedInvoice && (
            <InvoiceFormView
              initialInvoice={selectedInvoice}
              company={company}
              customers={customers}
              products={products}
              nextInvoiceNumber={selectedInvoice.invoiceNo}
              onSave={handleSaveInvoice}
              onCancel={() => setActiveTab('invoices')}
              onQuickAddCustomer={handleSaveCustomer}
            />
          )}

          {activeTab === 'view-invoice' && selectedInvoice && (
            <InvoicePrintView
              invoice={selectedInvoice}
              company={company}
              onBack={() => setActiveTab('invoices')}
              onEdit={(inv) => {
                setSelectedInvoice(inv);
                setActiveTab('edit-invoice');
              }}
              onDuplicate={handleDuplicateInvoice}
              onCreateReceipt={handleOpenNewReceipt}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerMasterView
              customers={customers}
              invoices={invoices}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'products' && (
            <ProductMasterView
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              invoices={invoices}
              receipts={receipts}
              onCreateReceipt={handleOpenNewReceipt}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              company={company}
              settings={settings}
              currentUser={currentUser}
              onSaveCompany={handleSaveCompany}
              onSaveSettings={handleSaveSettings}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDefaults={handleResetDefaults}
              onOpenSyncModal={() => setIsSyncOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Payment Receipt View / Print Modal */}
      <ReceiptPrintModal
        isOpen={isReceiptPrintModalOpen}
        receipt={selectedReceipt}
        company={company}
        onClose={() => setIsReceiptPrintModalOpen(false)}
      />

      {/* Payment Receipt Creation / Recording Modal */}
      <ReceiptFormModal
        isOpen={isReceiptFormOpen}
        onClose={() => setIsReceiptFormOpen(false)}
        onSave={handleSaveReceipt}
        customers={customers}
        invoices={invoices}
        company={company}
        initialInvoice={receiptTargetInvoice}
        initialCustomer={receiptTargetCustomer}
      />

      {/* User Login & Switcher Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Multi-Device & Mobile Sync Modal */}
      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onDataImported={refreshAllData}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
