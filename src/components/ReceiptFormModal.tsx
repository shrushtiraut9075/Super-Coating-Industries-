import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building,
  User,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle,
  HelpCircle,
  Printer,
  Save,
} from 'lucide-react';
import { PaymentReceipt, Customer, Invoice, PaymentMode, CompanyProfile } from '../types';
import { getTodayDateString, formatIndianCurrency } from '../utils/formatters';
import { numberToIndianWords } from '../utils/numberToWords';
import { getNextReceiptNumber, getReceipts } from '../services/storage';
import { useToast } from './Toast';

interface ReceiptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (receipt: PaymentReceipt, andPrint?: boolean) => void;
  customers: Customer[];
  invoices: Invoice[];
  company: CompanyProfile;
  initialInvoice?: Invoice | null;
  initialCustomer?: Customer | null;
}

export const ReceiptFormModal: React.FC<ReceiptFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customers,
  invoices,
  company,
  initialInvoice,
  initialCustomer,
}) => {
  const { showToast } = useToast();

  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(getTodayDateString());
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankName, setBankName] = useState(company.bankName || 'Union Bank of India');
  const [notes, setNotes] = useState('Payment received with thanks');
  const [amountInWords, setAmountInWords] = useState('');

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setReceiptNo(getNextReceiptNumber());
      setReceiptDate(getTodayDateString());

      if (initialInvoice) {
        setSelectedCustomerId(initialInvoice.customerId || '');
        setSelectedInvoiceId(initialInvoice.id);

        // Calculate pending amount on this invoice
        const allReceipts = getReceipts();
        const paidSoFar = allReceipts
          .filter((r) => r.invoiceId === initialInvoice.id)
          .reduce((sum, r) => sum + (r.amount || 0), 0);
        const due = Math.max(0, initialInvoice.grandTotal - paidSoFar);

        setAmount(due > 0 ? due : initialInvoice.grandTotal);
        setAmountInWords(numberToIndianWords(due > 0 ? due : initialInvoice.grandTotal));
        setNotes(`Payment received against Invoice ${initialInvoice.invoiceNo}`);
        setPaymentMode(initialInvoice.paymentMode || 'Bank Transfer');
      } else if (initialCustomer) {
        setSelectedCustomerId(initialCustomer.id);
        setSelectedInvoiceId('');
        setAmount(0);
        setAmountInWords('');
      } else {
        setSelectedCustomerId('');
        setSelectedInvoiceId('');
        setAmount(0);
        setAmountInWords('');
        setNotes('Payment received with thanks');
      }
    }
  }, [isOpen, initialInvoice, initialCustomer]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filter invoices for selected customer
  const customerInvoices = useMemo(() => {
    if (!selectedCustomerId && !selectedCustomer) return [];
    return invoices.filter((inv) => {
      if (inv.paymentStatus === 'Cancelled') return false;
      if (selectedCustomerId && inv.customerId === selectedCustomerId) return true;
      if (selectedCustomer && inv.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()) return true;
      return false;
    });
  }, [invoices, selectedCustomerId, selectedCustomer]);

  // Selected invoice object
  const selectedInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  // Calculate previously paid for selected invoice
  const previouslyPaid = useMemo(() => {
    if (!selectedInvoice) return 0;
    const allReceipts = getReceipts();
    return allReceipts
      .filter((r) => r.invoiceId === selectedInvoice.id)
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [selectedInvoice]);

  const invoiceBalanceDue = useMemo(() => {
    if (!selectedInvoice) return 0;
    return Math.max(0, selectedInvoice.grandTotal - previouslyPaid);
  }, [selectedInvoice, previouslyPaid]);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) return;

    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      if (!selectedCustomerId && inv.customerId) {
        setSelectedCustomerId(inv.customerId);
      }
      const allReceipts = getReceipts();
      const prev = allReceipts
        .filter((r) => r.invoiceId === inv.id)
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const due = Math.max(0, inv.grandTotal - prev);

      const payAmt = due > 0 ? due : inv.grandTotal;
      setAmount(payAmt);
      setAmountInWords(numberToIndianWords(payAmt));
      setNotes(`Payment received against Invoice ${inv.invoiceNo}`);
    }
  };

  const handleAmountChange = (val: number) => {
    const cleanVal = isNaN(val) ? 0 : Math.max(0, val);
    setAmount(cleanVal);
    setAmountInWords(numberToIndianWords(cleanVal));
  };

  const handleSelectFullPayment = () => {
    if (invoiceBalanceDue > 0) {
      handleAmountChange(invoiceBalanceDue);
    } else if (selectedInvoice) {
      handleAmountChange(selectedInvoice.grandTotal);
    }
  };

  const handleSubmit = (andPrint = false) => {
    if (!selectedCustomer && !selectedInvoice) {
      showToast('Validation Error', 'कृपया ग्राहक किंवा इन्व्हॉइस निवडा', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      showToast('Validation Error', 'कृपया योग्य रक्कम (Amount) टाका', 'error');
      return;
    }

    const customerName = selectedCustomer?.name || selectedInvoice?.customerName || 'Customer';
    const customerAddress = selectedCustomer?.billingAddress || selectedInvoice?.billingAddress || '';
    const customerGstin = selectedCustomer?.gstin || selectedInvoice?.customerGstin || '';
    const customerMobile = selectedCustomer?.mobile || selectedInvoice?.customerMobile || '';

    const invTotal = selectedInvoice ? selectedInvoice.grandTotal : amount;
    const balanceRemaining = selectedInvoice
      ? Math.max(0, invTotal - previouslyPaid - amount)
      : 0;

    let paymentType: 'Full Payment' | 'Part Payment' | 'Advance Payment' | 'On Account' = 'Full Payment';
    if (!selectedInvoice) {
      paymentType = 'On Account';
    } else if (balanceRemaining > 1) {
      paymentType = 'Part Payment';
    } else {
      paymentType = 'Full Payment';
    }

    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNo: receiptNo || getNextReceiptNumber(),
      receiptDate: receiptDate || getTodayDateString(),
      customerId: selectedCustomerId || selectedInvoice?.customerId,
      customerName,
      customerAddress,
      customerGstin,
      customerMobile,
      invoiceId: selectedInvoice?.id,
      invoiceNo: selectedInvoice?.invoiceNo,
      invoiceDate: selectedInvoice?.invoiceDate,
      invoiceTotal: invTotal,
      amount,
      previousPaid: previouslyPaid,
      balanceRemaining,
      paymentMode,
      referenceNo: referenceNo.trim(),
      bankName: bankName.trim(),
      paymentType,
      notes: notes.trim(),
      amountInWords: amountInWords || numberToIndianWords(amount),
      createdAt: new Date().toISOString(),
    };

    onSave(newReceipt, andPrint);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                <span>नवीन पेमेंट पावती (New Payment Receipt)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ग्राहकाकडून आलेले पेमेंट नोंदवून अधिकृत पावती तयार करा
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Top Row: Receipt No & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Receipt Number (पावती क्रमांक)
              </label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-blue-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                placeholder="REC-2026-27-001"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Receipt Date (पावतीची तारीख)
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Customer Name (ग्राहकाचे नाव) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedInvoiceId('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- ग्राहक निवडा (Select Customer) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.gstin ? `(${c.gstin})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Selection (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-bold">
                Against Invoice (कोणत्या बिलापोटी?)
              </label>
              <span className="text-[11px] text-slate-400">
                (पर्यायी - बिलाशिवाय ऑन अकाउंट सुद्धा करता येते)
              </span>
            </div>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- On Account / Advance (थेट ॲडव्हान्स किंवा खात्यावर) --</option>
              {(customerInvoices.length > 0 ? customerInvoices : invoices).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNo} | {inv.customerName} | Total: {formatIndianCurrency(inv.grandTotal)} ({inv.paymentStatus})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Balance Helper Banner (If invoice selected) */}
          {selectedInvoice && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-blue-900 font-bold block">
                  Invoice {selectedInvoice.invoiceNo}
                </span>
                <span className="text-blue-700 text-[11px]">
                  Total: {formatIndianCurrency(selectedInvoice.grandTotal)} | Already Paid: {formatIndianCurrency(previouslyPaid)}
                </span>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <span className="text-[10px] text-blue-600 block uppercase font-bold">
                    Balance Due
                  </span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    {formatIndianCurrency(invoiceBalanceDue)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectFullPayment}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                >
                  Pay Full
                </button>
              </div>
            </div>
          )}

          {/* Amount Received Input */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-emerald-950 font-black text-xs uppercase tracking-wide">
                Amount Received (मिळालेली रक्कम ₹) <span className="text-rose-500">*</span>
              </label>
              {selectedInvoice && invoiceBalanceDue > 0 && (
                <button
                  type="button"
                  onClick={handleSelectFullPayment}
                  className="text-emerald-700 hover:underline font-bold text-[11px]"
                >
                  पूर्ण रक्कम: {formatIndianCurrency(invoiceBalanceDue)}
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-500 text-base">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount || ''}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 border-2 border-emerald-400 rounded-lg text-lg font-mono font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Amount in Words */}
            <div className="text-[11px] text-emerald-900 font-medium">
              <span className="font-bold">रुपये अक्षरी: </span>
              <span className="italic">{amountInWords || 'Zero Rupees Only'}</span>
            </div>
          </div>

          {/* Payment Mode & Bank/Ref Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Payment Mode (पेमेंटचा प्रकार)
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                <option value="Cheque">Cheque (धनादेश)</option>
                <option value="Cash">Cash (रोख रक्कम)</option>
                <option value="NEFT/RTGS">IMPS / Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Ref / UTR / Cheque No.
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="उदा. UTR1234567 किंवा Cheque No."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bank Name & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="उदा. Union Bank of India"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Remarks / Notes (नोंद)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. Payment received with thanks"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            रद्द करा (Cancel)
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Receipt (फक्त जतन करा)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save & Print (पावती प्रिंट करा)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
