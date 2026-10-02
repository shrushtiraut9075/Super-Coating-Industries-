import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../types';
import { COMMON_UNITS, formatIndianCurrency } from '../utils/formatters';
import { useToast } from './Toast';

interface ProductMasterViewProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductMasterView: React.FC<ProductMasterViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hsn, setHsn] = useState('998898');
  const [defaultUnit, setDefaultUnit] = useState('KGS');
  const [defaultRate, setDefaultRate] = useState<number>(24);
  const [gstRate, setGstRate] = useState<number>(18);

  const handleAddNew = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setHsn('998898');
    setDefaultUnit('KGS');
    setDefaultRate(24);
    setGstRate(18);
    setModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setHsn(prod.hsn);
    setDefaultUnit(prod.defaultUnit);
    setDefaultRate(prod.defaultRate);
    setGstRate(prod.gstRate);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Name Required', 'Please enter product/service name', 'error');
      return;
    }
    if (!hsn.trim()) {
      showToast('HSN Required', 'Please enter HSN/SAC code', 'error');
      return;
    }

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim().toUpperCase(),
      description: description.trim(),
      hsn: hsn.trim(),
      defaultUnit,
      defaultRate: Number(defaultRate) || 0,
      gstRate: Number(gstRate) || 18,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(productToSave);
    setModalOpen(false);
    showToast(
      editingProduct ? 'Product Updated' : 'Product Added',
      `${productToSave.name} saved successfully`,
      'success'
    );
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteProduct(deleteId);
      setDeleteId(null);
      showToast('Product Deleted', 'Item removed from master', 'info');
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.hsn.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product & Service Master</h2>
          <p className="text-xs text-slate-500">
            Powder coating services, job work items, HSN/SAC codes, and standard rates
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Product / Item</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by product name, HSN code, shade description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Product / Job Work Name</th>
                <th className="p-3.5">HSN/SAC Code</th>
                <th className="p-3.5 text-center">Unit</th>
                <th className="p-3.5 text-right">Default Rate (₹)</th>
                <th className="p-3.5 text-center">GST Rate (%)</th>
                <th className="p-3.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-slate-700 font-semibold">{p.hsn}</td>
                  <td className="p-3.5 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {p.defaultUnit}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    {formatIndianCurrency(p.defaultRate)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                      {p.gstRate}%
                    </span>
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Add items to speed up invoice creation</p>
        </div>
      )}

      {/* Modal for Add / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? 'Edit Product / Service' : 'Add New Product / Service'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set standard description, HSN code, and base rates
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product / Description of Goods *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MS FRAME FOR POWDER COATING RAL 7035"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Powder shade, microns thickness, job specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HSN / SAC Code *
                  </label>
                  <input
                    type="text"
                    placeholder="998898"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Unit *
                  </label>
                  <select
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="24.00"
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate (%) *
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  >
                    <option value="18">18% (CGST 9% + SGST 9% - Powder Coating Standard)</option>
                    <option value="12">12% (CGST 6% + SGST 6%)</option>
                    <option value="24">24% (CGST 12% + SGST 12%)</option>
                    <option value="36">36% (CGST 18% + SGST 18%)</option>
                    <option value="5">5% (CGST 2.5% + SGST 2.5%)</option>
                    <option value="0">0% (Nil / Non-GST)</option>
                  </select>
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
                  {editingProduct ? 'Update Product' : 'Save Product'}
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
              <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this product item from the master?
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
