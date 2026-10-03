import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Printer,
  ArrowLeft,
  Search,
  Building,
  Truck,
  FileText,
  Calculator,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  Customer,
  Product,
  CompanyProfile,
  PaymentStatus,
  PaymentMode,
  InvoiceCopyType,
} from '../types';
import {
  INDIAN_STATES,
  COMMON_UNITS,
  formatIndianCurrency,
  getTodayDateString,
  round2,
} from '../utils/formatters';
import {
  calculateItemTaxes,
  calculateInvoiceTotals,
  CGST_SGST_OPTIONS,
  IGST_OPTIONS,
  PRIMARY_CGST_RATES,
  PRIMARY_IGST_RATES,
} from '../utils/gstCalculator';
import { useToast } from './Toast';

interface InvoiceFormViewProps {
  initialInvoice?: Invoice | null;
  company: CompanyProfile;
  customers: Customer[];
  products: Product[];
  nextInvoiceNumber: string;
  onSave: (invoice: Invoice, andView?: boolean) => void;
  onCancel: () => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

export const InvoiceFormView: React.FC<InvoiceFormViewProps> = ({
  initialInvoice,
  company,
  customers,
  products,
  nextInvoiceNumber,
  onSave,
  onCancel,
  onQuickAddCustomer,
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(initialInvoice);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState(initialInvoice?.invoiceNo || nextInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(initialInvoice?.invoiceDate || getTodayDateString());
  const [challanNo, setChallanNo] = useState(initialInvoice?.challanNo || '');
  const [challanDate, setChallanDate] = useState(initialInvoice?.challanDate || '');
  const [poNo, setPoNo] = useState(initialInvoice?.poNo || '');
  const [poDate, setPoDate] = useState(initialInvoice?.poDate || '');
  const [reverseCharge, setReverseCharge] = useState(initialInvoice?.reverseCharge || false);
  const [vehicleNo, setVehicleNo] = useState(initialInvoice?.vehicleNo || '');
  const [transportMode, setTransportMode] = useState(initialInvoice?.transportMode || 'Road / Tempo');
  const [copyType, setCopyType] = useState<InvoiceCopyType>(initialInvoice?.copyType || 'Original for Recipient');

  // GST Applicable Toggle (Option: YES or NO)
  const [isGstApplicable, setIsGstApplicable] = useState<boolean>(
    initialInvoice?.isGstApplicable !== undefined ? initialInvoice.isGstApplicable : true
  );

  // Customer / Bill To State
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialInvoice?.customerId || '');
  const [customerName, setCustomerName] = useState(initialInvoice?.customerName || '');
  const [billingAddress, setBillingAddress] = useState(initialInvoice?.billingAddress || '');
  const [customerState, setCustomerState] = useState(initialInvoice?.customerState || 'Maharashtra');
  const [customerStateCode, setCustomerStateCode] = useState(initialInvoice?.customerStateCode || '27');
  const [customerGstin, setCustomerGstin] = useState(initialInvoice?.customerGstin || '');
  const [customerMobile, setCustomerMobile] = useState(initialInvoice?.customerMobile || '');
  const [customerEmail, setCustomerEmail] = useState(initialInvoice?.customerEmail || '');
  const [customerPan, setCustomerPan] = useState(initialInvoice?.customerPan || '');

  // Ship To State
  const [sameAsBilling, setSameAsBilling] = useState(
    !initialInvoice ||
      (initialInvoice.shipToName === initialInvoice.customerName &&
        initialInvoice.shippingAddress === initialInvoice.billingAddress)
  );
  const [shipToName, setShipToName] = useState(initialInvoice?.shipToName || '');
  const [shippingAddress, setShippingAddress] = useState(initialInvoice?.shippingAddress || '');
  const [shipToState, setShipToState] = useState(initialInvoice?.shipToState || 'Maharashtra');
  const [shipToStateCode, setShipToStateCode] = useState(initialInvoice?.shipToStateCode || '27');
  const [shipToGstin, setShipToGstin] = useState(initialInvoice?.shipToGstin || '');
  const [shipToMobile, setShipToMobile] = useState(initialInvoice?.shipToMobile || '');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items || [
      {
        id: `item-${Date.now()}`,
        productId: products[0]?.id || '',
        description: products[0]?.name || 'MS FRAME FOR POWDER COATING RAL 7035',
        hsn: products[0]?.hsn || '998898',
        quantity: 779,
        unit: products[0]?.defaultUnit || 'KGS',
        rate: products[0]?.defaultRate || 24,
        taxableAmount: 18696,
        cgstRate: 9,
        cgstAmount: 1682.64,
        sgstRate: 9,
        sgstAmount: 1682.64,
        igstRate: 0,
        igstAmount: 0,
        totalAmount: 22061.28,
      },
    ]
  );

  // Round off & adjustment
  const [isManualRoundOff, setIsManualRoundOff] = useState(initialInvoice?.roundOff !== undefined);
  const [customRoundOff, setCustomRoundOff] = useState<number>(initialInvoice?.roundOff || 0);

  // Status & payment
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialInvoice?.paymentStatus || 'Pending');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialInvoice?.paymentMode || 'Bank Transfer');
  const [notes, setNotes] = useState(initialInvoice?.notes || '');
  const [terms, setTerms] = useState<string[]>(initialInvoice?.terms || company.terms);

  // Quick Customer Modal
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustAddress, setQuickCustAddress] = useState('');
  const [quickCustState, setQuickCustState] = useState('Maharashtra');
  const [quickCustStateCode, setQuickCustStateCode] = useState('27');
  const [quickCustGstin, setQuickCustGstin] = useState('');
  const [quickCustMobile, setQuickCustMobile] = useState('');

  // Handle Customer Selection
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setCustomerName(cust.name);
      setBillingAddress(cust.billingAddress);
      setCustomerState(cust.state);
      setCustomerStateCode(cust.stateCode);
      setCustomerGstin(cust.gstin);
      setCustomerMobile(cust.mobile);
      setCustomerEmail(cust.email || '');
      setCustomerPan(cust.pan || '');

      if (sameAsBilling) {
        setShipToName(cust.name);
        setShippingAddress(cust.shippingAddress || cust.billingAddress);
        setShipToState(cust.state);
        setShipToStateCode(cust.stateCode);
        setShipToGstin(cust.gstin);
        setShipToMobile(cust.mobile);
      }

      // Recalculate item taxes with new customer state code
      recalculateAllItems(cust.stateCode);
    }
  };

  // Recalculate all item taxes based on state and GST toggle
  const recalculateAllItems = (stateCode: string, currentItems = items, gstEnabled = isGstApplicable) => {
    const updated = currentItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const gstRate = prod?.gstRate || (item.cgstRate + item.sgstRate) || item.igstRate || 18;

      const calc = calculateItemTaxes(
        item.quantity,
        item.rate,
        gstRate,
        company.stateCode,
        stateCode,
        {
          cgstRate: item.cgstRate,
          sgstRate: item.sgstRate,
          igstRate: item.igstRate,
        },
        gstEnabled
      );

      return {
        ...item,
        taxableAmount: calc.taxableAmount,
        cgstRate: calc.cgstRate,
        cgstAmount: calc.cgstAmount,
        sgstRate: calc.sgstRate,
        sgstAmount: calc.sgstAmount,
        igstRate: calc.igstRate,
        igstAmount: calc.igstAmount,
        totalAmount: calc.totalAmount,
      };
    });

    setItems(updated);
  };

  // Toggle GST Applicable (Yes / No)
  const handleToggleGst = (enabled: boolean) => {
    setIsGstApplicable(enabled);
    recalculateAllItems(customerStateCode, items, enabled);
    showToast(
      enabled ? 'GST Enabled' : 'GST Disabled (Non-GST / Bill of Supply)',
      enabled ? 'CGST & SGST taxes applied' : '0% Tax bill of supply mode active',
      'info'
    );
  };

  // Quick apply GST preset (6%, 9%, 12%, 18% or Non-GST) to all items
  const handleQuickApplyGstPreset = (cgstRate: number, enableGst: boolean) => {
    setIsGstApplicable(enableGst);
    const updated = items.map((item) => {
      const isTax = enableGst && cgstRate > 0;
      const calc = calculateItemTaxes(
        item.quantity,
        item.rate,
        cgstRate * 2,
        company.stateCode,
        customerStateCode,
        isIntraState
          ? { cgstRate: cgstRate, sgstRate: cgstRate }
          : { igstRate: cgstRate * 2 },
        isTax
      );
      return {
        ...item,
        isTaxable: isTax,
        taxableAmount: calc.taxableAmount,
        cgstRate: calc.cgstRate,
        cgstAmount: calc.cgstAmount,
        sgstRate: calc.sgstRate,
        sgstAmount: calc.sgstAmount,
        igstRate: calc.igstRate,
        igstAmount: calc.igstAmount,
        totalAmount: calc.totalAmount,
      };
    });
    setItems(updated);
    if (!enableGst) {
      showToast('Non-GST Bill', 'Applied 0% Tax (Without GST) to all items', 'info');
    } else {
      showToast(
        'GST Rate Applied',
        `Applied CGST ${cgstRate}% + SGST ${cgstRate}% (Total ${cgstRate * 2}%) to all items`,
        'success'
      );
    }
  };

  // Update Item field
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'isTaxable') {
      const isTax = Boolean(value);
      item.isTaxable = isTax;
      if (!isTax) {
        item.cgstRate = 0;
        item.cgstAmount = 0;
        item.sgstRate = 0;
        item.sgstAmount = 0;
        item.igstRate = 0;
        item.igstAmount = 0;
        item.totalAmount = item.taxableAmount;
      } else {
        const prod = products.find((p) => p.id === item.productId);
        const defGst = prod?.gstRate || 18;
        const calc = calculateItemTaxes(
          item.quantity,
          item.rate,
          defGst,
          company.stateCode,
          customerStateCode,
          isIntraState ? { cgstRate: 9, sgstRate: 9 } : { igstRate: 18 },
          true
        );
        item.taxableAmount = calc.taxableAmount;
        item.cgstRate = calc.cgstRate;
        item.cgstAmount = calc.cgstAmount;
        item.sgstRate = calc.sgstRate;
        item.sgstAmount = calc.sgstAmount;
        item.igstRate = calc.igstRate;
        item.igstAmount = calc.igstAmount;
        item.totalAmount = calc.totalAmount;
      }
    } else if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        item.description = prod.name;
        item.hsn = prod.hsn;
        item.unit = prod.defaultUnit;
        item.rate = prod.defaultRate;
        const calc = calculateItemTaxes(
          item.quantity,
          prod.defaultRate,
          prod.gstRate,
          company.stateCode,
          customerStateCode,
          undefined,
          isGstApplicable
        );
        item.taxableAmount = calc.taxableAmount;
        item.cgstRate = calc.cgstRate;
        item.cgstAmount = calc.cgstAmount;
        item.sgstRate = calc.sgstRate;
        item.sgstAmount = calc.sgstAmount;
        item.igstRate = calc.igstRate;
        item.igstAmount = calc.igstAmount;
        item.totalAmount = calc.totalAmount;
      }
    } else if (field === 'cgstRate') {
      // Sync SGST when CGST rate is changed (e.g. 6% CGST -> 6% SGST, 9% CGST -> 9% SGST)
      const newRate = Number(value);
      item.cgstRate = newRate;
      item.sgstRate = newRate;
      const calc = calculateItemTaxes(
        item.quantity,
        item.rate,
        newRate * 2,
        company.stateCode,
        customerStateCode,
        { cgstRate: newRate, sgstRate: newRate },
        isGstApplicable
      );
      item.taxableAmount = calc.taxableAmount;
      item.cgstRate = calc.cgstRate;
      item.cgstAmount = calc.cgstAmount;
      item.sgstRate = calc.sgstRate;
      item.sgstAmount = calc.sgstAmount;
      item.igstRate = 0;
      item.igstAmount = 0;
      item.totalAmount = calc.totalAmount;
    } else if (field === 'sgstRate') {
      const newRate = Number(value);
      item.sgstRate = newRate;
      const calc = calculateItemTaxes(
        item.quantity,
        item.rate,
        item.cgstRate + newRate,
        company.stateCode,
        customerStateCode,
        { cgstRate: item.cgstRate, sgstRate: newRate },
        isGstApplicable
      );
      item.taxableAmount = calc.taxableAmount;
      item.sgstRate = calc.sgstRate;
      item.sgstAmount = calc.sgstAmount;
      item.totalAmount = calc.totalAmount;
    } else if (field === 'igstRate') {
      const newRate = Number(value);
      item.igstRate = newRate;
      const calc = calculateItemTaxes(
        item.quantity,
        item.rate,
        newRate,
        company.stateCode,
        customerStateCode,
        { igstRate: newRate },
        isGstApplicable
      );
      item.taxableAmount = calc.taxableAmount;
      item.igstRate = calc.igstRate;
      item.igstAmount = calc.igstAmount;
      item.totalAmount = calc.totalAmount;
    } else if (field === 'quantity' || field === 'rate') {
      const prod = products.find((p) => p.id === item.productId);
      const defaultGstRate = prod?.gstRate || 18;

      const calc = calculateItemTaxes(
        field === 'quantity' ? Number(value) : item.quantity,
        field === 'rate' ? Number(value) : item.rate,
        defaultGstRate,
        company.stateCode,
        customerStateCode,
        {
          cgstRate: item.cgstRate,
          sgstRate: item.sgstRate,
          igstRate: item.igstRate,
        },
        isGstApplicable
      );

      item.taxableAmount = calc.taxableAmount;
      item.cgstRate = calc.cgstRate;
      item.cgstAmount = calc.cgstAmount;
      item.sgstRate = calc.sgstRate;
      item.sgstAmount = calc.sgstAmount;
      item.igstRate = calc.igstRate;
      item.igstAmount = calc.igstAmount;
      item.totalAmount = calc.totalAmount;
    }

    updated[index] = item;
    setItems(updated);
  };

  // Add Item
  const handleAddItem = () => {
    const defaultProd = products[0];
    const calc = calculateItemTaxes(
      1,
      defaultProd?.defaultRate || 0,
      defaultProd?.gstRate || 18,
      company.stateCode,
      customerStateCode,
      undefined,
      isGstApplicable
    );

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: defaultProd?.id || '',
      description: defaultProd?.name || 'Powder Coating Job Work',
      hsn: defaultProd?.hsn || '998898',
      quantity: 1,
      unit: defaultProd?.defaultUnit || 'KGS',
      rate: defaultProd?.defaultRate || 0,
      taxableAmount: calc.taxableAmount,
      cgstRate: isGstApplicable ? calc.cgstRate : 0,
      cgstAmount: isGstApplicable ? calc.cgstAmount : 0,
      sgstRate: isGstApplicable ? calc.sgstRate : 0,
      sgstAmount: isGstApplicable ? calc.sgstAmount : 0,
      igstRate: isGstApplicable ? calc.igstRate : 0,
      igstAmount: isGstApplicable ? calc.igstAmount : 0,
      totalAmount: isGstApplicable ? calc.totalAmount : calc.taxableAmount,
    };

    setItems([...items, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast('Cannot delete', 'Invoice must have at least one line item', 'error');
      return;
    }
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  // Calculated totals
  const totals = calculateInvoiceTotals(items, isManualRoundOff ? customRoundOff : null);

  // Sync Ship To if "same as billing" is checked
  useEffect(() => {
    if (sameAsBilling) {
      setShipToName(customerName);
      setShippingAddress(billingAddress);
      setShipToState(customerState);
      setShipToStateCode(customerStateCode);
      setShipToGstin(customerGstin);
      setShipToMobile(customerMobile);
    }
  }, [sameAsBilling, customerName, billingAddress, customerState, customerStateCode, customerGstin, customerMobile]);

  // Handle Quick Add Customer Submit
  const handleQuickAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) {
      showToast('Name Required', 'Please enter customer name', 'error');
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: quickCustName.trim().toUpperCase(),
      billingAddress: quickCustAddress.trim(),
      shippingAddress: quickCustAddress.trim(),
      state: quickCustState,
      stateCode: quickCustStateCode,
      gstin: quickCustGstin.trim().toUpperCase(),
      mobile: quickCustMobile.trim(),
      createdAt: new Date().toISOString(),
    };

    onQuickAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setCustomerName(newCust.name);
    setBillingAddress(newCust.billingAddress);
    setCustomerState(newCust.state);
    setCustomerStateCode(newCust.stateCode);
    setCustomerGstin(newCust.gstin);
    setCustomerMobile(newCust.mobile);

    setShowQuickCustomerModal(false);
    recalculateAllItems(newCust.stateCode);
    showToast('Customer Created', `${newCust.name} added to Customer Master`, 'success');
  };

  // Handle Save
  const handleFormSubmit = (e: React.FormEvent, andView = false) => {
    e.preventDefault();

    if (!invoiceNo.trim()) {
      showToast('Invoice Number required', 'Please provide an invoice number', 'error');
      return;
    }
    if (!customerName.trim()) {
      showToast('Customer Name required', 'Please select or enter customer details', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('No Items', 'Please add at least one line item', 'error');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      if (!itm.description.trim()) {
        showToast('Item Error', `Description missing on row ${i + 1}`, 'error');
        return;
      }
      if (itm.quantity <= 0) {
        showToast('Item Error', `Quantity must be greater than 0 on row ${i + 1}`, 'error');
        return;
      }
      if (itm.rate < 0) {
        showToast('Item Error', `Rate cannot be negative on row ${i + 1}`, 'error');
        return;
      }
    }

    const invoiceToSave: Invoice = {
      id: initialInvoice?.id || `inv-${Date.now()}`,
      invoiceNo: invoiceNo.trim(),
      invoiceDate,
      challanNo: challanNo.trim(),
      challanDate: challanDate || undefined,
      poNo: poNo.trim(),
      poDate: poDate || undefined,

      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      billingAddress: billingAddress.trim(),
      customerState: customerState.trim(),
      customerStateCode: customerStateCode.trim(),
      customerGstin: customerGstin.trim().toUpperCase(),
      customerMobile: customerMobile.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPan: customerPan.trim().toUpperCase() || undefined,

      shipToName: (sameAsBilling ? customerName : shipToName).trim(),
      shippingAddress: (sameAsBilling ? billingAddress : shippingAddress).trim(),
      shipToState: sameAsBilling ? customerState : shipToState,
      shipToStateCode: sameAsBilling ? customerStateCode : shipToStateCode,
      shipToGstin: (sameAsBilling ? customerGstin : shipToGstin).trim().toUpperCase(),
      shipToMobile: (sameAsBilling ? customerMobile : shipToMobile).trim(),

      items,
      totalQuantity: totals.totalQuantity,
      taxableAmount: totals.taxableAmount,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      igstTotal: totals.igstTotal,
      totalTax: totals.totalTax,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountInWords: totals.amountInWords,

      isGstApplicable,
      reverseCharge,
      vehicleNo: vehicleNo.trim() || undefined,
      transportMode: transportMode.trim() || undefined,
      notes: notes.trim(),
      terms,
      paymentStatus,
      paymentMode,
      copyType,

      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(invoiceToSave, andView);
  };

  const isIntraState = customerStateCode === company.stateCode;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {isEditing ? `Edit Invoice: ${initialInvoice?.invoiceNo}` : 'Create New GST Tax Invoice'}
            </h2>
            <p className="text-xs text-slate-500">
              Tax calculation: {isIntraState ? 'CGST (9%) + SGST (9%) [Maharashtra]' : 'IGST (18%) [Inter-State]'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleFormSubmit(e, false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Invoice</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleFormSubmit(e, true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Save & View / Print</span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleFormSubmit(e, true)} className="space-y-6">
        {/* Section 1: Invoice Header & Meta */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Invoice Metadata</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Challan Number
              </label>
              <input
                type="text"
                placeholder="e.g. CH-894"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Challan Date
              </label>
              <input
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO / Order Number
              </label>
              <input
                type="text"
                placeholder="e.g. PO/2026/891"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO Date
              </label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                placeholder="e.g. MH-14-GH-4521"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transport Mode
              </label>
              <input
                type="text"
                placeholder="e.g. Road / Tempo"
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bill To & Ship To */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill To */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Details of Receiver (Bill To)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>

            {/* Quick Select Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer from Master
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Choose Existing Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.gstin || 'No GST'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                placeholder="e.g. MECON SYSTEMS"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Address *
              </label>
              <textarea
                rows={2}
                placeholder="Gat No, Village, Taluka, District, Pin Code"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State *
                </label>
                <select
                  value={customerState}
                  onChange={(e) => {
                    const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                    setCustomerState(e.target.value);
                    if (st) {
                      setCustomerStateCode(st.code);
                      recalculateAllItems(st.code);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State Code *
                </label>
                <input
                  type="text"
                  value={customerStateCode}
                  onChange={(e) => {
                    setCustomerStateCode(e.target.value);
                    recalculateAllItems(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-center font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  placeholder="27XXXXXXXXXXXXX"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile / Phone
                </label>
                <input
                  type="text"
                  placeholder="10-digit number"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Ship To */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Details of Consignee (Ship To)</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Same as Bill To</span>
              </label>
            </div>

            {!sameAsBilling && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consignee Name
                  </label>
                  <input
                    type="text"
                    value={shipToName}
                    onChange={(e) => setShipToName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery / Shipping Address
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shipping State
                    </label>
                    <select
                      value={shipToState}
                      onChange={(e) => {
                        const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                        setShipToState(e.target.value);
                        if (st) setShipToStateCode(st.code);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st.code} value={st.name}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State Code
                    </label>
                    <input
                      type="text"
                      value={shipToStateCode}
                      onChange={(e) => setShipToStateCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Consignee GSTIN
                    </label>
                    <input
                      type="text"
                      value={shipToGstin}
                      onChange={(e) => setShipToGstin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Consignee Mobile
                    </label>
                    <input
                      type="text"
                      value={shipToMobile}
                      onChange={(e) => setShipToMobile(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {sameAsBilling && (
              <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Delivery will be made to Billing Address:</p>
                <p className="font-bold text-slate-950 uppercase">{customerName || 'Customer Not Selected'}</p>
                <p>{billingAddress || 'Address will automatically match billing address.'}</p>
                <p className="text-slate-500 pt-1">
                  State: {customerState} ({customerStateCode}) | GSTIN: {customerGstin || '-'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Item Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Invoice Items & GST Rates</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Supply: {company.state} (Code {company.stateCode}) &rarr; {customerState} (Code {customerStateCode})
              </p>
            </div>

            {/* GST Applicable Toggle: YES / NO (Customer GST preference) */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 px-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900">Customer GST / Taxable Bill:</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                    isGstApplicable ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isGstApplicable ? 'YES - GST Bill' : 'NO - Without GST (0%)'}
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-600">
                  {isGstApplicable
                    ? 'ग्राहक ला GST बिल हवे आहे (CGST + SGST लागू आहे)'
                    : 'ग्राहक ला GST नको आहे (Bill of Supply / 0% Tax)'}
                </span>
              </div>
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleToggleGst(true)}
                  className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                    isGstApplicable
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  YES (Taxable)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGst(false)}
                  className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                    !isGstApplicable
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  NO (Non-GST)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Quick GST Presets Bar (6%, 9%, 12%, 18% or NO GST) */}
          <div className="bg-slate-50/90 p-2.5 px-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Quick Set GST for All Items:</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">(CGST & SGST options: 6%, 9%, 12%, 18%)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickApplyGstPreset(6, true)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                title="6% CGST + 6% SGST = 12% Total GST"
              >
                6% + 6% (12%)
              </button>
              <button
                type="button"
                onClick={() => handleQuickApplyGstPreset(9, true)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-xs font-black text-blue-900 transition-colors shadow-2xs"
                title="9% CGST + 9% SGST = 18% Total GST (Coating Standard)"
              >
                ★ 9% + 9% (18% Coating)
              </button>
              <button
                type="button"
                onClick={() => handleQuickApplyGstPreset(12, true)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                title="12% CGST + 12% SGST = 24% Total GST"
              >
                12% + 12% (24%)
              </button>
              <button
                type="button"
                onClick={() => handleQuickApplyGstPreset(18, true)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                title="18% CGST + 18% SGST = 36% Total GST"
              >
                18% + 18% (36%)
              </button>
              <button
                type="button"
                onClick={() => handleQuickApplyGstPreset(0, false)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded text-xs font-black text-amber-900 transition-colors shadow-2xs"
                title="Customer does not want GST (Non-GST / 0% Tax)"
              >
                NO GST (0% Non-Taxable)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 min-w-[200px]">Description / Product</th>
                  <th className="p-2.5 w-24 text-center">HSN/SAC</th>
                  <th className="p-2.5 w-28 sm:w-32 text-center text-xs">Qty (नग/प्रमाण)</th>
                  <th className="p-2.5 w-20 text-center">Unit</th>
                  <th className="p-2.5 w-24 text-right">Rate (₹)</th>
                  <th className="p-2.5 w-32 text-right">
                    <div>Taxable (₹)</div>
                    <div className="text-[8.5px] font-normal text-slate-600">GST: YES / NO</div>
                  </th>

                  {!isGstApplicable ? (
                    <th className="p-2.5 w-40 text-center text-amber-800 bg-amber-50">
                      <div>GST (Non-Taxable)</div>
                      <div className="text-[8.5px] font-normal text-amber-700">0% Tax / Bill of Supply</div>
                    </th>
                  ) : isIntraState ? (
                    <>
                      <th className="p-2.5 w-36 text-right">
                        <div>CGST %</div>
                        <div className="text-[8.5px] font-bold text-blue-700">6%, 9%, 12%, 18%</div>
                      </th>
                      <th className="p-2.5 w-36 text-right">
                        <div>SGST %</div>
                        <div className="text-[8.5px] font-bold text-blue-700">6%, 9%, 12%, 18%</div>
                      </th>
                    </>
                  ) : (
                    <th className="p-2.5 w-40 text-right">
                      <div>IGST %</div>
                      <div className="text-[8.5px] font-bold text-blue-700">12%, 18%, 24%, 36%</div>
                    </th>
                  )}

                  <th className="p-2.5 w-28 text-right">Total (₹)</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">{index + 1}</td>
                    
                    {/* Description & Product Picker */}
                    <td className="p-2.5 space-y-1">
                      {products.length > 0 && (
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-700 mb-1"
                        >
                          <option value="">-- Quick pick from Product Master --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (HSN: {p.hsn}, ₹{p.defaultRate}/{p.defaultUnit})
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        placeholder="Description of goods or powder coating work"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* HSN */}
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-center text-xs"
                      />
                    </td>

                    {/* Qty */}
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        placeholder="Qty"
                        className="w-full min-w-[95px] px-3 py-2.5 border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg font-mono text-center font-black text-sm sm:text-base text-slate-900 bg-white shadow-xs"
                      />
                    </td>

                    {/* Unit */}
                    <td className="p-2.5">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded text-center text-xs"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Rate */}
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        required
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-right font-semibold text-xs"
                      />
                    </td>

                    {/* Taxable Amount + Option for Customer GST YES / NO */}
                    <td className="p-2.5 text-right font-mono space-y-1">
                      <div className="font-bold text-slate-900 text-xs">
                        ₹{formatIndianCurrency(item.taxableAmount, false)}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'isTaxable', true)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                            (item.isTaxable !== false && isGstApplicable)
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Customer wants GST: YES"
                        >
                          GST: YES
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'isTaxable', false)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all ${
                            (item.isTaxable === false || !isGstApplicable)
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Customer does not want GST: NO (0% Tax)"
                        >
                          NO
                        </button>
                      </div>
                    </td>

                    {/* Tax Amounts */}
                    {(!isGstApplicable || item.isTaxable === false) ? (
                      <td className="p-2.5 text-center bg-amber-50/50" colSpan={isIntraState ? 2 : 1}>
                        <div className="inline-flex flex-col items-center">
                          <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded">
                            0% (Non-GST / Exempt)
                          </span>
                          <span className="text-[9px] text-amber-700 mt-0.5">Taxable ₹ equals Total ₹</span>
                        </div>
                      </td>
                    ) : isIntraState ? (
                      <>
                        {/* CGST Select & 6%, 9%, 12%, 18% Quick Buttons */}
                        <td className="p-2.5 text-right space-y-1.5 min-w-[135px]">
                          <div className="flex items-center justify-end gap-1">
                            {PRIMARY_CGST_RATES.map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => handleItemChange(index, 'cgstRate', rate)}
                                className={`px-1.5 py-0.5 rounded text-[9.5px] font-black transition-all ${
                                  item.cgstRate === rate
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title={`Set CGST to ${rate}% (Total GST ${rate * 2}%)`}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                          <select
                            value={item.cgstRate}
                            onChange={(e) => handleItemChange(index, 'cgstRate', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded font-bold text-slate-800 bg-white"
                          >
                            <option value={6}>6% (Total 12%)</option>
                            <option value={9}>9% (Total 18% - Standard)</option>
                            <option value={12}>12% (Total 24%)</option>
                            <option value={18}>18% (Total 36%)</option>
                            <option value={2.5}>2.5% (Total 5%)</option>
                            <option value={0}>0% (Non-GST)</option>
                            {![0, 2.5, 6, 9, 12, 18].includes(item.cgstRate) && (
                              <option value={item.cgstRate}>{item.cgstRate}%</option>
                            )}
                          </select>
                          <span className="text-[10.5px] font-mono text-slate-900 font-bold block">
                            ₹{formatIndianCurrency(item.cgstAmount, false)}
                          </span>
                        </td>

                        {/* SGST Select & 6%, 9%, 12%, 18% Quick Buttons */}
                        <td className="p-2.5 text-right space-y-1.5 min-w-[135px]">
                          <div className="flex items-center justify-end gap-1">
                            {PRIMARY_CGST_RATES.map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => handleItemChange(index, 'sgstRate', rate)}
                                className={`px-1.5 py-0.5 rounded text-[9.5px] font-black transition-all ${
                                  item.sgstRate === rate
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title={`Set SGST to ${rate}%`}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                          <select
                            value={item.sgstRate}
                            onChange={(e) => handleItemChange(index, 'sgstRate', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded font-bold text-slate-800 bg-white"
                          >
                            <option value={6}>6%</option>
                            <option value={9}>9% (Default)</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={2.5}>2.5%</option>
                            <option value={0}>0%</option>
                            {![0, 2.5, 6, 9, 12, 18].includes(item.sgstRate) && (
                              <option value={item.sgstRate}>{item.sgstRate}%</option>
                            )}
                          </select>
                          <span className="text-[10.5px] font-mono text-slate-900 font-bold block">
                            ₹{formatIndianCurrency(item.sgstAmount, false)}
                          </span>
                        </td>
                      </>
                    ) : (
                      /* IGST Select & 12%, 18%, 24%, 36% Quick Buttons */
                      <td className="p-2.5 text-right space-y-1.5 min-w-[145px]">
                        <div className="flex items-center justify-end gap-1">
                          {PRIMARY_IGST_RATES.map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => handleItemChange(index, 'igstRate', rate)}
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-black transition-all ${
                                item.igstRate === rate
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title={`Set IGST to ${rate}%`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                        <select
                          value={item.igstRate}
                          onChange={(e) => handleItemChange(index, 'igstRate', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded font-bold text-slate-800 bg-white"
                        >
                          <option value={12}>12% IGST (6% + 6%)</option>
                          <option value={18}>18% IGST (9% + 9%)</option>
                          <option value={24}>24% IGST (12% + 12%)</option>
                          <option value={36}>36% IGST (18% + 18%)</option>
                          <option value={5}>5% IGST (2.5% + 2.5%)</option>
                          <option value={0}>0% IGST (Non-GST)</option>
                          {![0, 5, 12, 18, 24, 36].includes(item.igstRate) && (
                            <option value={item.igstRate}>{item.igstRate}%</option>
                          )}
                        </select>
                        <span className="text-[10.5px] font-mono text-slate-900 font-bold block">
                          ₹{formatIndianCurrency(item.igstAmount, false)}
                        </span>
                      </td>
                    )}

                    {/* Line Total */}
                    <td className="p-2.5 text-right font-mono font-bold text-slate-950">
                      {formatIndianCurrency(item.totalAmount, false)}
                    </td>

                    {/* Remove Action */}
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Totals & Grand Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notes & Terms (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Payment & Additional Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit / Account</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Remarks / Job Work Notes
              </label>
              <textarea
                rows={2}
                placeholder="Job work instructions, batch number, shade code details, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount in words live preview */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">
                Amount in Words (Auto Generated):
              </span>
              <p className="text-xs font-bold text-blue-950 uppercase mt-0.5 font-mono">
                {totals.amountInWords}
              </p>
            </div>
          </div>

          {/* Aggregate Calculation Card (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Financial Summary</span>
              <span className="text-xs font-mono font-medium text-slate-500">
                Qty: {totals.totalQuantity}
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 font-medium">Subtotal (Taxable Amount):</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatIndianCurrency(totals.taxableAmount)}
                </span>
              </div>

              {!isGstApplicable ? (
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>GST (Tax):</span>
                    <span>₹0.00 (Non-GST / Exempt)</span>
                  </div>
                  <p className="text-[10px] text-amber-700">
                    Non-GST Supply mode active. No tax charged on this bill.
                  </p>
                </div>
              ) : isIntraState ? (
                <>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-600">Central GST (CGST):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(totals.cgstTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-600">State GST (SGST):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(totals.sgstTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-600 font-semibold">Total GST (Tax):</span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatIndianCurrency(totals.totalTax)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-600">Integrated GST (IGST):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(totals.igstTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-600 font-semibold">Total GST (Tax):</span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatIndianCurrency(totals.totalTax)}
                    </span>
                  </div>
                </>
              )}

              {/* Round Off with manual toggle */}
              <div className="py-2 border-t border-slate-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span>Round Off:</span>
                    <button
                      type="button"
                      onClick={() => setIsManualRoundOff(!isManualRoundOff)}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      {isManualRoundOff ? '(Auto)' : '(Custom)'}
                    </button>
                  </span>
                  {isManualRoundOff ? (
                    <input
                      type="number"
                      step="0.01"
                      value={customRoundOff}
                      onChange={(e) => setCustomRoundOff(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-0.5 border border-slate-300 rounded font-mono text-right text-xs"
                    />
                  ) : (
                    <span className="font-mono font-semibold text-slate-700">
                      {totals.roundOff >= 0 ? `+${totals.roundOff.toFixed(2)}` : totals.roundOff.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t-2 border-slate-900">
                <div className="p-3 bg-slate-900 text-white rounded-lg flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Grand Total (INR)
                    </span>
                    <span className="text-[9px] text-slate-400">Inclusive of all taxes</span>
                  </div>
                  <span className="font-mono font-black text-xl text-white">
                    {formatIndianCurrency(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, true)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Save & Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleFormSubmit(e, false)}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Invoice as Draft</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Customer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Quickly create and attach customer details to this invoice
            </p>

            <form onSubmit={handleQuickAddCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TATA MOTORS VENDOR"
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Gat / MIDC / Taluka"
                  value={quickCustAddress}
                  onChange={(e) => setQuickCustAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={quickCustState}
                    onChange={(e) => {
                      const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                      setQuickCustState(e.target.value);
                      if (st) setQuickCustStateCode(st.code);
                    }}
                    className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State Code
                  </label>
                  <input
                    type="text"
                    value={quickCustStateCode}
                    onChange={(e) => setQuickCustStateCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="27XXXXXXXXXXXXX"
                    value={quickCustGstin}
                    onChange={(e) => setQuickCustGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="Mobile number"
                    value={quickCustMobile}
                    onChange={(e) => setQuickCustMobile(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
