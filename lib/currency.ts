export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: '$USD — US Dollar' },
  { code: 'CAD', symbol: '$', label: '$CAD — Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: '$AUD — Australian Dollar' },
  { code: 'EUR', symbol: '€', label: '€EUR — Euro' },
  { code: 'GBP', symbol: '£', label: '£GBP — British Pound' },
  { code: 'JPY', symbol: '¥', label: '¥JPY — Japanese Yen' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  const locale = currency === 'JPY' ? 'ja-JP' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function roundForCurrency(amount: number, currency: string): number {
  return currency === 'JPY' ? Math.round(amount) : parseFloat(amount.toFixed(2));
}
