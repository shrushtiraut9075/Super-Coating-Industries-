import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Share2,
  FileJson,
  X,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { exportAllData, importAllData, getInvoices, getCustomers, getProducts } from '../services/storage';
import { useToast } from './Toast';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported?: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onDataImported }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const invoiceCount = getInvoices().length;
  const customerCount = getCustomers().length;
  const productCount = getProducts().length;

  const handleExport = () => {
    try {
      const dataStr = exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `SuperCoating_Full_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('बॅकअप डाऊनलोड झाले!', 'ही फाईल तुमच्या दुसऱ्या PC, लॅपटॉप किंवा मोबाईलवर ट्रान्सफर करा.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error', 'बॅकअप डाऊनलोड करण्यात त्रुटी आली.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importAllData(content);
        setImportStatus(result);
        if (result.success) {
          showToast('सिंक यशस्वी!', result.message, 'success');
          if (onDataImported) onDataImported();
        } else {
          showToast('त्रुटी', result.message, 'error');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('अभिनंदन!', 'Super Coating ॲप इन्स्टॉल झाले आहे!', 'success');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      showToast(
        'इन्स्टॉल पर्याय',
        'ब्राऊझरच्या मेनूवर (⋮ किंवा Share) क्लिक करून "Add to Home Screen" किंवा "Install App" निवडा.',
        'info'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold">डिव्हाइस सिंक व मोबाईल ॲप (Sync & Mobile App)</h2>
              <p className="text-xs text-slate-400">PC, टॅबलेट आणि मोबाईलवर समान डेटा वापरा</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Status Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold block uppercase">या डिव्हाइसवरील सध्याचा डेटा:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {invoiceCount} इन्व्हॉइसेस &bull; {customerCount} ग्राहक &bull; {productCount} उत्पादने
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Section 1: One-click Data Transfer across PC/Mobile */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>१. एका डिव्हाइसवरून दुसऱ्या डिव्हाइसवर डेटा ट्रान्सफर (1-Click Sync):</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              कोणत्याही नवीन PC, लॅपटॉप किंवा मोबाईल फोनवर Super Coating Industries सुरू करण्यासाठी फक्त २ पायऱ्या:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Step 1: Export */}
              <button
                onClick={handleExport}
                className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">पायरी १: डेटा बॅकअप घ्या</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    या डिव्हाइसवरील सर्व इन्व्हॉइसेस, कस्टमर्स व सेटिंग्जची .json फाईल डाऊनलोड करा.
                  </p>
                </div>
                <span className="mt-3 inline-block text-xs font-bold text-blue-600">
                  डाऊनलोड करा &rarr;
                </span>
              </button>

              {/* Step 2: Import */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">पायरी २: दुसऱ्या डिव्हाइसवर लोड करा</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    तुमच्या दुसऱ्या मोबाईल किंवा PC वर ती .json फाईल सिलेक्ट करून डेटा रीस्टोअर करा.
                  </p>
                </div>
                <span className="mt-3 inline-block text-xs font-bold text-emerald-600">
                  फाईल निवडा (Restore) &rarr;
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Section 2: Mobile & Desktop App (PWA) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-600" />
              <span>२. मोबाईलवर ॲप म्हणून इन्स्टॉल करा (Install as Mobile App):</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              हे ॲप तुम्ही थेट तुमच्या अँड्रॉइड मोबाईल, आयफोन (iPhone) किंवा विंडोज पीसीवर स्वतंत्र ॲप म्हणून वापरू शकता (कोणत्याही प्ले स्टोअरची गरज नाही).
            </p>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-200/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Super Coating App</span>
                <span className="text-[11px] text-slate-600">मोबाईल होम स्क्रीनवर ॲप आयकॉन तयार होतो.</span>
              </div>

              <button
                onClick={handleInstallApp}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>मोबाईल ॲप इन्स्टॉल करा</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-200">
              <p className="font-semibold text-slate-800">💡 मोबाईलवर ॲप सुरू करण्याची सोपी पद्धत:</p>
              <p>&bull; <strong>Android (Chrome):</strong> ब्राऊझर मेनू (⋮) वर टॅप करा आणि <strong>'Install app'</strong> किंवा <strong>'Add to Home screen'</strong> निवडा.</p>
              <p>&bull; <strong>iPhone (Safari):</strong> खालील <strong>Share</strong> बटणावर टॅप करा आणि <strong>'Add to Home Screen'</strong> निवडा.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            पूर्ण झाले (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
