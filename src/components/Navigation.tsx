import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Users,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Building2,
  Layers,
  ArrowUpRight,
  Smartphone,
  Shield,
  User,
  RefreshCw,
  LogOut,
  KeyRound,
  UserCheck,
  ReceiptText,
} from 'lucide-react';
import { ActiveTab, CompanyProfile, AppUser } from '../types';
import { Logo } from './Logo';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  invoiceCount: number;
  receiptCount?: number;
  isCloudSynced?: boolean;
  company: CompanyProfile;
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onOpenSync: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  invoiceCount,
  receiptCount = 0,
  isCloudSynced = false,
  company,
  currentUser,
  onOpenLogin,
  onOpenSync,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices' as ActiveTab, label: 'Invoices', icon: FileText, badge: invoiceCount },
    { id: 'receipts' as ActiveTab, label: 'Payment Receipts', icon: ReceiptText, badge: receiptCount },
    { id: 'new-invoice' as ActiveTab, label: 'Create Invoice', icon: FilePlus2, highlight: true },
    { id: 'customers' as ActiveTab, label: 'Customer Master', icon: Users },
    { id: 'products' as ActiveTab, label: 'Product Master', icon: Package },
    { id: 'reports' as ActiveTab, label: 'Reports & GST', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Company Settings', icon: Settings },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Mobile Bar (Hidden in Print) */}
      <header className="lg:hidden print:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm shrink-0">
            <Logo variant="icon" className="w-full h-full" logoUrl={company.logoUrl} />
          </div>
          <div>
            <div className="flex items-center gap-1 font-black text-sm tracking-tight leading-none">
              <span className="text-white">SUPER</span>
              <span className="text-orange-500">COATING</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">GST: {company.gstin}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Firebase Real-Time Cloud Sync Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isCloudSynced
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Real-Time Firebase Multi-Device Sync Active"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCloudSynced ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{isCloudSynced ? 'Cloud Live' : 'Connecting...'}</span>
          </div>

          {/* User Role Badge in Mobile Header */}
          <button
            onClick={onOpenLogin}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              currentUser?.role === 'admin'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
            }`}
            title="Click to Switch User"
          >
            <Shield className="w-3 h-3" />
            <span>{currentUser?.role || 'User'}</span>
          </button>

          <button
            onClick={onOpenSync}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            title="Sync Data Across Devices"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </button>

          <button
            onClick={() => handleNavClick('new-invoice')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>+ Bill</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Hidden in Print) */}
      {mobileMenuOpen && (
        <div className="lg:hidden print:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 text-white w-72 h-full flex flex-col p-5 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                  <Logo variant="icon" className="w-full h-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1 font-black text-sm leading-none">
                    <span className="text-white">SUPER</span>
                    <span className="text-orange-500">COATING</span>
                  </div>
                  <span className="text-[11px] text-blue-400 font-mono font-medium block mt-0.5">
                    GST Billing
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : item.highlight
                        ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                    currentUser?.role === 'admin'
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  }`}>
                    {currentUser?.role === 'admin' ? 'AD' : 'OP'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {currentUser?.displayName || currentUser?.username}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                      currentUser?.role === 'admin' ? 'text-purple-300' : 'text-amber-300'
                    }`}>
                      {currentUser?.role === 'admin' ? 'Admin (Full)' : 'Operator (Billing)'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="text-[10px] font-bold text-slate-300 bg-slate-700 px-2 py-1 rounded"
                >
                  बदला
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSync();
                }}
                className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-blue-900/40 to-slate-800 text-blue-200 text-xs font-semibold rounded-xl border border-blue-500/30"
              >
                <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                <span>PC & Mobile Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Hidden in Print) */}
      <aside className="hidden lg:flex print:hidden w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex-col shrink-0 h-screen sticky top-0 shadow-sm">
        {/* Brand Area */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md ring-2 ring-blue-500/20 shrink-0">
              <Logo variant="icon" className="w-full h-full" logoUrl={company.logoUrl} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 font-black text-sm tracking-tight truncate leading-none">
                <span className="text-white">SUPER</span>
                <span className="text-orange-500">COATING</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                INDUSTRIES
              </p>
              <p className="text-[11px] text-blue-400 font-medium">GST Tax Invoice</p>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px]">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>GSTIN</span>
              <span className="font-mono font-medium text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                ACTIVE
              </span>
            </div>
            <div className="font-mono text-slate-200 font-semibold tracking-wide text-xs">
              {company.gstin}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              Chimbali, Pune (State: 27)
            </div>

            {/* Cloud Sync Status */}
            <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Multi-Device Sync</span>
              <span
                className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full ${
                  isCloudSynced
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCloudSynced ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{isCloudSynced ? 'Firebase Live' : 'Connecting...'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : item.highlight
                    ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session & Device Sync Bottom Cards */}
        <div className="p-3.5 border-t border-slate-800 space-y-2">
          {/* User Role Card */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
              }`}>
                {currentUser?.role === 'admin' ? 'AD' : 'OP'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {currentUser?.displayName || currentUser?.username || 'User'}
                </span>
                <span className={`text-[9.5px] font-bold uppercase tracking-wider block ${
                  currentUser?.role === 'admin' ? 'text-purple-300' : 'text-amber-300'
                }`}>
                  {currentUser?.role === 'admin' ? 'Admin (Full Access)' : 'Operator (Billing)'}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenLogin}
              className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors shrink-0 ml-1"
              title="Switch user account"
            >
              बदला
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onOpenSync}
            className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-blue-900/40 to-slate-800 hover:from-blue-900/60 hover:to-slate-700 text-blue-200 text-xs font-semibold rounded-xl border border-blue-500/30 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-400" />
            <span>PC, Tab व Mobile Sync</span>
          </button>
        </div>
      </aside>
    </>
  );
};
