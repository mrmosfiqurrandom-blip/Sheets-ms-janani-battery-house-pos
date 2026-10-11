import React, { useState } from 'react';
import {
  BatteryCharging,
  TrendingUp,
  PackageCheck,
  Package,
  Search,
  Plus,
  CheckCircle,
  X,
} from 'lucide-react';
import { ScrapBatteryRecord } from '../../types';

interface ScrapBatteriesViewProps {
  scrapBatteries: ScrapBatteryRecord[];
  onSellScrap: (
    id: string,
    soldPrice: number,
    soldParty: string,
    soldDate: string,
    notes?: string
  ) => void;
  onDeleteScrap: (id: string) => void;
  onAddManualScrap: (scrap: ScrapBatteryRecord) => void;
}

export const ScrapBatteriesView: React.FC<ScrapBatteriesViewProps> = ({
  scrapBatteries,
  onSellScrap,
  onDeleteScrap,
  onAddManualScrap,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sell Scrap Modal
  const [selectedForSale, setSelectedForSale] = useState<ScrapBatteryRecord | null>(null);
  const [soldPrice, setSoldPrice] = useState<number | ''>('');
  const [soldParty, setSoldParty] = useState('Dhaka Battery Recycling Mills Ltd');
  const [soldNotes, setSoldNotes] = useState('');

  // Manual Add Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manBrand, setManBrand] = useState('Hamko');
  const [manCapacity, setManCapacity] = useState('150Ah');
  const [manBuyPrice, setManBuyPrice] = useState<number | ''>(3500);
  const [manCustName, setManCustName] = useState('Direct Walk-in Customer');
  const [manCustPhone, setManCustPhone] = useState('');
  const [manNotes, setManNotes] = useState('');

  // Summary Metrics
  const totalScrapCount = scrapBatteries.length;
  const inStockBatteries = scrapBatteries.filter((b) => b.status === 'in_stock');
  const inStockValuation = inStockBatteries.reduce((sum, b) => sum + b.buyPrice, 0);

  const soldBatteries = scrapBatteries.filter((b) => b.status === 'sold');
  const totalSoldAmount = soldBatteries.reduce((sum, b) => sum + (b.soldPrice || 0), 0);
  const totalScrapProfit = soldBatteries.reduce((sum, b) => {
    const profit = (b.soldPrice || 0) - b.buyPrice;
    return sum + (profit > 0 ? profit : 0);
  }, 0);

  // Filtered List
  const filteredBatteries = scrapBatteries.filter((b) => {
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch =
      b.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.capacityAh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.soldParty && b.soldParty.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const handleOpenSaleModal = (battery: ScrapBatteryRecord) => {
    setSelectedForSale(battery);
    setSoldPrice(Math.round(battery.buyPrice * 1.2));
    setSoldParty('Dhaka Battery Recycling Mills Ltd');
    setSoldNotes('');
  };

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForSale) return;
    const price = Number(soldPrice) || 0;
    if (price <= 0) {
      alert('Please enter a valid resale price');
      return;
    }

    onSellScrap(
      selectedForSale.id,
      price,
      soldParty,
      new Date().toISOString().split('T')[0],
      soldNotes
    );
    setSelectedForSale(null);
  };

  const handleSaveManualScrap = (e: React.FormEvent) => {
    e.preventDefault();
    const buyVal = Number(manBuyPrice) || 0;
    if (buyVal <= 0) {
      alert('Please enter a valid purchase price');
      return;
    }

    const newRecord: ScrapBatteryRecord = {
      id: 'scrap-man-' + Date.now(),
      invoiceId: 'MAN-BUY-' + Math.floor(100 + Math.random() * 900),
      customerName: manCustName.trim(),
      customerPhone: manCustPhone.trim() || 'N/A',
      brand: manBrand,
      capacityAh: manCapacity,
      buyPrice: buyVal,
      status: 'in_stock',
      notes: manNotes || 'Direct scrap battery walk-in purchase.',
      date: new Date().toISOString().split('T')[0],
    };

    onAddManualScrap(newRecord);
    setIsManualModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Old & Scrap Battery Ledger
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Customer exchange batteries, stock valuation, and wholesale recycling sales
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Direct Scrap Battery Purchase</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total In Stock */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">In-Stock Scrap Stock</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {inStockBatteries.length} Units
            </div>
            <span className="text-xs text-slate-500">
              Valuation: {inStockValuation.toLocaleString()} Tk
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Sold to recycling */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Sold to Recycling Mills</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {soldBatteries.length} Units
            </div>
            <span className="text-xs text-slate-500">
              Revenue: {totalSoldAmount.toLocaleString()} Tk
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Scrap Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Net Profit from Scrap Resale</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              +{totalScrapProfit.toLocaleString()} Tk
            </div>
            <span className="text-xs text-slate-500">Wholesale recycling margin</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Received Trade-ins</span>
            <div className="text-2xl font-black text-white mt-1">
              {totalScrapCount} Units
            </div>
            <span className="text-xs text-slate-500">Exchanged via POS invoices</span>
          </div>
          <div className="p-3 bg-slate-800 text-slate-400 rounded-xl">
            <BatteryCharging className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-xs sm:text-sm text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Seamless Accounting & Scrap Inventory:</strong>
            <p className="text-emerald-300/90 text-xs mt-0.5">
              When a customer exchanges an old battery, the selling price of the new battery remains completely intact. The old battery is recorded here as scrap stock, allowing you to resell it to scrap recycling mills at a profit without any bookkeeping discrepancies.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1 sm:flex-none ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Items ({scrapBatteries.length})
          </button>
          <button
            onClick={() => setFilterStatus('in_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1 sm:flex-none ${
              filterStatus === 'in_stock'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Stock ({inStockBatteries.length})
          </button>
          <button
            onClick={() => setFilterStatus('sold')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1 sm:flex-none ${
              filterStatus === 'sold'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sold ({soldBatteries.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search brand, customer, invoice, or Ah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table of Scrap Batteries */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Date & Invoice</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Battery Spec (Ah)</th>
                <th className="py-3 px-4 text-right">Trade-in Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Resale Details</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBatteries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No scrap batteries found.
                  </td>
                </tr>
              ) : (
                filteredBatteries.map((b) => {
                  const profit = (b.soldPrice || 0) - b.buyPrice;
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{b.date}</div>
                        <div className="text-[11px] text-amber-400 font-mono">
                          {b.invoiceId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{b.customerName}</div>
                        <div className="text-[11px] text-slate-400">{b.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-amber-300">{b.brand}</div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          Capacity: {b.capacityAh}
                        </div>
                        {b.notes && (
                          <div className="text-[10px] text-slate-500 line-clamp-1">{b.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-200">
                        {b.buyPrice.toLocaleString()} Tk
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.status === 'in_stock' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Sold
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {b.status === 'sold' ? (
                          <div>
                            <div className="font-semibold text-white">
                              Sold: {b.soldPrice?.toLocaleString()} Tk
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Buyer: {b.soldParty || 'Recycler'} ({b.soldDate})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unsold</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        {b.status === 'sold' ? (
                          <span
                            className={
                              profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }
                          >
                            {profit >= 0 ? '+' : ''}
                            {profit.toLocaleString()} Tk
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.status === 'in_stock' ? (
                          <button
                            onClick={() => handleOpenSaleModal(b)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow"
                          >
                            Sell Scrap
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Sell Scrap Battery */}
      {selectedForSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Record Scrap Battery Resale</h3>
              <button
                onClick={() => setSelectedForSale(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Battery:</span>
                <span className="font-bold text-white">
                  {selectedForSale.brand} ({selectedForSale.capacityAh})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trade-in Acquisition Cost:</span>
                <span className="font-bold text-amber-400">
                  {selectedForSale.buyPrice.toLocaleString()} Tk
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSale} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resale Price (Tk) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={soldPrice}
                  onChange={(e) =>
                    setSoldPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                />
                {Number(soldPrice) > selectedForSale.buyPrice && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                    Expected Net Profit: +{(Number(soldPrice) - selectedForSale.buyPrice).toLocaleString()} Tk
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recycling Buyer / Plant Name *
                </label>
                <input
                  type="text"
                  required
                  value={soldParty}
                  onChange={(e) => setSoldParty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash by recycler"
                  value={soldNotes}
                  onChange={(e) => setSoldNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedForSale(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  Confirm Resale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Manual Scrap Purchase */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Direct Scrap Battery Purchase</h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualScrap} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={manBrand}
                    onChange={(e) => setManBrand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capacity (Ah) *
                  </label>
                  <input
                    type="text"
                    required
                    value={manCapacity}
                    onChange={(e) => setManCapacity(e.target.value)}
                    placeholder="e.g., 150Ah"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purchase Price (Tk) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={manBuyPrice}
                  onChange={(e) =>
                    setManBuyPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-amber-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Seller / Customer Name
                  </label>
                  <input
                    type="text"
                    value={manCustName}
                    onChange={(e) => setManCustName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={manCustPhone}
                    onChange={(e) => setManCustPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={manNotes}
                  onChange={(e) => setManNotes(e.target.value)}
                  placeholder="e.g., Dead cell / lead scrap only"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Save to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
