import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  BatteryCharging,
  Package,
  Truck,
  Users,
  Receipt,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lowStockCount: number;
  scrapStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  lowStockCount,
  scrapStockCount,
}) => {
  const menuItems = [
    {
      id: 'pos',
      label: 'POS Sales Counter',
      subtitle: 'POS Billing & Checkout',
      icon: ShoppingCart,
      badge: null,
      highlight: true,
    },
    {
      id: 'scrap',
      label: 'Old Scrap Batteries',
      subtitle: 'Trade-in & Scrap Stock',
      icon: BatteryCharging,
      badge: scrapStockCount > 0 ? `${scrapStockCount} In Stock` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'inventory',
      label: 'Products & Inventory',
      subtitle: 'Products, Brands & Stock',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low Stock` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'suppliers',
      label: 'Suppliers & Ledger',
      subtitle: 'Purchases, Dues & Rebates',
      icon: Truck,
      badge: null,
    },
    {
      id: 'customers',
      label: 'Customers & Receivables',
      subtitle: 'Customer Dues & History',
      icon: Users,
      badge: null,
    },
    {
      id: 'expenses',
      label: 'Daily Shop Expenses',
      subtitle: 'Store Overhead & Costs',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Reports & Dashboard',
      subtitle: 'Analytics & Profit Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sheets',
      label: 'Google Sheets Sync',
      subtitle: 'Apps Script Database',
      icon: FileSpreadsheet,
      badge: 'Live Sync',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'settings',
      label: 'Store Settings',
      subtitle: 'Profile, Terms & Backup',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium leading-tight truncate">
                    {item.label}
                  </div>
                  <div
                    className={`text-[11px] leading-tight truncate ${
                      isActive ? 'text-slate-800 font-normal' : 'text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-1.5 ${
                    isActive
                      ? 'bg-slate-950 text-amber-300'
                      : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Helpful Hint Card at bottom of sidebar */}
      <div className="p-3 m-3 bg-slate-800/70 border border-slate-700/60 rounded-xl text-xs text-slate-400 hidden md:block">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>Battery Trade-in Policy</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Customer old batteries are credited against bills without lowering new battery selling prices, maintaining accurate revenue and scrap resale accounting.
        </p>
      </div>
    </aside>
  );
};
