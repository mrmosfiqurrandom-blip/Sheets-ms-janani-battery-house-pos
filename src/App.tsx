/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StorageService } from './services/storage';
import { syncAllToGoogleSheet } from './services/googleSheetsSync';
import {
  Product,
  Brand,
  Category,
  CustomUnit,
  ScrapBatteryRecord,
  ScrapBatteryTradeIn,
  Supplier,
  SupplierLedgerEntry,
  Customer,
  Expense,
  SaleInvoice,
  ShopSettings,
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PosCounter } from './components/pos/PosCounter';
import { ScrapBatteriesView } from './components/scrap/ScrapBatteriesView';
import { ProductsView } from './components/inventory/ProductsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { CustomersView } from './components/customers/CustomersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { DashboardView } from './components/reports/DashboardView';
import { GoogleSheetsSyncView } from './components/googleSheets/GoogleSheetsSyncView';
import { SettingsView } from './components/settings/SettingsView';
import { ReceiptPrint } from './components/pos/ReceiptPrint';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('pos');

  // Core Data States
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [brands, setBrands] = useState<Brand[]>(() => StorageService.getBrands());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [units, setUnits] = useState<CustomUnit[]>(() => StorageService.getUnits());
  const [scrapBatteries, setScrapBatteries] = useState<ScrapBatteryRecord[]>(() =>
    StorageService.getScrapBatteries()
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerEntry[]>(() =>
    StorageService.getSupplierLedger()
  );
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => StorageService.getInvoices());
  const [settings, setSettings] = useState<ShopSettings>(() => StorageService.getSettings());

  // Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  // Receipt Modal State for viewing historical invoices
  const [viewingInvoice, setViewingInvoice] = useState<SaleInvoice | null>(null);

  // Sync to Google Sheets Helper
  const triggerGoogleSheetsSync = useCallback(
    async (customSettings?: ShopSettings) => {
      const activeSettings = customSettings || settings;
      if (!activeSettings.googleScriptUrl) return;

      setIsSyncing(true);
      try {
        const payload = {
          products,
          invoices,
          scrapBatteries,
          suppliers,
          supplierLedger,
          expenses,
        };
        const result = await syncAllToGoogleSheet(activeSettings.googleScriptUrl, payload);
        setSyncStatus({
          success: result.success,
          message: result.message,
          timestamp: new Date().toLocaleTimeString('bn-BD'),
        });
      } catch (err: any) {
        setSyncStatus({
          success: false,
          message: 'সিঙ্ক ব্যর্থ হয়েছে: ' + (err.message || 'নেটওয়ার্ক সমস্যা'),
        });
      } finally {
        setIsSyncing(false);
      }
    },
    [products, invoices, scrapBatteries, suppliers, supplierLedger, expenses, settings]
  );

  // --- Handlers ---

  // 1. POS Sale Completion (Heart of the user's business logic)
  const handleCompleteSale = (
    newInvoice: SaleInvoice,
    updatedProducts: Product[],
    tradeIns: ScrapBatteryTradeIn[]
  ) => {
    // 1. Save updated products (reduced stock)
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // 2. Add Invoice
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    StorageService.saveInvoices(updatedInvoices);

    // 3. Transform trade-in old batteries into ScrapBatteryRecord and add to scrap stock
    let updatedScrap = [...scrapBatteries];
    if (tradeIns && tradeIns.length > 0) {
      const newScrapRecords: ScrapBatteryRecord[] = tradeIns.map((t, idx) => ({
        id: `scrap-${newInvoice.id}-${idx + 1}`,
        invoiceId: newInvoice.id,
        customerName: newInvoice.customerName,
        customerPhone: newInvoice.customerPhone,
        brand: t.brand,
        capacityAh: t.capacityAh,
        buyPrice: t.value,
        status: 'in_stock',
        notes: t.notes || 'কাস্টমারের পুরাতন ব্যাটারি এক্সচেঞ্জ গ্রহণ।',
        date: newInvoice.date,
      }));
      updatedScrap = [...newScrapRecords, ...updatedScrap];
      setScrapBatteries(updatedScrap);
      StorageService.saveScrapBatteries(updatedScrap);
    }

    // 4. Update or Add Customer Record
    const existingCustIdx = customers.findIndex(
      (c) =>
        (newInvoice.customerPhone && c.phone === newInvoice.customerPhone) ||
        c.name.toLowerCase() === newInvoice.customerName.toLowerCase()
    );

    let updatedCustomers = [...customers];
    if (existingCustIdx >= 0) {
      const cust = updatedCustomers[existingCustIdx];
      updatedCustomers[existingCustIdx] = {
        ...cust,
        totalPurchases: cust.totalPurchases + newInvoice.netTotal,
        totalDue: cust.totalDue + newInvoice.dueAmount,
        lastPurchaseDate: newInvoice.date,
      };
    } else if (newInvoice.customerName) {
      updatedCustomers = [
        {
          id: 'cust-' + Date.now(),
          name: newInvoice.customerName,
          phone: newInvoice.customerPhone,
          address: newInvoice.customerAddress,
          totalPurchases: newInvoice.netTotal,
          totalDue: newInvoice.dueAmount,
          lastPurchaseDate: newInvoice.date,
        },
        ...updatedCustomers,
      ];
    }
    setCustomers(updatedCustomers);
    StorageService.saveCustomers(updatedCustomers);

    // 5. Auto sync if enabled
    if (settings.autoSync && settings.googleScriptUrl) {
      setTimeout(() => triggerGoogleSheetsSync(), 600);
    }
  };

  // 2. Scrap Battery Handlers
  const handleSellScrap = (
    id: string,
    soldPrice: number,
    soldParty: string,
    soldDate: string,
    notes?: string
  ) => {
    const updated = scrapBatteries.map((b) =>
      b.id === id
        ? {
            ...b,
            status: 'sold' as const,
            soldPrice,
            soldParty,
            soldDate,
            notes: notes || b.notes,
          }
        : b
    );
    setScrapBatteries(updated);
    StorageService.saveScrapBatteries(updated);
    if (settings.autoSync) triggerGoogleSheetsSync();
  };

  const handleDeleteScrap = (id: string) => {
    const updated = scrapBatteries.filter((b) => b.id !== id);
    setScrapBatteries(updated);
    StorageService.saveScrapBatteries(updated);
  };

  const handleAddManualScrap = (scrap: ScrapBatteryRecord) => {
    const updated = [scrap, ...scrapBatteries];
    setScrapBatteries(updated);
    StorageService.saveScrapBatteries(updated);
    if (settings.autoSync) triggerGoogleSheetsSync();
  };

  // 3. Product & Brand/Category Handlers
  const handleAddProduct = (newProd: Product) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);
    if (settings.autoSync) triggerGoogleSheetsSync();
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    StorageService.saveProducts(updated);
    if (settings.autoSync) triggerGoogleSheetsSync();
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleAddBrand = (brand: Brand) => {
    const updated = [...brands, brand];
    setBrands(updated);
    StorageService.saveBrands(updated);
  };

  const handleDeleteBrand = (id: string) => {
    const updated = brands.filter((b) => b.id !== id);
    setBrands(updated);
    StorageService.saveBrands(updated);
  };

  const handleAddCategory = (category: Category) => {
    const updated = [...categories, category];
    setCategories(updated);
    StorageService.saveCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    StorageService.saveCategories(updated);
  };

  const handleAddUnit = (unit: CustomUnit) => {
    const updated = [...units, unit];
    setUnits(updated);
    StorageService.saveUnits(updated);
  };

  const handleDeleteUnit = (id: string) => {
    const updated = units.filter((u) => u.id !== id);
    setUnits(updated);
    StorageService.saveUnits(updated);
  };

  // 4. Supplier & Ledger Handlers
  const handleAddSupplier = (sup: Supplier) => {
    const updated = [...suppliers, sup];
    setSuppliers(updated);
    StorageService.saveSuppliers(updated);
  };

  const handleAddPurchase = (
    supplierId: string,
    invoiceNo: string,
    items: Array<{ productId: string; quantity: number; buyPrice: number }>,
    paidAmount: number,
    commissionDiscount?: number,
    notes?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const rawTotalBill = items.reduce((sum, i) => sum + i.quantity * i.buyPrice, 0);
    const commDisc = Number(commissionDiscount) || 0;
    const netBill = Math.max(0, rawTotalBill - commDisc);
    const newBalance = sup.currentBalance + (netBill - paidAmount);

    // 1. Update Product stock & buy price
    const updatedProducts = products.map((p) => {
      const match = items.find((i) => i.productId === p.id);
      if (match) {
        return {
          ...p,
          stock: p.stock + match.quantity,
          buyPrice: match.buyPrice,
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // 2. Update Supplier balance and commission
    const updatedSuppliers = suppliers.map((s) =>
      s.id === supplierId
        ? {
            ...s,
            currentBalance: newBalance,
            totalCommissionEarned: (s.totalCommissionEarned || 0) + commDisc,
          }
        : s
    );
    setSuppliers(updatedSuppliers);
    StorageService.saveSuppliers(updatedSuppliers);

    // 3. Add to Ledger
    const itemsDescription = items
      .map((i) => {
        const p = products.find((prod) => prod.id === i.productId);
        return `${p?.name || 'পণ্য'} (${i.quantity}টি x ${i.buyPrice}৳)`;
      })
      .join(', ');

    const newLedgerEntry: SupplierLedgerEntry = {
      id: 'led-' + Date.now(),
      supplierId,
      supplierName: sup.name,
      date: new Date().toISOString().split('T')[0],
      type: 'purchase',
      invoiceNumber: invoiceNo,
      billAmount: rawTotalBill,
      commissionAmount: commDisc > 0 ? commDisc : undefined,
      paidAmount,
      balance: newBalance,
      itemsSummary: itemsDescription,
      notes:
        notes ||
        (commDisc > 0
          ? `মোট বিল: ${rawTotalBill}৳, বিল কমিশন ছাড়: ${commDisc}৳, নিট: ${netBill}৳, পেইড: ${paidAmount}৳`
          : `ক্রয় বিল: ${rawTotalBill}৳, পেইড: ${paidAmount}৳`),
    };

    const updatedLedger = [newLedgerEntry, ...supplierLedger];
    setSupplierLedger(updatedLedger);
    StorageService.saveSupplierLedger(updatedLedger);

    if (settings.autoSync) triggerGoogleSheetsSync();
    alert('ক্রয় ভাউচার সফলভাবে সংরক্ষিত ও স্টক বৃদ্ধি হয়েছে!');
  };

  const handleApplyCommission = (
    supplierId: string,
    commissionAmount: number,
    commissionRate: number | undefined,
    period: string,
    notes?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    // Deduct commission from the supplier's due balance (সাপ্লায়ার আমার কাছে যত টাকা পায় সেটা থেকে মাইনাস হবে)
    const newBalance = Math.max(0, sup.currentBalance - commissionAmount);

    const updatedSuppliers = suppliers.map((s) =>
      s.id === supplierId
        ? {
            ...s,
            currentBalance: newBalance,
            totalCommissionEarned: (s.totalCommissionEarned || 0) + commissionAmount,
          }
        : s
    );
    setSuppliers(updatedSuppliers);
    StorageService.saveSuppliers(updatedSuppliers);

    const now = new Date();
    const newLedgerEntry: SupplierLedgerEntry = {
      id: 'led-' + Date.now(),
      supplierId,
      supplierName: sup.name,
      date: now.toISOString().split('T')[0],
      type: 'commission',
      invoiceNumber: `COMM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
      billAmount: 0,
      paidAmount: 0,
      commissionAmount,
      commissionRate,
      balance: newBalance,
      itemsSummary: `${period} পিরিয়ডের অর্জিত বিক্রয় কমিশন / রিবেট ছাড় সমন্বয়`,
      notes: notes || `মাসিক কমিশন ছাড় ${commissionAmount}৳ বকেয়া থেকে কর্তন করা হয়েছে।`,
    };

    const updatedLedger = [newLedgerEntry, ...supplierLedger];
    setSupplierLedger(updatedLedger);
    StorageService.saveSupplierLedger(updatedLedger);

    if (settings.autoSync) triggerGoogleSheetsSync();
    alert(
      `সাপ্লায়ারের বকেয়া থেকে ${commissionAmount.toLocaleString()} টাকা কমিশন ছাড় সফলভাবে সমন্বয় হয়েছে!`
    );
  };

  const handlePaySupplier = (
    supplierId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const newBalance = Math.max(0, sup.currentBalance - amount);

    const updatedSuppliers = suppliers.map((s) =>
      s.id === supplierId ? { ...s, currentBalance: newBalance } : s
    );
    setSuppliers(updatedSuppliers);
    StorageService.saveSuppliers(updatedSuppliers);

    const newLedgerEntry: SupplierLedgerEntry = {
      id: 'led-' + Date.now(),
      supplierId,
      supplierName: sup.name,
      date: new Date().toISOString().split('T')[0],
      type: 'payment',
      billAmount: 0,
      paidAmount: amount,
      balance: newBalance,
      paymentMethod,
      notes: notes || `বকেয়া বাবদ পরিশোধ (${paymentMethod})`,
    };

    const updatedLedger = [newLedgerEntry, ...supplierLedger];
    setSupplierLedger(updatedLedger);
    StorageService.saveSupplierLedger(updatedLedger);

    if (settings.autoSync) triggerGoogleSheetsSync();
    alert('সাপ্লায়ার পেমেন্ট সফলভাবে এন্ট্রি হয়েছে!');
  };

  // 5. Customer Handlers
  const handleAddCustomer = (c: Customer) => {
    const updated = [c, ...customers];
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  const handleCollectDue = (customerId: string, amount: number) => {
    const updated = customers.map((c) =>
      c.id === customerId ? { ...c, totalDue: Math.max(0, c.totalDue - amount) } : c
    );
    setCustomers(updated);
    StorageService.saveCustomers(updated);
    alert('কাস্টমারের বকেয়া সফলভাবে জমা নেওয়া হয়েছে!');
  };

  // 6. Expenses Handlers
  const handleAddExpense = (exp: Expense) => {
    const updated = [exp, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(updated);
    if (settings.autoSync) triggerGoogleSheetsSync();
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  // 7. Settings & Backup Handlers
  const handleSaveSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (fileContent: string): boolean => {
    return StorageService.importAllData(fileContent);
  };

  const handleResetToDefault = () => {
    StorageService.resetToDefault();
    window.location.reload();
  };

  // Calculations for Badges
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const inStockScrapCount = scrapBatteries.filter((b) => b.status === 'in_stock').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onNavigate={setActiveTab}
        onSync={() => triggerGoogleSheetsSync()}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        activeTab={activeTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lowStockCount={lowStockCount}
          scrapStockCount={inStockScrapCount}
        />

        {/* Dynamic View Panels */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {activeTab === 'pos' && (
            <PosCounter
              products={products}
              categories={categories}
              brands={brands}
              customers={customers}
              settings={settings}
              onCompleteSale={handleCompleteSale}
            />
          )}

          {activeTab === 'scrap' && (
            <ScrapBatteriesView
              scrapBatteries={scrapBatteries}
              onSellScrap={handleSellScrap}
              onDeleteScrap={handleDeleteScrap}
              onAddManualScrap={handleAddManualScrap}
            />
          )}

          {activeTab === 'inventory' && (
            <ProductsView
              products={products}
              brands={brands}
              categories={categories}
              units={units}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddBrand={handleAddBrand}
              onDeleteBrand={handleDeleteBrand}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddUnit={handleAddUnit}
              onDeleteUnit={handleDeleteUnit}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              supplierLedger={supplierLedger}
              products={products}
              onAddSupplier={handleAddSupplier}
              onAddPurchase={handleAddPurchase}
              onPaySupplier={handlePaySupplier}
              onApplyCommission={handleApplyCommission}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              onAddCustomer={handleAddCustomer}
              onCollectDue={handleCollectDue}
              onViewInvoice={setViewingInvoice}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'reports' && (
            <DashboardView
              invoices={invoices}
              products={products}
              scrapBatteries={scrapBatteries}
              suppliers={suppliers}
              customers={customers}
              expenses={expenses}
              onViewInvoice={setViewingInvoice}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'sheets' && (
            <GoogleSheetsSyncView
              settings={settings}
              onUpdateSettings={handleSaveSettings}
              onSyncAll={() => triggerGoogleSheetsSync()}
              isSyncing={isSyncing}
              exportBackup={handleExportBackup}
              importBackup={handleImportBackup}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetToDefault={handleResetToDefault}
            />
          )}
        </main>
      </div>

      {/* Historical Invoice Receipt Modal */}
      <ReceiptPrint
        invoice={viewingInvoice}
        settings={settings}
        onClose={() => setViewingInvoice(null)}
      />
    </div>
  );
}
