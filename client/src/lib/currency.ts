// Base currency is PKR. Display conversion for user's chosen format.
const RATES = { PKR: 1, USD: 278, EUR: 300 } as const;

export type CurrencyCode = 'PKR' | 'USD' | 'EUR';

export function pkrToDisplay(amountPkr: number, currency: CurrencyCode): number {
  if (currency === 'PKR') return amountPkr;
  return amountPkr / RATES[currency];
}

export function formatPrice(amountPkr: number, currency: CurrencyCode): string {
  const value = pkrToDisplay(amountPkr, currency);
  if (currency === 'PKR') return `Rs. ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'USD') return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'EUR') return `€ ${value.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `Rs. ${amountPkr.toFixed(2)}`;
}
