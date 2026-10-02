import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  Share2,
  Check,
  Building,
  Calendar,
  CreditCard,
  FileText,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { PaymentReceipt, CompanyProfile } from '../types';
import { formatIndianCurrency, formatDate } from '../utils/formatters';
import { generateReceiptPdf } from '../utils/receiptPdfGenerator';
import { useToast } from './Toast';
import { Logo } from './Logo';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  receipt: PaymentReceipt | null;
  company: CompanyProfile;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  receipt,
  company,
  onClose,
}) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [printBlobUrl, setPrintBlobUrl] = useState<string | null>(null);

  if (!isOpen || !receipt) return null;

  const invTotal = receipt.invoiceTotal || receipt.amount;
  const prevPaid = receipt.previousPaid || 0;
  const currentPaid = receipt.amount;
  const balanceDue =
    receipt.balanceRemaining !== undefined
      ? receipt.balanceRemaining
      : Math.max(0, invTotal - prevPaid - currentPaid);

  const handlePrint = () => {
    // 1. Attempt native browser window.print()
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print() failed:', e);
    }

    // 2. Generate vector PDF with autoPrint
    try {
      const doc = generateReceiptPdf(receipt, company);
      try {
        doc.autoPrint();
      } catch (apErr) {
        console.warn('autoPrint flag error:', apErr);
      }

      const safeNo = receipt.receiptNo.replace(/[\/\\]/g, '_');
      const fileName = `Receipt_${safeNo}.pdf`;

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPrintBlobUrl(url);

      doc.save(fileName);
      showToast('पावती तयार!', 'PDF डाऊनलोड झाली आहे. फाईल उघडून थेट प्रिंट करा.', 'success');
    } catch (err) {
      console.error('PDF print generation error:', err);
      showToast('Error', 'कृपया Download PDF बटणाचा वापर करा', 'error');
    }
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const doc = generateReceiptPdf(receipt, company);
      const safeNo = receipt.receiptNo.replace(/[\/\\]/g, '_');
      const fileName = `Payment_Receipt_${safeNo}.pdf`;
      doc.save(fileName);
      showToast('PDF Downloaded!', `पावती डाऊनलोड झाली: ${fileName}`, 'success');
    } catch (err) {
      console.error('Failed to generate receipt PDF:', err);
      showToast('Error', 'PDF तयार करताना त्रुटी आली', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const mobile = receipt.customerMobile ? receipt.customerMobile.replace(/\D/g, '') : '';
    const text = `*PAYMENT RECEIPT / पावती*
*SUPER COATING INDUSTRIES*
--------------------------------
*Receipt No:* ${receipt.receiptNo}
*Date:* ${formatDate(receipt.receiptDate)}
*Customer:* ${receipt.customerName}
--------------------------------
*Amount Received:* ${formatIndianCurrency(receipt.amount)}
*Amount in Words:* ${receipt.amountInWords}
*Payment Mode:* ${receipt.paymentMode}${receipt.referenceNo ? ` (Ref: ${receipt.referenceNo})` : ''}
${receipt.invoiceNo ? `*Against Invoice:* ${receipt.invoiceNo} (Total: ${formatIndianCurrency(invTotal)})` : ''}
${receipt.invoiceNo ? `*Balance Due:* ${formatIndianCurrency(balanceDue)}` : ''}
--------------------------------
Thank you for your business!
Super Coating Industries, Pune
Phone: ${company.mobile}`;

    const encodedText = encodeURIComponent(text);
    const targetUrl = mobile.length >= 10
      ? `https://wa.me/91${mobile.slice(-10)}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(targetUrl, '_blank');
    showToast('WhatsApp वर पाठवले', 'पावतीची माहिती WhatsApp वर शेअर करण्यात आली', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                <span>Payment Receipt</span>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  {receipt.receiptNo}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                पेमेंट पावती प्रिव्ह्यू व प्रिंट
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              title="Share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              title="Download Vector PDF"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/60 print:bg-white print:p-0">
          <div className="max-w-3xl mx-auto bg-white border-2 border-slate-900 rounded-xl p-5 sm:p-7 shadow-lg print:shadow-none print:border-2 print:border-black text-slate-900 text-xs font-sans">
            {/* Header Badge */}
            <div className="bg-slate-900 text-white py-1.5 px-4 rounded-lg flex items-center justify-between mb-4">
              <span className="font-bold tracking-wider text-[11px] uppercase">
                Official Payment Receipt / पेमेंट पावती
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                ORIGINAL VOUCHER
              </span>
            </div>

            {/* Company & Receipt Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                  <Logo variant="icon" className="w-full h-full" logoUrl={company.logoUrl} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h2 className="font-black text-base text-slate-900 tracking-tight leading-tight">
                    {company.name}
                  </h2>
                  {company.tagline && (
                    <p className="text-[10px] text-slate-500 font-medium">
                      {company.tagline}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-600 max-w-md leading-relaxed">
                    {company.address}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-700 pt-0.5">
                    GSTIN: <span className="font-mono text-slate-900">{company.gstin}</span> | PAN:{' '}
                    <span className="font-mono text-slate-900">{company.pan}</span> | Mob:{' '}
                    <span>{company.mobile}</span>
                  </p>
                </div>
              </div>

              {/* Receipt Meta Box */}
              <div className="sm:text-right shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[160px]">
                <div className="mb-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    Receipt Number
                  </span>
                  <span className="font-mono font-black text-sm text-blue-800">
                    {receipt.receiptNo}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    Receipt Date
                  </span>
                  <span className="font-semibold text-xs text-slate-800">
                    {formatDate(receipt.receiptDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Received With Thanks From */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Received with thanks from:
              </span>
              <p className="font-bold text-sm text-slate-900">
                {receipt.customerName}
              </p>
              <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                {receipt.customerGstin && (
                  <span>
                    GSTIN: <span className="font-mono font-semibold text-slate-800">{receipt.customerGstin}</span>
                  </span>
                )}
                {receipt.customerMobile && (
                  <span>
                    Contact: <span className="font-semibold text-slate-800">{receipt.customerMobile}</span>
                  </span>
                )}
                {receipt.customerAddress && (
                  <span>
                    Address: <span>{receipt.customerAddress}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Big Amount Highlight Banner */}
            <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">
                  The sum of Rupees (in words):
                </span>
                <p className="font-bold text-sm text-emerald-950 capitalize">
                  {receipt.amountInWords || 'Rupees Only'}
                </p>
              </div>

              <div className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-sm text-right shrink-0">
                <span className="text-[9px] uppercase block tracking-wider font-semibold text-emerald-100">
                  Amount Received
                </span>
                <span className="font-mono font-black text-xl text-white">
                  {formatIndianCurrency(receipt.amount)}
                </span>
              </div>
            </div>

            {/* Two-Column Details: Payment Mode & Invoice Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Payment Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Payment Details</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-900">{receipt.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Type:</span>
                    <span className="font-semibold text-slate-800">{receipt.paymentType || 'Full Payment'}</span>
                  </div>
                  {receipt.referenceNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ref / UTR / Cheque:</span>
                      <span className="font-mono font-bold text-slate-900">{receipt.referenceNo}</span>
                    </div>
                  )}
                  {receipt.bankName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Name:</span>
                      <span className="font-medium text-slate-800">{receipt.bankName}</span>
                    </div>
                  )}
                  {receipt.notes && (
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500">Remarks:</span>
                      <span className="text-slate-700 italic max-w-[180px] text-right truncate">
                        {receipt.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Breakdown */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Invoice & Balance Statement</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {receipt.invoiceNo || 'On Account / Advance'}
                    </span>
                  </div>
                  {receipt.invoiceDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(receipt.invoiceDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Total:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(invTotal)}
                    </span>
                  </div>
                  {prevPaid > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Previously Received:</span>
                      <span className="font-mono">{formatIndianCurrency(prevPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    <span>Current Payment:</span>
                    <span className="font-mono">{formatIndianCurrency(currentPaid)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span className="text-slate-600">Balance Due:</span>
                    <span
                      className={`font-mono ${
                        balanceDue > 0 ? 'text-rose-700 font-black' : 'text-slate-700'
                      }`}
                    >
                      {formatIndianCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details & Authorised Signatory Footer */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-4">
              <div className="text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 uppercase tracking-wider">
                  Company Bank Details for Payment:
                </p>
                <p className="font-mono text-slate-600">
                  Bank: <span className="font-bold text-slate-800">{company.bankName}</span> | A/C:{' '}
                  <span className="font-bold text-slate-800">{company.accountNumber}</span> | IFSC:{' '}
                  <span className="font-bold text-slate-800">{company.ifsc}</span> | Branch:{' '}
                  <span>{company.branch}</span>
                </p>
                <p className="text-[9px] text-slate-400 italic">
                  * Subject to realization of Cheque / NEFT. This is a computer-generated official receipt.
                </p>
              </div>

              {/* Signatory Box */}
              <div className="text-center shrink-0 w-48 space-y-2">
                <p className="text-[11px] font-bold text-slate-900">
                  For {company.name}
                </p>
                <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  Stamp & Signature
                </div>
                <p className="text-[11px] font-bold text-slate-700 pt-0.5 border-t border-slate-400">
                  Authorised Signatory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            A4 / Half Voucher format. Print किंवा Download करा.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (प्रिंट करा)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
