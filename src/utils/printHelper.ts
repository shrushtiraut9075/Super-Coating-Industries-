import { Invoice, CompanyProfile, InvoiceCopyType } from '../types';
import { formatIndianCurrency, formatDate } from './formatters';

/**
 * Generates clean, standalone printable HTML and opens it in an isolated print frame.
 * This guarantees printing works in every browser and inside sandboxed iframes without breaking or clipping.
 */
export function printInvoiceDocument(
  invoice: Invoice,
  company: CompanyProfile,
  copyType: InvoiceCopyType = 'Original for Recipient'
): void {
  const isGstApplicable = invoice.isGstApplicable !== false;
  const isIntraState = (invoice.customerStateCode || '27') === (company.stateCode || '27');

  const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${invoice.invoiceNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.25;
    }
    .invoice-box {
      border: 1.5px solid #0f172a;
      width: 100%;
      max-width: 194mm;
      margin: 0 auto;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f8fafc;
      border-bottom: 1.5px solid #0f172a;
      padding: 6px 12px;
    }
    .header-bar .title {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .badge {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      border-radius: 2px;
      text-transform: uppercase;
    }
    .company-meta {
      display: flex;
      border-bottom: 1.5px solid #0f172a;
    }
    .comp-left {
      width: 60%;
      padding: 10px;
      border-right: 1.5px solid #0f172a;
    }
    .comp-right {
      width: 40%;
      font-size: 10.5px;
    }
    .meta-row {
      display: flex;
      border-bottom: 1px solid #cbd5e1;
      padding: 4px 8px;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-col {
      width: 50%;
    }
    .meta-label {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      display: block;
    }
    .bill-ship {
      display: flex;
      border-bottom: 1.5px solid #0f172a;
    }
    .bill-col, .ship-col {
      width: 50%;
      padding: 8px 10px;
    }
    .bill-col {
      border-right: 1.5px solid #0f172a;
    }
    .section-title {
      font-size: 9.5px;
      font-weight: bold;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10px;
    }
    th, td {
      border-right: 1px solid #0f172a;
      padding: 5px 6px;
      overflow: hidden;
      word-break: break-word;
    }
    th:last-child, td:last-child {
      border-right: none;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      border-bottom: 1.5px solid #0f172a;
      text-align: center;
    }
    td.text-right, th.text-right {
      text-align: right;
    }
    td.text-center, th.text-center {
      text-align: center;
    }
    .items-table tr {
      border-bottom: 1px solid #e2e8f0;
    }
    .table-footer td {
      border-top: 1.5px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
      background: #f8fafc;
      font-weight: bold;
      border-right: 1px solid #0f172a;
    }
    .table-footer td:last-child {
      border-right: none;
    }
    .summary-section {
      display: flex;
    }
    .summary-left {
      width: 60%;
      padding: 10px;
      border-right: 1.5px solid #0f172a;
      display: flex;
      flex-col;
      gap: 8px;
    }
    .summary-right {
      width: 40%;
      font-size: 11px;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 8px;
      border-bottom: 1px solid #cbd5e1;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      font-weight: bold;
      font-size: 13px;
    }
    .bank-box {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      border-radius: 2px;
      background: #f8fafc;
      font-size: 10px;
      margin-top: 6px;
    }
    .words-box {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      background: #fdfdfd;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- Header -->
    <div class="header-bar">
      <div style="font-size: 9px; font-weight: bold; color: #475569;">
        ${isGstApplicable ? 'GST TAX INVOICE (RULE 46 OF CGST RULES)' : 'BILL OF SUPPLY / INVOICE (NON-TAXABLE SUPPLY)'}
      </div>
      <div class="title">${isGstApplicable ? 'TAX INVOICE' : 'BILL OF SUPPLY'}</div>
      <div class="badge">${copyType}</div>
    </div>

    <!-- Company Meta -->
    <div class="company-meta">
      <div class="comp-left" style="display: flex; gap: 10px; align-items: flex-start;">
        <div style="width: 72px; height: 72px; border: 1.5px solid #0f172a; padding: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #ffffff; border-radius: 2px;">
          ${company.logoUrl ? `<img src="${company.logoUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : `
            <div style="text-align: center; line-height: 1;">
              <div style="font-weight: 900; font-size: 20px; color: #0B478B; letter-spacing: -1px;">SCI</div>
              <div style="font-size: 7px; font-weight: bold; color: #F2600C; text-transform: uppercase;">COATING</div>
            </div>
          `}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1;">
            ${company.name}
          </div>
          ${company.tagline ? `<div style="font-size: 8.5px; color: #475569; font-weight: 600; margin-top: 1px;">${company.tagline}</div>` : ''}
          <div style="font-size: 9.5px; color: #1e293b; line-height: 1.25; margin-top: 3px;">
            ${company.address}<br>
            <b>State:</b> ${company.state} (Code: ${company.stateCode})<br>
            <b>GSTIN:</b> <span style="font-family: monospace; font-weight: bold;">${company.gstin}</span> &nbsp;|&nbsp; 
            <b>PAN:</b> <span style="font-family: monospace;">${company.pan}</span><br>
            <b>Mobile:</b> ${company.mobile} &nbsp;|&nbsp; <b>Email:</b> ${company.email}
          </div>
        </div>
      </div>
      <div class="comp-right">
        <div class="meta-row" style="background: #f8fafc;">
          <div class="meta-col">
            <span class="meta-label">Invoice No:</span>
            <span style="font-weight: bold; font-family: monospace;">${invoice.invoiceNo}</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">Dated:</span>
            <span>${formatDate(invoice.invoiceDate)}</span>
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-col">
            <span class="meta-label">Challan No:</span>
            <span>${invoice.challanNo || '-'}</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">Challan Date:</span>
            <span>${formatDate(invoice.challanDate)}</span>
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-col">
            <span class="meta-label">PO Number:</span>
            <span>${invoice.poNo || '-'}</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">PO Date:</span>
            <span>${formatDate(invoice.poDate)}</span>
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-col">
            <span class="meta-label">Place of Supply:</span>
            <span>${invoice.customerState || 'Maharashtra'} (${invoice.customerStateCode || '27'})</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">Reverse Charge:</span>
            <span>${invoice.reverseCharge ? 'YES' : 'NO'}</span>
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-col">
            <span class="meta-label">Vehicle No:</span>
            <span style="font-family: monospace;">${invoice.vehicleNo || '-'}</span>
          </div>
          <div class="meta-col">
            <span class="meta-label">Transport:</span>
            <span>${invoice.transportMode || 'Road'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bill To & Ship To -->
    <div class="bill-ship">
      <div class="bill-col">
        <div class="section-title">
          <span>DETAILS OF RECEIVER | BILLED TO:</span>
          <span style="font-family: monospace;">Code: ${invoice.customerStateCode || '27'}</span>
        </div>
        <div style="font-weight: bold; font-size: 11px;">${invoice.customerName}</div>
        <div style="font-size: 10px; color: #334155; margin: 2px 0;">${invoice.billingAddress}</div>
        <div style="font-size: 10px;">
          <b>State:</b> ${invoice.customerState || 'Maharashtra'}<br>
          <b>GSTIN / UIN:</b> <span style="font-family: monospace; font-weight: bold;">${invoice.customerGstin || '-'}</span><br>
          <b>Contact:</b> ${invoice.customerMobile || '-'} &nbsp;|&nbsp; <b>PAN:</b> ${invoice.customerPan || '-'}
        </div>
      </div>
      <div class="ship-col">
        <div class="section-title">
          <span>DETAILS OF CONSIGNEE | SHIPPED TO:</span>
          <span style="font-family: monospace;">Code: ${invoice.shipToStateCode || invoice.customerStateCode || '27'}</span>
        </div>
        <div style="font-weight: bold; font-size: 11px;">${invoice.shipToName || invoice.customerName}</div>
        <div style="font-size: 10px; color: #334155; margin: 2px 0;">${invoice.shippingAddress || invoice.billingAddress}</div>
        <div style="font-size: 10px;">
          <b>State:</b> ${invoice.shipToState || invoice.customerState || 'Maharashtra'}<br>
          <b>GSTIN / UIN:</b> <span style="font-family: monospace; font-weight: bold;">${invoice.shipToGstin || invoice.customerGstin || '-'}</span><br>
          <b>Contact:</b> ${invoice.shipToMobile || invoice.customerMobile || '-'}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      ${isGstApplicable && isIntraState ? `
        <colgroup>
          <col style="width: 4%;">
          <col style="width: 31%;">
          <col style="width: 8%;">
          <col style="width: 6%;">
          <col style="width: 6%;">
          <col style="width: 9%;">
          <col style="width: 10%;">
          <col style="width: 8%;">
          <col style="width: 8%;">
          <col style="width: 10%;">
        </colgroup>
      ` : `
        <colgroup>
          <col style="width: 4%;">
          <col style="width: 34%;">
          <col style="width: 9%;">
          <col style="width: 7%;">
          <col style="width: 6%;">
          <col style="width: 9%;">
          <col style="width: 11%;">
          <col style="width: 9%;">
          <col style="width: 11%;">
        </colgroup>
      `}
      <thead>
        <tr>
          <th>Sr.</th>
          <th style="text-align: left;">Description of Goods / Job Work</th>
          <th>HSN/SAC</th>
          <th>Qty</th>
          <th>Unit</th>
          <th class="text-right">Rate (₹)</th>
          <th class="text-right">Taxable (₹)</th>
          ${!isGstApplicable ? `
            <th class="text-center">GST Rate / Amt</th>
          ` : isIntraState ? `
            <th class="text-right">CGST</th>
            <th class="text-right">SGST</th>
          ` : `
            <th class="text-right">IGST</th>
          `}
          <th class="text-right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td style="font-weight: 600;">${item.description}</td>
            <td class="text-center" style="font-family: monospace;">${item.hsn}</td>
            <td class="text-center" style="font-weight: bold;">${item.quantity}</td>
            <td class="text-center">${item.unit}</td>
            <td class="text-right" style="font-family: monospace;">${formatIndianCurrency(item.rate, false)}</td>
            <td class="text-right" style="font-family: monospace; font-weight: 600;">${formatIndianCurrency(item.taxableAmount, false)}</td>
            ${!isGstApplicable ? `
              <td class="text-center" style="color: #64748b;">0% (0.00)</td>
            ` : isIntraState ? `
              <td class="text-right" style="font-family: monospace;">
                <span style="font-size: 8px; color: #64748b;">${item.cgstRate}%</span> ${formatIndianCurrency(item.cgstAmount, false)}
              </td>
              <td class="text-right" style="font-family: monospace;">
                <span style="font-size: 8px; color: #64748b;">${item.sgstRate}%</span> ${formatIndianCurrency(item.sgstAmount, false)}
              </td>
            ` : `
              <td class="text-right" style="font-family: monospace;">
                <span style="font-size: 8px; color: #64748b;">${item.igstRate}%</span> ${formatIndianCurrency(item.igstAmount, false)}
              </td>
            `}
            <td class="text-right" style="font-family: monospace; font-weight: bold;">${formatIndianCurrency(item.totalAmount, false)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr class="table-footer">
          <td colspan="3" style="text-align: right; text-transform: uppercase;">Total</td>
          <td class="text-center">${invoice.totalQuantity}</td>
          <td></td>
          <td></td>
          <td class="text-right" style="font-family: monospace;">${formatIndianCurrency(invoice.taxableAmount, false)}</td>
          ${!isGstApplicable ? `
            <td class="text-center">0.00</td>
          ` : isIntraState ? `
            <td class="text-right" style="font-family: monospace;">${formatIndianCurrency(invoice.cgstTotal, false)}</td>
            <td class="text-right" style="font-family: monospace;">${formatIndianCurrency(invoice.sgstTotal, false)}</td>
          ` : `
            <td class="text-right" style="font-family: monospace;">${formatIndianCurrency(invoice.igstTotal, false)}</td>
          `}
          <td class="text-right" style="font-family: monospace;">
            ${formatIndianCurrency(invoice.taxableAmount + (isGstApplicable ? (invoice.cgstTotal + invoice.sgstTotal + invoice.igstTotal) : 0), false)}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Calculations & Summary -->
    <div class="summary-section">
      <div class="summary-left">
        <div class="words-box">
          <span style="font-size: 8.5px; font-weight: bold; color: #64748b; text-transform: uppercase;">Amount Chargeable (in words):</span>
          <div style="font-weight: 800; font-size: 11px; margin-top: 2px;">${invoice.amountInWords}</div>
        </div>

        <div class="bank-box">
          <div style="font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 3px;">
            COMPANY'S BANK DETAILS FOR RTGS / NEFT
          </div>
          <div><b>Bank:</b> ${company.bankName} &nbsp;|&nbsp; <b>Branch:</b> ${company.branch}</div>
          <div><b>A/C No:</b> <span style="font-family: monospace; font-weight: bold;">${company.accountNumber}</span></div>
          <div><b>IFSC:</b> <span style="font-family: monospace; font-weight: bold;">${company.ifsc}</span></div>
        </div>

        <div style="font-size: 9px; color: #475569; margin-top: 6px;">
          <b>Terms & Conditions:</b>
          <ol style="margin: 2px 0 0 16px; padding: 0;">
            ${(invoice.terms?.length ? invoice.terms : company.terms).slice(0, 3).map((t) => `<li>${t}</li>`).join('')}
          </ol>
        </div>

        <div style="margin-top: 15px; font-size: 10px; font-weight: bold;">
          Receiver's Signature & Seal
        </div>
      </div>

      <div class="summary-right">
        <div class="sum-row">
          <span>Taxable Subtotal:</span>
          <span style="font-weight: bold; font-family: monospace;">${formatIndianCurrency(invoice.taxableAmount)}</span>
        </div>
        ${!isGstApplicable ? `
          <div class="sum-row" style="color: #64748b;">
            <span>GST (Non-Taxable Supply):</span>
            <span style="font-family: monospace;">₹0.00</span>
          </div>
        ` : isIntraState ? `
          <div class="sum-row">
            <span>Central GST (CGST):</span>
            <span style="font-family: monospace;">${formatIndianCurrency(invoice.cgstTotal)}</span>
          </div>
          <div class="sum-row">
            <span>State GST (SGST):</span>
            <span style="font-family: monospace;">${formatIndianCurrency(invoice.sgstTotal)}</span>
          </div>
        ` : `
          <div class="sum-row">
            <span>Integrated GST (IGST):</span>
            <span style="font-family: monospace;">${formatIndianCurrency(invoice.igstTotal)}</span>
          </div>
        `}
        <div class="sum-row">
          <span>Round Off:</span>
          <span style="font-family: monospace;">${invoice.roundOff > 0 ? '+' : ''}${formatIndianCurrency(invoice.roundOff, false)}</span>
        </div>
        <div class="grand-total-row">
          <div>
            <div style="font-size: 9px; text-transform: uppercase;">Grand Total</div>
            <div style="font-size: 8px; opacity: 0.8;">Total Invoice Value</div>
          </div>
          <div style="font-size: 16px; font-family: monospace;">${formatIndianCurrency(invoice.grandTotal)}</div>
        </div>

        <div style="padding: 20px 10px 10px; text-align: right;">
          <div style="font-size: 10px; font-weight: bold;">For ${company.name}</div>
          <div style="margin-top: 30px; font-size: 9px; color: #475569;">Authorised Signatory</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Create isolated hidden iframe for 100% reliable printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback to standard window.print()
    window.print();
    return;
  }

  doc.open();
  doc.write(printHtml);
  doc.close();

  // Wait for rendering & images, then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
}
