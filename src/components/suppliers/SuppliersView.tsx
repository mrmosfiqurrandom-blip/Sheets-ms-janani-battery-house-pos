import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  DollarSign,
  FileText,
  CreditCard,
  Search,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  Layers,
  CheckCircle,
  X,
  Printer,
  Percent,
  TrendingDown,
  Gift,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import {
  Supplier,
  SupplierLedgerEntry,
  Product,
} from '../../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  supplierLedger: SupplierLedgerEntry[];
  products: Product[];
  onAddSupplier: (supplier: Supplier) => void;
  onAddPurchase: (
    supplierId: string,
    invoiceNo: string,
    items: Array<{ productId: string; quantity: number; buyPrice: number }>,
    paidAmount: number,
    commissionDiscount?: number,
    notes?: string
  ) => void;
  onPaySupplier: (
    supplierId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => void;
  onApplyCommission: (
    supplierId: string,
    commissionAmount: number,
    commissionRate: number | undefined,
    period: string,
    notes?: string
  ) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  supplierLedger,
  products,
  onAddSupplier,
  onAddPurchase,
  onPaySupplier,
  onApplyCommission,
}) => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'ledger'>('suppliers');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supOpeningDue, setSupOpeningDue] = useState<number | ''>(0);
  const [supCommissionRate, setSupCommissionRate] = useState<number | ''>(3);

  // Purchase Form
  const [purSupplierId, setPurSupplierId] = useState(suppliers[0]?.id || '');
  const [purBillNo, setPurBillNo] = useState('');
  const [purItems, setPurItems] = useState<
    Array<{ productId: string; quantity: number; buyPrice: number }>
  >([{ productId: products[0]?.id || '', quantity: 1, buyPrice: products[0]?.buyPrice || 0 }]);
  const [purPaid, setPurPaid] = useState<number | ''>(0);
  const [purCommissionDiscount, setPurCommissionDiscount] = useState<number | ''>(0);
  const [purNotes, setPurNotes] = useState('');

  // Payment Form
  const [paySupplierId, setPaySupplierId] = useState(suppliers[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('নগদ ক্যাশ');
  const [payNotes, setPayNotes] = useState('');

  // Monthly Commission / Rebate Adjustment Form
  const [commSupplierId, setCommSupplierId] = useState(suppliers[0]?.id || '');
  const [commType, setCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [commPercentage, setCommPercentage] = useState<number | ''>(3);
  const [commFixedAmount, setCommFixedAmount] = useState<number | ''>('');
  const [commPeriod, setCommPeriod] = useState(
    new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })
  );
  const [commNotes, setCommNotes] = useState('');

  // Calculations
  const totalDueToSuppliers = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
  const totalCommissionAllSuppliers = suppliers.reduce(
    (sum, s) => sum + (s.totalCommissionEarned || 0),
    0
  );

  // Filtered Ledger
  const filteredLedger = supplierLedger.filter((entry) => {
    const matchesSupplier =
      selectedSupplierId === 'all' || entry.supplierId === selectedSupplierId;
    const matchesSearch =
      entry.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.invoiceNumber && entry.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.itemsSummary && entry.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSupplier && matchesSearch;
  });

  // Calculate dynamic stats for selected supplier in commission modal
  const targetSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === commSupplierId) || suppliers[0];
  }, [suppliers, commSupplierId]);

  // Purchases made from this supplier
  const supplierPurchaseStats = useMemo(() => {
    if (!targetSupplier) return { totalPurchases: 0, thisMonthPurchases: 0 };
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const supplierPurchases = supplierLedger.filter(
      (l) => l.supplierId === targetSupplier.id && l.type === 'purchase'
    );

    const totalPurchases = supplierPurchases.reduce((sum, l) => sum + l.billAmount, 0);
    const thisMonthPurchases = supplierPurchases
      .filter((l) => l.date.startsWith(currentMonthPrefix))
      .reduce((sum, l) => sum + l.billAmount, 0);

    return { totalPurchases, thisMonthPurchases };
  }, [supplierLedger, targetSupplier]);

  // Calculated commission value
  const calculatedCommissionAmount = useMemo(() => {
    if (commType === 'fixed') {
      return Number(commFixedAmount) || 0;
    } else {
      const rate = Number(commPercentage) || 0;
      // Calculate based on either this month's purchase or total purchases if this month is 0
      const baseAmount =
        supplierPurchaseStats.thisMonthPurchases > 0
          ? supplierPurchaseStats.thisMonthPurchases
          : supplierPurchaseStats.totalPurchases;
      return Math.round((baseAmount * rate) / 100);
    }
  }, [commType, commFixedAmount, commPercentage, supplierPurchaseStats]);

  // New balance preview after commission adjustment
  const projectedNewBalance = useMemo(() => {
    if (!targetSupplier) return 0;
    return Math.max(0, targetSupplier.currentBalance - calculatedCommissionAmount);
  }, [targetSupplier, calculatedCommissionAmount]);

  // Handle New Supplier Save
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const opening = Number(supOpeningDue) || 0;
    const newSup: Supplier = {
      id: 'sup-' + Date.now(),
      name: supName.trim(),
      company: supCompany.trim() || supName.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim(),
      address: supAddress.trim(),
      openingBalance: opening,
      currentBalance: opening,
      defaultCommissionRate: Number(supCommissionRate) || 0,
      totalCommissionEarned: 0,
    };

    onAddSupplier(newSup);
    setIsAddSupplierModalOpen(false);
    setSupName('');
    setSupCompany('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupOpeningDue(0);
    setSupCommissionRate(3);
  };

  // Add Item to Purchase Form
  const handleAddPurchaseItemRow = () => {
    if (products.length === 0) return;
    setPurItems((prev) => [
      ...prev,
      { productId: products[0].id, quantity: 1, buyPrice: products[0].buyPrice },
    ]);
  };

  // Purchase total
  const rawPurchaseTotal = purItems.reduce((sum, item) => sum + item.quantity * item.buyPrice, 0);
  const netPurchaseBill = Math.max(
    0,
    rawPurchaseTotal - (Number(purCommissionDiscount) || 0)
  );

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplierId) {
      alert('সাপ্লায়ার নির্বাচন করুন');
      return;
    }
    if (purItems.length === 0 || rawPurchaseTotal <= 0) {
      alert('পণ্য নির্বাচন ও সঠিক ক্রয়মূল্য প্রদান করুন');
      return;
    }

    onAddPurchase(
      purSupplierId,
      purBillNo.trim() || 'BILL-' + Math.floor(1000 + Math.random() * 9000),
      purItems,
      Number(purPaid) || 0,
      Number(purCommissionDiscount) || 0,
      purNotes
    );

    setIsPurchaseModalOpen(false);
    setPurBillNo('');
    setPurPaid(0);
    setPurCommissionDiscount(0);
    setPurNotes('');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount) || 0;
    if (amt <= 0) {
      alert('পরিশোধের সঠিক পরিমাণ প্রদান করুন');
      return;
    }

    onPaySupplier(paySupplierId, amt, payMethod, payNotes);
    setIsPaymentModalOpen(false);
    setPayAmount('');
    setPayNotes('');
  };

  const handleSaveCommissionAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSupplier) return;
    if (calculatedCommissionAmount <= 0) {
      alert('সঠিক কমিশন ছাড়ের পরিমাণ নির্ধারণ করুন');
      return;
    }

    const rate = commType === 'percentage' ? Number(commPercentage) || undefined : undefined;
    onApplyCommission(
      targetSupplier.id,
      calculatedCommissionAmount,
      rate,
      commPeriod,
      commNotes ||
        `${commPeriod} মাসের জন্য ${rate ? `${rate}% হারে ` : ''}কমিশন ছাড় বকেয়া থেকে কর্তন।`
    );

    setIsCommissionModalOpen(false);
    setCommNotes('');
  };

  const handleOpenCommissionModalForSupplier = (supplierId: string) => {
    setCommSupplierId(supplierId);
    const sup = suppliers.find((s) => s.id === supplierId);
    if (sup?.defaultCommissionRate) {
      setCommPercentage(sup.defaultCommissionRate);
      setCommType('percentage');
    }
    setIsCommissionModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                সাপ্লায়ার, লেজার ও মাসিক কমিশন সমন্বয়
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                পণ্য সরবরাহকারী, ক্রয় ভাউচার, মাসিক কমিশন ছাড় (Rebate) এবং বকেয়া লেজার
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Monthly Commission Button (User Requested Feature) */}
          <button
            onClick={() => setIsCommissionModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
          >
            <Percent className="w-4 h-4" />
            <span>মাসিক কমিশন ছাড় সমন্বয়</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>বকেয়া পরিশোধ</span>
          </button>

          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>পণ্য ক্রয় ভাউচার</span>
          </button>

          <button
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>নতুন সাপ্লায়ার</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">নিবন্ধিত সাপ্লায়ার</span>
            <div className="text-2xl font-black text-white mt-1">{suppliers.length} টি</div>
            <span className="text-xs text-slate-500">কোম্পানি ও ডিলারশিপ</span>
          </div>
          <div className="p-3 bg-slate-800 text-amber-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">সাপ্লায়ারদের মোট পাওনা (বকেয়া)</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {totalDueToSuppliers.toLocaleString()} ৳
            </div>
            <span className="text-xs text-slate-500">কমিশন সমন্বয়ের পর নিট দেনা</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Commission Earned Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">মোট অর্জিত কমিশন ছাড়</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalCommissionAllSuppliers.toLocaleString()} ৳
            </div>
            <span className="text-xs text-slate-500">মাসিক রিবেট থেকে সাশ্রয়</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">লেজার ট্রানজ্যাকশন</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {supplierLedger.length} টি
            </div>
            <span className="text-xs text-slate-500">ক্রয়, পেমেন্ট ও কমিশন সমন্বয়</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Feature explanation callout */}
      <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-2xl text-xs text-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white text-sm">সাপ্লায়ার মাসিক কমিশন ও হিসাবের নির্ভুলতা:</strong>
          <p className="text-emerald-300/90 leading-relaxed">
            সাপ্লায়ার থেকে নির্দিষ্ট পরিমাণ (যেমন ১ লাখ টাকা) পণ্য কিনলে যে মাসিক কমিশন বা ছাড় পাওয়া যায়, তা <strong>"মাসিক কমিশন ছাড় সমন্বয়"</strong> বাটনের মাধ্যমে সরাসরি সাপ্লায়ারের বকেয়া থেকে মাইনাস করতে পারবেন। এটি লেজার শিটে আলাদা <em>'মাসিক কমিশন ছাড়'</em> হিসেবে সংরক্ষিত হয়, ফলে পণ্যের ক্রয়মূল্যে কোনো গোলমাল হয় না এবং হিসাব শতভাগ মিলে থাকে।
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'suppliers'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>সাপ্লায়ার তালিকা ও বর্তমান বকেয়া</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>সাপ্লায়ার বিস্তারিত লেজার শিট ({supplierLedger.length})</span>
        </button>
      </div>

      {/* TAB 1: SUPPLIERS LIST */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((sup) => {
            const hasDue = sup.currentBalance > 0;
            return (
              <div
                key={sup.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{sup.name}</h4>
                      <p className="text-xs text-amber-400 font-medium">{sup.company}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        hasDue
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {hasDue ? 'বকেয়া আছে' : 'পরিশোধিত'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{sup.phone}</span>
                    </div>
                    {sup.address && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{sup.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Commission Details Badge on Card */}
                  <div className="mt-3 p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">মাসিক কমিশন এগ্রিমেন্ট:</span>
                      <strong className="text-emerald-400">
                        {sup.defaultCommissionRate ? `${sup.defaultCommissionRate}%` : 'নির্ধারিত নেই'}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">মোট প্রাপ্ত ছাড়:</span>
                      <strong className="text-white">
                        {(sup.totalCommissionEarned || 0).toLocaleString()} ৳
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">বর্তমান বকেয়া (Balance Due)</span>
                    <div className="text-lg font-black text-rose-400">
                      {sup.currentBalance.toLocaleString()} ৳
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenCommissionModalForSupplier(sup.id)}
                      className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                      title="এই সাপ্লায়ারের কমিশন বকেয়া থেকে মাইনাস করুন"
                    >
                      <Percent className="w-3 h-3 text-emerald-400" />
                      <span>কমিশন ছাড়</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSupplierId(sup.id);
                        setActiveTab('ledger');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                    >
                      লেজার
                    </button>

                    <button
                      onClick={() => {
                        setPaySupplierId(sup.id);
                        setPayAmount(sup.currentBalance > 0 ? sup.currentBalance : '');
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
                    >
                      টাকা দিন
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DETAILED SUPPLIER LEDGER SHEET */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 shrink-0">সাপ্লায়ার নির্বাচন:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">সকল সাপ্লায়ার ({suppliers.length})</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (বকেয়া: {s.currentBalance} ৳)
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="বিল নং, পণ্য বা কমিশন দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">সাপ্লায়ার নাম</th>
                    <th className="py-3 px-4 text-center">লেনদেনের ধরণ</th>
                    <th className="py-3 px-4">চালান / রেফারেন্স</th>
                    <th className="py-3 px-4">পণ্যের বিবরণ / নোট</th>
                    <th className="py-3 px-4 text-right">বিল মূল্য (টাকা)</th>
                    <th className="py-3 px-4 text-right">কমিশন ছাড় (Rebate)</th>
                    <th className="py-3 px-4 text-right">পরিশোধ (টাকা)</th>
                    <th className="py-3 px-4 text-right">চলতি বকেয়া (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        কোনো লেজার এন্ট্রি পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                          {l.date}
                        </td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {l.supplierName}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {l.type === 'purchase' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              পণ্য ক্রয় বিল
                            </span>
                          )}
                          {l.type === 'commission' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                              <Percent className="w-3 h-3" />
                              <span>মাসিক কমিশন ছাড়</span>
                            </span>
                          )}
                          {l.type === 'payment' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              পেমেন্ট পরিশোধ
                            </span>
                          )}
                          {l.type === 'return' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              পণ্য ফেরত
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-amber-400">
                          {l.invoiceNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {l.itemsSummary || l.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-200">
                          {l.billAmount > 0 ? `${l.billAmount.toLocaleString()} ৳` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {l.commissionAmount && l.commissionAmount > 0 ? (
                            <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                              -{l.commissionAmount.toLocaleString()} ৳
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-300">
                          {l.paidAmount > 0 ? `${l.paidAmount.toLocaleString()} ৳` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-400 text-sm">
                          {l.balance.toLocaleString()} ৳
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Monthly Commission / Rebate Adjustment (NEW CORE FEATURE) */}
      {isCommissionModalOpen && targetSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">মাসিক কমিশন / রিবেট ছাড় সমন্বয়</h3>
                  <p className="text-xs text-slate-400">
                    সাপ্লায়ার থেকে প্রাপ্ত কমিশন বকেয়া থেকে বাদ দিন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCommissionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommissionAdjustment} className="space-y-4">
              {/* Select Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সাপ্লায়ার নির্বাচন করুন *
                </label>
                <select
                  value={commSupplierId}
                  onChange={(e) => setCommSupplierId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company}) — বকেয়া: {s.currentBalance} ৳
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Overview Box */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">চলতি মাসে এই সাপ্লায়ার থেকে মোট ক্রয়:</span>
                  <span className="font-bold text-amber-400">
                    {supplierPurchaseStats.thisMonthPurchases.toLocaleString()} ৳
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">আজ পর্যন্ত সর্বমোট ক্রয়:</span>
                  <span className="font-bold text-white">
                    {supplierPurchaseStats.totalPurchases.toLocaleString()} ৳
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-700/60 pt-1">
                  <span className="text-slate-400">বর্তমানে সাপ্লায়ারের পাওনা বকেয়া:</span>
                  <span className="font-black text-rose-400">
                    {targetSupplier.currentBalance.toLocaleString()} ৳
                  </span>
                </div>
              </div>

              {/* Calculation Method (Percentage vs Fixed) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  কমিশন ছাড়ের হিসাব পদ্ধতি
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCommType('percentage')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      commType === 'percentage'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>শতাংশ হারে (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommType('fixed')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      commType === 'fixed'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>নির্দিষ্ট অংক (টাকা)</span>
                  </button>
                </div>
              </div>

              {/* Inputs based on type */}
              {commType === 'percentage' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    কমিশন শতকরা হার (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      required
                      value={commPercentage}
                      onChange={(e) =>
                        setCommPercentage(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="যেমন: 3"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ক্রয়কৃত মোট {((supplierPurchaseStats.thisMonthPurchases || supplierPurchaseStats.totalPurchases)).toLocaleString()} ৳ এর{' '}
                    {commPercentage}% = <strong className="text-emerald-400">{calculatedCommissionAmount.toLocaleString()} ৳</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    কমিশন ছাড়ের পরিমাণ (টাকা) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={commFixedAmount}
                    onChange={(e) =>
                      setCommFixedAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="যেমন: 3000 বা 5000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Month/Period & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    মাস / পিরিয়ড
                  </label>
                  <input
                    type="text"
                    value={commPeriod}
                    onChange={(e) => setCommPeriod(e.target.value)}
                    placeholder="যেমন: সেপ্টেম্বর ২০২৬"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    মন্তব্য / রেফারেন্স
                  </label>
                  <input
                    type="text"
                    value={commNotes}
                    onChange={(e) => setCommNotes(e.target.value)}
                    placeholder="যেমন: ১ লাখ টাকা টার্গেট রিবেট"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Adjustment Summary Preview (Prevents mismatch!) */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>বর্তমান বকেয়া পাওনা:</span>
                  <span className="font-semibold text-white">
                    {targetSupplier.currentBalance.toLocaleString()} ৳
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>(-) অর্জিত মাসিক কমিশন ছাড়:</span>
                  <span>- {calculatedCommissionAmount.toLocaleString()} ৳</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-white">
                  <span>নতুন অবশিষ্ট বকেয়া (Projected Balance):</span>
                  <span className="text-amber-400">{projectedNewBalance.toLocaleString()} ৳</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCommissionModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={calculatedCommissionAmount <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  কমিশন ছাড় সমন্বয় নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Purchase Voucher (with Instant Bill Commission / Trade Discount option) */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-800 p-4 border-b border-slate-700/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">নতুন পণ্য ক্রয় ভাউচার</h3>
                <p className="text-xs text-slate-400">
                  সাপ্লায়ার থেকে চালান এন্ট্রি দিলে স্বয়ংক্রিয়ভাবে স্টক ও লেজার আপডেট হবে
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    সাপ্লায়ার নির্বাচন করুন *
                  </label>
                  <select
                    value={purSupplierId}
                    onChange={(e) => setPurSupplierId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    চালান / ইনভয়েস নং *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: BILL-9921"
                    value={purBillNo}
                    onChange={(e) => setPurBillNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>ক্রয়কৃত পণ্যের তালিকা</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItemRow}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>আরেকটি পণ্য যোগ করুন</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {purItems.map((item, index) => {
                    const lineTotal = item.quantity * item.buyPrice;
                    return (
                      <div
                        key={index}
                        className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-wrap sm:flex-nowrap items-center gap-2"
                      >
                        <div className="flex-1 min-w-[180px]">
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const prod = products.find((p) => p.id === e.target.value);
                              const updated = [...purItems];
                              updated[index].productId = e.target.value;
                              if (prod) updated[index].buyPrice = prod.buyPrice;
                              setPurItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            placeholder="পরিমাণ"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...purItems];
                              updated[index].quantity = Math.max(1, Number(e.target.value));
                              setPurItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center text-white"
                          />
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            placeholder="ক্রয়মূল্য"
                            value={item.buyPrice}
                            onChange={(e) => {
                              const updated = [...purItems];
                              updated[index].buyPrice = Number(e.target.value);
                              setPurItems(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-amber-300 font-bold"
                          />
                        </div>

                        <div className="w-24 text-right text-xs font-bold text-white">
                          {lineTotal.toLocaleString()} ৳
                        </div>

                        {purItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPurItems(purItems.filter((_, i) => i !== index))}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Commission Discount & Bill Calculation */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>মোট পণ্যের ক্রয়মূল্য:</span>
                  <span className="font-semibold text-white">{rawPurchaseTotal.toLocaleString()} ৳</span>
                </div>

                {/* Instant trade discount/commission on this bill */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    <span>বিলকালীন কমিশন / স্পেশাল ছাড় (যদি বিলেই কাটা হয়):</span>
                  </span>
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={purCommissionDiscount}
                      onChange={(e) =>
                        setPurCommissionDiscount(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      className="w-full bg-slate-900 border border-emerald-700/60 rounded px-2 py-1 text-xs text-right text-emerald-300 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-1.5">
                  <span>নিট প্রদেয় বিল (Net Payable Bill):</span>
                  <span className="text-amber-400 font-black text-base">
                    {netPurchaseBill.toLocaleString()} ৳
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-400 mb-0.5">নগদ পরিশোধ (Paid)</label>
                    <input
                      type="number"
                      min="0"
                      value={purPaid}
                      onChange={(e) =>
                        setPurPaid(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-0.5">অবশিষ্ট বকেয়া (Due)</label>
                    <div className="w-full bg-slate-900 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 border border-slate-800">
                      {(netPurchaseBill - (Number(purPaid) || 0)).toLocaleString()} ৳
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="নোট বা চালান সংক্রান্ত মন্তব্য..."
                value={purNotes}
                onChange={(e) => setPurNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  ক্রয় ভাউচার সেভ ও স্টক আপডেট
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Supplier */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">সাপ্লায়ার বকেয়া পরিশোধ</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সাপ্লায়ার নির্বাচন করুন *
                </label>
                <select
                  value={paySupplierId}
                  onChange={(e) => {
                    setPaySupplierId(e.target.value);
                    const sup = suppliers.find((s) => s.id === e.target.value);
                    if (sup && sup.currentBalance > 0) {
                      setPayAmount(sup.currentBalance);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (চলতি বকেয়া: {s.currentBalance} ৳)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পরিশোধকৃত টাকার পরিমাণ *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="যেমন: 25000"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="নগদ ক্যাশ">নগদ ক্যাশ</option>
                  <option value="ব্যাংক চেক / ট্র্যান্সফার">ব্যাংক চেক / ট্র্যান্সফার</option>
                  <option value="বিকাশ">বিকাশ</option>
                  <option value="নগদ এমএফএস">নগদ এমএফএস</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">নোট / বিবরণ</label>
                <input
                  type="text"
                  placeholder="যেমন: চেক নং-৭৭৯৮১২"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  পেমেন্ট সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier (with default commission agreement rate) */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">নতুন সাপ্লায়ার যোগ করুন</h3>
              <button
                onClick={() => setIsAddSupplierModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  সাপ্লায়ার / ডিলারশিপের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মেসার্স রহিমআফরোজ ডিস্ট্রিবিউশন"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">কোম্পানির নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: রহিমআফরোজ বাংলাদেশ"
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ডিফল্ট কমিশন হার (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="যেমন: 3"
                    value={supCommissionRate}
                    onChange={(e) =>
                      setSupCommissionRate(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="যেমন: নবাবপুর রোড, ঢাকা"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  প্রারম্ভিক বকেয়া পাওনা (Opening Due)
                </label>
                <input
                  type="number"
                  min="0"
                  value={supOpeningDue}
                  onChange={(e) =>
                    setSupOpeningDue(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-300 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
