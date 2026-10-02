import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Printer,
  Download,
  Share2,
  Trash2,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { PaymentReceipt, AppUser, CompanyProfile } from '../types';
import { formatIndianCurrency, formatDate } from '../utils/formatters';
import { generateReceiptPdf } from '../utils/receiptPdfGenerator';
import { useToast } from './Toast';

interface ReceiptsListViewProps {
  receipts: PaymentReceipt[];
  currentUser: AppUser | null;
  company: CompanyProfile;
  onCreateNew: () => void;
  onViewReceipt: (receipt: PaymentReceipt) => void;
  onDeleteReceipt: (id: string) => void;
}

export const ReceiptsListView: React.FC<ReceiptsListViewProps> = ({
  receipts,
  currentUser,
  company,
  onCreateNew,
  onViewReceipt,
  onDeleteReceipt,
}) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Distinct customers for filter
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    receipts.forEach((r) => {
      if (r.customerName) map.set(r.customerName, r.customerName);
    });
    return Array.from(map.values());
  }, [receipts]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        r.receiptNo.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term) ||
        (r.invoiceNo && r.invoiceNo.toLowerCase().includes(term)) ||
        (r.referenceNo && r.referenceNo.toLowerCase().includes(term));

      const matchesMode = modeFilter === 'ALL' || r.paymentMode === modeFilter;
      const matchesCustomer =
        selectedCustomerId === 'ALL' || r.customerName === selectedCustomerId;

      let matchesDate = true;
      if (dateFrom && r.receiptDate < dateFrom) matchesDate = false;
      if (dateTo && r.receiptDate > dateTo) matchesDate = false;

      return matchesSearch && matchesMode && matchesCustomer && matchesDate;
    });
  }, [receipts, searchTerm, modeFilter, selectedCustomerId, dateFrom, dateTo]);

  // Summary Metrics
  const stats = useMemo(() => {
    return receipts.reduce(
      (acc, r) => {
        acc.totalAmount += r.amount || 0;
        acc.count += 1;
        if (r.paymentMode === 'Bank Transfer' || r.paymentMode === 'UPI' || r.paymentMode === 'NEFT/RTGS') {
          acc.onlineAmount += r.amount || 0;
        } else if (r.paymentMode === 'Cash') {
          acc.cashAmount += r.amount || 0;
        } else if (r.paymentMode === 'Cheque') {
          acc.chequeAmount += r.amount || 0;
        }
        return acc;
      },
      { totalAmount: 0, count: 0, onlineAmount: 0, cashAmount: 0, chequeAmount: 0 }
    );
  }, [receipts]);

  // Quick download helper
  const handleQuickDownload = (r: PaymentReceipt) => {
    try {
      const doc = generateReceiptPdf(r, company);
      const safeNo = r.receiptNo.replace(/[\/\\]/g, '_');
      doc.save(`Receipt_${safeNo}.pdf`);
      showToast('PDF Downloaded', `पावती डाऊनलोड झाली: Receipt_${safeNo}.pdf`, 'success');
    } catch (e) {
      console.error('PDF error:', e);
      showToast('Error', 'PDF डाऊनलोड करताना त्रुटी आली', 'error');
    }
  };

  // WhatsApp share helper
  const handleShareWhatsApp = (r: PaymentReceipt) => {
    const mobile = r.customerMobile ? r.customerMobile.replace(/\D/g, '') : '';
    const text = `*PAYMENT RECEIPT / पावती*
*SUPER COATING INDUSTRIES*
--------------------------------
*Receipt No:* ${r.receiptNo}
*Date:* ${formatDate(r.receiptDate)}
*Customer:* ${r.customerName}
--------------------------------
*Amount Received:* ${formatIndianCurrency(r.amount)}
*Amount in Words:* ${r.amountInWords}
*Payment Mode:* ${r.paymentMode}${r.referenceNo ? ` (Ref: ${r.referenceNo})` : ''}
${r.invoiceNo ? `*Against Invoice:* ${r.invoiceNo}` : ''}
--------------------------------
Thank you for your business!
Super Coating Industries, Pune`;

    const encoded = encodeURIComponent(text);
    const url = mobile.length >= 10
      ? `https://wa.me/91${mobile.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Payment Receipts (पेमेंट पावत्या)</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {receipts.length} पावत्या
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ग्राहकांकडून आलेल्या सर्व पेमेंट्सच्या अधिकृत पावत्या तयार करा, प्रिंट करा व शेअर करा
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Payment Receipt (नवीन पावती)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Payments Received
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-emerald-700 block mt-1">
            {formatIndianCurrency(stats.totalAmount)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            एकूण {stats.count} पावत्या नोंदवल्या
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Bank & UPI Payments
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-blue-700 block mt-1">
            {formatIndianCurrency(stats.onlineAmount)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            NEFT / RTGS / UPI / NetBanking
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Cheque Payments
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-indigo-700 block mt-1">
            {formatIndianCurrency(stats.chequeAmount)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            धनादेशाद्वारे आलेली रक्कम
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Cash Payments
          </span>
          <span className="text-lg sm:text-xl font-mono font-black text-amber-700 block mt-1">
            {formatIndianCurrency(stats.cashAmount)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            रोख स्वरूपात जमा
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Receipt No, Customer, Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Customers (सर्व ग्राहक)</option>
              {uniqueCustomers.map((custName) => (
                <option key={custName} value={custName}>
                  {custName}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Payment Modes (सर्व प्रकार)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              title="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              title="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters Helper */}
        {(searchTerm || modeFilter !== 'ALL' || selectedCustomerId !== 'ALL' || dateFrom || dateTo) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing {filteredReceipts.length} of {receipts.length} receipts
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setModeFilter('ALL');
                setSelectedCustomerId('ALL');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Receipt No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Against Invoice</th>
                <th className="p-3.5">Mode & Reference</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <p className="text-sm font-semibold">कोणतीही पावती सापडली नाही</p>
                    <p className="text-xs text-slate-400 mt-1">
                      नवीन पावती तयार करण्यासाठी वरील '+ New Payment Receipt' बटणावर क्लिक करा
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Receipt No */}
                    <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <button
                        onClick={() => onViewReceipt(r)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{r.receiptNo}</span>
                      </button>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(r.receiptDate)}
                    </td>

                    {/* Customer */}
                    <td className="p-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                      {r.customerName}
                    </td>

                    {/* Invoice */}
                    <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                      {r.invoiceNo ? (
                        <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          {r.invoiceNo}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">On Account</span>
                      )}
                    </td>

                    {/* Mode & Ref */}
                    <td className="p-3.5 text-slate-700 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold">{r.paymentMode}</span>
                        {r.referenceNo && (
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                            {r.referenceNo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 whitespace-nowrap text-sm">
                      {formatIndianCurrency(r.amount)}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewReceipt(r)}
                          title="View / Print"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleQuickDownload(r)}
                          title="Download PDF"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleShareWhatsApp(r)}
                          title="Share on WhatsApp"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {/* Admin Delete */}
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => setDeleteId(r.id)}
                            title="Delete Receipt"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-center text-slate-900 text-base">
              पावती हटवायची आहे का?
            </h3>
            <p className="text-xs text-center text-slate-500 mt-1">
              ही पावती डिलीट केल्यास ती पुन्हा मिळणार नाही. तुम्हाला नक्की ही पावती हटवायची आहे का?
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                रद्द करा (Cancel)
              </button>
              <button
                onClick={() => {
                  onDeleteReceipt(deleteId);
                  setDeleteId(null);
                  showToast('Deleted', 'पावती हटवली गेली आहे', 'success');
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
              >
                हटवा (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
