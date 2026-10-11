/**
 * Google Apps Script & Google Sheets integration helper
 * Provides complete GAS script and sync endpoints.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * ইলেক্ট্রো পাওয়ার পিওএস - গুগল শিট ডাটাবেস ও অ্যাপ স্ক্রিপ্ট (Code.gs)
 * IPS & Battery POS - Google Sheets Database Sync Backend
 * ============================================================================
 * 
 * নির্দেশনা:
 * ১. একটি নতুন Google Sheet খুলুন (যেমন: 'IPS & Battery POS Database')
 * ২. Extensions > Apps Script মেন্যুতে যান
 * ৩. আগের সব কোড মুছে এই সম্পূর্ণ কোডটি পেস্ট করুন
 * ৪. 'Deploy' > 'New deployment' এ ক্লিক করুন
 * ৫. Select type: 'Web app' নির্বাচন করুন
 * ৬. Description: 'POS Backend API'
 * ৭. Execute as: 'Me (আপনার ইমেইল)'
 * ৮. Who has access: 'Anyone' (বা 'Anyone with Google account')
 * ৯. 'Deploy' চাপুন এবং প্রাপ্ত Web App URL টি কপি করে পিওএস অ্যাপ্লিকেশনে বসান।
 */

function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ১. Sales Sheet
  var salesSheet = ss.getSheetByName('Sales') || ss.insertSheet('Sales');
  if (salesSheet.getLastRow() === 0) {
    salesSheet.appendRow([
      'Invoice ID', 'Date', 'Time', 'Customer Name', 'Customer Phone', 
      'Address', 'Items Sold', 'Subtotal (Tk)', 'Scrap Credit (Tk)', 
      'Discount (Tk)', 'Net Payable (Tk)', 'Paid Amount (Tk)', 
      'Due Amount (Tk)', 'Payment Method', 'Notes'
    ]);
    formatHeaderRow(salesSheet, '#1e293b');
  }

  // ২. Scrap Batteries Sheet (পুরাতন স্ক্র্যাপ ব্যাটারি খাতা)
  var scrapSheet = ss.getSheetByName('Scrap_Batteries') || ss.insertSheet('Scrap_Batteries');
  if (scrapSheet.getLastRow() === 0) {
    scrapSheet.appendRow([
      'Scrap ID', 'Date', 'Invoice ID', 'Customer Name', 'Phone', 
      'Battery Brand', 'Capacity (Ah)', 'Buyback Value (Tk)', 
      'Status (In Stock / Sold)', 'Sold Price (Tk)', 'Sold To Party', 
      'Sold Date', 'Profit (Tk)', 'Notes'
    ]);
    formatHeaderRow(scrapSheet, '#0f766e');
  }

  // ৩. Products & Stock Sheet (মজুদ স্টক)
  var productSheet = ss.getSheetByName('Products') || ss.insertSheet('Products');
  if (productSheet.getLastRow() === 0) {
    productSheet.appendRow([
      'Product ID', 'Barcode/SKU', 'Product Name', 'Brand', 'Category', 
      'Unit', 'Buy Price (Tk)', 'Sell Price (Tk)', 'Stock Qty', 
      'Min Alert', 'Warranty'
    ]);
    formatHeaderRow(productSheet, '#1d4ed8');
  }

  // ৪. Suppliers Sheet (সাপ্লায়ার তালিকা)
  var supSheet = ss.getSheetByName('Suppliers') || ss.insertSheet('Suppliers');
  if (supSheet.getLastRow() === 0) {
    supSheet.appendRow([
      'Supplier ID', 'Supplier Name', 'Company', 'Phone', 'Email', 
      'Address', 'Default Commission (%)', 'Total Commission Earned (Tk)', 'Current Balance Due (Tk)'
    ]);
    formatHeaderRow(supSheet, '#b45309');
  }

  // ৫. Supplier Ledger Sheet (সাপ্লায়ার বিস্তারিত লেজার শিট)
  var ledgerSheet = ss.getSheetByName('Supplier_Ledger') || ss.insertSheet('Supplier_Ledger');
  if (ledgerSheet.getLastRow() === 0) {
    ledgerSheet.appendRow([
      'Entry ID', 'Date', 'Supplier Name', 'Transaction Type', 
      'Invoice / Ref No', 'Bill Amount (Tk)', 'Paid Amount (Tk)', 
      'Commission / Rebate (Tk)', 'Running Balance (Tk)', 'Items / Description', 'Notes'
    ]);
    formatHeaderRow(ledgerSheet, '#7c2d12');
  }

  // ৬. Expenses Sheet (দোকানের আনুষাঙ্গিক খরচ)
  var expSheet = ss.getSheetByName('Expenses') || ss.insertSheet('Expenses');
  if (expSheet.getLastRow() === 0) {
    expSheet.appendRow([
      'Expense ID', 'Date', 'Category', 'Amount (Tk)', 
      'Paid To', 'Payment Method', 'Notes'
    ]);
    formatHeaderRow(expSheet, '#be123c');
  }
}

