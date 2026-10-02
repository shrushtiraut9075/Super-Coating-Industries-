import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Printer,
  Trash2,
  Download,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Ban,
  ReceiptText,
  RotateCcw,
} from 'lucide-react';
import { Invoice, PaymentStatus, AppUser } from '../types';
import { formatIndianCurrency, formatDate } from '../utils/formatters';
import { useToast } from './Toast';

interface InvoiceListViewProps {
  invoices: Invoice[];
  currentUser?: AppUser | null;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onCreateNew: () => void;
  onCreateReceipt?: (invoice: Invoice) => void;
  onRestoreDefaults?: () => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  currentUser,
  onViewInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onCreateNew,
  onCreateReceipt,
  onRestoreDefaults,
}) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('ALL');

  // Delete confirmation modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Distinct customers for filter
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach((inv) => {
      if (inv.customerName) {
        map.set(inv.customerName, inv.customerName);
      }
    });
    return Array.from(map.values());
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        inv.invoiceNo.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        (inv.customerGstin && inv.customerGstin.toLowerCase().includes(term)) ||
        (inv.poNo && inv.poNo.toLowerCase().includes(term)) ||
        (inv.challanNo && inv.challanNo.toLowerCase().includes(term));

      // Status
      const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;

      // Customer
      const matchesCustomer =
        selectedCustomerId === 'ALL' || inv.customerName === selectedCustomerId;

      // Date range
      let matchesDate = true;
      if (dateFrom && inv.invoiceDate < dateFrom) matchesDate = false;
      if (dateTo && inv.invoiceDate > dateTo) matchesDate = false;

      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, selectedCustomerId, dateFrom, dateTo]);

  // Aggregate totals of filtered items
  const aggregates = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.taxable += inv.taxableAmount || 0;
        acc.gst += inv.totalTax || 0;
        acc.grand += inv.grandTotal || 0;
        acc.count += 1;
        return acc;
      },
      { taxable: 0, gst: 0, grand: 0, count: 0 }
    );
  }, [filteredInvoices]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      showToast('No Data', 'No invoices to export with current filters', 'info');
      return;
    }

    const headers = [
      'Invoice No',
      'Invoice Date',
      'Customer Name',
      'GSTIN',
      'State',
      'Taxable Amount',
      'CGST Amount',
      'SGST Amount',
      'IGST Amount',
      'Total GST',
      'Round Off',
      'Grand Total',
      'Payment Status',
      'PO Number',
      'Challan Number',
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNo}"`,
      `"${inv.invoiceDate}"`,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      `"${inv.customerGstin || ''}"`,
      `"${inv.customerState || ''}"`,
      inv.taxableAmount.toFixed(2),
      inv.cgstTotal.toFixed(2),
      inv.sgstTotal.toFixed(2),
      inv.igstTotal.toFixed(2),
      inv.totalTax.toFixed(2),
      inv.roundOff.toFixed(2),
      inv.grandTotal.toFixed(2),
      `"${inv.paymentStatus}"`,
      `"${inv.poNo || ''}"`,
      `"${inv.challanNo || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GST_Sales_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Successful', `Exported ${filteredInvoices.length} invoices to CSV`, 'success');
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteInvoice(deleteId);
      setDeleteId(null);
      showToast('Invoice Deleted', 'Invoice has been removed', 'info');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header with Title and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tax Invoices</h2>
          <p className="text-xs text-slate-500">
            Manage, filter, search, print, and export your GST invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRestoreDefaults && (
            <button
              onClick={onRestoreDefaults}
              title="मूळ इनव्हॉइसेस परत आणा (Restore Default Invoices)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors border border-amber-200"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">मूळ बिले रिस्टोअर</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice No, Customer, GSTIN, PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Customer filter */}
          <div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Customers</option>
              {uniqueCustomers.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date range trigger/inputs */}
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

        {/* Filter reset helper if active */}
        {(searchTerm || statusFilter !== 'ALL' || selectedCustomerId !== 'ALL' || dateFrom || dateTo) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
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

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5 text-right">Taxable (₹)</th>
                <th className="p-3.5 text-right">GST (₹)</th>
                <th className="p-3.5 text-right">Grand Total (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <p className="text-sm font-semibold">कोणतेही बिल सापडले नाही (No invoices found)</p>
                    <p className="text-xs text-slate-400 mt-1 mb-3">शोध फिल्टर तपासा किंवा मूळ बिले परत आणा</p>
                    {onRestoreDefaults && (
                      <button
                        onClick={onRestoreDefaults}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>सर्व मूळ बिले पूर्ववत लोड करा</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice No */}
                    <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{inv.invoiceNo}</span>
                      </button>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>

                    {/* Customer */}
                    <td className="p-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                      {inv.customerName}
                    </td>

                    {/* GSTIN */}
                    <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {inv.customerGstin || '-'}
                    </td>

                    {/* Taxable Amount */}
                    <td className="p-3.5 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                      {formatIndianCurrency(inv.taxableAmount, false)}
                    </td>

                    {/* GST */}
                    <td className="p-3.5 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                      {formatIndianCurrency(inv.totalTax, false)}
                    </td>

                    {/* Grand Total */}
                    <td className="p-3.5 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                      {formatIndianCurrency(inv.grandTotal)}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.paymentStatus === 'Paid' && <CheckCircle className="w-3 h-3" />}
                        {inv.paymentStatus === 'Pending' && <Clock className="w-3 h-3" />}
                        {inv.paymentStatus === 'Cancelled' && <Ban className="w-3 h-3" />}
                        <span>{inv.paymentStatus}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title="View / Print"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onCreateReceipt && (
                          <button
                            onClick={() => onCreateReceipt(inv)}
                            title="पेमेंट पावती तयार करा (Create Payment Receipt)"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <ReceiptText className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}

                        <button
                          onClick={() => onEditInvoice(inv)}
                          title="Edit"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDuplicateInvoice(inv.id)}
                          title="Duplicate"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {currentUser?.role !== 'operator' && (
                          <button
                            onClick={() => setDeleteId(inv.id)}
                            title="Delete Invoice (Admin Only)"
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

        {/* Aggregates Footer */}
        {filteredInvoices.length > 0 && (
          <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Total Filtered Invoices:</span>{' '}
              <span className="font-bold text-white text-sm">{aggregates.count}</span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-400">Taxable:</span>{' '}
                <span className="font-bold">{formatIndianCurrency(aggregates.taxable)}</span>
              </div>
              <div>
                <span className="text-slate-400">Total GST:</span>{' '}
                <span className="font-bold text-blue-400">{formatIndianCurrency(aggregates.gst)}</span>
              </div>
              <div>
                <span className="text-slate-400">Grand Total:</span>{' '}
                <span className="font-black text-emerald-400 text-sm">
                  {formatIndianCurrency(aggregates.grand)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Invoice?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this invoice? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
