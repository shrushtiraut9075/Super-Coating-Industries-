import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Layers,
  Users,
  Package,
  Clock,
  Download,
  Filter,
  ReceiptText,
  Eye,
  CreditCard,
  Wallet,
  Landmark,
} from 'lucide-react';
import { Invoice, PaymentReceipt } from '../types';
import { formatIndianCurrency, formatDate } from '../utils/formatters';
import { useToast } from './Toast';

interface ReportsViewProps {
  invoices: Invoice[];
  receipts?: PaymentReceipt[];
  onCreateReceipt?: (invoice: Invoice) => void;
  onViewReceipt?: (receipt: PaymentReceipt) => void;
}

type ReportTab =
  | 'sales-register'
  | 'gst-summary'
  | 'payment-receipts'
  | 'customer-sales'
  | 'product-sales'
  | 'outstanding';

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  receipts = [],
  onCreateReceipt,
  onViewReceipt,
}) => {
  const { showToast } = useToast();

  const [activeReport, setActiveReport] = useState<ReportTab>('sales-register');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Financial Year Filter Logic
  // FY 2026-2027 runs from 2026-04-01 to 2027-03-31
  const fyFilteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.paymentStatus === 'Cancelled') return false;

      // Custom date filter overrides FY if set
      if (dateFrom && inv.invoiceDate < dateFrom) return false;
      if (dateTo && inv.invoiceDate > dateTo) return false;

      if (!dateFrom && !dateTo && financialYear) {
        const startYear = parseInt(financialYear.split('-')[0], 10);
        const fyStart = `${startYear}-04-01`;
        const fyEnd = `${startYear + 1}-03-31`;
        if (inv.invoiceDate < fyStart || inv.invoiceDate > fyEnd) {
          // If invoice date is within fy range
          return false;
        }
      }

      return true;
    });
  }, [invoices, financialYear, dateFrom, dateTo]);

  // Payment Receipts Filtered by Financial Year / Custom Date
  const fyFilteredReceipts = useMemo(() => {
    return (receipts || []).filter((r) => {
      if (dateFrom && r.receiptDate < dateFrom) return false;
      if (dateTo && r.receiptDate > dateTo) return false;

      if (!dateFrom && !dateTo && financialYear) {
        const startYear = parseInt(financialYear.split('-')[0], 10);
        const fyStart = `${startYear}-04-01`;
        const fyEnd = `${startYear + 1}-03-31`;
        if (r.receiptDate < fyStart || r.receiptDate > fyEnd) {
          return false;
        }
      }

      return true;
    });
  }, [receipts, financialYear, dateFrom, dateTo]);

  // Payment Receipts Totals
  const receiptTotals = useMemo(() => {
    return fyFilteredReceipts.reduce(
      (acc, r) => {
        acc.total += r.amount || 0;
        acc.count += 1;
        if (r.paymentMode === 'Bank Transfer' || r.paymentMode === 'NEFT/RTGS') {
          acc.bank += r.amount || 0;
        } else if (r.paymentMode === 'UPI') {
          acc.upi += r.amount || 0;
        } else if (r.paymentMode === 'Cash') {
          acc.cash += r.amount || 0;
        } else if (r.paymentMode === 'Cheque') {
          acc.cheque += r.amount || 0;
        } else {
          acc.other += r.amount || 0;
        }
        return acc;
      },
      { total: 0, count: 0, bank: 0, upi: 0, cash: 0, cheque: 0, other: 0 }
    );
  }, [fyFilteredReceipts]);

  // 1. Sales Register Aggregates
  const salesRegisterTotals = useMemo(() => {
    return fyFilteredInvoices.reduce(
      (acc, inv) => {
        acc.taxable += inv.taxableAmount || 0;
        acc.cgst += inv.cgstTotal || 0;
        acc.sgst += inv.sgstTotal || 0;
        acc.igst += inv.igstTotal || 0;
        acc.totalTax += inv.totalTax || 0;
        acc.grand += inv.grandTotal || 0;
        acc.count += 1;
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, grand: 0, count: 0 }
    );
  }, [fyFilteredInvoices]);

  // 2. Customer-wise aggregation
  const customerWiseData = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        gstin: string;
        state: string;
        count: number;
        taxable: number;
        cgst: number;
        sgst: number;
        igst: number;
        grand: number;
      }
    > = {};

    fyFilteredInvoices.forEach((inv) => {
      const key = inv.customerName;
      if (!map[key]) {
        map[key] = {
          name: inv.customerName,
          gstin: inv.customerGstin || 'Unregistered',
          state: inv.customerState || 'Maharashtra',
          count: 0,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          grand: 0,
        };
      }
      map[key].count += 1;
      map[key].taxable += inv.taxableAmount || 0;
      map[key].cgst += inv.cgstTotal || 0;
      map[key].sgst += inv.sgstTotal || 0;
      map[key].igst += inv.igstTotal || 0;
      map[key].grand += inv.grandTotal || 0;
    });

    return Object.values(map).sort((a, b) => b.grand - a.grand);
  }, [fyFilteredInvoices]);

  // 3. Product-wise aggregation
  const productWiseData = useMemo(() => {
    const map: Record<
      string,
      {
        description: string;
        hsn: string;
        unit: string;
        totalQty: number;
        totalTaxable: number;
        totalTax: number;
        totalAmount: number;
      }
    > = {};

    fyFilteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.description.trim().toUpperCase();
        if (!map[key]) {
          map[key] = {
            description: item.description,
            hsn: item.hsn,
            unit: item.unit,
            totalQty: 0,
            totalTaxable: 0,
            totalTax: 0,
            totalAmount: 0,
          };
        }
        map[key].totalQty += Number(item.quantity) || 0;
        map[key].totalTaxable += Number(item.taxableAmount) || 0;
        const tax = (Number(item.cgstAmount) || 0) + (Number(item.sgstAmount) || 0) + (Number(item.igstAmount) || 0);
        map[key].totalTax += tax;
        map[key].totalAmount += Number(item.totalAmount) || 0;
      });
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [fyFilteredInvoices]);

  // 4. Outstanding Payments
  const outstandingInvoices = useMemo(() => {
    return fyFilteredInvoices.filter(
      (inv) => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid'
    );
  }, [fyFilteredInvoices]);

  const outstandingTotal = useMemo(() => {
    return outstandingInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  }, [outstandingInvoices]);

  // Export current active report as CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Report_${activeReport}_${financialYear}.csv`;

    if (activeReport === 'sales-register') {
      headers = [
        'Invoice No',
        'Date',
        'Customer Name',
        'GSTIN',
        'Taxable (INR)',
        'CGST (INR)',
        'SGST (INR)',
        'IGST (INR)',
        'Total GST (INR)',
        'Grand Total (INR)',
        'Status',
      ];
      rows = fyFilteredInvoices.map((inv) => [
        `"${inv.invoiceNo}"`,
        `"${inv.invoiceDate}"`,
        `"${inv.customerName.replace(/"/g, '""')}"`,
        `"${inv.customerGstin || ''}"`,
        inv.taxableAmount.toFixed(2),
        inv.cgstTotal.toFixed(2),
        inv.sgstTotal.toFixed(2),
        inv.igstTotal.toFixed(2),
        inv.totalTax.toFixed(2),
        inv.grandTotal.toFixed(2),
        `"${inv.paymentStatus}"`,
      ]);
    } else if (activeReport === 'gst-summary') {
      headers = [
        'Description',
        'Invoice Count',
        'Taxable Value (INR)',
        'Central GST (CGST)',
        'State GST (SGST)',
        'Integrated GST (IGST)',
        'Total GST (INR)',
      ];
      rows = [
        [
          '"B2B Invoices (Standard GSTR-1)"',
          salesRegisterTotals.count,
          salesRegisterTotals.taxable.toFixed(2),
          salesRegisterTotals.cgst.toFixed(2),
          salesRegisterTotals.sgst.toFixed(2),
          salesRegisterTotals.igst.toFixed(2),
          salesRegisterTotals.totalTax.toFixed(2),
        ],
      ];
    } else if (activeReport === 'customer-sales') {
      headers = [
        'Customer Name',
        'GSTIN',
        'State',
        'Invoices',
        'Taxable Value',
        'CGST',
        'SGST',
        'IGST',
        'Grand Total',
      ];
      rows = customerWiseData.map((c) => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.gstin}"`,
        `"${c.state}"`,
        c.count,
        c.taxable.toFixed(2),
        c.cgst.toFixed(2),
        c.sgst.toFixed(2),
        c.igst.toFixed(2),
        c.grand.toFixed(2),
      ]);
    } else if (activeReport === 'product-sales') {
      headers = ['Product Description', 'HSN/SAC', 'Quantity Sold', 'Unit', 'Taxable Value', 'GST', 'Total Value'];
      rows = productWiseData.map((p) => [
        `"${p.description.replace(/"/g, '""')}"`,
        `"${p.hsn}"`,
        p.totalQty,
        `"${p.unit}"`,
        p.totalTaxable.toFixed(2),
        p.totalTax.toFixed(2),
        p.totalAmount.toFixed(2),
      ]);
    } else if (activeReport === 'payment-receipts') {
      filename = `Payment_Receipts_Register_${financialYear}.csv`;
      headers = [
        'Receipt No',
        'Receipt Date',
        'Customer Name',
        'Invoice No',
        'Invoice Date',
        'Invoice Total (INR)',
        'Received Amount (INR)',
        'Payment Mode',
        'Reference / UTR / Cheque No',
        'Bank Name',
        'Payment Type',
        'Notes',
      ];
      rows = fyFilteredReceipts.map((r) => [
        `"${r.receiptNo}"`,
        `"${r.receiptDate}"`,
        `"${r.customerName.replace(/"/g, '""')}"`,
        `"${r.invoiceNo || ''}"`,
        `"${r.invoiceDate || ''}"`,
        (r.invoiceTotal || 0).toFixed(2),
        (r.amount || 0).toFixed(2),
        `"${r.paymentMode}"`,
        `"${r.referenceNo || ''}"`,
        `"${r.bankName || ''}"`,
        `"${r.paymentType}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ]);
    } else if (activeReport === 'outstanding') {
      headers = ['Invoice No', 'Date', 'Customer Name', 'Contact', 'Due Amount', 'Status'];
      rows = outstandingInvoices.map((inv) => [
        `"${inv.invoiceNo}"`,
        `"${inv.invoiceDate}"`,
        `"${inv.customerName.replace(/"/g, '""')}"`,
        `"${inv.customerMobile || ''}"`,
        inv.grandTotal.toFixed(2),
        `"${inv.paymentStatus}"`,
      ]);
    }

    if (rows.length === 0) {
      showToast('No Data', 'No records found for current filter to export', 'info');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported', `Saved ${filename}`, 'success');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial & GST Reports</h2>
          <p className="text-xs text-slate-500">
            GSTR-1 compliant summary, sales registers, and customer receivables
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Export Current Report (CSV)</span>
        </button>
      </div>

      {/* Filter Ribbon: FY & Date Range */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Financial Year:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026-2027">2026-2027 (Current)</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Or Custom Dates:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-blue-600 hover:underline text-[11px] ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Matching Invoices: <span className="font-bold text-slate-900">{fyFilteredInvoices.length}</span>
        </div>
      </div>

      {/* Report Type Navigation Tabs */}
      <div className="flex items-center overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReport('sales-register')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'sales-register'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Sales Register</span>
        </button>

        <button
          onClick={() => setActiveReport('gst-summary')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'gst-summary'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GST Summary (GSTR-1)</span>
        </button>

        <button
          onClick={() => setActiveReport('payment-receipts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'payment-receipts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5 text-emerald-500" />
          <span>Payment Receipts (पेमेंट पावत्या)</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-mono font-bold">
            {fyFilteredReceipts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveReport('customer-sales')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'customer-sales'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer-wise Sales</span>
        </button>

        <button
          onClick={() => setActiveReport('product-sales')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'product-sales'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Product-wise Sales</span>
        </button>

        <button
          onClick={() => setActiveReport('outstanding')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeReport === 'outstanding'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Outstanding Receivables ({outstandingInvoices.length})</span>
        </button>
      </div>

      {/* REPORT CONTENT: 1. Sales Register */}
      {activeReport === 'sales-register' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Tax Invoice Sales Register</h3>
            <span className="text-xs text-slate-500">FY: {financialYear}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Inv No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3 text-right">Taxable (₹)</th>
                  <th className="p-3 text-right">CGST (₹)</th>
                  <th className="p-3 text-right">SGST (₹)</th>
                  <th className="p-3 text-right">IGST (₹)</th>
                  <th className="p-3 text-right">Total GST (₹)</th>
                  <th className="p-3 text-right">Grand Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fyFilteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-700">{inv.invoiceNo}</td>
                    <td className="p-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="p-3 font-medium text-slate-900">{inv.customerName}</td>
                    <td className="p-3 text-right font-mono">{formatIndianCurrency(inv.taxableAmount, false)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatIndianCurrency(inv.cgstTotal, false)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatIndianCurrency(inv.sgstTotal, false)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatIndianCurrency(inv.igstTotal, false)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-blue-800">
                      {formatIndianCurrency(inv.totalTax, false)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-950">
                      {formatIndianCurrency(inv.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-mono font-bold border-t-2 border-slate-950">
                <tr>
                  <td colSpan={3} className="p-3 uppercase">Total ({salesRegisterTotals.count} Invoices)</td>
                  <td className="p-3 text-right">{formatIndianCurrency(salesRegisterTotals.taxable, false)}</td>
                  <td className="p-3 text-right">{formatIndianCurrency(salesRegisterTotals.cgst, false)}</td>
                  <td className="p-3 text-right">{formatIndianCurrency(salesRegisterTotals.sgst, false)}</td>
                  <td className="p-3 text-right">{formatIndianCurrency(salesRegisterTotals.igst, false)}</td>
                  <td className="p-3 text-right text-blue-400">{formatIndianCurrency(salesRegisterTotals.totalTax, false)}</td>
                  <td className="p-3 text-right text-emerald-400 font-black">{formatIndianCurrency(salesRegisterTotals.grand)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 2. GST Summary */}
      {activeReport === 'gst-summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">Total Taxable Value</span>
              <p className="text-lg font-black text-slate-900 font-mono">
                {formatIndianCurrency(salesRegisterTotals.taxable)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">Central GST (CGST)</span>
              <p className="text-lg font-black text-blue-700 font-mono">
                {formatIndianCurrency(salesRegisterTotals.cgst)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">State GST (SGST)</span>
              <p className="text-lg font-black text-indigo-700 font-mono">
                {formatIndianCurrency(salesRegisterTotals.sgst)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">Total GST Collected</span>
              <p className="text-lg font-black text-emerald-700 font-mono">
                {formatIndianCurrency(salesRegisterTotals.totalTax)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">GSTR-1 Tax Summary (Table 4B - B2B Invoices)</h3>
            <p className="text-xs text-slate-500">
              Breakdown of outward taxable supplies for return filing with the GST portal
            </p>

            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Supply Type</th>
                  <th className="p-3 text-center">Invoice Count</th>
                  <th className="p-3 text-right">Taxable Value (₹)</th>
                  <th className="p-3 text-right">Central Tax (₹)</th>
                  <th className="p-3 text-right">State Tax (₹)</th>
                  <th className="p-3 text-right">Integrated Tax (₹)</th>
                  <th className="p-3 text-right">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="p-3 font-semibold text-slate-900">
                    B2B Regular Invoices (Powder Coating / Job Work)
                  </td>
                  <td className="p-3 text-center font-bold">{salesRegisterTotals.count}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    {formatIndianCurrency(salesRegisterTotals.taxable, false)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatIndianCurrency(salesRegisterTotals.cgst, false)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatIndianCurrency(salesRegisterTotals.sgst, false)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatIndianCurrency(salesRegisterTotals.igst, false)}
                  </td>
                  <td className="p-3 text-right font-mono font-black text-blue-700">
                    {formatIndianCurrency(salesRegisterTotals.totalTax, false)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Payment Receipts Register */}
      {activeReport === 'payment-receipts' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                <span>एकूण पावत्या (Receipts Count)</span>
                <ReceiptText className="w-4 h-4 text-emerald-600" />
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {receiptTotals.count}
              </p>
              <span className="text-[11px] text-slate-400">FY {financialYear} अंतर्गत जारी</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs space-y-1">
              <span className="text-xs text-emerald-800 font-semibold flex items-center justify-between">
                <span>एकूण जमा रक्कम (Total Received)</span>
                <Wallet className="w-4 h-4 text-emerald-700" />
              </span>
              <p className="text-2xl font-black text-emerald-900 font-mono">
                {formatIndianCurrency(receiptTotals.total)}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">१००% अधिकृत पावत्या</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                <span>बँक / NEFT / RTGS</span>
                <Landmark className="w-4 h-4 text-blue-600" />
              </span>
              <p className="text-xl font-black text-blue-700 font-mono">
                {formatIndianCurrency(receiptTotals.bank)}
              </p>
              <span className="text-[11px] text-slate-400">Direct Bank Deposit</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                <span>UPI / GPay / PhonePe</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </span>
              <p className="text-xl font-black text-purple-700 font-mono">
                {formatIndianCurrency(receiptTotals.upi)}
              </p>
              <span className="text-[11px] text-slate-400">
                रोख / चेक: {formatIndianCurrency(receiptTotals.cash + receiptTotals.cheque)}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Payment Receipts Register (पेमेंट पावती अहवाल)</h3>
                <p className="text-xs text-slate-500">सर्व जारी केलेल्या पेमेंट पावत्यांचा आर्थिक वर्षानुसार तपशील</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                FY: {financialYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">पावती क्र. (Receipt No)</th>
                    <th className="p-3">तारीख (Date)</th>
                    <th className="p-3">ग्राहक / पार्टी (Customer)</th>
                    <th className="p-3">संबंधित बिल क्र. (Against Inv)</th>
                    <th className="p-3 text-right">बिल रक्कम (₹)</th>
                    <th className="p-3 text-right">जमा रक्कम (₹)</th>
                    <th className="p-3 text-center">पेमेंट मोड (Mode)</th>
                    <th className="p-3">संदर्भ / बँक (Ref & Bank)</th>
                    <th className="p-3 text-center">प्रकार (Type)</th>
                    <th className="p-3 text-center">कृती (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fyFilteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        <p className="text-sm font-semibold">निवडलेल्या कालावधीत कोणतीही पावती उपलब्ध नाही</p>
                        <p className="text-xs text-slate-400 mt-1">आर्थिक वर्ष किंवा तारखेचा फिल्टर तपासा</p>
                      </td>
                    </tr>
                  ) : (
                    fyFilteredReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {r.receiptNo}
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {formatDate(r.receiptDate)}
                        </td>
                        <td className="p-3 font-bold text-slate-900 max-w-[200px] truncate">
                          {r.customerName}
                        </td>
                        <td className="p-3 font-mono text-blue-700 whitespace-nowrap font-medium">
                          {r.invoiceNo ? (
                            <span>{r.invoiceNo}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600 whitespace-nowrap">
                          {r.invoiceTotal ? formatIndianCurrency(r.invoiceTotal, false) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap text-sm">
                          {formatIndianCurrency(r.amount)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.paymentMode === 'Bank Transfer' || r.paymentMode === 'NEFT/RTGS'
                                ? 'bg-blue-100 text-blue-800'
                                : r.paymentMode === 'UPI'
                                ? 'bg-purple-100 text-purple-800'
                                : r.paymentMode === 'Cheque'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.paymentMode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate font-mono text-[11px]">
                          {r.referenceNo || r.bankName ? (
                            <span>
                              {r.referenceNo} {r.bankName ? `(${r.bankName})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap text-[11px] font-medium text-slate-600">
                          {r.paymentType || 'Full Payment'}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {onViewReceipt && (
                            <button
                              onClick={() => onViewReceipt(r)}
                              title="पावती पहा / प्रिंट करा"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>पहा</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {fyFilteredReceipts.length > 0 && (
                  <tfoot className="bg-slate-900 text-white font-mono font-bold text-xs">
                    <tr>
                      <td colSpan={5} className="p-3 text-right uppercase">
                        एकूण जमा रक्कम (Total Amount Collected):
                      </td>
                      <td className="p-3 text-right text-emerald-300 font-black text-sm">
                        {formatIndianCurrency(receiptTotals.total)}
                      </td>
                      <td colSpan={4} className="p-3 text-slate-400 text-right text-[11px]">
                        {receiptTotals.count} पावत्या
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 3. Customer-wise Sales */}
      {activeReport === 'customer-sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Customer-wise Sales Breakdown</h3>
            <span className="text-xs text-slate-500">{customerWiseData.length} Customers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3 text-center">Invoices</th>
                  <th className="p-3 text-right">Taxable (₹)</th>
                  <th className="p-3 text-right">GST (₹)</th>
                  <th className="p-3 text-right">Grand Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerWiseData.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-950 uppercase">{c.name}</td>
                    <td className="p-3 font-mono text-slate-600">{c.gstin}</td>
                    <td className="p-3 text-center font-bold">{c.count}</td>
                    <td className="p-3 text-right font-mono">{formatIndianCurrency(c.taxable, false)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatIndianCurrency(c.cgst + c.sgst + c.igst, false)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatIndianCurrency(c.grand)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 4. Product-wise Sales */}
      {activeReport === 'product-sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Item & Job Work Wise Sales</h3>
            <span className="text-xs text-slate-500">{productWiseData.length} Items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">HSN/SAC</th>
                  <th className="p-3 text-center">Quantity</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-right">Taxable (₹)</th>
                  <th className="p-3 text-right">GST (₹)</th>
                  <th className="p-3 text-right">Total Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productWiseData.map((p) => (
                  <tr key={p.description} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-900">{p.description}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{p.hsn}</td>
                    <td className="p-3 text-center font-mono font-bold">{p.totalQty}</td>
                    <td className="p-3 text-center text-slate-600">{p.unit}</td>
                    <td className="p-3 text-right font-mono">{formatIndianCurrency(p.totalTaxable, false)}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{formatIndianCurrency(p.totalTax, false)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-950">
                      {formatIndianCurrency(p.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 5. Outstanding Payments */}
      {activeReport === 'outstanding' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-amber-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-amber-900">Pending & Outstanding Receivables</h3>
              <p className="text-xs text-amber-700">Follow-up list for unpaid invoices</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-800 uppercase block font-semibold">Total Due</span>
              <span className="font-mono font-black text-amber-950 text-base">
                {formatIndianCurrency(outstandingTotal)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3 text-right">Amount Due (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      All invoices are fully paid! No outstanding receivables.
                    </td>
                  </tr>
                ) : (
                  outstandingInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-blue-700">{inv.invoiceNo}</td>
                      <td className="p-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="p-3 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="p-3 font-mono text-slate-600">{inv.customerMobile || '-'}</td>
                      <td className="p-3 text-right font-mono font-black text-amber-800">
                        {formatIndianCurrency(inv.grandTotal)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {onCreateReceipt && (
                          <button
                            onClick={() => onCreateReceipt(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] shadow-xs transition-colors"
                            title="पेमेंट पावती तयार करा (Create Payment Receipt)"
                          >
                            <ReceiptText className="w-3 h-3" />
                            <span>+ पावती (Receipt)</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
