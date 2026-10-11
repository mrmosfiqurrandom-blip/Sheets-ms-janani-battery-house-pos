import React, { useState, useEffect } from 'react';
import {
  Zap,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Clock,
  Plus,
  ShoppingCart,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { ShopSettings } from '../types';

interface NavbarProps {
  settings: ShopSettings;
  onNavigate: (tab: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  syncStatus: { success: boolean; message: string; timestamp?: string } | null;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onNavigate,
  onSync,
  isSyncing,
  syncStatus,
  activeTab,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('bn-BD', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = !!settings.googleScriptUrl;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Zap className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                {settings.shopName}
              </h1>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold px-2 py-0.5 rounded-full">
                POS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {settings.tagline} • <Phone className="w-3 h-3 inline text-slate-400 ml-1 mr-0.5" />
              {settings.phone}
            </p>
          </div>
        </div>

        {/* Live Date/Time & Quick Status */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-white">{currentTime}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{currentDate}</span>
        </div>

        {/* Google Sheets Sync & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Sheets Status Badge */}
          <button
            onClick={() => onNavigate('sheets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
            }`}
            title="গুগল শিট সিঙ্ক সেটিংস খুলুন"
          >
            <Cloud className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="hidden md:inline">
              {isConnected ? 'গুগল শিট কানেক্টেড' : 'গুগল শিট সেটআপ'}
            </span>
            {isConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Sync Now button */}
          {isConnected && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition disabled:opacity-50"
              title="গুগল শিটে ডাটা সিঙ্ক করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">সিঙ্ক করুন</span>
            </button>
          )}

          {/* New Sale Button */}
          <button
            onClick={() => onNavigate('pos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>নতুন সেল (POS)</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner if recently synced */}
      {syncStatus && (
        <div
          className={`py-1 px-4 text-xs text-center border-t ${
            syncStatus.success
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/40'
          }`}
        >
          {syncStatus.message} {syncStatus.timestamp && `(${syncStatus.timestamp})`}
        </div>
      )}
    </header>
  );
};
