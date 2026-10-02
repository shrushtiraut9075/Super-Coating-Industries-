import { InvoiceItem } from '../types';
import { round2 } from './formatters';
import { numberToIndianWords } from './numberToWords';

export interface CalculatedItem {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export const CGST_SGST_OPTIONS = [
  { label: '6% (Total GST 12%)', value: 6, totalGst: 12 },
  { label: '9% (Total GST 18%)', value: 9, totalGst: 18 },
  { label: '12% (Total GST 24%)', value: 12, totalGst: 24 },
  { label: '18% (Total GST 36%)', value: 18, totalGst: 36 },
  { label: '2.5% (Total GST 5%)', value: 2.5, totalGst: 5 },
  { label: '0% (Nil / Non-GST)', value: 0, totalGst: 0 },
];

export const PRIMARY_CGST_RATES = [6, 9, 12, 18];
export const PRIMARY_IGST_RATES = [12, 18, 24, 36];

export const IGST_OPTIONS = [
  { label: '12% IGST (6% + 6%)', value: 12 },
  { label: '18% IGST (9% + 9%)', value: 18 },
  { label: '24% IGST (12% + 12%)', value: 24 },
  { label: '36% IGST (18% + 18%)', value: 36 },
  { label: '5% IGST (2.5% + 2.5%)', value: 5 },
  { label: '0% IGST (Non-GST / Nil)', value: 0 },
];

/**
 * Calculates tax values for an item based on supplier and customer state codes and GST toggle
 */
export function calculateItemTaxes(
  quantity: number,
  rate: number,
  gstRate: number,
  companyStateCode: string,
  customerStateCode: string,
  customTaxRates?: { cgstRate?: number; sgstRate?: number; igstRate?: number },
  isGstApplicable: boolean = true
): CalculatedItem {
  const taxableAmount = round2((quantity || 0) * (rate || 0));

  if (!isGstApplicable) {
    return {
      taxableAmount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalAmount: taxableAmount,
    };
  }

  const cleanCompanyCode = (companyStateCode || '27').trim();
  const cleanCustomerCode = (customerStateCode || '27').trim();
  const isIntraState = cleanCompanyCode === cleanCustomerCode;

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isIntraState) {
    cgstRate = customTaxRates?.cgstRate !== undefined ? customTaxRates.cgstRate : round2(gstRate / 2);
    sgstRate = customTaxRates?.sgstRate !== undefined ? customTaxRates.sgstRate : round2(gstRate / 2);
    igstRate = 0;

    cgstAmount = round2(taxableAmount * (cgstRate / 100));
    sgstAmount = round2(taxableAmount * (sgstRate / 100));
    igstAmount = 0;
  } else {
    cgstRate = 0;
    sgstRate = 0;
    igstRate = customTaxRates?.igstRate !== undefined ? customTaxRates.igstRate : gstRate;

    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = round2(taxableAmount * (igstRate / 100));
  }

  const totalAmount = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount);

  return {
    taxableAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalAmount,
  };
}

export interface InvoiceTotals {
  totalQuantity: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

/**
 * Calculates aggregate totals for an invoice
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  customRoundOff?: number | null
): InvoiceTotals {
  let totalQuantity = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  items.forEach((item) => {
    totalQuantity += Number(item.quantity) || 0;
    taxableAmount += Number(item.taxableAmount) || 0;
    cgstTotal += Number(item.cgstAmount) || 0;
    sgstTotal += Number(item.sgstAmount) || 0;
    igstTotal += Number(item.igstAmount) || 0;
  });

  totalQuantity = round2(totalQuantity);
  taxableAmount = round2(taxableAmount);
  cgstTotal = round2(cgstTotal);
  sgstTotal = round2(sgstTotal);
  igstTotal = round2(igstTotal);
  const totalTax = round2(cgstTotal + sgstTotal + igstTotal);

  const exactGrand = round2(taxableAmount + totalTax);

  let roundOff = 0;
  let grandTotal = exactGrand;

  if (customRoundOff !== undefined && customRoundOff !== null) {
    roundOff = round2(customRoundOff);
    grandTotal = round2(exactGrand + roundOff);
  } else {
    // Auto round-off to nearest integer rupee
    const roundedInt = Math.round(exactGrand);
    roundOff = round2(roundedInt - exactGrand);
    grandTotal = round2(exactGrand + roundOff);
  }

  const amountInWords = numberToIndianWords(grandTotal);

  return {
    totalQuantity,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    totalTax,
    roundOff,
    grandTotal,
    amountInWords,
  };
}
