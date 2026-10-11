import React, { useState } from 'react';
import {
  Printer,
  X,
  CheckCircle,
  FileText,
  ShieldCheck,
  Phone,
  MapPin,
  BatteryCharging,
} from 'lucide-react';
import { SaleInvoice, ShopSettings } from '../../types';

interface ReceiptPrintProps {
  invoice: SaleInvoice | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  invoice,
  settings,
  onClose,
}) => {
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-hidden">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-800 border-b border-slate-700/80 p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-300">ফরম্যাট:</span>
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setPrintMode('thermal')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  printMode === 'thermal'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                থার্মাল রিসিট (80mm)
              </button>
              <button
                onClick={() => setPrintMode('a4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  printMode === 'a4'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                এ৪ / প্যাড ইনভয়েস (A4)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white text-slate-900 shadow-xl transition-all ${
              printMode === 'thermal'
                ? 'w-full max-w-[360px] p-4 text-[12px] font-mono leading-tight'
                : 'w-full max-w-[580px] p-6 text-[13px] leading-normal font-sans'
            }`}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-950">
                {settings.shopName}
              </h2>
              <p className="text-[11px] text-slate-700 font-medium">{settings.tagline}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                <MapPin className="w-3 h-3 inline mr-1" />
                {settings.address}
              </p>
              <p className="text-[11px] font-bold text-slate-800">
                <Phone className="w-3 h-3 inline mr-1" />
                মোবাইল: {settings.phone}
              </p>
              {settings.proprietor && (
                <p className="text-[10px] text-slate-600">স্বত্বাধিকারী: {settings.proprietor}</p>
              )}
            </div>

            {/* Invoice Info */}
            <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[11px]">
              <div className="flex justify-between">
                <span>
                  <strong>বিল নং:</strong> {invoice.id}
                </span>
                <span>
                  <strong>তারিখ:</strong> {invoice.date} {invoice.time}
                </span>
              </div>
              <div className="mt-1">
                <strong>ক্রেতার নাম:</strong> {invoice.customerName}
              </div>
              {invoice.customerPhone && (
                <div>
                  <strong>মোবাইল:</strong> {invoice.customerPhone}
                </div>
              )}
              {invoice.customerAddress && (
                <div>
                  <strong>ঠিকানা:</strong> {invoice.customerAddress}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-3">
              <div className="font-bold border-b border-slate-900 py-1 flex justify-between text-[11px]">
                <span className="w-6/12">পণ্যের বিবরণ</span>
                <span className="w-2/12 text-center">পরিমাণ</span>
                <span className="w-2/12 text-right">দর</span>
                <span className="w-2/12 text-right">মোট</span>
              </div>
              <div className="divide-y divide-dashed divide-slate-300">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between text-[11px]">
                    <div className="w-6/12 pr-1">
                      <div className="font-bold text-slate-950">{item.product.name}</div>
                      {item.serialNumber && (
                        <div className="text-[10px] text-slate-600">
                          সিরিয়াল: {item.serialNumber}
                        </div>
                      )}
                      {item.warrantyPeriod && (
                        <div className="text-[10px] text-amber-800 font-medium">
                          ওয়ারেন্টি: {item.warrantyPeriod}
                        </div>
                      )}
                    </div>
                    <div className="w-2/12 text-center font-medium">
                      {item.quantity} {item.product.unit}
                    </div>
                    <div className="w-2/12 text-right">{item.unitPrice}৳</div>
                    <div className="w-2/12 text-right font-bold">{item.total}৳</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Scrap Breakdown */}
            <div className="border-t-2 border-slate-900 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between font-semibold">
                <span>নতুন পণ্যের মোট মূল্য (Subtotal):</span>
                <span>{invoice.subtotal.toLocaleString()} ৳</span>
              </div>

              {/* Scrap Battery Trade-In (Crucial Feature!) */}
              {invoice.scrapBatteries && invoice.scrapBatteries.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 p-1.5 rounded my-1 text-[11px]">
                  <div className="flex justify-between font-bold text-amber-950">
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 inline" />
                      পুরাতন ব্যাটারি জমা / ট্রেড-ইন:
                    </span>
                    <span className="text-rose-700">
                      - {invoice.totalScrapCredit.toLocaleString()} ৳
                    </span>
                  </div>
                  {invoice.scrapBatteries.map((sb, i) => (
                    <div key={i} className="text-[10px] text-slate-700 pl-4 mt-0.5">
                      • {sb.brand} ({sb.capacityAh}) — {sb.value} ৳ {sb.condition && `[${sb.condition}]`}
                    </div>
                  ))}
                  <div className="text-[9px] text-slate-500 pl-4 italic mt-0.5">
                    (নতুন ব্যাটারির মূল্য অপরিবর্তিত রেখে স্ক্র্যাপ হিসেবে সমন্বয়কৃত)
                  </div>
                </div>
              )}

              {invoice.discount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>অতিরিক্ত ছাড় (Discount):</span>
                  <span>- {invoice.discount.toLocaleString()} ৳</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm border-t border-slate-800 pt-1 text-slate-950">
                <span>সর্বমোট প্রদেয় (Net Payable):</span>
                <span>{invoice.netTotal.toLocaleString()} ৳</span>
              </div>

              <div className="flex justify-between font-semibold text-emerald-800">
                <span>পরিশোধিত (Paid):</span>
                <span>{invoice.paidAmount.toLocaleString()} ৳</span>
              </div>

              {invoice.dueAmount > 0 && (
                <div className="flex justify-between font-bold text-rose-700">
                  <span>অবশিষ্ট বকেয়া (Due):</span>
                  <span>{invoice.dueAmount.toLocaleString()} ৳</span>
                </div>
              )}

              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>পেমেন্ট মাধ্যম:</span>
                <span className="font-semibold uppercase">{invoice.paymentMethod}</span>
              </div>
            </div>

            {/* Warranty & Terms */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-400 text-[10px] text-slate-700 space-y-1">
              <div className="font-bold flex items-center gap-1 text-slate-900">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>ওয়ারেন্টি ও বিক্রয় শর্তাবলী:</span>
              </div>
              <p className="leading-snug">{settings.warrantyPolicy}</p>
              <p className="italic text-slate-500">{settings.invoiceFooterNote}</p>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 flex justify-between text-[10px] text-slate-800">
              <div className="text-center">
                <div className="border-t border-slate-400 w-24 mb-1"></div>
                <span>ক্রেতার স্বাক্ষর</span>
              </div>
              <div className="text-center">
                <div className="border-t border-slate-400 w-28 mb-1"></div>
                <span>কর্তৃপক্ষের স্বাক্ষর</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info (No-print) */}
        <div className="no-print bg-slate-900 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>ইনভয়েস সফলভাবে সংরক্ষিত হয়েছে।</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            বন্ধ করুন / নতুন সেল
          </button>
        </div>
      </div>
    </div>
  );
};
