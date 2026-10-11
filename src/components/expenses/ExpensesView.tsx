import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Coffee,
  Zap,
  Home,
  Users,
  Truck,
  Wrench,
  Trash2,
  X,
} from 'lucide-react';
import { Expense } from '../../types';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form State
  const [category, setCategory] = useState<Expense['category']>('চা-নাস্তা');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('নগদ ক্যাশ');
  const [notes, setNotes] = useState('');

  const categories: Expense['category'][] = [
    'দোকান ভাড়া',
    'বিদ্যুৎ বিল',
    'কর্মচারী বেতন',
    'চা-নাস্তা',
    'পরিবহন খরচ',
    'মেরামত ও যন্ত্রাংশ',
    'আপ্যায়ন',
    'অন্যান্য',
  ];

  // Totals
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  // Filtered List
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch =
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount) || 0;
    if (val <= 0) {
      alert('সঠিক খরচের পরিমাণ দিন');
      return;
    }

    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      category,
      amount: val,
      paidTo: paidTo.trim(),
      paymentMethod,
      notes: notes.trim(),
    };

    onAddExpense(newExp);
    setIsModalOpen(false);
    setAmount('');
    setPaidTo('');
    setNotes('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                দোকানের আনুষাঙ্গিক খরচ
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন, চা-নাস্তা ও যাতায়াত খরচের দৈনিক হিসাব
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন খরচ এন্ট্রি</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">চলতি মাসের মোট খরচ</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {thisMonthExpenses.toLocaleString()} ৳
            </div>
            <span className="text-xs text-slate-500">বর্তমান ক্যালেন্ডার মাস</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">সর্বমোট রেকর্ডকৃত খরচ</span>
            <div className="text-2xl font-black text-white mt-1">
              {totalExpenses.toLocaleString()} ৳
            </div>
            <span className="text-xs text-slate-500">সব রেকর্ড মিলিয়ে</span>
          </div>
          <div className="p-3 bg-slate-800 text-amber-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">মোট খরচের ভাউচার</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{expenses.length} টি</div>
            <span className="text-xs text-slate-500">দৈনিক খরচের এন্ট্রি</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            সব খাত ({expenses.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition ${
                selectedCategory === c
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="বিবরণ বা গ্রহীতা দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">খরচের খাত (Category)</th>
                <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
                <th className="py-3 px-4">গ্রহীতা (Paid To)</th>
                <th className="py-3 px-4">পেমেন্ট মাধ্যম</th>
                <th className="py-3 px-4">বিবরণ / নোট</th>
                <th className="py-3 px-4 text-center">মুছুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    কোনো খরচের এন্ট্রি পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 text-slate-300 font-medium">{exp.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-400 text-sm">
                      {exp.amount.toLocaleString()} ৳
                    </td>
                    <td className="py-3 px-4 text-slate-300">{exp.paidTo || '-'}</td>
                    <td className="py-3 px-4 text-slate-400">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm('আপনি কি এই খরচের এন্ট্রি মুছে ফেলতে চান?')) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">নতুন খরচ যোগ করুন</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  খরচের খাত নির্বাচন করুন *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  টাকার পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="যেমন: 450"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    টাকা গ্রহীতা
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ভ্যান চালক"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="নগদ ক্যাশ">নগদ ক্যাশ</option>
                    <option value="বিকাশ">বিকাশ</option>
                    <option value="নগদ">নগদ</option>
                    <option value="ব্যাংক">ব্যাংক</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বিবরণ / মন্তব্য
                </label>
                <input
                  type="text"
                  placeholder="যেমন: নবাবপুর থেকে মালামাল আনার খরচ"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
