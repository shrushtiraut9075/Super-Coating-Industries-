import React, { useState } from 'react';
import {
  Lock,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
} from 'lucide-react';
import { AppUser } from '../types';
import { authenticateUser, getUsers } from '../services/storage';
import { Logo } from './Logo';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: AppUser | null;
  onLoginSuccess: (user: AppUser) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  onLoginSuccess,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('कृपया युझरनेम (Username) प्रविष्ट करा');
      return;
    }

    if (!password) {
      setError('कृपया पासवर्ड (Password) प्रविष्ट करा');
      return;
    }

    const user = authenticateUser(username, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('अवैध युझरनेम किंवा पासवर्ड! (Invalid credentials)');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'operator') => {
    const users = getUsers();
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      const authenticated = authenticateUser(targetUser.username, targetUser.passwordHash);
      if (authenticated) {
        onLoginSuccess(authenticated);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl p-1.5 shadow-lg mx-auto flex items-center justify-center mb-3">
            <Logo variant="icon" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">SUPER COATING INDUSTRIES</h2>
          <p className="text-xs text-blue-200 font-medium mt-0.5">GST Tax Billing & Invoice System</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>सुरक्षित लॉगिन (Secure Access)</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              युझरनेम (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="उदा. admin किंवा operator"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden transition-all"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              पासवर्ड (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="तुमचा पासवर्ड टाका"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>लॉगिन करा (Sign In)</span>
          </button>

          {/* Quick Demo Switchers */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              झटपट चाचणी लॉगिन (Quick Access):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-700 uppercase">Admin</span>
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">पूर्ण अधिकार (Full Access)</p>
                <p className="text-[9.5px] font-mono text-slate-400 mt-1">admin / admin123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 uppercase">Operator</span>
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">बिलिंग (No Profile Edit)</p>
                <p className="text-[9.5px] font-mono text-slate-400 mt-1">operator / operator123</p>
              </button>
            </div>
          </div>
        </form>

        {onClose && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              रद्द करा (Close)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
