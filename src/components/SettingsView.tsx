import React, { useState, useEffect } from 'react';
import {
  Building2,
  Settings as SettingsIcon,
  CreditCard,
  FileText,
  ShieldCheck,
  Save,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Users,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Lock,
  UserCheck,
  Laptop,
} from 'lucide-react';
import { CompanyProfile, InvoiceSettings, AppUser, UserRole } from '../types';
import { INDIAN_STATES } from '../utils/formatters';
import { getUsers, saveUser, deleteUser } from '../services/storage';
import { useToast } from './Toast';
import { Logo } from './Logo';

interface SettingsViewProps {
  company: CompanyProfile;
  settings: InvoiceSettings;
  currentUser: AppUser | null;
  onSaveCompany: (company: CompanyProfile) => void;
  onSaveSettings: (settings: InvoiceSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => boolean;
  onResetDefaults: () => void;
  onOpenSyncModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company,
  settings,
  currentUser,
  onSaveCompany,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  onOpenSyncModal,
}) => {
  const { showToast } = useToast();
  const isOperator = currentUser?.role === 'operator';

  // User Management State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');

  // Change Password state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNewPassword, setEditNewPassword] = useState('');

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  // Company Form State
  const [name, setName] = useState(company.name);
  const [tagline, setTagline] = useState(company.tagline || '');
  const [address, setAddress] = useState(company.address);
  const [state, setState] = useState(company.state);
  const [stateCode, setStateCode] = useState(company.stateCode);
  const [gstin, setGstin] = useState(company.gstin);
  const [pan, setPan] = useState(company.pan);
  const [mobile, setMobile] = useState(company.mobile);
  const [email, setEmail] = useState(company.email);

  // Logo State (Editable by Admin)
  const [logoUrl, setLogoUrl] = useState<string>(company.logoUrl || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Bank Form State
  const [bankName, setBankName] = useState(company.bankName);
  const [accountNumber, setAccountNumber] = useState(company.accountNumber);
  const [ifsc, setIfsc] = useState(company.ifsc);
  const [branch, setBranch] = useState(company.branch);

  // Invoice Numbering Settings
  const [prefix, setPrefix] = useState(settings.prefix);
  const [nextNumber, setNextNumber] = useState(settings.nextNumber);
  const [paddingDigits, setPaddingDigits] = useState(settings.paddingDigits);
  const [financialYear, setFinancialYear] = useState(settings.financialYear);

  // Terms and Conditions
  const [terms, setTerms] = useState<string[]>(company.terms || []);
  const [newTerm, setNewTerm] = useState('');

  // Sync state if company prop updates
  useEffect(() => {
    setLogoUrl(company.logoUrl || '');
    setName(company.name);
    setTagline(company.tagline || '');
    setAddress(company.address);
    setState(company.state);
    setStateCode(company.stateCode);
    setGstin(company.gstin);
    setPan(company.pan);
    setMobile(company.mobile);
    setEmail(company.email);
    setBankName(company.bankName);
    setAccountNumber(company.accountNumber);
    setIfsc(company.ifsc);
    setBranch(company.branch);
    setTerms(company.terms || []);
  }, [company]);

  // Handle Logo Upload with Canvas Optimization
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        // Optimize image size (max 500px) so it's crisp for A4 print but fits well in storage
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
          setLogoUrl(optimizedDataUrl);
          showToast('Logo Selected', 'Logo preview updated. Click "Save Company Profile" to apply.', 'success');
        } else {
          setLogoUrl(src);
        }
      };
      img.onerror = () => {
        setLogoUrl(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyLogoUrl = () => {
    if (!customUrlInput.trim()) return;
    setLogoUrl(customUrlInput.trim());
    setCustomUrlInput('');
    setShowUrlInput(false);
    showToast('Logo URL Applied', 'Logo updated from link.', 'success');
  };

  const handleResetLogo = () => {
    setLogoUrl('');
    showToast('Default Logo Restored', 'Original Super Coating Industries vector logo restored.', 'info');
  };

  // Handle Save Company & Bank
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCompany: CompanyProfile = {
      ...company,
      name: name.trim().toUpperCase(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim() || undefined,
      address: address.trim(),
      state: state.trim(),
      stateCode: stateCode.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      mobile: mobile.trim(),
      email: email.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      branch: branch.trim(),
      terms,
    };

    onSaveCompany(updatedCompany);
    showToast('Company Profile Saved', 'Updated company profile, logo & bank information', 'success');
  };

  // Handle Save Invoice Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: InvoiceSettings = {
      prefix: prefix.trim(),
      nextNumber: Number(nextNumber) || 1,
      paddingDigits: Number(paddingDigits) || 3,
      financialYear: financialYear.trim(),
    };

    onSaveSettings(updatedSettings);
    showToast('Settings Saved', 'Invoice numbering configuration updated', 'success');
  };

  // Term management
  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setTerms([...terms, newTerm.trim()]);
    setNewTerm('');
  };

  const handleRemoveTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  // Handle File Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportBackup(content);
        if (ok) {
          showToast('Data Restored', 'All invoices, master data & settings restored', 'success');
        } else {
          showToast('Import Failed', 'Invalid backup file format', 'error');
        }
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Company Settings</h2>
          <p className="text-xs text-slate-500">
            Configure business identity, bank account for invoices, numbering series, and backups
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Company Details & Bank Info (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Operator Mode Notification Banner */}
          {isOperator && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  ऑपरेटर मोड (Operator Restricted Mode)
                </h4>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed font-medium">
                  कंपनी प्रोफाइल, बँक खात्याचा तपशील, व GST सेटिंग्ज बदलण्याची परवानगी फक्त Admin कडे आहे. ऑपरेटरसाठी हे फील्ड्स फक्त वाचण्यासाठी (Read-Only) आहेत.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveCompany} className="space-y-6">
            <fieldset disabled={isOperator} className="space-y-6 group">
            {/* Company Profile Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Company Profile & GST Information</span>
              </h3>

              {/* Logo Management & Upload Section (कंपनी लोगो एडिट व बदलणे) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Company Brand Logo (कंपनी लोगो एडिट करा)
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    logoUrl
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {logoUrl ? 'Custom Admin Logo (कस्टम लोगो)' : 'Official Default Logo (मूळ लोगो)'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Live Logo Preview Box */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-20 h-20 bg-white p-2 rounded-xl shadow-xs border-2 border-slate-300 flex items-center justify-center">
                      <Logo variant="icon" className="w-full h-full" logoUrl={logoUrl} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Live Preview
                    </span>
                  </div>

                  {/* Actions & Instructions */}
                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {logoUrl ? 'Custom Brand Logo Active' : 'Default Super Coating Industries Logo Active'}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        हा लोगो बिलाच्या प्रिंटवर (A4 Tax Invoice PDF), हेडरमध्ये आणि ॲपच्या साइडबारवर दिसतो.
                      </p>
                    </div>

                    {!isOperator ? (
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        {/* Upload Button */}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload New Logo (नवीन लोगो अपलोड करा)</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>

                        {/* URL Toggle */}
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <span>Logo URL</span>
                        </button>

                        {/* Reset to Default Button */}
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleResetLogo}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
                            title="Reset to official Super Coating Industries logo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset to Default (मूळ लोगो सेट करा)</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 text-xs italic">
                        🔒 कंपनी लोगो केवळ Admin द्वारे बदलता येतो (Locked for Operator)
                      </div>
                    )}

                    {/* URL Input Bar */}
                    {!isOperator && showUrlInput && (
                      <div className="pt-1 flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyLogoUrl}
                          className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-slate-500 pt-0.5">
                      <span>✓ Supports PNG, JPG, JPEG, SVG, WebP</span>
                      <span>✓ Auto-scaled for crisp A4 Invoice printing</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Name (as per GST Certificate) *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Factory / Registered Address *
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                      if (st) setStateCode(st.code);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN *
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PAN *
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / Contact Numbers *
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Bank Account Details for Direct Payment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Conditions Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Default Terms & Conditions on Invoices</span>
                <span className="text-xs text-slate-500 font-normal">{terms.length} clauses</span>
              </h3>

              <div className="space-y-2">
                {terms.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <span className="font-bold text-slate-400 mt-0.5">{index + 1}.</span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const copy = [...terms];
                        copy[index] = e.target.value;
                        setTerms(copy);
                      }}
                      className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-slate-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(index)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add new clause or warranty term..."
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTerm();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            </fieldset>

            {/* Save Button (Admin Only) */}
            {!isOperator ? (
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Company & Bank Profile</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-semibold border border-slate-200">
                🔒 कंपनी प्रोफाइल बदलण्याचे अधिकार केवळ Admin कडे आहेत (Operator Mode)
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Numbering, User Accounts & Data Management (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Accounts Management (Admin Only) */}
          {!isOperator && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>युझर्स व पासवर्ड (User Accounts)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddUser ? 'बंद करा' : 'नवीन युझर'}</span>
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newUsername.trim() || !newPassword.trim()) {
                      showToast('Error', 'Username व Password आवश्यक आहे', 'error');
                      return;
                    }
                    const newUser: AppUser = {
                      id: `user-${Date.now()}`,
                      username: newUsername.trim().toLowerCase(),
                      displayName: newDisplayName.trim() || newUsername.trim(),
                      role: newRole,
                      passwordHash: newPassword.trim(),
                      createdAt: new Date().toISOString(),
                    };
                    saveUser(newUser);
                    refreshUsers();
                    setShowAddUser(false);
                    setNewUsername('');
                    setNewPassword('');
                    setNewDisplayName('');
                    showToast('User Created', `नवीन युझर (${newUser.username}) तयार झाला!`, 'success');
                  }}
                  className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2.5 text-xs"
                >
                  <span className="font-bold text-purple-900 uppercase block">नवीन युझर तयार करा:</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Username *</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="उदा. operator2"
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">नाव (Display Name)</label>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="उदा. Rahul (Billing)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Role (अधिकार) *</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                      >
                        <option value="operator">Operator (बिलिंग/प्रिंटिंग)</option>
                        <option value="admin">Admin (पूर्ण अधिकार)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Password *</label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="पासवर्ड टाका"
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    युझर सेव्ह करा (Save User)
                  </button>
                </form>
              )}

              {/* Users List */}
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{u.displayName || u.username}</span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        User: <span className="font-bold text-slate-700">{u.username}</span> &bull; Pass: <span className="font-bold text-slate-700">{u.passwordHash}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editNewPassword}
                            onChange={(e) => setEditNewPassword(e.target.value)}
                            placeholder="नवीन पासवर्ड"
                            className="w-24 px-2 py-1 text-xs border border-blue-400 rounded bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!editNewPassword.trim()) return;
                              u.passwordHash = editNewPassword.trim();
                              saveUser(u);
                              refreshUsers();
                              setEditingUserId(null);
                              setEditNewPassword('');
                              showToast('Password Updated', `${u.username} चा पासवर्ड बदलला!`, 'success');
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(u.id);
                            setEditNewPassword(u.passwordHash);
                          }}
                          title="Change Password"
                          className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 text-[11px] font-medium"
                        >
                          पासवर्ड बदला
                        </button>
                      )}

                      {u.username !== 'admin' && users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteUser(u.id);
                            refreshUsers();
                            showToast('Deleted', `${u.username} हटवला.`, 'info');
                          }}
                          title="Delete user"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Numbering Config */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-600" />
              <span>Invoice Numbering</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prefix (e.g. 2026-27-)
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  disabled={isOperator}
                  className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold ${
                    isOperator ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Invoice Counter Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={nextNumber}
                  onChange={(e) => setNextNumber(parseInt(e.target.value, 10) || 1)}
                  disabled={isOperator}
                  className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold ${
                    isOperator ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Digit Padding (e.g. 3 &rarr; 001)
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={paddingDigits}
                  onChange={(e) => setPaddingDigits(parseInt(e.target.value, 10) || 3)}
                  disabled={isOperator}
                  className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono ${
                    isOperator ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Preview Next Invoice No:</span>
                <span className="font-mono font-extrabold text-blue-700 text-sm">
                  {prefix}
                  {String(nextNumber).padStart(paddingDigits, '0')}
                </span>
              </div>

              {!isOperator && (
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Update Series
                </button>
              )}
            </form>
          </div>

          {/* Backup & Multi-Device Sync */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Sync & Multi-Device App</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              कोणत्याही दुसऱ्या PC, टॅब किंवा मोबाईलवर हाच डेटा वापरण्यासाठी आणि मोबाईल ॲप इन्स्टॉल करण्यासाठी खालील बटण दाबा.
            </p>

            {onOpenSyncModal && (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4 text-orange-400" />
                <span>PC, Tab & Mobile Sync केंद्र उघडा</span>
              </button>
            )}

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={onExportBackup}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-300"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export JSON Backup</span>
              </button>

              {!isOperator && (
                <label className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Restore from JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              {!isOperator && (
                <div className="pt-3 border-t border-slate-100">
                  {showResetConfirm ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-rose-800">
                        तुम्हाला खात्री आहे का? सध्याचा सर्व डेटा बदलून सॅम्पल डेटा लोड होईल.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onResetDefaults();
                            setShowResetConfirm(false);
                            refreshUsers();
                            showToast('Reset Complete', 'Default data reloaded', 'info');
                          }}
                          className="flex-1 py-1.5 bg-rose-600 text-white rounded text-xs font-bold"
                        >
                          होय, रीसेट करा
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          रद्द
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors border border-rose-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Sample Data</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
