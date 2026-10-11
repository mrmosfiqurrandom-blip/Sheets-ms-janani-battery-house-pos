import React, { useState } from 'react';
import { BatteryCharging, X, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import { ScrapBatteryTradeIn } from '../../types';

interface ScrapBatteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScrap: (scrap: ScrapBatteryTradeIn) => void;
}

export const ScrapBatteryModal: React.FC<ScrapBatteryModalProps> = ({
  isOpen,
  onClose,
  onAddScrap,
}) => {
  const [brand, setBrand] = useState('হ্যামকো (Hamko)');
  const [capacityAh, setCapacityAh] = useState('150Ah');
  const [customCapacity, setCustomCapacity] = useState('');
  const [value, setValue] = useState<number | ''>(3500);
  const [condition, setCondition] = useState('ডেড সেল / অক্ষত বডি');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCapacity = capacityAh === 'other' ? (customCapacity.trim() || 'Custom') : capacityAh;
    const finalVal = Number(value) || 0;

    if (finalVal <= 0) {
      alert('অনুগ্রহ করে পুরাতন ব্যাটারির মূল্য প্রদান করুন');
      return;
    }

    const tradeIn: ScrapBatteryTradeIn = {
      id: 'scrap-' + Date.now(),
      brand,
      capacityAh: finalCapacity,
      value: finalVal,
      condition,
      notes: notes || `কাস্টমারের পুরাতন ${brand} ${finalCapacity} ব্যাটারি এক্সচেঞ্জ গ্রহণ।`,
      soldStatus: 'in_stock',
    };

    onAddScrap(tradeIn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-950/20 rounded-xl">
              <BatteryCharging className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-950">
                পুরাতন ব্যাটারি জমা / এক্সচেঞ্জ এন্ট্রি
              </h3>
              <p className="text-xs text-slate-900 font-medium">
                নতুন ব্যাটারির মূল দাম ঠিক রেখে আলাদা স্ক্র্যাপ হিসাব তৈরি হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-950/10 text-slate-950 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info callout */}
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-amber-300">হিসাবের স্বচ্ছতা:</strong> গ্রাহকের মোট বিল থেকে এই টাকা মাইনাস হবে, কিন্তু নতুন ব্যাটারির সেলস রেট কমবে না। এই পুরাতন ব্যাটারিটি সরাসরি আপনার <strong>স্ক্র্যাপ ব্যাটারি স্টকে</strong> জমা হবে যাতে ভবিষ্যতে পাইকারি রিসাইক্লিং কারখানায় লাভসহ বিক্রি করতে পারেন।
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Battery Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                পুরাতন ব্যাটারির ব্র্যান্ড *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="হ্যামকো (Hamko)">হ্যামকো (Hamko)</option>
                <option value="রহিমআফরোজ (Rahimafrooz)">রহিমআফরোজ (Rahimafrooz)</option>
                <option value="লুকাস (Lucas)">লুকাস (Lucas)</option>
                <option value="নাভানা (Navana)">নাভানা (Navana)</option>
                <option value="ভলভো (Volvo)">ভলভো (Volvo)</option>
                <option value="ইস্টার্ন (Eastern)">ইস্টার্ন (Eastern)</option>
                <option value="গাড়ির ব্যাটারি (Car/Auto)">গাড়ির ব্যাটারি (Car/Auto)</option>
                <option value="অন্যান্য / লোকাল ব্র্যান্ড">অন্যান্য / লোকাল ব্র্যান্ড</option>
              </select>
            </div>

            {/* Capacity (Ah) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ক্যাপাসিটি / সাইজ (Ah) *
              </label>
              <select
                value={capacityAh}
                onChange={(e) => setCapacityAh(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="60Ah">60 Ah (ছোট গাড়ি)</option>
                <option value="80Ah">80 Ah</option>
                <option value="100Ah">100 Ah</option>
                <option value="120Ah">120 Ah</option>
                <option value="130Ah">130 Ah</option>
                <option value="150Ah">150 Ah (স্ট্যান্ডার্ড আইপিএস)</option>
                <option value="200Ah">200 Ah (হেভি আইপিএস)</option>
                <option value="other">অন্য সাইজ (কাস্টম)</option>
              </select>
            </div>
          </div>

          {capacityAh === 'other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                কাস্টম ব্যাটারি ক্যাপাসিটি লিখুন
              </label>
              <input
                type="text"
                placeholder="যেমন: 220Ah বা 24V সেট"
                value={customCapacity}
                onChange={(e) => setCustomCapacity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Trade-in Value / Buyback Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পুরাতন ব্যাটারির এক্সচেঞ্জ মূল্য (টাকা) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-amber-400 font-bold text-base">
                ৳
              </span>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={value}
                onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="যেমন: 3500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-base font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              এই পরিমাণ টাকা কাস্টমারের প্রদেয় বিল থেকে বিয়োগ হবে এবং আপনার ক্রয় হিসেবে স্টকে ঢুকবে।
            </p>
          </div>

          {/* Condition & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                শারীরিক অবস্থা
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ডেড সেল / অক্ষত বডি">ডেড সেল / অক্ষত বডি</option>
                <option value="টার্মিনাল ভাঙা">টার্মিনাল ভাঙা</option>
                <option value="বডি ফাটা / লিক">বডি ফাটা / লিক</option>
                <option value="মোটামুটি চার্জ ধরে">মোটামুটি চার্জ ধরে</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: লেড ওজন ২০ কেজি"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>কার্টে পুরাতন ব্যাটারি যোগ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
