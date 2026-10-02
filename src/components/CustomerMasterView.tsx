import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Customer, Invoice } from '../types';
import { INDIAN_STATES, isValidGSTIN, getStateCodeFromGSTIN, formatIndianCurrency } from '../utils/formatters';
import { useToast } from './Toast';

interface CustomerMasterViewProps {
  customers: Customer[];
  invoices: Invoice[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onCreateInvoiceForCustomer?: (customer: Customer) => void;
}

export const CustomerMasterView: React.FC<CustomerMasterViewProps> = ({
  customers,
  invoices,
  onSaveCustomer,
  onDeleteCustomer,
  onCreateInvoiceForCustomer,
}) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameShipping, setSameShipping] = useState(true);
  const [state, setState] = useState('Maharashtra');
  const [stateCode, setStateCode] = useState('27');
  const [gstin, setGstin] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 Days');

  // Customer statistics (invoices and total billing)
  const customerStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; pending: number }> = {};
    invoices.forEach((inv) => {
      const key = inv.customerId || inv.customerName;
      if (!stats[key]) {
        stats[key] = { count: 0, total: 0, pending: 0 };
      }
      stats[key].count += 1;
      stats[key].total += inv.grandTotal || 0;
      if (inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid') {
        stats[key].pending += inv.grandTotal || 0;
      }
    });
    return stats;
  }, [invoices]);

  // Open modal for add
  const handleAddNew = () => {
    setEditingCustomer(null);
    setName('');
    setBillingAddress('');
    setShippingAddress('');
    setSameShipping(true);
    setState('Maharashtra');
    setStateCode('27');
    setGstin('');
    setMobile('');
    setEmail('');
    setPan('');
    setPaymentTerms('30 Days');
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setBillingAddress(cust.billingAddress);
    setShippingAddress(cust.shippingAddress || cust.billingAddress);
    setSameShipping(cust.shippingAddress === cust.billingAddress);
    setState(cust.state);
    setStateCode(cust.stateCode);
    setGstin(cust.gstin);
    setMobile(cust.mobile);
    setEmail(cust.email || '');
    setPan(cust.pan || '');
    setPaymentTerms(cust.paymentTerms || '30 Days');
    setModalOpen(true);
  };

  // Auto extract PAN from GSTIN if valid
  const handleGstinChange = (value: string) => {
    const clean = value.toUpperCase().trim();
    setGstin(clean);

    // Auto extract PAN (chars 3 to 12)
    if (clean.length >= 12) {
      const extractedPan = clean.substring(2, 12);
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extractedPan)) {
        setPan(extractedPan);
      }
    }

    // Auto extract State Code
    const stCode = getStateCodeFromGSTIN(clean);
    if (stCode) {
      setStateCode(stCode);
      const matchedState = INDIAN_STATES.find((s) => s.code === stCode);
      if (matchedState) {
        setState(matchedState.name);
      }
    }
  };

  const handleStateChange = (stName: string) => {
    setState(stName);
    const found = INDIAN_STATES.find((s) => s.name === stName);
    if (found) {
      setStateCode(found.code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Name Required', 'Please enter customer name', 'error');
      return;
    }

    if (gstin && !isValidGSTIN(gstin)) {
      showToast(
        'GSTIN Warning',
        'GSTIN does not match standard 15-character format, saving anyway',
        'info'
      );
    }

    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim().toUpperCase(),
      billingAddress: billingAddress.trim(),
      shippingAddress: (sameShipping ? billingAddress : shippingAddress).trim(),
      state: state.trim(),
      stateCode: stateCode.trim(),
      gstin: gstin.trim().toUpperCase(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      pan: pan.trim().toUpperCase() || undefined,
      paymentTerms: paymentTerms.trim(),
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(customerToSave);
    setModalOpen(false);
    showToast(
      editingCustomer ? 'Customer Updated' : 'Customer Added',
      `${customerToSave.name} saved successfully`,
      'success'
    );
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteCustomer(deleteId);
      setDeleteId(null);
      showToast('Customer Deleted', 'Customer record removed', 'info');
    }
  };

  // Filtered
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.gstin.toLowerCase().includes(term) ||
        (c.mobile && c.mobile.includes(term)) ||
        c.billingAddress.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Master</h2>
          <p className="text-xs text-slate-500">
            Registered B2B Clients, GSTIN details, shipping addresses and accounts
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name, GSTIN, mobile, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const stats = customerStats[cust.id] || customerStats[cust.name] || { count: 0, total: 0, pending: 0 };
          return (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-950 uppercase leading-snug">
                      {cust.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      GSTIN: <span className="font-bold text-slate-800">{cust.gstin || 'Unregistered'}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    State: {cust.stateCode}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <p className="line-clamp-2">{cust.billingAddress}</p>
                  <p className="text-slate-500">
                    <span className="font-medium text-slate-700">State:</span> {cust.state}
                  </p>
                  {cust.mobile && (
                    <p className="text-slate-500">
                      <span className="font-medium text-slate-700">Phone:</span> {cust.mobile}
                    </p>
                  )}
                  {cust.email && (
                    <p className="text-slate-500">
                      <span className="font-medium text-slate-700">Email:</span> {cust.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Footer & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px]">
                  <span className="text-slate-500 block">Total Invoiced:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatIndianCurrency(stats.total)} ({stats.count} bills)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(cust)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cust.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">No customers found</p>
          <p className="text-xs text-slate-400 mt-1">Add a new customer to get started</p>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter official billing and GST details for invoice creation
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MECON SYSTEMS"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN (15 Digits)
                </label>
                <input
                  type="text"
                  placeholder="27AJGJPA8641A1ZR"
                  value={gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
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
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Address *
                </label>
                <textarea
                  rows={2}
                  placeholder="Gat No / Industrial Area / Pin Code"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 mb-1">
                  <input
                    type="checkbox"
                    checked={sameShipping}
                    onChange={(e) => setSameShipping(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Shipping Address same as Billing Address</span>
                </label>
                {!sameShipping && (
                  <textarea
                    rows={2}
                    placeholder="Consignee or plant delivery address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="98XXXXXXXX"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PAN
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Days / Immediate"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Customer?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this customer? Historical invoices will remain intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
