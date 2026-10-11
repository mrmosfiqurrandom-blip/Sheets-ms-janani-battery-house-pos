import {
  Brand,
  Category,
  CustomUnit,
  Product,
  ScrapBatteryRecord,
  Supplier,
  SupplierLedgerEntry,
  Customer,
  Expense,
  ShopSettings,
  SaleInvoice,
} from '../types';
import {
  initialBrands,
  initialCategories,
  initialUnits,
  initialProducts,
  initialScrapBatteries,
  initialSuppliers,
  initialSupplierLedger,
  initialCustomers,
  initialExpenses,
  initialInvoices,
  initialShopSettings,
} from '../data/initialData';

const KEYS = {
  PRODUCTS: 'pos_products_v1',
  BRANDS: 'pos_brands_v1',
  CATEGORIES: 'pos_categories_v1',
  UNITS: 'pos_units_v1',
  SCRAP: 'pos_scrap_batteries_v1',
  SUPPLIERS: 'pos_suppliers_v1',
  SUPPLIER_LEDGER: 'pos_supplier_ledger_v1',
  CUSTOMERS: 'pos_customers_v1',
  EXPENSES: 'pos_expenses_v1',
  INVOICES: 'pos_invoices_v1',
  SETTINGS: 'pos_settings_v1',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading key ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

export const StorageService = {
  getProducts(): Product[] {
    return getStored<Product[]>(KEYS.PRODUCTS, initialProducts);
  },
  saveProducts(products: Product[]): void {
    setStored(KEYS.PRODUCTS, products);
  },

  getBrands(): Brand[] {
    return getStored<Brand[]>(KEYS.BRANDS, initialBrands);
  },
  saveBrands(brands: Brand[]): void {
    setStored(KEYS.BRANDS, brands);
  },

  getCategories(): Category[] {
    return getStored<Category[]>(KEYS.CATEGORIES, initialCategories);
  },
  saveCategories(categories: Category[]): void {
    setStored(KEYS.CATEGORIES, categories);
  },

  getUnits(): CustomUnit[] {
    return getStored<CustomUnit[]>(KEYS.UNITS, initialUnits);
  },
  saveUnits(units: CustomUnit[]): void {
    setStored(KEYS.UNITS, units);
  },

  getScrapBatteries(): ScrapBatteryRecord[] {
    return getStored<ScrapBatteryRecord[]>(KEYS.SCRAP, initialScrapBatteries);
  },
  saveScrapBatteries(scrap: ScrapBatteryRecord[]): void {
    setStored(KEYS.SCRAP, scrap);
  },

  getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(KEYS.SUPPLIERS, initialSuppliers);
  },
  saveSuppliers(suppliers: Supplier[]): void {
    setStored(KEYS.SUPPLIERS, suppliers);
  },

  getSupplierLedger(): SupplierLedgerEntry[] {
    return getStored<SupplierLedgerEntry[]>(KEYS.SUPPLIER_LEDGER, initialSupplierLedger);
  },
  saveSupplierLedger(ledger: SupplierLedgerEntry[]): void {
    setStored(KEYS.SUPPLIER_LEDGER, ledger);
  },

  getCustomers(): Customer[] {
    return getStored<Customer[]>(KEYS.CUSTOMERS, initialCustomers);
  },
  saveCustomers(customers: Customer[]): void {
    setStored(KEYS.CUSTOMERS, customers);
  },

  getExpenses(): Expense[] {
    return getStored<Expense[]>(KEYS.EXPENSES, initialExpenses);
  },
  saveExpenses(expenses: Expense[]): void {
    setStored(KEYS.EXPENSES, expenses);
  },

  getInvoices(): SaleInvoice[] {
    return getStored<SaleInvoice[]>(KEYS.INVOICES, initialInvoices);
  },
  saveInvoices(invoices: SaleInvoice[]): void {
    setStored(KEYS.INVOICES, invoices);
  },

  getSettings(): ShopSettings {
    return getStored<ShopSettings>(KEYS.SETTINGS, initialShopSettings);
  },
  saveSettings(settings: ShopSettings): void {
    setStored(KEYS.SETTINGS, settings);
  },

  exportAllData(): string {
    const backup = {
      products: this.getProducts(),
      brands: this.getBrands(),
      categories: this.getCategories(),
      units: this.getUnits(),
      scrapBatteries: this.getScrapBatteries(),
      suppliers: this.getSuppliers(),
      supplierLedger: this.getSupplierLedger(),
      customers: this.getCustomers(),
      expenses: this.getExpenses(),
      invoices: this.getInvoices(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.products) this.saveProducts(data.products);
      if (data.brands) this.saveBrands(data.brands);
      if (data.categories) this.saveCategories(data.categories);
      if (data.units) this.saveUnits(data.units);
      if (data.scrapBatteries) this.saveScrapBatteries(data.scrapBatteries);
      if (data.suppliers) this.saveSuppliers(data.suppliers);
      if (data.supplierLedger) this.saveSupplierLedger(data.supplierLedger);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.invoices) this.saveInvoices(data.invoices);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  },

  resetToDefault(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
