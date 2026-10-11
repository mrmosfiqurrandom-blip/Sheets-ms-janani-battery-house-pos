import React from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BatteryCharging,
  Package,
  Truck,
  Users,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  CheckCircle,
  Percent,
} from 'lucide-react';
import {
  SaleInvoice,
  Product,
  ScrapBatteryRecord,
  Supplier,
  Customer,
  Expense,
} from '../../types';

interface DashboardViewProps {
  invoices: SaleInvoice[];
  products: Product[];
  scrapBatteries: ScrapBatteryRecord[];
  suppliers: Supplier[];
  customers: Customer[];
  expenses: Expense[];
  onViewInvoice: (invoice: SaleInvoice) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  products,
  scrapBatteries,
  suppliers,
  customers,
  expenses,
  onViewInvoice,
  onNavigate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Today's Sales
  const todayInvoices = invoices.filter((inv) => inv.date === todayStr);
  const todaySalesAmount = todayInvoices.reduce((sum, inv) => sum + inv.netTotal, 0);

  // Month's Sales
  const monthInvoices = invoices.filter((inv) => inv.date.startsWith(currentMonthStr));
  const monthSalesAmount = monthInvoices.reduce((sum, inv) => sum + inv.netTotal, 0);

  // Total Sales & Product Profit Estimate
  const totalSalesAmount = invoices.reduce((sum, inv) => sum + inv.netTotal, 0);

  // Scrap Statistics
  const inStockScrap = scrapBatteries.filter((b) => b.status === 'in_stock');
  const inStockScrapVal = inStockScrap.reduce((sum, b) => sum + b.buyPrice, 0);
  const soldScrap = scrapBatteries.filter((b) => b.status === 'sold');
  const totalScrapProfit = soldScrap.reduce((sum, b) => {
    const p = (b.soldPrice || 0) - b.buyPrice;
    return sum + (p > 0 ? p : 0);
  }, 0);

  // Dues
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalSupplierDues = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

  // Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Supplier Commission Rebate Earned
  const totalCommissionEarned = suppliers.reduce(
    (sum, s) => sum + (s.totalCommissionEarned || 0),
    0
  );

  // Low Stock
  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);

  // Recent 5 Invoices
  const recentInvoices = [...invoices].reverse().slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Business Dashboard & Reports
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Today's sales, profit & loss, scrap battery valuation, and supplier ledger overview
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Today's Sales</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">
              {todaySalesAmount.toLocaleString()} Tk
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>{todayInvoices.length} cash memos</span>
            </div>
          </div>
        </div>

        {/* Month's Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Monthly Sales</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">
              {monthSalesAmount.toLocaleString()} Tk
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>{monthInvoices.length} sales completed this month</span>
            </div>
          </div>
        </div>

        {/* Scrap Battery Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Net Scrap Battery Profit</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <BatteryCharging className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-400">
              +{totalScrapProfit.toLocaleString()} Tk
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>{inStockScrap.length} units in stock ({inStockScrapVal.toLocaleString()} Tk)</span>
            </div>
          </div>
        </div>

        {/* Customer Dues */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Customer Receivables</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400">
              {totalCustomerDues.toLocaleString()} Tk
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>Supplier Payables: {totalSupplierDues.toLocaleString()} Tk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights & Financial Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scrap Policy Card */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <BatteryCharging className="w-5 h-5" />
            <span>Scrap Battery Inventory</span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            Old batteries stored in stock ready for bulk wholesale liquidation.
          </p>
          <button
            onClick={() => onNavigate('scrap')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Manage Scrap Stock</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Supplier Commission Rebate Card */}
        <div className="bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-800/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
            <Percent className="w-5 h-5 text-teal-400" />
            <span>Supplier Monthly Rebates</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalCommissionEarned.toLocaleString()} Tk
          </div>
          <p className="text-xs text-slate-400">
            Deducted from supplier balances according to monthly turnover targets.
          </p>
          <button
            onClick={() => onNavigate('suppliers')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>View Commission & Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expenses Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <Receipt className="w-5 h-5" />
            <span>Shop Operating Expenses</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalExpenses.toLocaleString()} Tk
          </div>
          <p className="text-xs text-slate-400">
            Staff salaries, shop rent, electricity, and maintenance overhead.
          </p>
          <button
            onClick={() => onNavigate('expenses')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>View Expense Book</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Suppliers Dues Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Truck className="w-5 h-5" />
            <span>Supplier Balance Due</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalSupplierDues.toLocaleString()} Tk
          </div>
          <p className="text-xs text-slate-400">
            Net bill payable to companies after rebate discount deductions.
          </p>
          <button
            onClick={() => onNavigate('suppliers')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>View Supplier Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Invoices & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Recent Sales Memos</span>
            </h3>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              + New Sale
            </button>
          </div>

          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{inv.id}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      • {inv.date} ({inv.time})
                    </span>
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    {inv.customerName} ({inv.customerPhone})
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {inv.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                  </div>
                  {inv.scrapBatteries && inv.scrapBatteries.length > 0 && (
                    <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                      ✓ {inv.scrapBatteries.length} old batteries exchanged & deducted
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-amber-300 text-sm">
                    {inv.netTotal.toLocaleString()} Tk
                  </div>
                  <button
                    onClick={() => onViewInvoice(inv)}
                    className="mt-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Low Stock Alerts</span>
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              View All Products
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
              <p className="text-xs text-slate-300 font-medium">All products have sufficient stock!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white">{p.name}</h5>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Brand: {p.brand} • Reorder Alert: {p.minStockAlert} {p.unit}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                        p.stock <= 0
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {p.stock <= 0 ? 'Out of Stock' : `${p.stock} ${p.unit} remaining`}
                    </span>
                    <div className="mt-1">
                      <button
                        onClick={() => onNavigate('suppliers')}
                        className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                      >
                        Order from Supplier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