function formatHeaderRow(sheet, bgColor) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  header.setBackground(bgColor);
  header.setFontColor('#ffffff');
  header.setFontWeight('bold');
  header.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

// GET রিকোয়েস্ট হ্যান্ডলার (ডাটা ফেচ ও কানেকশন টেস্ট)
function doGet(e) {
  setupDatabaseSheets();
  var action = (e && e.parameter && e.parameter.action) || 'test';
  
  if (action === 'test') {
    return createJsonResponse({
      success: true,
      message: 'গুগল শিট ও অ্যাপ স্ক্রিপ্ট ডাটাবেস সফলভাবে সংযুক্ত হয়েছে!',
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      timestamp: new Date().toISOString()
    });
  }
  
  if (action === 'getData') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return createJsonResponse({
      success: true,
      data: {
        products: getSheetDataAsJson(ss.getSheetByName('Products')),
        sales: getSheetDataAsJson(ss.getSheetByName('Sales')),
        scrapBatteries: getSheetDataAsJson(ss.getSheetByName('Scrap_Batteries')),
        suppliers: getSheetDataAsJson(ss.getSheetByName('Suppliers')),
        ledger: getSheetDataAsJson(ss.getSheetByName('Supplier_Ledger')),
        expenses: getSheetDataAsJson(ss.getSheetByName('Expenses'))
      }
    });
  }

  return createJsonResponse({ success: false, message: 'Invalid action' });
}

