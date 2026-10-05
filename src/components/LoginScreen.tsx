import React, { useState } from 'react';
import {
  Lock,
  User,
  Shield,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { AppUser } from '../types';
import { authenticateUser, getCompanyProfile } from '../services/storage';
import { Logo } from './Logo';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const company = getCompanyProfile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('कृपया युझरनेम (Username) प्रविष्ट करा.');
      return;
    }

    if (!password) {
      setError('कृपया पासवर्ड (Password) प्रविष्ट करा.');
      return;
    }

    setIsLoading(true);

    try {
      const user = authenticateUser(trimmedUser, password);

      if (!user) {
        setError('चुकीचे युझरनेम किंवा पासवर्ड! कृपया योग्य माहिती प्रविष्ट करा.');
        setIsLoading(false);
        return;
      }

      // Requirement: Security is strictly compulsory & restricted to ADMIN only
      if (user.role !== 'admin') {
        setError('प्रवेश नाकारला! ही प्रणाली केवळ मुख्य ॲडमिनसाठीच (Admin Only) सुरक्षित आहे.');
        setIsLoading(false);
        return;
      }

      // Success
      setIsLoading(false);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Login error:', err);
      setError('लॉगिन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header Branding */}
          <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 p-6 text-white text-center relative border-b border-blue-900/50">
            <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-xl mx-auto flex items-center justify-center mb-3.5 border-2 border-white/20">
              <Logo variant="icon" className="w-full h-full object-contain" logoUrl={company.logoUrl} />
            </div>

            <h1 className="text-xl font-black tracking-tight uppercase text-white leading-tight">
              {company.name || 'SUPER COATING INDUSTRIES'}
            </h1>
            <p className="text-xs text-blue-200 font-medium mt-1">
              GST Tax Billing & Invoicing System
            </p>

            {/* Mandatory Security Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>सुरक्षित ॲडमिन पोर्टल (Admin Access Only)</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-base font-black text-slate-900">
                अनिवार्य ॲडमिन लॉगिन (Login Required)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                प्रणाली उघडण्यासाठी युझरनेम व पासवर्ड टाकणे अनिवार्य आहे.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                युझरनेम (Username) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="युझरनेम टाका (उदा. admin)"
                  autoFocus
                  required
                  className="w-full pl-10 pr-3.5 py-3 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden transition-all text-slate-900"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                पासवर्ड (Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="पासवर्ड टाका"
                  required
                  className="w-full pl-10 pr-11 py-3 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden transition-all text-slate-900"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'पडताळणी करत आहे...' : 'सुरक्षित लॉगिन करा (Sign In)'}</span>
            </button>

            {/* Credential Reference Box for Admin */}
            <div className="pt-3 border-t border-slate-200">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-700">
                  डीफॉल्ट ॲडमिन लॉगिन (Default Admin):
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-mono font-black text-blue-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                  <span>admin</span>
                  <span className="text-slate-400">/</span>
                  <span>admin123</span>
                </div>
                <p className="text-[10px] text-slate-500 pt-0.5">
                  (लॉगिन झाल्यानंतर सेटिंग्जमधून पासवर्ड बदलू शकता)
                </p>
              </div>
            </div>
          </form>

          {/* Footer Security Note */}
          <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Session & Local Vault</span>
          </div>
        </div>
      </div>
    </div>
  );
};
