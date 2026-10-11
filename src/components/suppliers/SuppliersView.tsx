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
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');

  // Monthly Commission / Rebate Adjustment Form
  const [commSupplierId, setCommSupplierId] = useState(suppliers[0]?.id || '');
  const [commType, setCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [commPercentage, setCommPercentage] = useState<number | ''>(3);
  const [commFixedAmount, setCommFixedAmount] = useState<number | ''>('');
  const [commPeriod, setCommPeriod] = useState(
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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
      alert('Please select a supplier');
      return;
    }
    if (purItems.length === 0 || rawPurchaseTotal <= 0) {
      alert('Please select products and valid purchase prices');
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
      alert('Please enter a valid payment amount');
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
      alert('Please specify a valid commission rebate amount');
      return;
    }

    const rate = commType === 'percentage' ? Number(commPercentage) || undefined : undefined;
    onApplyCommission(
      targetSupplier.id,
      calculatedCommissionAmount,
      rate,
      commPeriod,
      commNotes ||
        `Monthly rebate discount of ${calculatedCommissionAmount.toLocaleString()} Tk deducted from payables (${commPeriod}).`
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
                Suppliers, Ledger & Monthly Commission Rebates
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Track supplier purchases, payment vouchers, monthly target commission discounts, and real-time dues
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Monthly Commission Button */}
          <button
            onClick={() => setIsCommissionModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
          >
            <Percent className="w-4 h-4" />
            <span>Apply Monthly Commission</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Pay Supplier Due</span>
          </button>

          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Purchase Invoice</span>
          </button>

          <button
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Registered Suppliers</span>
            <div className="text-2xl font-black text-white mt-1">{suppliers.length} Suppliers</div>
            <span className="text-xs text-slate-500">Companies & Dealerships</span>
          </div>
          <div className="p-3 bg-slate-800 text-amber-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Supplier Payables (Due)</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {totalDueToSuppliers.toLocaleString()} Tk
            </div>
            <span className="text-xs text-slate-500">Net outstanding balance</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Commission Earned Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Earned Commission / Rebates</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalCommissionAllSuppliers.toLocaleString()} Tk
            </div>
            <span className="text-xs text-slate-500">Savings from monthly rebate targets</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Ledger Transactions</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {supplierLedger.length} Records
            </div>
            <span className="text-xs text-slate-500">Purchases, payments & rebates</span>
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
          <strong className="text-white text-sm">Monthly Supplier Commission & Accurate Ledger Balancing:</strong>
          <p className="text-emerald-300/90 leading-relaxed">
            When you purchase goods from a supplier (e.g., 100,000 Tk volume target) and earn a monthly commission or rebate percentage, you can deduct that discount directly from your payable balance using the <strong>"Apply Monthly Commission"</strong> tool. It logs a separate <em>'Monthly Commission Rebate'</em> entry in the ledger, keeping inventory purchase prices intact while eliminating financial mismatches.
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
          <span>Suppliers List & Due Balances</span>
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
          <span>Detailed Supplier Ledger Sheet ({supplierLedger.length})</span>
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
                      {hasDue ? 'Balance Due' : 'Settled'}
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
                      <span className="text-[11px] text-slate-400 block">Monthly Commission Agreement:</span>
                      <strong className="text-emerald-400">
                        {sup.defaultCommissionRate ? `${sup.defaultCommissionRate}%` : 'Not set'}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Total Rebate Credited:</span>
                      <strong className="text-white">
                        {(sup.totalCommissionEarned || 0).toLocaleString()} Tk
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Balance Due</span>
                    <div className="text-lg font-black text-rose-400">
                      {sup.currentBalance.toLocaleString()} Tk
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenCommissionModalForSupplier(sup.id)}
                      className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                      title="Deduct monthly commission from this supplier's balance"
                    >
                      <Percent className="w-3 h-3 text-emerald-400" />
                      <span>Rebate</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSupplierId(sup.id);
                        setActiveTab('ledger');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                    >
                      Ledger
                    </button>

                    <button
                      onClick={() => {
                        setPaySupplierId(sup.id);
                        setPayAmount(sup.currentBalance > 0 ? sup.currentBalance : '');
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
                    >
                      Pay Due
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
              <span className="text-xs text-slate-400 shrink-0">Filter Supplier:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Suppliers ({suppliers.length})</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Due: {s.currentBalance} Tk)
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by bill #, product or commission notes..."
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
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4">Bill / Ref #</th>
                    <th className="py-3 px-4">Description / Notes</th>
                    <th className="py-3 px-4 text-right">Bill Amount</th>
                    <th className="py-3 px-4 text-right">Commission Rebate</th>
                    <th className="py-3 px-4 text-right">Paid Amount</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No ledger entries found.
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
                              Purchase Bill
                            </span>
                          )}
                          {l.type === 'commission' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                              <Percent className="w-3 h-3" />
                              <span>Monthly Rebate</span>
                            </span>
                          )}
                          {l.type === 'payment' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Due Payment
                            </span>
                          )}
                          {l.type === 'return' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Product Return
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
                          {l.billAmount > 0 ? `${l.billAmount.toLocaleString()} Tk` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {l.commissionAmount && l.commissionAmount > 0 ? (
                            <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                              -{l.commissionAmount.toLocaleString()} Tk
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-300">
                          {l.paidAmount > 0 ? `${l.paidAmount.toLocaleString()} Tk` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-400 text-sm">
                          {l.balance.toLocaleString()} Tk
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

      {/* MODAL: Monthly Commission / Rebate Adjustment */}
      {isCommissionModalOpen && targetSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Monthly Commission / Rebate Credit</h3>
                  <p className="text-xs text-slate-400">
                    Deduct earned turnover commission directly from supplier due balance
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
                  Select Supplier *
                </label>
                <select
                  value={commSupplierId}
                  onChange={(e) => setCommSupplierId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company}) — Due: {s.currentBalance} Tk
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Overview Box */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Purchases This Month from this Supplier:</span>
                  <span className="font-bold text-amber-400">
                    {supplierPurchaseStats.thisMonthPurchases.toLocaleString()} Tk
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">All-Time Cumulative Purchases:</span>
                  <span className="font-bold text-white">
                    {supplierPurchaseStats.totalPurchases.toLocaleString()} Tk
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-700/60 pt-1">
                  <span className="text-slate-400">Current Outstanding Payable Balance:</span>
                  <span className="font-black text-rose-400">
                    {targetSupplier.currentBalance.toLocaleString()} Tk
                  </span>
                </div>
              </div>

              {/* Calculation Method (Percentage vs Fixed) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Commission Rebate Calculation Method
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
                    <span>Percentage Rate (%)</span>
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
                    <span>Fixed Amount (Tk)</span>
                  </button>
                </div>
              </div>

              {/* Inputs based on type */}
              {commType === 'percentage' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Commission Rate (%) *
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
                      placeholder="e.g. 3"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {commPercentage}% of purchases ({((supplierPurchaseStats.thisMonthPurchases || supplierPurchaseStats.totalPurchases)).toLocaleString()} Tk) = <strong className="text-emerald-400">{calculatedCommissionAmount.toLocaleString()} Tk</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Commission Rebate Amount (Tk) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={commFixedAmount}
                    onChange={(e) =>
                      setCommFixedAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="e.g. 3000 or 5000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Month/Period & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Month / Period
                  </label>
                  <input
                    type="text"
                    value={commPeriod}
                    onChange={(e) => setCommPeriod(e.target.value)}
                    placeholder="e.g. September 2026"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reference / Notes
                  </label>
                  <input
                    type="text"
                    value={commNotes}
                    onChange={(e) => setCommNotes(e.target.value)}
                    placeholder="e.g. 100k turnover target discount"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Adjustment Summary Preview (Prevents mismatch!) */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Current Payable Due:</span>
                  <span className="font-semibold text-white">
                    {targetSupplier.currentBalance.toLocaleString()} Tk
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>(-) Earned Monthly Commission Rebate:</span>
                  <span>- {calculatedCommissionAmount.toLocaleString()} Tk</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-white">
                  <span>New Outstanding Balance (Projected):</span>
                  <span className="text-amber-400">{projectedNewBalance.toLocaleString()} Tk</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCommissionModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calculatedCommissionAmount <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  Confirm Commission Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Purchase Voucher */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-800 p-4 border-b border-slate-700/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">New Purchase Invoice Voucher</h3>
                <p className="text-xs text-slate-400">
                  Entering supplier invoices automatically increases inventory stock and updates supplier ledger
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
                    Select Supplier *
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
                    Challan / Invoice Bill # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BILL-9921"
                    value={purBillNo}
                    onChange={(e) => setPurBillNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Purchased Product Items</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItemRow}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
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
                            placeholder="Qty"
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
                            placeholder="Buy Price"
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
                          {lineTotal.toLocaleString()} Tk
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
                  <span>Gross Products Cost:</span>
                  <span className="font-semibold text-white">{rawPurchaseTotal.toLocaleString()} Tk</span>
                </div>

                {/* Instant trade discount/commission on this bill */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    <span>Invoice Trade Discount / Instant Rebate (if deducted on bill):</span>
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
                  <span>Net Payable Bill:</span>
                  <span className="text-amber-400 font-black text-base">
                    {netPurchaseBill.toLocaleString()} Tk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-400 mb-0.5">Paid Now</label>
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
                    <label className="block text-xs text-slate-400 mb-0.5">Balance Due</label>
                    <div className="w-full bg-slate-900 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 border border-slate-800">
                      {(netPurchaseBill - (Number(purPaid) || 0)).toLocaleString()} Tk
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="Notes or invoice remarks..."
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Save Purchase & Update Stock
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
              <h3 className="font-bold text-white text-base">Pay Supplier Due Balance</h3>
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
                  Select Supplier *
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
                      {s.name} (Current Due: {s.currentBalance} Tk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 25000"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Cheque / Transfer">Bank Cheque / Transfer</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad MFS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. Cheque # 779812 or Bank Ref"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Confirm Payment
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
              <h3 className="font-bold text-white text-base">Add New Supplier</h3>
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
                  Supplier / Dealership Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahimafrooz Distribution Center"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahimafrooz Batteries Bangladesh Ltd"
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
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
                    Default Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 3"
                    value={supCommissionRate}
                    onChange={(e) =>
                      setSupCommissionRate(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address / Depot</label>
                <input
                  type="text"
                  placeholder="e.g. Nawabpur Road, Dhaka"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Opening Balance Due (Tk)
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