// POST রিকোয়েস্ট হ্যান্ডলার (ডাটা সিঙ্ক ও সেভ)
function doPost(e) {
  setupDatabaseSheets();
  try {
    var body = e.postData.contents;
    var payload = JSON.parse(body);
    var action = payload.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'test') {
      return createJsonResponse({
        success: true,
        message: 'কানেকশন সফল! গুগল শিট প্রস্তুত আছে।'
      });
    }

    if (action === 'syncAll') {
      var data = payload.data || {};
      
      // Update Products
      if (data.products && data.products.length > 0) {
        var pSheet = ss.getSheetByName('Products');
        clearSheetContentPreserveHeader(pSheet);
        data.products.forEach(function(p) {
          pSheet.appendRow([
            p.id, p.barcode || '', p.name, p.brand, p.category, 
            p.unit, p.buyPrice, p.sellPrice, p.stock, 
            p.minStockAlert, p.warranty || ''
          ]);
        });
      }

      // Update Sales
      if (data.invoices && data.invoices.length > 0) {
        var sSheet = ss.getSheetByName('Sales');
        clearSheetContentPreserveHeader(sSheet);
        data.invoices.forEach(function(inv) {
          var itemsStr = (inv.items || []).map(function(i) {
            return i.product.name + ' (Qty: ' + i.quantity + ', Rate: ' + i.unitPrice + ' Tk)';
          }).join(' | ');

          sSheet.appendRow([
            inv.id, inv.date, inv.time || '', inv.customerName, 
            inv.customerPhone, inv.customerAddress || '', itemsStr, 
            inv.subtotal, inv.totalScrapCredit || 0, inv.discount || 0, 
            inv.netTotal, inv.paidAmount, inv.dueAmount, 
            inv.paymentMethod, inv.notes || ''
          ]);
        });
      }

      // Update Scrap Batteries
      if (data.scrapBatteries && data.scrapBatteries.length > 0) {
        var scrapSheet = ss.getSheetByName('Scrap_Batteries');
        clearSheetContentPreserveHeader(scrapSheet);
        data.scrapBatteries.forEach(function(sb) {
          var profit = (sb.soldPrice && sb.soldPrice > sb.buyPrice) ? (sb.soldPrice - sb.buyPrice) : 0;
          scrapSheet.appendRow([
            sb.id, sb.date, sb.invoiceId, sb.customerName, sb.customerPhone,
            sb.brand, sb.capacityAh, sb.buyPrice, 
            sb.status === 'sold' ? 'Sold' : 'In Stock',
            sb.soldPrice || '', sb.soldParty || '', sb.soldDate || '',
            profit, sb.notes || ''
          ]);
        });
      }

      // Update Suppliers
      if (data.suppliers && data.suppliers.length > 0) {
        var supSheet = ss.getSheetByName('Suppliers');
        clearSheetContentPreserveHeader(supSheet);
        data.suppliers.forEach(function(sup) {
          supSheet.appendRow([
            sup.id, sup.name, sup.company, sup.phone, sup.email || '',
            sup.address || '', sup.defaultCommissionRate || 0,
            sup.totalCommissionEarned || 0, sup.currentBalance
          ]);
        });
      }

      // Update Supplier Ledger
      if (data.supplierLedger && data.supplierLedger.length > 0) {
        var ledSheet = ss.getSheetByName('Supplier_Ledger');
        clearSheetContentPreserveHeader(ledSheet);
        data.supplierLedger.forEach(function(l) {
          var typeLabel = l.type === 'purchase' ? 'ক্রয় বিল' : (l.type === 'commission' ? 'মাসিক কমিশন ছাড়' : 'পেমেন্ট পরিশোধ');
          ledSheet.appendRow([
            l.id, l.date, l.supplierName, typeLabel, l.invoiceNumber || '',
            l.billAmount || 0, l.paidAmount || 0, l.commissionAmount || 0, l.balance, 
            l.itemsSummary || '', l.notes || ''
          ]);
        });
      }

      // Update Expenses
      if (data.expenses && data.expenses.length > 0) {
        var expSheet = ss.getSheetByName('Expenses');
        clearSheetContentPreserveHeader(expSheet);
        data.expenses.forEach(function(ex) {
          expSheet.appendRow([
            ex.id, ex.date, ex.category, ex.amount, 
            ex.paidTo || '', ex.paymentMethod || '', ex.notes || ''
          ]);
        });
      }

      return createJsonResponse({
        success: true,
        message: 'গুগল শিটে সমস্ত ডাটা সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!',
        syncTime: new Date().toLocaleString()
      });
    }

    return createJsonResponse({ success: false, message: 'Action not supported' });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'ত্রুটি: ' + error.toString()
    });
  }
}

function clearSheetContentPreserveHeader(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function getSheetDataAsJson(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  data?: any;
}

export async function testGoogleSheetConnection(scriptUrl: string): Promise<SyncResult> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return {
      success: false,
      message: 'অনুগ্রহ করে সঠিক Google Apps Script Web App URL প্রদান করুন।',
    };
  }

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'test');
    
    // We send test request
    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success ?? true,
      message: data.message || 'গুগল শিট কানেকশন সফল হয়েছে!',
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    console.warn('Direct GET failed, checking with no-cors or post:', err);
    // Since Google Apps Script Web App redirects (302) on POST/GET, browser fetch might face CORS redirect in some environments
    // We can also test sending a POST request
    try {
      const postRes = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'test' }),
      });
      const postData = await postRes.json();
      return {
        success: postData.success ?? true,
        message: postData.message || 'গুগল শিট কানেকশন সফল হয়েছে!',
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'সংযোগ করা সম্ভব হয়নি। Web App Deploy করার সময় "Who has access: Anyone" নির্বাচন করা আছে কিনা চেক করুন।',
      };
    }
  }
}

export async function syncAllToGoogleSheet(scriptUrl: string, payload: any): Promise<SyncResult> {
  if (!scriptUrl) {
    return {
      success: false,
      message: 'গুগল অ্যাপ স্ক্রিপ্ট URL দেওয়া হয়নি। সেটিংস থেকে URL সেট করুন।',
    };
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncAll',
        data: payload,
      }),
    });

    const result = await res.json();
    return {
      success: result.success ?? true,
      message: result.message || 'সমস্ত ডাটা সফলভাবে গুগল শিটে সিঙ্ক হয়েছে!',
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    console.error('Sync failed:', err);
    return {
      success: false,
      message: 'সিঙ্ক করার সময় ত্রুটি ঘটেছে: ' + (err.message || 'Network Error'),
    };
  }
}
