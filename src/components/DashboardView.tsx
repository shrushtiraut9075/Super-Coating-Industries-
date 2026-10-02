import React, { useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  FileCheck,
  AlertCircle,
  FilePlus2,
  Users,
  Package,
  Calendar,
  IndianRupee,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ReceiptText,
} from 'lucide-react';
import { Invoice, Customer, Product, ActiveTab, PaymentReceipt } from '../types';
import { formatIndianCurrency, formatDate } from '../utils/formatters';
import { Logo } from './Logo';

interface DashboardViewProps {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  receipts?: PaymentReceipt[];
  onNavigate: (tab: ActiveTab) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onCreateReceipt?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  customers,
  products,
  receipts = [],
  onNavigate,
  onViewInvoice,
  onCreateReceipt,
}) => {
  // Statistics calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    let totalSales = 0;
    let thisMonthSales = 0;
    let todaySales = 0;
    let totalGST = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let paidCount = 0;

    invoices.forEach((inv) => {
      if (inv.paymentStatus !== 'Cancelled') {
        totalSales += inv.grandTotal || 0;
        totalGST += inv.totalTax || 0;

        if (inv.invoiceDate?.startsWith(currentMonthPrefix)) {
          thisMonthSales += inv.grandTotal || 0;
        }

        if (inv.invoiceDate === todayStr) {
          todaySales += inv.grandTotal || 0;
        }

        if (inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid') {
          pendingAmount += inv.grandTotal || 0;
          pendingCount += 1;
        } else if (inv.paymentStatus === 'Paid') {
          paidCount += 1;
        }
      }
    });

    return {
      totalSales,
      thisMonthSales,
      todaySales,
      totalGST,
      pendingAmount,
      pendingCount,
      paidCount,
      totalInvoices: invoices.length,
    };
  }, [invoices]);

  // Recent 6 invoices
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [invoices]);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center shrink-0 ring-4 ring-white/10">
              <Logo variant="icon" className="w-full h-full" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/50">
                GST Tax Invoicing & Manufacturing ERP
              </span>
              <div className="flex items-center gap-1.5 font-black text-xl sm:text-2xl tracking-tight leading-none text-white">
                <span>SUPER</span>
                <span className="text-orange-400">COATING</span>
                <span className="text-slate-300 font-bold text-sm sm:text-base ml-1">INDUSTRIES</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Chimbali, Tal-Khed, Dist-Pune | GSTIN: 27DBAPS9015K1ZA | State Code: 27
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => (onCreateReceipt ? onCreateReceipt() : onNavigate('receipts'))}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <ReceiptText className="w-4 h-4" />
              <span>+ Payment Receipt (पावती)</span>
            </button>

            <button
              onClick={() => onNavigate('new-invoice')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>+ New Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 6 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Sales</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">
            {formatIndianCurrency(stats.totalSales)}
          </p>
          <p className="text-[11px] text-slate-500">All non-cancelled</p>
        </div>

        {/* This Month Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>This Month</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">
            {formatIndianCurrency(stats.thisMonthSales)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Current Month Billings</p>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Sales</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">
            {formatIndianCurrency(stats.todaySales)}
          </p>
          <p className="text-[11px] text-slate-500">Generated today</p>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Invoices</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono tracking-tight">
            {stats.totalInvoices}
          </p>
          <p className="text-[11px] text-slate-500">{stats.paidCount} Paid Invoices</p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Payments</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-700 font-mono tracking-tight">
            {formatIndianCurrency(stats.pendingAmount)}
          </p>
          <p className="text-[11px] text-amber-600 font-medium">
            {stats.pendingCount} unpaid invoice{stats.pendingCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total GST Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total GST</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-purple-800 font-mono tracking-tight">
            {formatIndianCurrency(stats.totalGST)}
          </p>
          <p className="text-[11px] text-purple-600 font-medium">CGST + SGST + IGST</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('new-invoice')}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                New GST Tax Invoice
              </p>
              <p className="text-xs text-slate-500">Auto-numbering & PDF print</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('receipts')}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                Payment Receipts ({receipts.length})
              </p>
              <p className="text-xs text-slate-500">पेमेंट पावती तयार करा व प्रिंट करा</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('customers')}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Customer Master ({customers.length})
              </p>
              <p className="text-xs text-slate-500">Manage clients & GSTINs</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('products')}
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                Product & Job Work ({products.length})
              </p>
              <p className="text-xs text-slate-500">Rates, HSN & units</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0" />
        </button>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Tax Invoices</h3>
            <p className="text-xs text-slate-500">Latest generated invoices with status</p>
          </div>

          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">GST (₹)</th>
                <th className="p-3 text-right">Grand Total (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-700">{inv.invoiceNo}</td>
                  <td className="p-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                  <td className="p-3 font-medium text-slate-900">{inv.customerName}</td>
                  <td className="p-3 text-right font-mono">{formatIndianCurrency(inv.taxableAmount, false)}</td>
                  <td className="p-3 text-right font-mono text-slate-600">{formatIndianCurrency(inv.totalTax, false)}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-950">
                    {formatIndianCurrency(inv.grandTotal)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
