import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit,
  Trash2,
  Tags,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  Barcode,
  Layers,
  X,
  CheckCircle,
} from 'lucide-react';
import { Product, Brand, Category, CustomUnit } from '../../types';
import { BrandsCategoriesModal } from './BrandsCategoriesModal';

interface ProductsViewProps {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  units: CustomUnit[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddBrand: (brand: Brand) => void;
  onDeleteBrand: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddUnit: (unit: CustomUnit) => void;
  onDeleteUnit: (id: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  brands,
  categories,
  units,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddBrand,
  onDeleteBrand,
  onAddCategory,
  onDeleteCategory,
  onAddUnit,
  onDeleteUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBrandsModalOpen, setIsBrandsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [pName, setPName] = useState('');
  const [pBarcode, setPBarcode] = useState('');
  const [pBrand, setPBrand] = useState(brands[0]?.name || 'Hamko');
  const [pCategory, setPCategory] = useState(categories[0]?.name || 'IPS Inverters & Machines');
  const [pUnit, setPUnit] = useState('Pcs');
  const [pBuyPrice, setPBuyPrice] = useState<number | ''>('');
  const [pSellPrice, setPSellPrice] = useState<number | ''>('');
  const [pStock, setPStock] = useState<number | ''>(5);
  const [pMinAlert, setPMinAlert] = useState<number | ''>(2);
  const [pWarranty, setPWarranty] = useState('24 Months');
  const [pCapacityAh, setPCapacityAh] = useState('');
  const [pModelNo, setPModelNo] = useState('');
  const [pDescription, setPDescription] = useState('');

  // Quick Stock Adjustment
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.modelNo && p.modelNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = p.stock <= p.minStockAlert && p.stock > 0;
      if (stockFilter === 'out') matchesStock = p.stock <= 0;

      return matchesSearch && matchesBrand && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedBrand, selectedCategory, stockFilter]);

  // Statistics
  const totalStockQty = products.reduce((sum, p) => sum + p.stock, 0);
  const totalBuyValuation = products.reduce((sum, p) => sum + p.buyPrice * p.stock, 0);
  const totalSellValuation = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setPName('');
    setPBarcode('IPS-' + Math.floor(1000 + Math.random() * 9000));
    setPBrand(brands[0]?.name || 'Hamko');
    setPCategory(categories[0]?.name || 'IPS Tubular Batteries');
    setPUnit('Pcs');
    setPBuyPrice('');
    setPSellPrice('');
    setPStock(5);
    setPMinAlert(2);
    setPWarranty('24 Months');
    setPCapacityAh('');
    setPModelNo('');
    setPDescription('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name);
    setPBarcode(p.barcode);
    setPBrand(p.brand);
    setPCategory(p.category);
    setPUnit(p.unit);
    setPBuyPrice(p.buyPrice);
    setPSellPrice(p.sellPrice);
    setPStock(p.stock);
    setPMinAlert(p.minStockAlert);
    setPWarranty(p.warranty);
    setPCapacityAh(p.capacityAh || '');
    setPModelNo(p.modelNo || '');
    setPDescription(p.description || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      alert('Please enter a product name');
      return;
    }
    const buy = Number(pBuyPrice) || 0;
    const sell = Number(pSellPrice) || 0;
    const stock = Number(pStock) || 0;
    const minAlert = Number(pMinAlert) || 1;

    if (sell < buy) {
      if (!confirm('Selling price is lower than purchase price! Do you want to proceed and save?')) {
        return;
      }
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: pName.trim(),
        barcode: pBarcode.trim() || editingProduct.barcode,
        brand: pBrand,
        category: pCategory,
        unit: pUnit,
        buyPrice: buy,
        sellPrice: sell,
        stock,
        minStockAlert: minAlert,
        warranty: pWarranty,
        capacityAh: pCapacityAh.trim(),
        modelNo: pModelNo.trim(),
        description: pDescription.trim(),
      };
      onUpdateProduct(updated);
    } else {
      const newProduct: Product = {
        id: 'p-' + Date.now(),
        name: pName.trim(),
        barcode: pBarcode.trim() || 'SKU-' + Date.now().toString().slice(-6),
        brand: pBrand,
        category: pCategory,
        unit: pUnit,
        buyPrice: buy,
        sellPrice: sell,
        stock,
        minStockAlert: minAlert,
        warranty: pWarranty,
        capacityAh: pCapacityAh.trim(),
        modelNo: pModelNo.trim(),
        description: pDescription.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(newProduct);
    }

    setIsProductModalOpen(false);
  };

  const handleApplyStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;
    const amt = Number(adjustAmount);
    if (isNaN(amt)) return;

