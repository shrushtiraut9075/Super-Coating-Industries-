import { jsPDF } from 'jspdf';
import { PaymentReceipt, CompanyProfile } from '../types';
import { formatIndianCurrency, formatDate } from './formatters';

/**
 * Generates a clean, pixel-perfect official Indian Payment Receipt (पेमेंट पावती)
 * as a high-resolution vector PDF using jsPDF.
 */
export function generateReceiptPdf(
  receipt: PaymentReceipt,
  company: CompanyProfile
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page Dimensions & Margins
  const startX = 12;
  const startY = 12;
  const width = 186;
  const endX = startX + width; // 198mm

  // Outer Decorative Double Border
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.6);
  doc.rect(startX, startY, width, 180);

  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.2);
  doc.rect(startX + 1.5, startY + 1.5, width - 3, 177);

  // ==========================================================
  // 1. Top Header Title Bar (12mm to 22mm)
  // ==========================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(startX, startY, width, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL PAYMENT RECEIPT / पेमेंट पावती', startX + width / 2, startY + 6.8, {
    align: 'center',
  });

  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('ORIGINAL VOUCHER', endX - 4, startY + 6.8, { align: 'right' });

  // ==========================================================
  // 2. Company Information & Brand Logo (22mm to 52mm)
  // ==========================================================
  const compY = startY + 10;
  const compHeight = 32;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(startX, compY + compHeight, endX, compY + compHeight);

  // Logo Box
  const logoBoxWidth = 22;
  const logoBoxHeight = 22;
  const logoBoxX = startX + 4;
  const logoBoxY = compY + 4;

  let hasRenderedLogo = false;
  if (company.logoUrl && (company.logoUrl.startsWith('data:image/') || company.logoUrl.startsWith('http'))) {
    try {
      const isJpeg = company.logoUrl.includes('image/jpeg') || company.logoUrl.includes('image/jpg');
      const format = isJpeg ? 'JPEG' : 'PNG';
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 1, 1, 'FD');
      doc.addImage(company.logoUrl, format, logoBoxX + 1, logoBoxY + 1, logoBoxWidth - 2, logoBoxHeight - 2);
      hasRenderedLogo = true;
    } catch {
      hasRenderedLogo = false;
    }
  }

  if (!hasRenderedLogo) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 1, 1, 'FD');
    doc.setFillColor(11, 71, 139);
    doc.roundedRect(logoBoxX + 1.5, logoBoxY + 1.5, logoBoxWidth - 3, 12, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SCI', logoBoxX + logoBoxWidth / 2, logoBoxY + 10, { align: 'center' });
    doc.setFillColor(234, 88, 12);
    doc.roundedRect(logoBoxX + 1.5, logoBoxY + 14.5, logoBoxWidth - 3, 5, 0.5, 0.5, 'F');
  }

  // Company Text
  const textX = logoBoxX + logoBoxWidth + 4;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(company.name, textX, compY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  if (company.tagline) {
    doc.text(company.tagline, textX, compY + 11.5);
  }

  const addrLines = doc.splitTextToSize(company.address, 110);
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(addrLines, textX, compY + 16);

  const contactY = compY + 16 + addrLines.length * 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${company.gstin}   |   PAN: ${company.pan}   |   Mob: ${company.mobile}`, textX, contactY);

  // Right side of Header: Receipt Highlight Box
  const receiptBadgeX = endX - 44;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(receiptBadgeX, compY + 4, 40, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT NUMBER', receiptBadgeX + 20, compY + 9, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(receipt.receiptNo, receiptBadgeX + 20, compY + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE', receiptBadgeX + 20, compY + 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(receipt.receiptDate), receiptBadgeX + 20, compY + 23.5, { align: 'center' });

  // ==========================================================
  // 3. Receipt Details Section (54mm onwards)
  // ==========================================================
  let secY = compY + compHeight + 6;

  // Received From Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(startX + 4, secY, width - 8, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RECEIVED WITH THANKS FROM:', startX + 8, secY + 6);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(receipt.customerName, startX + 8, secY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const custDetail = [
    receipt.customerGstin ? `GSTIN: ${receipt.customerGstin}` : '',
    receipt.customerMobile ? `Contact: ${receipt.customerMobile}` : '',
    receipt.customerAddress ? `Address: ${receipt.customerAddress}` : '',
  ]
    .filter(Boolean)
    .join('   |   ');

  const custDetailLines = doc.splitTextToSize(custDetail, width - 20);
  doc.text(custDetailLines, startX + 8, secY + 17.5);

  secY += 28;

  // Amount In Words & Numbers Big Highlight Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.setLineWidth(0.4);
  doc.roundedRect(startX + 4, secY, width - 8, 24, 1.5, 1.5, 'FD');

  // Left side: Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text('THE SUM OF RUPEES (IN WORDS):', startX + 8, secY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const wordsLines = doc.splitTextToSize(receipt.amountInWords || 'Rupees Only', width - 68);
  doc.text(wordsLines, startX + 8, secY + 13);

  // Right side: Bold Amount Tag
  const amountBoxX = endX - 54;
  doc.setFillColor(22, 101, 52); // emerald-800
  doc.roundedRect(amountBoxX, secY + 3.5, 46, 17, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(240, 253, 244);
  doc.text('AMOUNT RECEIVED', amountBoxX + 23, secY + 8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(formatIndianCurrency(receipt.amount), amountBoxX + 23, secY + 16, { align: 'center' });

  secY += 28;

  // ==========================================================
  // 4. Payment Mode & Invoice Breakdown Table
  // ==========================================================
  const colHalf = (width - 8) / 2;

  // Left Column: Payment Mode & Reference
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(startX + 4, secY, colHalf - 2, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT DETAILS', startX + 8, secY + 6.5);
  doc.line(startX + 8, secY + 8, startX + colHalf, secY + 8);

  const payInfo = [
    { label: 'Payment Mode', val: receipt.paymentMode },
    { label: 'Payment Type', val: receipt.paymentType || 'Full Payment' },
    { label: 'Reference / UTR / Cheque No.', val: receipt.referenceNo || 'N/A' },
    { label: 'Bank Name', val: receipt.bankName || company.bankName },
    { label: 'Remarks / Notes', val: receipt.notes || 'Payment received with thanks' },
  ];

  let pY = secY + 13;
  payInfo.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label + ':', startX + 8, pY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.val).substring(0, 32), startX + 46, pY);
    pY += 5.5;
  });

  // Right Column: Against Invoice & Balance Statement
  const rightColX = startX + 4 + colHalf + 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, secY, colHalf - 2, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE & BALANCE STATEMENT', rightColX + 4, secY + 6.5);
  doc.line(rightColX + 4, secY + 8, rightColX + colHalf - 6, secY + 8);

  const invTotal = receipt.invoiceTotal || receipt.amount;
  const prevPaid = receipt.previousPaid || 0;
  const currentPaid = receipt.amount;
  const balanceDue = receipt.balanceRemaining !== undefined
    ? receipt.balanceRemaining
    : Math.max(0, invTotal - prevPaid - currentPaid);

  const invStatements = [
    { label: 'Invoice Number', val: receipt.invoiceNo ? receipt.invoiceNo : 'On Account / Advance' },
    { label: 'Invoice Date', val: receipt.invoiceDate ? formatDate(receipt.invoiceDate) : '-' },
    { label: 'Invoice Total Amount', val: formatIndianCurrency(invTotal) },
    { label: 'Previously Received', val: formatIndianCurrency(prevPaid) },
    { label: 'Current Payment', val: formatIndianCurrency(currentPaid), highlight: true },
    { label: 'Balance Outstanding', val: formatIndianCurrency(balanceDue), isDue: balanceDue > 0 },
  ];

  let bY = secY + 13;
  invStatements.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, rightColX + 4, bY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (item.highlight) {
      doc.setTextColor(22, 101, 52); // green
    } else if (item.isDue) {
      doc.setTextColor(185, 28, 28); // red
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(item.val, rightColX + colHalf - 8, bY, { align: 'right' });
    bY += 4.8;
  });

  secY += 46;

  // ==========================================================
  // 5. Bank Account Details & Signatory Section
  // ==========================================================
  // Bank details on bottom left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('SUPER COATING INDUSTRIES BANK DETAILS (FOR NEFT/RTGS/IMPS):', startX + 4, secY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Bank: ${company.bankName}   |   A/C No: ${company.accountNumber}   |   IFSC: ${company.ifsc}   |   Branch: ${company.branch}`,
    startX + 4,
    secY + 9.5
  );

  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '* Subject to realization of Cheque / DD / Online Transfer. This is a computer-generated payment receipt.',
    startX + 4,
    secY + 14
  );

  // Signatory Box on bottom right
  const signBoxX = endX - 55;
  const signBoxY = secY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${company.name}`, signBoxX + 25, signBoxY + 3, { align: 'center' });

  // Stamp / Signature Space
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(signBoxX + 5, signBoxY + 6, 40, 16);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('STAMP & SIGNATURE', signBoxX + 25, signBoxY + 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorised Signatory', signBoxX + 25, signBoxY + 26, { align: 'center' });

  return doc;
}
