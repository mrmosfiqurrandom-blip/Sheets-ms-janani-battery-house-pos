import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Layers, Scale } from 'lucide-react';
import { Brand, Category, CustomUnit } from '../../types';

interface BrandsCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  categories: Category[];
  units: CustomUnit[];
  onAddBrand: (brand: Brand) => void;
  onDeleteBrand: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddUnit: (unit: CustomUnit) => void;
  onDeleteUnit: (id: string) => void;
}

export const BrandsCategoriesModal: React.FC<BrandsCategoriesModalProps> = ({
  isOpen,
  onClose,
  brands,
  categories,
  units,
  onAddBrand,
  onDeleteBrand,
  onAddCategory,
  onDeleteCategory,
  onAddUnit,
  onDeleteUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'brands' | 'categories' | 'units'>('brands');

  // New Brand input
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('বাংলাদেশ');

  // New Category input
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // New Unit input
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');

  if (!isOpen) return null;

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    onAddBrand({
      id: 'b-' + Date.now(),
      name: newBrandName.trim(),
      origin: newBrandOrigin.trim(),
    });
    setNewBrandName('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory({
      id: 'c-' + Date.now(),
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim(),
    });
    setNewCategoryName('');
    setNewCategoryDesc('');
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    onAddUnit({
      id: 'u-' + Date.now(),
      name: newUnitName.trim(),
      code: newUnitCode.trim() || newUnitName.trim(),
    });
    setNewUnitName('');
    setNewUnitCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              ব্র্যান্ড, ক্যাটাগরি ও ইউনিট ম্যানেজমেন্ট
            </h3>
            <p className="text-xs text-slate-400">
              দোকানের নতুন ব্র্যান্ড, ক্যাটাগরি এবং পরিমাপের ইউনিট যুক্ত বা পরিবর্তন করুন
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('brands')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'brands'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>ব্র্যান্ড সমূহ ({brands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ক্যাটাগরি সমূহ ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'units'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>ইউনিট টাইপ ({units.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: BRANDS */}
          {activeTab === 'brands' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateBrand} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-amber-400">নতুন ব্র্যান্ড যোগ করুন</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="ব্র্যান্ডের নাম (যেমন: লুমিনাস)"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="উৎপাদক দেশ / উৎস (ঐচ্ছিক)"
                    value={newBrandOrigin}
                    onChange={(e) => setNewBrandOrigin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ব্র্যান্ড সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-400">বিদ্যমান ব্র্যান্ডের তালিকা:</div>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                  {brands.map((b) => (
                    <div key={b.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40">
                      <div>
                        <span className="font-bold text-white">{b.name}</span>
                        {b.origin && (
                          <span className="text-[11px] text-slate-400 ml-2">({b.origin})</span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteBrand(b.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateCategory} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-amber-400">নতুন ক্যাটাগরি যোগ করুন</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="ক্যাটাগরির নাম (যেমন: আইপিএস ব্যাটারি)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ক্যাটাগরি সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-400">বিদ্যমান ক্যাটাগরি তালিকা:</div>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                  {categories.map((c) => (
                    <div key={c.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40">
                      <div>
                        <span className="font-bold text-white">{c.name}</span>
                        {c.description && (
                          <p className="text-[11px] text-slate-400">{c.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteCategory(c.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UNITS */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateUnit} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-amber-400">নতুন ইউনিট টাইপ যোগ করুন</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="ইউনিটের নাম (যেমন: পিস বা মিটার)"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="কোড / সিম্বল (যেমন: Pcs, Mtr)"
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ইউনিট সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-400">বিদ্যমান ইউনিট তালিকা:</div>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                  {units.map((u) => (
                    <div key={u.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40">
                      <div>
                        <span className="font-bold text-white">{u.name}</span>
                        <span className="text-[11px] text-amber-400 font-mono ml-2 font-bold">
                          [{u.code}]
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteUnit(u.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
