export type UnitType = 'Pcs' | 'Set' | 'Ah' | 'Kg' | 'Meter' | 'Box' | 'Piece';

export interface Brand {
  id: string;
  name: string;
  origin?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CustomUnit {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStockAlert: number;
  warranty: string; // e.g. "24 Months", "18 Months", "1 Year", "N/A"
  capacityAh?: string; // e.g. "150Ah", "200Ah" for batteries
  modelNo?: string;
  description?: string;
  createdAt: string;
}

export interface ScrapBatteryTradeIn {
  id: string;
  brand: string;
  capacityAh: string; // e.g. "130Ah", "150Ah", "200Ah"
  value: number; // Value credited to customer (old battery buy price)
  condition?: string; // e.g. "Dead cell", "Broken terminal", "Intact body"
  notes?: string;
  soldStatus?: 'in_stock' | 'sold';
  soldPrice?: number;
  soldParty?: string;
  soldDate?: string;
}

export interface ScrapBatteryRecord {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  capacityAh: string;
  buyPrice: number; // The amount paid / credited to customer
  status: 'in_stock' | 'sold';
  soldPrice?: number; // Amount fetched when sold to recycling factory
  soldParty?: string;
  soldDate?: string;
  notes?: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  serialNumber?: string; // Serial number for warranty tracking
  warrantyPeriod?: string;
  total: number;
}

export interface SaleInvoice {
  id: string; // e.g., "INV-1001"
  date: string; // "2026-10-02"
  time: string; // "14:30"
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: CartItem[];
  subtotal: number; // Sum of new products sold at standard price
  scrapBatteries: ScrapBatteryTradeIn[]; // Old batteries bought from customer
  totalScrapCredit: number; // Total deduction for old batteries
  discount: number; // Additional cash discount
  netTotal: number; // subtotal - totalScrapCredit - discount
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card' | 'bank' | 'due';
  notes?: string;
  syncedToGoogleSheet?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address: string;
  openingBalance: number;
  currentBalance: number; // Positive means shop owes supplier
  defaultCommissionRate?: number; // e.g. 2 for 2%, 3 for 3%
  totalCommissionEarned?: number; // Total commission received / deducted
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  type: 'purchase' | 'payment' | 'return' | 'commission';
  invoiceNumber?: string;
  billAmount: number;
  paidAmount: number;
  commissionAmount?: number; // Monthly commission or rebate discounted from balance
  commissionRate?: number; // Percentage if calculated by %
  balance: number; // Running balance after this transaction
  paymentMethod?: string;
  itemsSummary?: string;
  notes?: string;
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalDue: number;
  lastPurchaseDate?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'দোকান ভাড়া' | 'বিদ্যুৎ বিল' | 'কর্মচারী বেতন' | 'চা-নাস্তা' | 'পরিবহন খরচ' | 'মেরামত ও যন্ত্রাংশ' | 'আপ্যায়ন' | 'অন্যান্য';
  amount: number;
  paidTo?: string;
  paymentMethod: string;
  notes?: string;
  syncedToGoogleSheet?: boolean;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  proprietor: string;
  phone: string;
  email: string;
  address: string;
  invoiceFooterNote: string;
  warrantyPolicy: string;
  currency: string;
  googleScriptUrl: string;
  autoSync: boolean;
  lastSyncTime?: string;
}
