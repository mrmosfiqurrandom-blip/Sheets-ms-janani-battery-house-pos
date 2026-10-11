/**
 * Google Apps Script & Google Sheets integration helper
 * Provides complete GAS script and sync endpoints.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * ElectroPower POS - Google Sheets Database & Google Apps Script (Code.gs)
 * IPS & Battery POS - Google Sheets Database Sync Backend
 * ============================================================================
 * 
 * Instructions:
 * 1. Open a new Google Sheet (e.g. 'ElectroPower POS Database')
 * 2. Go to Extensions > Apps Script in the menu
 * 3. Delete any default code and paste this entire code
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Description: 'POS Backend API'
 * 7. Execute as: 'Me (your email)'
 * 8. Who has access: 'Anyone'
 * 9. Click 'Deploy', authorize permissions, and copy the Web App URL into the POS app.
 */

function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sales Sheet
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

  // 2. Scrap Batteries Sheet (Old Scrap Battery Ledger)
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

  // 3. Products & Stock Sheet
  var productSheet = ss.getSheetByName('Products') || ss.insertSheet('Products');
  if (productSheet.getLastRow() === 0) {
    productSheet.appendRow([
      'Product ID', 'Barcode/SKU', 'Product Name', 'Brand', 'Category', 
      'Unit', 'Buy Price (Tk)', 'Sell Price (Tk)', 'Stock Qty', 
      'Min Alert', 'Warranty'
    ]);
    formatHeaderRow(productSheet, '#1d4ed8');
  }

  // 4. Suppliers Sheet
  var supSheet = ss.getSheetByName('Suppliers') || ss.insertSheet('Suppliers');
  if (supSheet.getLastRow() === 0) {
    supSheet.appendRow([
      'Supplier ID', 'Supplier Name', 'Company', 'Phone', 'Email', 
      'Address', 'Default Commission (%)', 'Total Commission Earned (Tk)', 'Current Balance Due (Tk)'
    ]);
    formatHeaderRow(supSheet, '#b45309');
  }

  // 5. Supplier Ledger Sheet
  var ledgerSheet = ss.getSheetByName('Supplier_Ledger') || ss.insertSheet('Supplier_Ledger');
  if (ledgerSheet.getLastRow() === 0) {
    ledgerSheet.appendRow([
      'Entry ID', 'Date', 'Supplier Name', 'Transaction Type', 
      'Invoice / Ref No', 'Bill Amount (Tk)', 'Paid Amount (Tk)', 
      'Commission / Rebate (Tk)', 'Running Balance (Tk)', 'Items / Description', 'Notes'
    ]);
    formatHeaderRow(ledgerSheet, '#7c2d12');
  }

  // 6. Expenses Sheet
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

// GET request handler (data fetch & connection test)
function doGet(e) {
  setupDatabaseSheets();
  var action = (e && e.parameter && e.parameter.action) || 'test';
  
  if (action === 'test') {
    return createJsonResponse({
      success: true,
      message: 'Google Sheets & Apps Script database connected successfully!',
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

// POST request handler (data sync & save)
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
        message: 'Connection successful! Google Sheet database is ready.'
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
          var typeLabel = l.type === 'purchase' ? 'Purchase Bill' : (l.type === 'commission' ? 'Monthly Rebate Commission' : 'Payment Cleared');
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
        message: 'All data successfully synchronized to Google Sheets!',
        syncTime: new Date().toLocaleString()
      });
    }

    return createJsonResponse({ success: false, message: 'Action not supported' });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'Error: ' + error.toString()
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
      message: 'Please provide a valid Google Apps Script Web App URL.',
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
      message: data.message || 'Google Sheets connection successful!',
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
        message: postData.message || 'Google Sheets connection successful!',
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Could not connect. Please ensure "Who has access: Anyone" is selected when deploying your Web App.',
      };
    }
  }
}

export async function syncAllToGoogleSheet(scriptUrl: string, payload: any): Promise<SyncResult> {
  if (!scriptUrl) {
    return {
      success: false,
      message: 'Google Apps Script URL is not configured. Set the URL in Google Sheets settings.',
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
      message: result.message || 'All data successfully synchronized to Google Sheets!',
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    console.error('Sync failed:', err);
    return {
      success: false,
      message: 'Error during sync: ' + (err.message || 'Network Error'),
    };
  }
}
