import { jsPDF } from 'jspdf';
import { Invoice, CompanyProfile, InvoiceCopyType } from '../types';
import { formatIndianCurrency, formatDate } from './formatters';

/**
 * Generates an authentic, pixel-perfect A4 Indian GST Tax Invoice as a vector PDF.
 * - Perfectly aligned table column divider lines from header through total row.
 * - Right-aligned numbers matching exactly across item rows and total row.
 * - Clean "Rs." labels avoiding broken Latin-1 unicode rupee glyphs.
 * - Safe margins ensuring no text touches or clips outer borders.
 */
export function generateInvoicePdf(
  invoice: Invoice,
  company: CompanyProfile,
  copyType: InvoiceCopyType = 'Original for Recipient'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isGstApplicable = invoice.isGstApplicable !== false;
  const isIntraState = (invoice.customerStateCode || '27') === (company.stateCode || '27');

  // Page Dimensions & Margins
  const startX = 10;
  const startY = 10;
  const width = 190;
  const endX = startX + width; // 200 mm
  const pageBottom = 287; // 10mm bottom margin

  // Outer Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(startX, startY, width, pageBottom - startY);

  // ==========================================================
  // 1. Top Header Bar (10mm to 19mm)
  // ==========================================================
  doc.setFillColor(248, 250, 252);
  doc.rect(startX, startY, width, 9, 'F');
  doc.line(startX, startY + 9, endX, startY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isGstApplicable
      ? 'GST TAX INVOICE (RULE 46 OF CGST RULES)'
      : 'BILL OF SUPPLY / INVOICE (NON-TAXABLE SUPPLY)',
    startX + 3,
    startY + 6
  );

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(isGstApplicable ? 'TAX INVOICE' : 'BILL OF SUPPLY', startX + width / 2, startY + 6.2, {
    align: 'center',
  });

  // Copy Type Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(endX - 48, startY + 1.5, 45, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(copyType.toUpperCase(), endX - 25.5, startY + 5.5, { align: 'center' });

  // ==========================================================
  // 2. Company Details & Invoice Metadata (19mm to 55mm)
  // ==========================================================
  let currY = startY + 9;
  const compMetaHeight = 36;
  doc.line(startX, currY + compMetaHeight, endX, currY + compMetaHeight);

  // Vertical divider between Company (60%) and Metadata (40%)
  const splitX = startX + 114;
  doc.line(splitX, currY, splitX, currY + compMetaHeight);

  // Left: Company Info with Dedicated Logo Box
  const logoBoxWidth = 24; // 24mm wide
  const logoBoxHeight = 24; // 24mm high
  const logoBoxX = startX + 3; // 13mm
  const logoBoxY = currY + 4; // 23mm

  let textStartX = logoBoxX + logoBoxWidth + 3.5; // ~40.5mm
  let textMaxWidth = splitX - textStartX - 2; // ~81.5mm
  let hasRenderedLogo = false;

  // Render logo if available
  if (company.logoUrl && (company.logoUrl.startsWith('data:image/') || company.logoUrl.startsWith('http'))) {
    try {
      const isJpeg = company.logoUrl.includes('image/jpeg') || company.logoUrl.includes('image/jpg');
      const format = isJpeg ? 'JPEG' : 'PNG';

      let imgW = logoBoxWidth - 2;
      let imgH = logoBoxHeight - 2;
      try {
        const props = doc.getImageProperties(company.logoUrl);
        if (props.width && props.height) {
          const ratio = props.width / props.height;
          if (ratio > (logoBoxWidth - 2) / (logoBoxHeight - 2)) {
            imgW = logoBoxWidth - 2;
            imgH = imgW / ratio;
          } else {
            imgH = logoBoxHeight - 2;
            imgW = imgH * ratio;
          }
        }
      } catch {
        imgW = logoBoxWidth - 2;
        imgH = logoBoxHeight - 2;
      }

      // Draw neat bordered container for logo
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 1, 1, 'FD');

      // Center logo within container box
      const posX = logoBoxX + (logoBoxWidth - imgW) / 2;
      const posY = logoBoxY + (logoBoxHeight - imgH) / 2;
      doc.addImage(company.logoUrl, format, posX, posY, imgW, imgH);
      hasRenderedLogo = true;
    } catch (e) {
      console.warn('PDF logo render failed:', e);
    }
  }

  // If no custom logo, draw the official company emblem
  if (!hasRenderedLogo) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 1, 1, 'FD');

    // Corporate emblem: Blue badge with "SCI" and orange sub-ribbon
    doc.setFillColor(11, 71, 139);
    doc.roundedRect(logoBoxX + 2, logoBoxY + 2, logoBoxWidth - 4, 13, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SCI', logoBoxX + logoBoxWidth / 2, logoBoxY + 11, { align: 'center' });

    doc.setFillColor(242, 96, 12);
    doc.rect(logoBoxX + 2, logoBoxY + 15, logoBoxWidth - 4, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4);
    doc.text('COATING', logoBoxX + logoBoxWidth / 2, logoBoxY + 18.5, { align: 'center' });
  }

  // Company Details (Positioned completely to the right of the logo box)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, textStartX, currY + 5.5);

  let compY = currY + 9;
  if (company.tagline) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const tagLines = doc.splitTextToSize(company.tagline, textMaxWidth);
    doc.text(tagLines, textStartX, compY);
    compY += tagLines.length * 2.8;
  }

  // Address (Wrapped cleanly beside the logo, never overlapping)
  doc.setFontSize(6.8);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  const addrLines = doc.splitTextToSize(company.address, textMaxWidth);
  doc.text(addrLines, textStartX, compY + 0.5);
  compY += addrLines.length * 2.9;

  // State
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.text(`State: ${company.state} (Code: ${company.stateCode})`, textStartX, compY + 1.2);
  compY += 3.3;

  // GSTIN & PAN
  doc.text(`GSTIN: ${company.gstin}   |   PAN: ${company.pan}`, textStartX, compY + 1.2);
  compY += 3.3;

  // Mobile & Email
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.text(`Mobile: ${company.mobile}   |   Email: ${company.email}`, textStartX, compY + 1.2);

  // Right: Invoice Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.rect(splitX, currY, endX - splitX, 7.5, 'F');
  doc.line(splitX, currY + 7.5, endX, currY + 7.5);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE NO:', splitX + 3, currY + 3.2);
  doc.text('DATED:', splitX + 40, currY + 3.2);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNo, splitX + 3, currY + 6.3);
  doc.text(formatDate(invoice.invoiceDate), splitX + 40, currY + 6.3);

  // Challan row
  doc.line(splitX, currY + 14.5, endX, currY + 14.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('CHALLAN NO:', splitX + 3, currY + 10.5);
  doc.text('CHALLAN DATE:', splitX + 40, currY + 10.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.challanNo || '-', splitX + 3, currY + 13.5);
  doc.text(invoice.challanDate ? formatDate(invoice.challanDate) : '-', splitX + 40, currY + 13.5);

  // PO row
  doc.line(splitX, currY + 21.5, endX, currY + 21.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('PO NUMBER:', splitX + 3, currY + 17.5);
  doc.text('PO DATE:', splitX + 40, currY + 17.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.poNo || '-', splitX + 3, currY + 20.5);
  doc.text(invoice.poDate ? formatDate(invoice.poDate) : '-', splitX + 40, currY + 20.5);

  // Place of Supply & Reverse Charge row
  doc.line(splitX, currY + 28.5, endX, currY + 28.5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('PLACE OF SUPPLY:', splitX + 3, currY + 24.5);
  doc.text('REV. CHARGE:', splitX + 40, currY + 24.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.customerState || 'Maharashtra'} (${invoice.customerStateCode || '27'})`, splitX + 3, currY + 27.5);
  doc.text(invoice.reverseCharge ? 'YES' : 'NO', splitX + 40, currY + 27.5);

  // Vehicle & Transport row
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('VEHICLE NO:', splitX + 3, currY + 31.5);
  doc.text('TRANSPORT:', splitX + 40, currY + 31.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.vehicleNo || '-', splitX + 3, currY + 34.5);
  doc.text(invoice.transportMode || 'Road', splitX + 40, currY + 34.5);

  // ==========================================================
  // 3. Bill To & Ship To Boxes (55mm to 85mm)
  // ==========================================================
  currY = currY + compMetaHeight;
  const billShipHeight = 30;
  doc.line(startX, currY + billShipHeight, endX, currY + billShipHeight);
  const midX = startX + width / 2; // 105 mm
  doc.line(midX, currY, midX, currY + billShipHeight);

  // Bill To (Left)
  doc.setFillColor(248, 250, 252);
  doc.rect(startX, currY, width / 2, 5, 'F');
  doc.line(startX, currY + 5, midX, currY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DETAILS OF RECEIVER | BILLED TO:', startX + 3, currY + 3.5);
  doc.text(`State Code: ${invoice.customerStateCode || '27'}`, midX - 3, currY + 3.5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customerName.toUpperCase(), startX + 3, currY + 8.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const billAddr = doc.splitTextToSize(invoice.billingAddress, 88);
  doc.text(billAddr, startX + 3, currY + 12);

  const billBottomY = currY + 12 + Math.min(billAddr.length, 2) * 3;
  doc.setFont('helvetica', 'bold');
  doc.text(`State: ${invoice.customerState || 'Maharashtra'}`, startX + 3, billBottomY + 2);
  doc.text(`GSTIN / UIN: ${invoice.customerGstin || '-'}`, startX + 3, billBottomY + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contact: ${invoice.customerMobile || '-'}    |    PAN: ${invoice.customerPan || '-'}`, startX + 3, billBottomY + 8.4);

  // Ship To (Right)
  doc.setFillColor(248, 250, 252);
  doc.rect(midX, currY, width / 2, 5, 'F');
  doc.line(midX, currY + 5, endX, currY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DETAILS OF CONSIGNEE | SHIPPED TO:', midX + 3, currY + 3.5);
  doc.text(`State Code: ${invoice.shipToStateCode || invoice.customerStateCode || '27'}`, endX - 3, currY + 3.5, { align: 'right' });

  const shipName = invoice.shipToName || invoice.customerName;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(shipName.toUpperCase(), midX + 3, currY + 8.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const shipAddr = doc.splitTextToSize(invoice.shippingAddress || invoice.billingAddress, 88);
  doc.text(shipAddr, midX + 3, currY + 12);

  const shipBottomY = currY + 12 + Math.min(shipAddr.length, 2) * 3;
  doc.setFont('helvetica', 'bold');
  doc.text(`State: ${invoice.shipToState || invoice.customerState || 'Maharashtra'}`, midX + 3, shipBottomY + 2);
  doc.text(`GSTIN / UIN: ${invoice.shipToGstin || invoice.customerGstin || '-'}`, midX + 3, shipBottomY + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contact: ${invoice.shipToMobile || invoice.customerMobile || '-'}`, midX + 3, shipBottomY + 8.4);

  // ==========================================================
  // 4. Items Table Columns & Grid Geometry
  // ==========================================================
  currY = currY + billShipHeight;
  const headerHeight = 7.5;
  const tableStartY = currY;
  const tableEndY = 184; // Fixed height before totals
  const footerHeight = 7;
  const tableTotalBottom = tableEndY + footerHeight; // 191 mm

  // Column boundaries array:
  // Intra-State: 10 columns
  // Inter-State / Non-GST: 9 columns
  let cols: number[];
  if (isGstApplicable && isIntraState) {
    // 10 columns: Sr(6), Desc(60), HSN(15), Qty(11), Unit(10), Rate(16), Taxable(20), CGST(16), SGST(16), Total(20) = 190mm
    cols = [
      startX,       // 0: 10
      startX + 6,   // 1: 16 (Sr)
      startX + 66,  // 2: 76 (Desc)
      startX + 81,  // 3: 91 (HSN)
      startX + 92,  // 4: 102 (Qty)
      startX + 102, // 5: 112 (Unit)
      startX + 118, // 6: 128 (Rate)
      startX + 138, // 7: 148 (Taxable)
      startX + 154, // 8: 164 (CGST)
      startX + 170, // 9: 180 (SGST)
      endX,         // 10: 200 (Total)
    ];
  } else if (isGstApplicable && !isIntraState) {
    // 9 columns: Sr(6), Desc(68), HSN(16), Qty(12), Unit(10), Rate(18), Taxable(20), IGST(18), Total(22) = 190mm
    cols = [
      startX,       // 0: 10
      startX + 6,   // 1: 16 (Sr)
      startX + 74,  // 2: 84 (Desc)
      startX + 90,  // 3: 100 (HSN)
      startX + 102, // 4: 112 (Qty)
      startX + 112, // 5: 122 (Unit)
      startX + 130, // 6: 140 (Rate)
      startX + 150, // 7: 160 (Taxable)
      startX + 172, // 8: 182 (IGST)
      endX,         // 9: 200 (Total)
    ];
  } else {
    // Non-GST: 9 columns
    cols = [
      startX,       // 0: 10
      startX + 6,   // 1: 16 (Sr)
      startX + 74,  // 2: 84 (Desc)
      startX + 90,  // 3: 100 (HSN)
      startX + 102, // 4: 112 (Qty)
      startX + 112, // 5: 122 (Unit)
      startX + 130, // 6: 140 (Rate)
      startX + 152, // 7: 162 (Taxable)
      startX + 176, // 8: 186 (GST 0%)
      endX,         // 9: 200 (Total)
    ];
  }

  // Draw Table Header Fill & Horizontal Lines
  doc.setFillColor(241, 245, 249);
  doc.rect(startX, currY, width, headerHeight, 'F');
  doc.line(startX, currY + headerHeight, endX, currY + headerHeight);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  if (isGstApplicable && isIntraState) {
    doc.text('Sr.', (cols[0] + cols[1]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Description of Goods / Job Work', cols[1] + 2, currY + 4.8);
    doc.text('HSN/SAC', (cols[2] + cols[3]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Qty', (cols[3] + cols[4]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Unit', (cols[4] + cols[5]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Rate (Rs.)', cols[6] - 2, currY + 4.8, { align: 'right' });
    doc.text('Taxable Amt', cols[7] - 2, currY + 4.8, { align: 'right' });
    doc.text('CGST', cols[8] - 2, currY + 3.4, { align: 'right' });
    doc.setFontSize(5.5);
    doc.text('Rate / Amt', cols[8] - 2, currY + 6.2, { align: 'right' });
    doc.setFontSize(6.5);
    doc.text('SGST', cols[9] - 2, currY + 3.4, { align: 'right' });
    doc.setFontSize(5.5);
    doc.text('Rate / Amt', cols[9] - 2, currY + 6.2, { align: 'right' });
    doc.setFontSize(6.5);
    doc.text('Total (Rs.)', cols[10] - 2, currY + 4.8, { align: 'right' });
  } else if (isGstApplicable && !isIntraState) {
    doc.text('Sr.', (cols[0] + cols[1]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Description of Goods / Job Work', cols[1] + 2, currY + 4.8);
    doc.text('HSN/SAC', (cols[2] + cols[3]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Qty', (cols[3] + cols[4]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Unit', (cols[4] + cols[5]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Rate (Rs.)', cols[6] - 2, currY + 4.8, { align: 'right' });
    doc.text('Taxable Amt', cols[7] - 2, currY + 4.8, { align: 'right' });
    doc.text('IGST', cols[8] - 2, currY + 3.4, { align: 'right' });
    doc.setFontSize(5.5);
    doc.text('Rate / Amt', cols[8] - 2, currY + 6.2, { align: 'right' });
    doc.setFontSize(6.5);
    doc.text('Total (Rs.)', cols[9] - 2, currY + 4.8, { align: 'right' });
  } else {
    doc.text('Sr.', (cols[0] + cols[1]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Description of Goods / Job Work', cols[1] + 2, currY + 4.8);
    doc.text('HSN/SAC', (cols[2] + cols[3]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Qty', (cols[3] + cols[4]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Unit', (cols[4] + cols[5]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Rate (Rs.)', cols[6] - 2, currY + 4.8, { align: 'right' });
    doc.text('Taxable Amt', cols[7] - 2, currY + 4.8, { align: 'right' });
    doc.text('GST (0%)', (cols[7] + cols[8]) / 2, currY + 4.8, { align: 'center' });
    doc.text('Total (Rs.)', cols[9] - 2, currY + 4.8, { align: 'right' });
  }

  // ==========================================================
  // 5. Item Rows Rendering with Precise Right Alignment
  // ==========================================================
  currY += headerHeight;
  const rowHeight = 7.5;

  invoice.items.forEach((item, index) => {
    if (currY > tableEndY - rowHeight) return;

    doc.line(startX, currY + rowHeight, endX, currY + rowHeight);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    // Sr.
    doc.text(String(index + 1), (cols[0] + cols[1]) / 2, currY + 5, { align: 'center' });

    // Description
    doc.setFont('helvetica', 'bold');
    const maxDescChars = isIntraState ? 34 : 40;
    const descText = item.description.length > maxDescChars ? `${item.description.substring(0, maxDescChars - 2)}...` : item.description;
    doc.text(descText, cols[1] + 2, currY + 5);

    // HSN
    doc.setFont('helvetica', 'normal');
    doc.text(item.hsn, (cols[2] + cols[3]) / 2, currY + 5, { align: 'center' });

    // Qty
    doc.text(String(item.quantity), (cols[3] + cols[4]) / 2, currY + 5, { align: 'center' });

    // Unit
    doc.text(item.unit, (cols[4] + cols[5]) / 2, currY + 5, { align: 'center' });

    // Rate
    doc.text(formatIndianCurrency(item.rate, false), cols[6] - 2, currY + 5, { align: 'right' });

    // Taxable
    doc.text(formatIndianCurrency(item.taxableAmount, false), cols[7] - 2, currY + 5, { align: 'right' });

    if (isGstApplicable && isIntraState) {
      doc.text(`${item.cgstRate}% / ${formatIndianCurrency(item.cgstAmount, false)}`, cols[8] - 2, currY + 5, { align: 'right' });
      doc.text(`${item.sgstRate}% / ${formatIndianCurrency(item.sgstAmount, false)}`, cols[9] - 2, currY + 5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatIndianCurrency(item.totalAmount, false), cols[10] - 2, currY + 5, { align: 'right' });
    } else if (isGstApplicable && !isIntraState) {
      doc.text(`${item.igstRate}% / ${formatIndianCurrency(item.igstAmount, false)}`, cols[8] - 2, currY + 5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatIndianCurrency(item.totalAmount, false), cols[9] - 2, currY + 5, { align: 'right' });
    } else {
      doc.text('0% (0.00)', (cols[7] + cols[8]) / 2, currY + 5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatIndianCurrency(item.totalAmount, false), cols[9] - 2, currY + 5, { align: 'right' });
    }

    currY += rowHeight;
  });

  // ==========================================================
  // 6. TOTAL Footer Row (with CONTINUOUS Vertical Lines!)
  // ==========================================================
  doc.setFillColor(248, 250, 252);
  doc.rect(startX, tableEndY, width, footerHeight, 'F');
  doc.line(startX, tableEndY, endX, tableEndY);
  doc.line(startX, tableTotalBottom, endX, tableTotalBottom);

  // ALL Vertical Lines run continuously from tableStartY all the way to tableTotalBottom!
  cols.forEach((colX) => {
    if (colX > startX && colX < endX) {
      doc.line(colX, tableStartY, colX, tableTotalBottom);
    }
  });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  // "TOTAL" label inside Description column
  doc.text('TOTAL', cols[2] - 3, tableEndY + 4.8, { align: 'right' });

  // Total Quantity inside Qty column
  doc.text(String(invoice.totalQuantity), (cols[3] + cols[4]) / 2, tableEndY + 4.8, { align: 'center' });

  // Total Taxable Amount inside Taxable column
  doc.text(formatIndianCurrency(invoice.taxableAmount, false), cols[7] - 2, tableEndY + 4.8, { align: 'right' });

  if (isGstApplicable && isIntraState) {
    doc.text(formatIndianCurrency(invoice.cgstTotal, false), cols[8] - 2, tableEndY + 4.8, { align: 'right' });
    doc.text(formatIndianCurrency(invoice.sgstTotal, false), cols[9] - 2, tableEndY + 4.8, { align: 'right' });
    const grandTotalCalc = invoice.taxableAmount + invoice.cgstTotal + invoice.sgstTotal;
    doc.text(formatIndianCurrency(grandTotalCalc, false), cols[10] - 2, tableEndY + 4.8, { align: 'right' });
  } else if (isGstApplicable && !isIntraState) {
    doc.text(formatIndianCurrency(invoice.igstTotal, false), cols[8] - 2, tableEndY + 4.8, { align: 'right' });
    const grandTotalCalc = invoice.taxableAmount + invoice.igstTotal;
    doc.text(formatIndianCurrency(grandTotalCalc, false), cols[9] - 2, tableEndY + 4.8, { align: 'right' });
  } else {
    doc.text('0.00', (cols[7] + cols[8]) / 2, tableEndY + 4.8, { align: 'center' });
    doc.text(formatIndianCurrency(invoice.taxableAmount, false), cols[9] - 2, tableEndY + 4.8, { align: 'right' });
  }

  // ==========================================================
  // 7. Bottom Section: Words & Bank (Left) + Calculations (Right)
  // ==========================================================
  currY = tableTotalBottom;
  const summarySplitX = startX + 114; // 124 mm
  doc.line(summarySplitX, currY, summarySplitX, pageBottom);

  // --- LEFT SIDE: Amount in Words, Bank Details, Terms, Receiver Sign ---
  // Amount in Words Box
  doc.setFillColor(250, 250, 250);
  doc.rect(startX + 2, currY + 2, 110, 13, 'F');
  doc.rect(startX + 2, currY + 2, 110, 13, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('AMOUNT CHARGEABLE (IN WORDS):', startX + 4, currY + 5.5);

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const wordsLines = doc.splitTextToSize(invoice.amountInWords, 104);
  doc.text(wordsLines, startX + 4, currY + 9.5);

  // Bank Details Box
  const bankY = currY + 17;
  doc.rect(startX + 2, bankY, 110, 24, 'S');
  doc.setFillColor(241, 245, 249);
  doc.rect(startX + 2, bankY, 110, 5, 'F');
  doc.line(startX + 2, bankY + 5, startX + 112, bankY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("COMPANY'S BANK DETAILS FOR RTGS / NEFT", startX + 4, bankY + 3.5);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank Name: ${company.bankName}`, startX + 4, bankY + 9);
  doc.text(`Branch: ${company.branch}`, startX + 60, bankY + 9);
  doc.setFont('helvetica', 'bold');
  doc.text(`A/C No: ${company.accountNumber}`, startX + 4, bankY + 13.5);
  doc.text(`IFSC Code: ${company.ifsc}`, startX + 4, bankY + 18);

  // Terms and Conditions
  const termsY = bankY + 26;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & CONDITIONS:', startX + 4, termsY + 3);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const termsList = invoice.terms?.length ? invoice.terms : company.terms;
  termsList.slice(0, 3).forEach((term, i) => {
    doc.text(`${i + 1}. ${term}`, startX + 4, termsY + 6.8 + i * 3.1);
  });

  // Receiver's Signature
  doc.setLineWidth(0.2);
  doc.line(startX + 4, pageBottom - 7, startX + 45, pageBottom - 7);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Receiver's Signature & Seal", startX + 4, pageBottom - 3);

  // --- RIGHT SIDE: Accurate Calculation Totals ---
  // All amounts aligned strictly to rightMarginX (endX - 4 = 196mm)
  const rightMarginX = endX - 4;
  let calcY = currY + 1.5;

  // Subtotal Row
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Taxable Subtotal:', summarySplitX + 3, calcY + 4.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatIndianCurrency(invoice.taxableAmount, false), rightMarginX, calcY + 4.2, { align: 'right' });
  doc.line(summarySplitX, calcY + 6.8, endX, calcY + 6.8);
  calcY += 6.8;

  if (!isGstApplicable) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('GST (Non-Taxable Supply):', summarySplitX + 3, calcY + 4.2);
    doc.text('0.00', rightMarginX, calcY + 4.2, { align: 'right' });
    doc.line(summarySplitX, calcY + 6.8, endX, calcY + 6.8);
    calcY += 6.8;
  } else if (isIntraState) {
    // CGST Row
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Central GST (CGST):', summarySplitX + 3, calcY + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatIndianCurrency(invoice.cgstTotal, false), rightMarginX, calcY + 4.2, { align: 'right' });
    doc.line(summarySplitX, calcY + 6.8, endX, calcY + 6.8);
    calcY += 6.8;

    // SGST Row
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('State GST (SGST):', summarySplitX + 3, calcY + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatIndianCurrency(invoice.sgstTotal, false), rightMarginX, calcY + 4.2, { align: 'right' });
    doc.line(summarySplitX, calcY + 6.8, endX, calcY + 6.8);
    calcY += 6.8;
  } else {
    // IGST Row
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Integrated GST (IGST):', summarySplitX + 3, calcY + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatIndianCurrency(invoice.igstTotal, false), rightMarginX, calcY + 4.2, { align: 'right' });
    doc.line(summarySplitX, calcY + 6.8, endX, calcY + 6.8);
    calcY += 6.8;
  }

  // Round Off Row
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Round Off:', summarySplitX + 3, calcY + 4.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const roundSign = invoice.roundOff > 0 ? '+' : '';
  doc.text(`${roundSign}${formatIndianCurrency(invoice.roundOff, false)}`, rightMarginX, calcY + 4.2, { align: 'right' });
  doc.line(summarySplitX, calcY + 6.8, endX, calcY + 6.8);
  calcY += 6.8;

  // GRAND TOTAL Block
  const grandBoxHeight = 11;
  doc.setFillColor(15, 23, 42);
  doc.rect(summarySplitX, calcY, endX - summarySplitX, grandBoxHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL:', summarySplitX + 3, calcY + 4.8);
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text('(Total Invoice Value)', summarySplitX + 3, calcY + 8.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${formatIndianCurrency(invoice.grandTotal, false)}`, rightMarginX, calcY + 7.2, { align: 'right' });
  calcY += grandBoxHeight + 5;

  // Company Signature Area
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`For ${company.name}`, endX - 4, calcY + 4, { align: 'right' });

  // Signature line and label at bottom
  doc.setLineWidth(0.2);
  doc.line(endX - 48, pageBottom - 8, endX - 4, pageBottom - 8);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Authorised Signatory', endX - 4, pageBottom - 3.5, { align: 'right' });

  return doc;
}