    const newStock = Math.max(0, stockAdjustProduct.stock + amt);
    onUpdateProduct({
      ...stockAdjustProduct,
      stock: newStock,
    });
    setStockAdjustProduct(null);
    setAdjustAmount('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Products & Inventory
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage shop products, models, brands, prices, warranties, and live stock levels
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsBrandsModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
          >
            <Tags className="w-4 h-4 text-amber-400" />
            <span>Brands, Categories & Units</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Product Items</span>
            <div className="text-2xl font-black text-white mt-1">{products.length} Items</div>
            <span className="text-xs text-slate-500">Total Stock Qty: {totalStockQty} Pcs/Units</span>
          </div>
          <div className="p-3 bg-slate-800 text-amber-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Inventory Buy Valuation</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {totalBuyValuation.toLocaleString()} Tk
            </div>
            <span className="text-xs text-slate-500">Capital invested in stock</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Expected Retail Value</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalSellValuation.toLocaleString()} Tk
            </div>
            <span className="text-xs text-slate-500">
              Potential Profit: +{(totalSellValuation - totalBuyValuation).toLocaleString()} Tk
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Low Stock Alerts</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {lowStockCount} Items
            </div>
            <span className="text-xs text-slate-500">Reached reorder alert level</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, barcode, model or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Stock Status</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Barcode / SKU</th>
                <th className="py-3 px-4">Product Name & Spec</th>
                <th className="py-3 px-4">Brand & Category</th>
                <th className="py-3 px-4 text-right">Buy Price</th>
                <th className="py-3 px-4 text-right">Sell Price</th>
                <th className="py-3 px-4 text-center">Margin</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const marginPct =
                    p.buyPrice > 0 ? Math.round((profit / p.buyPrice) * 100) : 0;
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {p.barcode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        {p.modelNo && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            Model: {p.modelNo}
                          </div>
                        )}
                        {p.capacityAh && (
                          <div className="text-[10px] text-amber-400 font-bold">
                            Capacity: {p.capacityAh}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-amber-400">{p.brand}</div>
                        <div className="text-[11px] text-slate-400">{p.category}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-400">
                        {p.buyPrice.toLocaleString()} Tk
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-300 text-sm">
                        {p.sellPrice.toLocaleString()} Tk
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          +{marginPct}% ({profit.toLocaleString()} Tk)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              setStockAdjustProduct(p);
                              setAdjustAmount('');
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-black transition cursor-pointer hover:ring-2 hover:ring-amber-500 ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isLowStock
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                            title="Click to quickly adjust stock"
                          >
                            {p.stock} {p.unit}
                          </button>
                          {isLowStock && !isOutOfStock && (
                            <span className="text-[10px] text-amber-400 mt-0.5">Low Stock!</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.warranty && p.warranty !== 'N/A' ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{p.warranty}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-800 p-4 border-b border-slate-700/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamko HPD-200Ah Deep Cycle Tubular Battery"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Barcode & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Barcode / SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BAT-HAM-200"
                    value={pBarcode}
                    onChange={(e) => setPBarcode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Model Number / Specification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eco Volt 1050VA"
                    value={pModelNo}
                    onChange={(e) => setPModelNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Brand & Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand *
                  </label>
                  <select
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.code}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buy Price & Sell Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purchase Price (Tk) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 22000"
                    value={pBuyPrice}
                    onChange={(e) =>
                      setPBuyPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price (Tk) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 25500"
                    value={pSellPrice}
                    onChange={(e) =>
                      setPSellPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Stock, Min Alert & Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current In-Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pStock}
                    onChange={(e) =>
                      setPStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pMinAlert}
                    onChange={(e) =>
                      setPMinAlert(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Warranty Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24 Months or 18 Months"
                    value={pWarranty}
                    onChange={(e) => setPWarranty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Capacity Ah & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Battery Capacity Ah (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 200Ah or 150Ah"
                    value={pCapacityAh}
                    onChange={(e) => setPCapacityAh(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Note / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy duty tubular plates"
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  {editingProduct ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Quick Stock Adjustment</h3>
              <button
                onClick={() => setStockAdjustProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-300">{stockAdjustProduct.name}</div>
              <div>
                Current Stock: <strong>{stockAdjustProduct.stock} {stockAdjustProduct.unit}</strong>
              </div>
            </div>

            <form onSubmit={handleApplyStockAdjust} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Quantity to Add or Deduct (+ or -)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. +5 or -2"
                  value={adjustAmount}
                  onChange={(e) =>
                    setAdjustAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Example: Enter +5 for incoming inventory, or -1 for damaged item.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="px-4 py-1.5 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brands & Categories Modal */}
      <BrandsCategoriesModal
        isOpen={isBrandsModalOpen}
        onClose={() => setIsBrandsModalOpen(false)}
        brands={brands}
        categories={categories}
        units={units}
        onAddBrand={onAddBrand}
        onDeleteBrand={onDeleteBrand}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
        onAddUnit={onAddUnit}
        onDeleteUnit={onDeleteUnit}
      />
    </div>
  );
};
