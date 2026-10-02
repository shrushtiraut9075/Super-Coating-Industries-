import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  Edit,
  Copy,
  Check,
  Building,
  Phone,
  Mail,
  FileCheck,
  ExternalLink,
  X,
  ReceiptText,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Invoice, CompanyProfile, InvoiceCopyType } from '../types';
import { formatIndianCurrency, formatDate } from '../utils/formatters';
import { generateInvoicePdf } from '../utils/pdfGenerator';
import { useToast } from './Toast';
import { Logo } from './Logo';

interface InvoicePrintViewProps {
  invoice: Invoice;
  company: CompanyProfile;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onDuplicate: (id: string) => void;
  onCreateReceipt?: (invoice: Invoice) => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  company,
  onBack,
  onEdit,
  onDuplicate,
  onCreateReceipt,
}) => {
  const { showToast } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [copyType, setCopyType] = useState<InvoiceCopyType>(invoice.copyType || 'Original for Recipient');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printBlobUrl, setPrintBlobUrl] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const isGstApplicable = invoice.isGstApplicable !== false;
  const isIntraState = (invoice.customerStateCode || '27') === (company.stateCode || '27');

  const copyOptions: InvoiceCopyType[] = [
    'Original for Recipient',
    'Duplicate for Transporter',
    'Triplicate for Supplier',
  ];

  const handlePrint = () => {
    // 1. Attempt native browser window.print()
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print() failed or blocked by sandbox:', e);
    }

    // 2. Prepare auto-print PDF with direct download and open link
    try {
      const doc = generateInvoicePdf(invoice, company, copyType);
      try {
        doc.autoPrint();
      } catch (apErr) {
        console.warn('autoPrint flag error:', apErr);
      }

      const safeInvoiceNo = invoice.invoiceNo.replace(/[\/\\]/g, '_');
      const fileName = `Tax_Invoice_${safeInvoiceNo}.pdf`;

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPrintBlobUrl(url);
      setShowPrintModal(true);

      // Also trigger auto download
      doc.save(fileName);
      showToast('इन्व्हॉइस तयार!', 'PDF डाऊनलोड झाली आहे. फाईल उघडून थेट प्रिंट (Ctrl+P) करा.', 'success');
    } catch (err) {
      console.error('PDF print generation error:', err);
      showToast('Error', 'कृपया Download PDF बटणाचा वापर करा', 'error');
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    showToast('Generating PDF...', 'Creating high-resolution vector A4 invoice', 'info');

    try {
      // 1. Generate clean, crystal-clear vector PDF natively with jsPDF
      const doc = generateInvoicePdf(invoice, company, copyType);
      const safeInvoiceNo = invoice.invoiceNo.replace(/[\/\\]/g, '_');
      const fileName = `Tax_Invoice_${safeInvoiceNo}.pdf`;
      doc.save(fileName);
      showToast('PDF Downloaded!', `Saved as ${fileName}`, 'success');
    } catch (err) {
      console.error('Vector PDF error, attempting fallback:', err);
      // Fallback to html2canvas if vector generation fails
      try {
        if (printAreaRef.current) {
          const element = printAreaRef.current;
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });
          const pdfWidth = 210;
          const imgHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, 297));
          const fileName = `Tax_Invoice_${invoice.invoiceNo.replace(/[\/\\]/g, '_')}.pdf`;
          pdf.save(fileName);
          showToast('PDF Downloaded!', `Saved as ${fileName}`, 'success');
          return;
        }
      } catch (fallbackErr) {
        console.error('All PDF generation methods failed:', fallbackErr);
      }
      showToast('Error creating PDF', 'Please use the Print Invoice button to Save as PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Invoice {invoice.invoiceNo}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  invoice.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.paymentStatus === 'Pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </h2>
            <p className="text-xs text-slate-500">Dated: {formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>

        {/* Copy Selector & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            {copyOptions.map((type) => (
              <button
                key={type}
                onClick={() => setCopyType(type)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  copyType === type
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type.replace(' for ', ' - ')}
              </button>
            ))}
          </div>

          {onCreateReceipt && (
            <button
              onClick={() => onCreateReceipt(invoice)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs transition-colors"
              title="पेमेंट पावती तयार करा (Create Payment Receipt)"
            >
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <span>+ Receipt</span>
            </button>
          )}

          <button
            onClick={() => onEdit(invoice)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Edit this invoice"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            onClick={() => onDuplicate(invoice.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Duplicate invoice"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="flex justify-center bg-slate-100/60 p-2 sm:p-4 rounded-xl">
        <div
          ref={printAreaRef}
          id="invoice-print-sheet"
          className="print-area bg-white text-slate-900 shadow-md border border-slate-300 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-8 text-[11px] leading-tight font-sans mx-auto"
        >
          {/* Top Title & Copy Type Banner */}
          <div className="border-2 border-slate-900 mb-0">
            <div className="flex items-center justify-between border-b-2 border-slate-900 px-3 py-1.5 bg-slate-50">
              <span className="font-mono text-[10px] text-slate-700 font-semibold uppercase tracking-wider">
                {isGstApplicable
                  ? 'GST TAX INVOICE (RULE 46 OF CGST RULES)'
                  : 'BILL OF SUPPLY / INVOICE (NON-TAXABLE SUPPLY)'}
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
                {isGstApplicable ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
              </h1>
              <div className="flex items-center gap-1.5">
                {!isGstApplicable && (
                  <span className="font-bold text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-sm uppercase tracking-wide">
                    NON-GST
                  </span>
                )}
                <span className="font-bold text-[11px] bg-slate-900 text-white px-2.5 py-0.5 rounded-sm uppercase tracking-wide">
                  {copyType}
                </span>
              </div>
            </div>

            {/* Header: Company Details & Invoice Metadata */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
              {/* Left: Company Details (7 cols) */}
              <div className="col-span-7 p-3 flex items-start gap-3.5">
                {/* Official Brand Logo Box */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1.5 bg-white border-2 border-slate-900 rounded-sm shadow-xs overflow-hidden">
                  <Logo variant="icon" className="w-full h-full max-h-full object-contain" logoUrl={company.logoUrl} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div>
                    <h2 className="font-black text-base sm:text-lg tracking-tight uppercase text-slate-950 leading-tight">
                      {company.name}
                    </h2>
                    {company.tagline && (
                      <p className="text-[9.5px] font-semibold text-slate-600 uppercase tracking-wide mt-0.5">
                        {company.tagline}
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-800 space-y-0.5 leading-snug pt-0.5">
                    <p>{company.address}</p>
                    <p>
                      <span className="font-bold">State:</span> {company.state} &nbsp;|&nbsp;{' '}
                      <span className="font-bold">State Code:</span> {company.stateCode}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-medium pt-0.5">
                      <p>
                        <span className="font-bold text-slate-950">GSTIN:</span>{' '}
                        <span className="font-mono font-bold">{company.gstin}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-950">PAN:</span>{' '}
                        <span className="font-mono font-semibold">{company.pan}</span>
                      </p>
                    </div>
                    <p className="text-slate-700 text-[9.5px] pt-0.5">
                      <span className="font-bold">Mobile:</span> {company.mobile} &nbsp;|&nbsp;{' '}
                      <span className="font-bold">Email:</span> {company.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Invoice Metadata (5 cols) */}
              <div className="col-span-5 divide-y divide-slate-800 text-[10.5px]">
                <div className="p-2 grid grid-cols-2 bg-slate-50/70">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Invoice No:</span>
                    <span className="font-mono font-extrabold text-sm text-slate-950">{invoice.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Dated:</span>
                    <span className="font-semibold text-slate-900">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                </div>

                <div className="p-2 grid grid-cols-2">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Challan No:</span>
                    <span className="font-medium text-slate-900">{invoice.challanNo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Challan Date:</span>
                    <span className="font-medium text-slate-900">{formatDate(invoice.challanDate)}</span>
                  </div>
                </div>

                <div className="p-2 grid grid-cols-2">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">P.O. Number:</span>
                    <span className="font-medium text-slate-900">{invoice.poNo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">P.O. Date:</span>
                    <span className="font-medium text-slate-900">{formatDate(invoice.poDate)}</span>
                  </div>
                </div>

                <div className="p-2 grid grid-cols-2 bg-slate-50/40">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Place of Supply:</span>
                    <span className="font-bold text-slate-900">
                      {invoice.customerState || 'Maharashtra'} ({invoice.customerStateCode || '27'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Reverse Charge:</span>
                    <span className="font-bold text-slate-900">{invoice.reverseCharge ? 'YES' : 'NO'}</span>
                  </div>
                </div>

                {(invoice.vehicleNo || invoice.transportMode) && (
                  <div className="p-2 grid grid-cols-2">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Vehicle No:</span>
                      <span className="font-mono font-medium text-slate-900">{invoice.vehicleNo || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Transport Mode:</span>
                      <span className="font-medium text-slate-900">{invoice.transportMode || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To & Ship To Boxes */}
            <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
              {/* Bill To */}
              <div className="p-2.5 space-y-1">
                <div className="font-bold uppercase text-[10px] tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex justify-between items-center">
                  <span>DETAILS OF RECEIVER | BILLED TO:</span>
                  <span className="font-mono text-[9px] text-slate-500 font-normal">State Code: {invoice.customerStateCode || '27'}</span>
                </div>
                <p className="font-bold text-xs text-slate-950 uppercase">{invoice.customerName}</p>
                <p className="text-[10px] text-slate-800 leading-snug whitespace-pre-line">
                  {invoice.billingAddress}
                </p>
                <div className="pt-1 space-y-0.5 text-[10px]">
                  <p>
                    <span className="font-bold">State:</span> {invoice.customerState || 'Maharashtra'}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">GSTIN / UIN:</span>{' '}
                    <span className="font-mono font-bold text-slate-950">{invoice.customerGstin || '-'}</span>
                  </p>
                  {invoice.customerPan && (
                    <p>
                      <span className="font-bold">PAN:</span> <span className="font-mono">{invoice.customerPan}</span>
                    </p>
                  )}
                  {invoice.customerMobile && (
                    <p>
                      <span className="font-bold">Contact No:</span> {invoice.customerMobile}
                    </p>
                  )}
                </div>
              </div>

              {/* Ship To */}
              <div className="p-2.5 space-y-1">
                <div className="font-bold uppercase text-[10px] tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex justify-between items-center">
                  <span>DETAILS OF CONSIGNEE | SHIPPED TO:</span>
                  <span className="font-mono text-[9px] text-slate-500 font-normal">
                    State Code: {invoice.shipToStateCode || invoice.customerStateCode || '27'}
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-950 uppercase">
                  {invoice.shipToName || invoice.customerName}
                </p>
                <p className="text-[10px] text-slate-800 leading-snug whitespace-pre-line">
                  {invoice.shippingAddress || invoice.billingAddress}
                </p>
                <div className="pt-1 space-y-0.5 text-[10px]">
                  <p>
                    <span className="font-bold">State:</span>{' '}
                    {invoice.shipToState || invoice.customerState || 'Maharashtra'}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">GSTIN / UIN:</span>{' '}
                    <span className="font-mono font-bold text-slate-950">
                      {invoice.shipToGstin || invoice.customerGstin || '-'}
                    </span>
                  </p>
                  {(invoice.shipToMobile || invoice.customerMobile) && (
                    <p>
                      <span className="font-bold">Contact No:</span>{' '}
                      {invoice.shipToMobile || invoice.customerMobile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 text-slate-900 text-center font-bold">
                    <th className="border-r border-slate-900 p-1.5 w-8">Sr.</th>
                    <th className="border-r border-slate-900 p-1.5 text-left">Description of Goods / Job Work</th>
                    <th className="border-r border-slate-900 p-1.5 w-16">HSN/SAC</th>
                    <th className="border-r border-slate-900 p-1.5 w-14">Qty</th>
                    <th className="border-r border-slate-900 p-1.5 w-12">Unit</th>
                    <th className="border-r border-slate-900 p-1.5 w-16 text-right">Rate (₹)</th>
                    <th className="border-r border-slate-900 p-1.5 w-20 text-right">Taxable Amt (₹)</th>
                    
                    {!isGstApplicable ? (
                      <th className="border-r border-slate-900 p-1.5 w-24 text-center">
                        GST (Tax)
                        <div className="text-[9px] font-normal text-slate-600">0% (Non-GST)</div>
                      </th>
                    ) : isIntraState ? (
                      <>
                        <th className="border-r border-slate-900 p-1.5 w-20 text-right">
                          CGST
                          <div className="text-[9px] font-normal text-slate-600">Rate / Amt</div>
                        </th>
                        <th className="border-r border-slate-900 p-1.5 w-20 text-right">
                          SGST
                          <div className="text-[9px] font-normal text-slate-600">Rate / Amt</div>
                        </th>
                      </>
                    ) : (
                      <th className="border-r border-slate-900 p-1.5 w-24 text-right">
                        IGST
                        <div className="text-[9px] font-normal text-slate-600">Rate / Amt</div>
                      </th>
                    )}

                    <th className="p-1.5 w-24 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="border-r border-slate-900 p-1.5 text-center font-medium">{idx + 1}</td>
                      <td className="border-r border-slate-900 p-1.5 text-left font-semibold text-slate-950">
                        {item.description}
                      </td>
                      <td className="border-r border-slate-900 p-1.5 text-center font-mono">{item.hsn}</td>
                      <td className="border-r border-slate-900 p-1.5 text-center font-bold font-mono">
                        {item.quantity}
                      </td>
                      <td className="border-r border-slate-900 p-1.5 text-center font-medium text-slate-700">
                        {item.unit}
                      </td>
                      <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                        {formatIndianCurrency(item.rate, false)}
                      </td>
                      <td className="border-r border-slate-900 p-1.5 text-right font-mono font-semibold">
                        {formatIndianCurrency(item.taxableAmount, false)}
                      </td>

                      {!isGstApplicable ? (
                        <td className="border-r border-slate-900 p-1.5 text-center font-mono text-slate-600">
                          0% (₹0.00)
                        </td>
                      ) : isIntraState ? (
                        <>
                          <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                            <span className="text-[9px] text-slate-500 mr-1">{item.cgstRate}%</span>
                            {formatIndianCurrency(item.cgstAmount, false)}
                          </td>
                          <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                            <span className="text-[9px] text-slate-500 mr-1">{item.sgstRate}%</span>
                            {formatIndianCurrency(item.sgstAmount, false)}
                          </td>
                        </>
                      ) : (
                        <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                          <span className="text-[9px] text-slate-500 mr-1">{item.igstRate}%</span>
                          {formatIndianCurrency(item.igstAmount, false)}
                        </td>
                      )}

                      <td className="p-1.5 text-right font-mono font-bold text-slate-950">
                        {formatIndianCurrency(item.totalAmount, false)}
                      </td>
                    </tr>
                  ))}

                  {/* Empty rows filler for paper feel if items < 3 */}
                  {invoice.items.length < 2 && (
                    <tr className="h-10 text-transparent select-none">
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      {isIntraState ? (
                        <>
                          <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                          <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                        </>
                      ) : (
                        <td className="border-r border-slate-900 p-1.5">&nbsp;</td>
                      )}
                      <td className="p-1.5">&nbsp;</td>
                    </tr>
                  )}
                </tbody>

                {/* Subtotals & Taxes Footer */}
                <tfoot>
                  {/* Total Qty & Taxable Total row */}
                  <tr className="border-t-2 border-b border-slate-900 font-bold bg-slate-50">
                    <td colSpan={3} className="border-r border-slate-900 p-1.5 text-right uppercase">
                      Total
                    </td>
                    <td className="border-r border-slate-900 p-1.5 text-center font-mono">
                      {invoice.totalQuantity}
                    </td>
                    <td className="border-r border-slate-900 p-1.5"></td>
                    <td className="border-r border-slate-900 p-1.5"></td>
                    <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                      {formatIndianCurrency(invoice.taxableAmount, false)}
                    </td>

                    {!isGstApplicable ? (
                      <td className="border-r border-slate-900 p-1.5 text-center font-mono text-slate-500">
                        ₹0.00
                      </td>
                    ) : isIntraState ? (
                      <>
                        <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                          {formatIndianCurrency(invoice.cgstTotal, false)}
                        </td>
                        <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                          {formatIndianCurrency(invoice.sgstTotal, false)}
                        </td>
                      </>
                    ) : (
                      <td className="border-r border-slate-900 p-1.5 text-right font-mono">
                        {formatIndianCurrency(invoice.igstTotal, false)}
                      </td>
                    )}

                    <td className="p-1.5 text-right font-mono">
                      {formatIndianCurrency(
                        invoice.taxableAmount + (isGstApplicable ? (invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal) : 0),
                        false
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Calculations & Words Section */}
            <div className="grid grid-cols-12 border-t-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
              {/* Left Side: Amount in Words & Bank Details (7 cols) */}
              <div className="col-span-7 p-3 flex flex-col justify-between space-y-3">
                {/* Amount in words */}
                <div className="border border-slate-300 p-2.5 rounded-xs bg-slate-50/50">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">
                    Amount Chargeable (in words):
                  </span>
                  <p className="font-extrabold text-xs text-slate-950 uppercase tracking-wide leading-snug">
                    {invoice.amountInWords}
                  </p>
                </div>

                {/* Bank Details */}
                <div className="border border-slate-400 p-2.5 rounded-xs bg-white text-[10px]">
                  <div className="font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                    <span>COMPANY'S BANK DETAILS FOR NEFT / RTGS</span>
                    <span className="font-mono text-[9px] text-blue-700 font-semibold">DIRECT PAYMENT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <p>
                      <span className="text-slate-600 font-medium">Bank Name:</span>{' '}
                      <span className="font-bold text-slate-900">{company.bankName}</span>
                    </p>
                    <p>
                      <span className="text-slate-600 font-medium">Branch:</span>{' '}
                      <span className="font-bold text-slate-900">{company.branch}</span>
                    </p>
                    <p className="col-span-2">
                      <span className="text-slate-600 font-medium">A/C No:</span>{' '}
                      <span className="font-mono font-black text-slate-950 text-[11px] tracking-wide">
                        {company.accountNumber}
                      </span>
                    </p>
                    <p className="col-span-2">
                      <span className="text-slate-600 font-medium">IFSC Code:</span>{' '}
                      <span className="font-mono font-bold text-slate-900 tracking-wider">
                        {company.ifsc}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Totals Summary Table (5 cols) */}
              <div className="col-span-5 divide-y divide-slate-800 text-[11px]">
                <div className="p-2 flex justify-between items-center">
                  <span className="font-medium text-slate-700">Taxable Value (Subtotal):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatIndianCurrency(invoice.taxableAmount)}
                  </span>
                </div>

                {!isGstApplicable ? (
                  <div className="p-2 flex justify-between items-center text-slate-600 bg-amber-50/40">
                    <span className="text-slate-700 font-medium">GST Tax (Non-Taxable Supply):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹0.00
                    </span>
                  </div>
                ) : isIntraState ? (
                  <>
                    <div className="p-2 flex justify-between items-center">
                      <span className="text-slate-700">Add: Central GST (CGST):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatIndianCurrency(invoice.cgstTotal)}
                      </span>
                    </div>
                    <div className="p-2 flex justify-between items-center">
                      <span className="text-slate-700">Add: State GST (SGST):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatIndianCurrency(invoice.sgstTotal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-2 flex justify-between items-center">
                    <span className="text-slate-700">Add: Integrated GST (IGST):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatIndianCurrency(invoice.igstTotal)}
                    </span>
                  </div>
                )}

                <div className="p-2 flex justify-between items-center bg-slate-50/50">
                  <span className="text-slate-700">Round Off:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {invoice.roundOff > 0 ? `+${formatIndianCurrency(invoice.roundOff, false)}` : formatIndianCurrency(invoice.roundOff, false)}
                  </span>
                </div>

                {/* Grand Total Box */}
                <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase block font-semibold">
                      Grand Total:
                    </span>
                    <span className="text-[9px] text-slate-400">Total Invoice Value (INR)</span>
                  </div>
                  <span className="font-mono font-black text-lg sm:text-xl tracking-tight text-white">
                    {formatIndianCurrency(invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions & Signatures */}
            <div className="grid grid-cols-12 divide-x-2 divide-slate-900">
              {/* Left: Terms and Conditions (7 cols) */}
              <div className="col-span-7 p-3 text-[9.5px] text-slate-700 space-y-1">
                <span className="font-bold text-slate-950 uppercase tracking-wider block text-[10px] mb-1">
                  Terms & Conditions:
                </span>
                <ol className="list-decimal pl-4 space-y-0.5 leading-snug">
                  {invoice.terms && invoice.terms.length > 0 ? (
                    invoice.terms.map((t, i) => <li key={i}>{t}</li>)
                  ) : (
                    <>
                      <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>
                      <li>Goods once sold will not be taken back unless agreed otherwise.</li>
                      <li>Payment should be made as per agreed terms.</li>
                    </>
                  )}
                </ol>
                {invoice.notes && (
                  <p className="pt-1.5 text-slate-600 italic">
                    <span className="font-bold not-italic text-slate-800">Note:</span> {invoice.notes}
                  </p>
                )}
              </div>

              {/* Right: Signatures (5 cols) */}
              <div className="col-span-5 p-3 flex flex-col justify-between min-h-[120px] text-center">
                <div className="text-[10px] font-bold text-slate-950 uppercase tracking-tight">
                  For {company.name}
                </div>

                <div className="pt-12 text-[10px] space-y-1">
                  <div className="border-t border-dashed border-slate-500 w-3/4 mx-auto pt-1 font-bold text-slate-950 uppercase tracking-wider">
                    Authorised Signatory
                  </div>
                  <p className="text-[8.5px] text-slate-500">This is a Computer Generated Tax Invoice</p>
                </div>
              </div>
            </div>

            {/* Bottom Seal Row */}
            <div className="border-t-2 border-slate-900 px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[9px] text-slate-600">
              <span>Customer's Seal & Signature: _______________________</span>
              <span>Prepared By: Accounts Dept</span>
              <span>Pune Jurisdiction Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Helper Modal for environments where native window.print() is restricted */}
      {showPrintModal && printBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">इन्व्हॉइस प्रिंट (Print Invoice)</h3>
                  <p className="text-xs text-slate-500">Invoice: {invoice.invoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>प्रिंट फाईल (PDF) तयार होऊन डाऊनलोड झाली आहे!</span>
              </p>
              <p className="leading-relaxed text-slate-600">
                ब्राऊझरमध्ये थेट प्रिंट डायलॉग उघडला नसल्यास, खालील <strong>'नवीन टॅबमध्ये उघडा'</strong> बटणावर क्लिक करा आणि <strong>Ctrl + P</strong> दाबून थेट प्रिंट द्या.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <a
                href={printBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors text-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>नवीन टॅबमध्ये उघडा व प्रिंट करा</span>
              </a>

              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
