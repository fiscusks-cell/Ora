export const CURRENCIES = [
  { code: 'USD', symbol: '$',    label: '$USD'  },
  { code: 'CAD', symbol: '$CAD', label: '$CAD'  },
  { code: 'AUD', symbol: '$AUD', label: '$AUD'  },
  { code: 'EUR', symbol: '€',    label: '€EUR'  },
  { code: 'JPY', symbol: '¥',    label: '¥JPY'  },
  { code: 'GBP', symbol: '£',    label: '£GBP'  },
  { code: 'CHF', symbol: 'CHF',  label: 'CHF'   },
  { code: 'SGD', symbol: '$SGD', label: '$SGD'  },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

// Currencies with no subunit (no decimal places)
const NO_DECIMAL_CURRENCIES = new Set(['JPY']);

// Currencies that use a custom symbol prefix rather than Intl's default
const CUSTOM_FORMAT: Partial<Record<CurrencyCode, (amount: number) => string>> = {
  CAD: (n) => `$CAD ${formatDecimal(n, 2)}`,
  AUD: (n) => `$AUD ${formatDecimal(n, 2)}`,
  CHF: (n) => `CHF ${formatDecimal(n, 2)}`,
  SGD: (n) => `$SGD ${formatDecimal(n, 2)}`,
};

function formatDecimal(amount: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  const custom = CUSTOM_FORMAT[currency as CurrencyCode];
  if (custom) return custom(amount);

  const decimals = NO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  const locale = currency === 'JPY' ? 'ja-JP' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function roundForCurrency(amount: number, currency: string): number {
  return NO_DECIMAL_CURRENCIES.has(currency) ? Math.round(amount) : parseFloat(amount.toFixed(2));
}
