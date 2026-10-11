import React, { useState } from 'react';
import { BatteryCharging, X, Plus, ShieldCheck } from 'lucide-react';
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
  const [brand, setBrand] = useState('Hamko');
  const [capacityAh, setCapacityAh] = useState('150Ah');
  const [customCapacity, setCustomCapacity] = useState('');
  const [value, setValue] = useState<number | ''>(3500);
  const [condition, setCondition] = useState('Dead Cell / Intact Body');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCapacity = capacityAh === 'other' ? (customCapacity.trim() || 'Custom') : capacityAh;
    const finalVal = Number(value) || 0;

    if (finalVal <= 0) {
      alert('Please enter a valid old battery trade-in value');
      return;
    }

    const tradeIn: ScrapBatteryTradeIn = {
      id: 'scrap-' + Date.now(),
      brand,
      capacityAh: finalCapacity,
      value: finalVal,
      condition,
      notes: notes || `Customer trade-in exchange for ${brand} ${finalCapacity} battery.`,
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
                Old Battery Trade-in / Exchange
              </h3>
              <p className="text-xs text-slate-900 font-medium">
                Preserves original product selling price while recording scrap inventory
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
            <strong className="text-amber-300">Accounting Accuracy:</strong> This amount is deducted from the customer's total bill, but the selling price of the new battery remains completely unchanged. This old battery enters your <strong>Scrap Battery Stock</strong> so you can resell it at a profit to recycling plants.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Battery Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Old Battery Brand *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Hamko">Hamko</option>
                <option value="Rahimafrooz">Rahimafrooz</option>
                <option value="Lucas">Lucas</option>
                <option value="Navana">Navana</option>
                <option value="Volvo">Volvo</option>
                <option value="Eastern">Eastern</option>
                <option value="Automotive Car/Truck">Automotive Car/Truck</option>
                <option value="Generic / Local">Generic / Local</option>
              </select>
            </div>

            {/* Capacity (Ah) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Capacity / Size (Ah) *
              </label>
              <select
                value={capacityAh}
                onChange={(e) => setCapacityAh(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="60Ah">60 Ah (Small Car)</option>
                <option value="80Ah">80 Ah</option>
                <option value="100Ah">100 Ah</option>
                <option value="120Ah">120 Ah</option>
                <option value="130Ah">130 Ah</option>
                <option value="150Ah">150 Ah (Standard IPS)</option>
                <option value="200Ah">200 Ah (Heavy IPS)</option>
                <option value="other">Other Size (Custom)</option>
              </select>
            </div>
          </div>

          {capacityAh === 'other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter Custom Capacity
              </label>
              <input
                type="text"
                placeholder="e.g., 220Ah or 24V Set"
                value={customCapacity}
                onChange={(e) => setCustomCapacity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Trade-in Value */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trade-in Value / Buyback Credit (Amount) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-amber-400 font-bold text-base">
                $
              </span>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={value}
                onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g., 3500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              This amount is deducted from the customer's payable total and enters your inventory as scrap purchase.
            </p>
          </div>

          {/* Condition & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Physical Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Dead Cell / Intact Body">Dead Cell / Intact Body</option>
                <option value="Broken Terminal">Broken Terminal</option>
                <option value="Cracked Casing / Leaking">Cracked Casing / Leaking</option>
                <option value="Fair / Holds Minor Charge">Fair / Holds Minor Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Lead weight approx 20kg"
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Old Battery to Cart</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
