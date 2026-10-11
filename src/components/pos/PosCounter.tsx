import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  BatteryCharging,
  Tag,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  CheckCircle,
  CreditCard,
  Banknote,
  DollarSign,
  AlertTriangle,
  Barcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Product,
  CartItem,
  ScrapBatteryTradeIn,
  SaleInvoice,
  Customer,
  ShopSettings,
} from '../../types';
import { ScrapBatteryModal } from './ScrapBatteryModal';
import { ReceiptPrint } from './ReceiptPrint';

interface PosCounterProps {
  products: Product[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  customers: Customer[];
  settings: ShopSettings;
  onCompleteSale: (
    invoice: SaleInvoice,
    updatedProducts: Product[],
    newScrapRecords: ScrapBatteryTradeIn[]
  ) => void;
}

export const PosCounter: React.FC<PosCounterProps> = ({
  products,
  categories,
  brands,
  customers,
  settings,
  onCompleteSale,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scrapTradeIns, setScrapTradeIns] = useState<ScrapBatteryTradeIn[]>([]);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  // Customer Information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Payment State
  const [discount, setDiscount] = useState<number | ''>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'bkash' | 'nagad' | 'card' | 'bank' | 'due'
  >('cash');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Completed Invoice for Receipt Printing
  const [lastInvoice, setLastInvoice] = useState<SaleInvoice | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.modelNo && p.modelNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const totalScrapCredit = useMemo(() => {
    return scrapTradeIns.reduce((sum, item) => sum + item.value, 0);
  }, [scrapTradeIns]);

  const netPayable = useMemo(() => {
    const disc = Number(discount) || 0;
    const net = subtotal - totalScrapCredit - disc;
    return Math.max(0, net);
  }, [subtotal, totalScrapCredit, discount]);

  // If user hasn't typed a custom paid amount, default to netPayable
  const currentPaid = paidAmount === '' ? netPayable : Number(paidAmount);
  const currentDue = Math.max(0, netPayable - currentPaid);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`দুঃখিত, "${product.name}" এর স্টক শেষ!`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= product.stock) {
          alert(`সর্বোচ্চ মজুদ স্টক (${product.stock} টি) কার্টে যুক্ত আছে।`);
          return prev;
        }
        const updated = [...prev];
        const newQty = existing.quantity + 1;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          total: newQty * existing.unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellPrice,
            warrantyPeriod: product.warranty,
            total: product.sellPrice,
          },
        ];
      }
    });
  };

  // Adjust cart item quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`স্টকে কেবল ${item.product.stock} টি পণ্য রয়েছে।`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Update item serial number (for warranty)
  const handleUpdateSerial = (productId: string, serial: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, serialNumber: serial } : item
      )
    );
  };

  // Remove cart item
  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Scrap battery handlers
  const handleAddScrapBattery = (scrap: ScrapBatteryTradeIn) => {
    setScrapTradeIns((prev) => [...prev, scrap]);
  };

  const handleRemoveScrapBattery = (id: string) => {
    setScrapTradeIns((prev) => prev.filter((s) => s.id !== id));
  };

  // Select existing customer
  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    if (c.address) setCustomerAddress(c.address);
  };

  // Complete Sale
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('অনুগ্রহ করে কার্টে অন্তত একটি পণ্য যোগ করুন!');
      return;
    }

    if (!customerName.trim()) {
      alert('অনুগ্রহ করে ক্রেতার নাম প্রদান করুন।');
      return;
    }

    const now = new Date();
    const invoiceId = 'INV-' + now.getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const invoice: SaleInvoice = {
      id: invoiceId,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'ন/এ',
      customerAddress: customerAddress.trim() || '',
      items: cart,
      subtotal,
      scrapBatteries: scrapTradeIns,
      totalScrapCredit,
      discount: Number(discount) || 0,
      netTotal: netPayable,
      paidAmount: currentPaid,
      dueAmount: currentDue,
      paymentMethod,
      notes: invoiceNotes || (scrapTradeIns.length > 0 ? 'পুরাতন ব্যাটারি এক্সচেঞ্জ সমন্বয়কৃত।' : ''),
      syncedToGoogleSheet: false,
    };

    // Calculate updated stock
    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((c) => c.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - cartItem.quantity),
        };
      }
      return p;
    });

    onCompleteSale(invoice, updatedProducts, scrapTradeIns);
    setLastInvoice(invoice);

    // Reset Cart form
    setCart([]);
    setScrapTradeIns([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDiscount(0);
    setPaidAmount('');
    setInvoiceNotes('');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950">
      {/* LEFT: Product Catalog & Search */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* Search & Filters Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="পণ্যের নাম, মডেল, ব্র্যান্ড বা বারকোড দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>

            {/* Brand Filter */}
            <div className="w-full sm:w-48">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">সব ব্র্যান্ড ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              সব পণ্য ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition ${
                  selectedCategory === cat.name
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Layers className="w-12 h-12 text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-400">কোনো পণ্য পাওয়া যায়নি!</p>
              <p className="text-xs text-slate-600 mt-1">
                অন্য কোনো নাম বা ফিল্টার নির্বাচন করে চেষ্টা করুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStockAlert;
                const inCart = cart.find((i) => i.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`bg-slate-900 border rounded-xl p-3 flex flex-col justify-between transition group relative select-none ${
                      isOutOfStock
                        ? 'opacity-50 border-slate-800 cursor-not-allowed'
                        : inCart
                        ? 'border-amber-500/80 bg-amber-500/5 cursor-pointer shadow-lg shadow-amber-500/5'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer'
                    }`}
                  >
                    {/* Header info */}
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 truncate max-w-[130px]">
                          {product.brand}
                        </span>
                        <div className="flex items-center gap-1">
                          {isOutOfStock ? (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                              স্টক আউট
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                              {product.stock} {product.unit} (কম স্টক)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                              মজুদ: {product.stock} {product.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-2">
                        {product.name}
                      </h4>

                      {product.modelNo && (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          মডেল: {product.modelNo}
                        </p>
                      )}

                      {product.warranty && product.warranty !== 'N/A' && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1.5">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{product.warranty}</span>
                        </div>
                      )}
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">বিক্রয় মূল্য</span>
                        <div className="text-base font-black text-amber-400">
                          {product.sellPrice.toLocaleString()} ৳
                        </div>
                      </div>

                      {inCart ? (
                        <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg">
                          কার্টে {inCart.quantity}টি
                        </span>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          className="p-2 bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 rounded-lg transition"
                          title="কার্টে যোগ করুন"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS Billing & Cart Counter */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col bg-slate-900 border-t lg:border-t-0 border-slate-800 h-auto lg:h-full shrink-0 shadow-2xl">
        {/* Cart Header */}
        <div className="p-3 sm:p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">সেলস কার্ট ও ক্যাশ মেমো</h3>
              <p className="text-[11px] text-slate-400">
                {cart.length} টি আইটেম • {scrapTradeIns.length} টি স্ক্র্যাপ ব্যাটারি
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => {
                if (confirm('আপনি কি সম্পূর্ণ কার্ট খালি করতে চান?')) {
                  setCart([]);
                  setScrapTradeIns([]);
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>কার্ট খালি করুন</span>
            </button>
          )}
        </div>

        {/* Customer Information Section */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <User className="w-3.5 h-3.5" />
              <span>ক্রেতার বিবরণ (Customer Info)</span>
            </span>
            {customers.length > 0 && (
              <select
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) handleSelectCustomer(cust);
                }}
                className="bg-slate-800 text-[11px] text-slate-300 border border-slate-700 rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="">পূর্বে নিবন্ধিত কাস্টমার নির্বাচন...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="ক্রেতার নাম *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="মোবাইল নম্বর"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="ঠিকানা (ঐচ্ছিক)"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px] max-h-[320px] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-slate-700 mb-1.5" />
              <p className="text-xs font-medium text-slate-400">কার্ট খালি আছে</p>
              <p className="text-[11px] text-slate-600">বাম পাশের তালিকা থেকে পণ্য নির্বাচন করুন</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-2.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] text-amber-400 font-semibold">
                      {item.unitPrice.toLocaleString()} ৳ / {item.product.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Serial Number & Warranty input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="সিরিয়াল নং (যেমন: BAT-12345)"
                    value={item.serialNumber || ''}
                    onChange={(e) => handleUpdateSerial(item.product.id, e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {item.warrantyPeriod && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded shrink-0">
                      {item.warrantyPeriod}
                    </span>
                  )}
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateQty(item.product.id, -1)}
                      className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.product.id, 1)}
                      className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-slate-400 ml-1">{item.product.unit}</span>
                  </div>

                  <div className="text-xs font-bold text-amber-300">
                    {item.total.toLocaleString()} ৳
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Old Battery Trade-in Box (Crucial User Requirement!) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4" />
                <span>পুরাতন ব্যাটারি জমা / এক্সচেঞ্জ</span>
              </span>
              <button
                type="button"
                onClick={() => setIsScrapModalOpen(true)}
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold transition"
              >
                <Plus className="w-3 h-3" />
                <span>পুরাতন ব্যাটারি যোগ করুন</span>
              </button>
            </div>

            {scrapTradeIns.length === 0 ? (
              <div className="p-2 bg-slate-800/40 border border-dashed border-slate-800 rounded-lg text-center">
                <p className="text-[11px] text-slate-400">
                  কাস্টমার পুরাতন ব্যাটারি জমা দিয়ে ডিসকাউন্ট নিতে চাইলে উপরের বাটনে ক্লিক করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {scrapTradeIns.map((sb) => (
                  <div
                    key={sb.id}
                    className="p-2 rounded-lg bg-amber-950/40 border border-amber-600/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-amber-200">
                        {sb.brand} • {sb.capacityAh}
                      </div>
                      <div className="text-[10px] text-amber-400">
                        স্ক্র্যাপ স্টক মূল্য: -{sb.value.toLocaleString()} ৳ ({sb.condition || 'ডেড ব্যাটারি'})
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveScrapBattery(sb.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Checkout & Bill Calculation Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-2.5">
          {/* Summary Breakdown */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>নতুন পণ্যের বিক্রয় মূল্য (Subtotal):</span>
              <span className="font-semibold text-white">{subtotal.toLocaleString()} ৳</span>
            </div>

            {totalScrapCredit > 0 && (
              <div className="flex justify-between text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                <span>(-) পুরাতন ব্যাটারি বাবদ ছাড় (Trade-in):</span>
                <span>-{totalScrapCredit.toLocaleString()} ৳</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-300">
              <span>(-) বিশেষ ছাড় (Cash Discount):</span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-right text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-between text-sm font-black text-amber-300 pt-1 border-t border-slate-800">
              <span>নিট প্রদেয় বিল (Net Payable):</span>
              <span>{netPayable.toLocaleString()} ৳</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-1">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">পেমেন্ট মেথড:</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {[
                { id: 'cash', label: 'ক্যাশ', icon: Banknote },
                { id: 'bkash', label: 'বিকাশ', icon: CreditCard },
                { id: 'nagad', label: 'নগদ', icon: CreditCard },
                { id: 'card', label: 'কার্ড', icon: CreditCard },
                { id: 'bank', label: 'ব্যাংক', icon: CreditCard },
                { id: 'due', label: 'বাকি', icon: DollarSign },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'due') {
                        setPaidAmount(0);
                      }
                    }}
                    className={`px-1.5 py-1 rounded text-center text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid & Due Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">পরিশোধ (Paid Amount)</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) =>
                  setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder={netPayable.toString()}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">বকেয়া (Due)</label>
              <div
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                  currentDue > 0 ? 'bg-rose-950/60 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentDue.toLocaleString()} ৳
              </div>
            </div>
          </div>

          {/* Notes */}
          <input
            type="text"
            placeholder="ইনভয়েস নোট বা বিশেষ বিবরণ..."
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none"
          />

          {/* Complete Sale Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5 fill-slate-950 text-amber-400" />
            <span>বিক্রি সম্পন্ন করুন ও রিসিট প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Scrap Battery Modal */}
      <ScrapBatteryModal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        onAddScrap={handleAddScrapBattery}
      />

      {/* Receipt Print Modal */}
      <ReceiptPrint
        invoice={lastInvoice}
        settings={settings}
        onClose={() => setLastInvoice(null)}
      />
    </div>
  );
};
