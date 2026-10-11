import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  Database,
  ArrowRight,
  ShieldCheck,
  Download,
  Upload,
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  testGoogleSheetConnection,
  syncAllToGoogleSheet,
} from '../../services/googleSheetsSync';
import { ShopSettings } from '../../types';

interface GoogleSheetsSyncViewProps {
  settings: ShopSettings;
  onUpdateSettings: (settings: ShopSettings) => void;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  exportBackup: () => void;
  importBackup: (fileContent: string) => boolean;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  settings,
  onUpdateSettings,
  onSyncAll,
  isSyncing,
  exportBackup,
  importBackup,
}) => {
  const [scriptUrl, setScriptUrl] = useState(settings.googleScriptUrl || '');
  const [autoSync, setAutoSync] = useState(settings.autoSync || false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'code' | 'schema' | 'backup'>('setup');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      googleScriptUrl: scriptUrl.trim(),
      autoSync,
    });
    alert('গুগল শিট সেটিংস সংরক্ষিত হয়েছে!');
  };

  const handleTestConnection = async () => {
    if (!scriptUrl.trim()) {
      alert('অনুগ্রহ করে Google Apps Script Web App URL টি প্রদান করুন।');
      return;
    }
    setIsTesting(true);
    const res = await testGoogleSheetConnection(scriptUrl.trim());
    setIsTesting(false);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackup(content);
        if (ok) {
          alert('ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে!');
          window.location.reload();
        } else {
          alert('ব্যাকআপ ফাইলে ত্রুটি রয়েছে। সঠিক JSON ফাইল নির্বাচন করুন।');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              গুগল শিট ও গুগল অ্যাপ স্ক্রিপ্ট ডাটাবেস
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              আপনার গুগল ড্রাইভের Google Sheet-কে সম্পূর্ণ ডাটাবেস হিসেবে ব্যবহার করুন
            </p>
          </div>
        </div>
      </div>

      {/* Connection Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Cloud className="w-5 h-5 text-amber-400" />
              <span>Google Apps Script Web App সংযোগ</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Google Sheet-এর Apps Script থেকে পাওয়া Web App URL এখানে দিন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !scriptUrl}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'পরীক্ষা করা হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
            </button>

            <button
              onClick={handleSaveSettings}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              সেভ করুন
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Google Apps Script Web App URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            উদাহরণ: <code className="text-slate-400 font-mono">https://script.google.com/macros/s/AKfycbx.../exec</code>
          </p>
        </div>

        {/* Toggle & Sync Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-300 font-medium">
              প্রতিটি নতুন সেল বা খরচে স্বয়ংক্রিয় সিঙ্ক (Auto-Sync) চালু রাখুন
            </span>
          </label>

          <button
            onClick={onSyncAll}
            disabled={isSyncing || !settings.googleScriptUrl}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>এখনই সব ডাটা গুগল শিটে পাঠান (Sync Now)</span>
          </button>
        </div>

        {/* Test Result Message */}
        {testResult?.tested && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/40'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('setup')}
          className={`pb-2.5 px-3 border-b-2 transition shrink-0 ${
            activeTab === 'setup'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ধাপে ধাপে সেটআপ গাইড (Setup Guide)
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`pb-2.5 px-3 border-b-2 transition shrink-0 ${
            activeTab === 'code'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          গুগল অ্যাপ স্ক্রিপ্ট কোড (Code.gs)
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-2.5 px-3 border-b-2 transition shrink-0 ${
            activeTab === 'schema'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          শিটের টেবিল ও কলাম সমূহ (Sheet Schema)
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-2.5 px-3 border-b-2 transition shrink-0 ${
            activeTab === 'backup'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          লোকাল ব্যাকআপ ও রিস্টোর (JSON Backup)
        </button>
      </div>

      {/* TAB 1: SETUP GUIDE */}
      {activeTab === 'setup' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                ১
              </div>
              <h4 className="font-bold text-white text-sm">গুগল শিট তৈরি করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                আপনার ব্রাউজারে <strong>sheets.google.com</strong> এ যান এবং একটি নতুন ব্ল্যাংক স্প্রেডশিট খুলুন। নাম দিন <em>"ইলেক্ট্রো পাওয়ার পিওএস ডাটাবেস"</em>।
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                ২
              </div>
              <h4 className="font-bold text-white text-sm">Apps Script এ যান</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                স্প্রেডশিটের উপরের মেনুবার থেকে <strong>Extensions &gt; Apps Script</strong> এ ক্লিক করুন। একটি নতুন কোড এডিটর উইন্ডো ওপেন হবে।
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                ৩
              </div>
              <h4 className="font-bold text-white text-sm">Code.gs কোড পেস্ট করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                পাশের <strong>Code.gs</strong> ট্যাব থেকে সম্পূর্ণ কোডটি কপি করে এডিটরের সব আগের কোড মুছে পেস্ট করুন এবং Save আইকনে ক্লিক করুন।
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                ৪
              </div>
              <h4 className="font-bold text-white text-sm">Web App হিসেবে Deploy করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                উপরের ডানপাশে নীল রঙের <strong>Deploy &gt; New deployment</strong> বাটনে ক্লিক করুন। Select type: <strong>Web app</strong> নির্বাচন করুন।
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                ৫
              </div>
              <h4 className="font-bold text-white text-sm">Who has access: Anyone</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Execute as:</strong> "Me (আপনার ইমেইল)" এবং <strong>Who has access:</strong> "Anyone" দিন। তারপর <strong>Deploy</strong> এ চাপুন।
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                ৬
              </div>
              <h4 className="font-bold text-white text-sm">URL পেস্ট করে সেভ করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deploy সম্পন্ন হলে যে <strong>Web app URL</strong> টি দেখতে পাবেন, সেটি কপি করে এই অ্যাপের উপরের ইনপুট বক্সে বসিয়ে <strong>সেভ করুন</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE.GS */}
      {activeTab === 'code' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              এই কোডটি গুগল স্প্রেডশিটের Extensions &gt; Apps Script-এ পেস্ট করবেন:
            </span>
            <button
              onClick={handleCopyCode}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'কোড কপি হয়েছে!' : 'সম্পূর্ণ কোড কপি করুন'}</span>
            </button>
          </div>

          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed p-2">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>1. Sales (বিক্রয় খাতা)</span>
            </h4>
            <p className="text-xs text-slate-400">
              কলামসমূহ: Invoice ID, Date, Time, Customer Name, Customer Phone, Address, Items Sold, Subtotal (Tk), Scrap Credit (Tk), Discount (Tk), Net Payable (Tk), Paid Amount (Tk), Due Amount (Tk), Payment Method, Notes
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>2. Scrap_Batteries (পুরাতন ব্যাটারি খাতা)</span>
            </h4>
            <p className="text-xs text-slate-400">
              কলামসমূহ: Scrap ID, Date, Invoice ID, Customer Name, Phone, Battery Brand, Capacity (Ah), Buyback Value (Tk), Status (In Stock / Sold), Sold Price (Tk), Sold To Party, Sold Date, Profit (Tk), Notes
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-blue-400 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>3. Products (পণ্য ও স্টক)</span>
            </h4>
            <p className="text-xs text-slate-400">
              কলামসমূহ: Product ID, Barcode/SKU, Product Name, Brand, Category, Unit, Buy Price (Tk), Sell Price (Tk), Stock Qty, Min Alert, Warranty
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>4. Suppliers & Supplier_Ledger (সাপ্লায়ার ও লেজার)</span>
            </h4>
            <p className="text-xs text-slate-400">
              কলামসমূহ: Entry ID, Date, Supplier Name, Transaction Type, Invoice / Ref No, Bill Amount (Tk), Paid Amount (Tk), Commission / Rebate (Tk), Running Balance (Tk), Items / Description, Notes
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 md:col-span-2">
            <h4 className="font-bold text-purple-400 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>5. Expenses (দোকানের আনুষাঙ্গিক খরচ)</span>
            </h4>
            <p className="text-xs text-slate-400">
              কলামসমূহ: Expense ID, Date, Category, Amount (Tk), Paid To, Payment Method, Notes
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP */}
      {activeTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h4 className="font-bold text-white text-base">লোকাল ব্যাকআপ ও রিস্টোর</h4>
            <p className="text-xs text-slate-400">
              আপনার কম্পিউটার বা মোবাইলে সমস্ত পণ্য, বিক্রয় ও লেজারের সম্পূর্ণ ব্যাকআপ ফাইল নামিয়ে রাখুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={exportBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>সম্পূর্ণ ডাটাবেস ডাউনলোড (JSON Backup)</span>
            </button>

            <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>ব্যাকআপ ফাইল থেকে রিস্টোর করুন</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
