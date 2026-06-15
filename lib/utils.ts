import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatDecimalHours(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export function formatCurrency(amount: number, currency = 'USD'): string {
  const locale = currency === 'JPY' ? 'ja-JP' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function roundForCurrency(amount: number, currency: string): number {
  return currency === 'JPY' ? Math.round(amount) : parseFloat(amount.toFixed(2));
}

