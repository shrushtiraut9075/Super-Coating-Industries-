/**
 * Convert numbers into Indian Currency words (Lakhs, Crores, Thousands)
 * Example: 22061 -> "Twenty Two Thousand Sixty One Rupees Only"
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ones[num];
  if (num < 100) {
    const unit = num % 10;
    return tens[Math.floor(num / 10)] + (unit !== 0 ? ' ' + ones[unit] : '');
  }
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  return ones[hundred] + ' Hundred' + (remainder !== 0 ? ' and ' + convertLessThanThousand(remainder) : '');
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Zero Rupees Only';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  let words = '';

  const crore = Math.floor(integerPart / 10000000);
  const remainderAfterCrore = integerPart % 10000000;

  const lakh = Math.floor(remainderAfterCrore / 100000);
  const remainderAfterLakh = remainderAfterCrore % 100000;

  const thousand = Math.floor(remainderAfterLakh / 1000);
  const remainderAfterThousand = remainderAfterLakh % 1000;

  const remainder = remainderAfterThousand;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }

  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }

  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }

  if (remainder > 0) {
    words += convertLessThanThousand(remainder) + ' ';
  }

  words = words.trim();

  let result = words ? words + ' Rupees' : 'Zero Rupees';

  if (decimalPart > 0) {
    const paiseWords = convertLessThanThousand(decimalPart);
    result += ' and ' + paiseWords + ' Paise';
  }

  result += ' Only';

  if (isNegative) {
    result = 'Minus ' + result;
  }

  // Clean double spaces
  return result.replace(/\s+/g, ' ');
}
