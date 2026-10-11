import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  DollarSign,
  Receipt,
  CheckCircle,
  X,
} from 'lucide-react';
import { Customer, SaleInvoice } from '../../types';

interface CustomersViewProps {
  customers: Customer[];
  invoices: SaleInvoice[];
  onAddCustomer: (customer: Customer) => void;
  onCollectDue: (customerId: string, amount: number) => void;
  onViewInvoice: (invoice: SaleInvoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  onAddCustomer,
  onCollectDue,
  onViewInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number | ''>('');

  // Form State
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');

  const totalCustomerDue = customers.reduce((sum, c) => sum + c.totalDue, 0);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    const newCust: Customer = {
      id: 'c-' + Date.now(),
      name: cName.trim(),
      phone: cPhone.trim() || 'N/A',
      address: cAddress.trim(),
      totalPurchases: 0,
      totalDue: 0,
      lastPurchaseDate: new Date().toISOString().split('T')[0],
    };

    onAddCustomer(newCust);
    setIsAddCustomerOpen(false);
    setCName('');
    setCPhone('');
    setCAddress('');
  };

  const handleSaveDueCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = Number(collectAmount) || 0;
    if (amt <= 0) return;

    onCollectDue(selectedCustomer.id, amt);
    setIsCollectDueOpen(false);
    setCollectAmount('');
  };

  const customerInvoices = selectedCustomer
    ? invoices.filter(
        (inv) =>
          inv.customerName === selectedCustomer.name ||
          (inv.customerPhone && inv.customerPhone === selectedCustomer.phone)
      )
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Customers & Due Receivables Ledger
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Customer directory, purchase history, outstanding dues, and due collection
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Registered Customers</span>
            <div className="text-2xl font-black text-white mt-1">{customers.length} Customers</div>
            <span className="text-xs text-slate-500">Regular & retail clients</span>
          </div>
          <div className="p-3 bg-slate-800 text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Customer Dues Receivable</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {totalCustomerDue.toLocaleString()} Tk
            </div>
            <span className="text-xs text-slate-500">Outstanding balance to collect</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Customers with Due Balance</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {customers.filter((c) => c.totalDue > 0).length} Clients
            </div>
            <span className="text-xs text-slate-500">Clients with pending dues</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const hasDue = c.totalDue > 0;
          return (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-white text-base">{c.name}</h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      hasDue
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {hasDue ? `Due: ${c.totalDue.toLocaleString()} Tk` : 'No Due'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{c.phone}</span>
                  </div>
                  {c.address && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{c.address}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 pt-1">
                    Total Purchases: {c.totalPurchases.toLocaleString()} Tk
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCustomer(c)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  Invoice History
                </button>

                {hasDue && (
                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCollectAmount(c.totalDue);
                      setIsCollectDueOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    Collect Due
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice History Drawer / Section */}
      {selectedCustomer && !isCollectDueOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">
                Purchase Invoices for {selectedCustomer.name}
              </h3>
              <p className="text-xs text-slate-400">Phone: {selectedCustomer.phone}</p>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {customerInvoices.length === 0 ? (
            <p className="text-xs text-slate-500">No invoices found for this customer.</p>
          ) : (
            <div className="space-y-2">
              {customerInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      {inv.id} • {inv.date} ({inv.time})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {inv.items.map((i) => i.product.name).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-amber-300">
                        {inv.netTotal.toLocaleString()} Tk
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Paid: {inv.paidAmount.toLocaleString()} Tk{' '}
                        {inv.dueAmount > 0 && `(Due: ${inv.dueAmount} Tk)`}
                      </div>
                    </div>

                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Customer */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Register Customer</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017xxxxxxxx"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Mirpur 10, Dhaka"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect Due */}
      {isCollectDueOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Collect Customer Due</h3>
              <button
                onClick={() => setIsCollectDueOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>
                Customer: <strong>{selectedCustomer.name}</strong>
              </div>
              <div>
                Current Outstanding Due:{' '}
                <strong className="text-rose-400">{selectedCustomer.totalDue} Tk</strong>
              </div>
            </div>

            <form onSubmit={handleSaveDueCollection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount Collected (Tk) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.totalDue}
                  required
                  value={collectAmount}
                  onChange={(e) =>
                    setCollectAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCollectDueOpen(false)}
                  className="px-4 py-1.5 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Confirm Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
