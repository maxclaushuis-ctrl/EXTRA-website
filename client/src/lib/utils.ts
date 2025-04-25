import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { debounce as _debounce } from 'lodash';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Constanten
export const POINTS_TO_EURO_RATIO = 20; // 20 punten = 1 euro

/**
 * Berekent de euro waarde van een bepaald aantal punten
 */
export function pointsToEuro(points: number): number {
  return points / POINTS_TO_EURO_RATIO;
}

/**
 * Berekent het aantal punten voor een bepaald bedrag in euro
 */
export function euroToPoints(euro: number): number {
  return euro * POINTS_TO_EURO_RATIO;
}

/**
 * Formatteert een bedrag in euro naar een string met 2 decimalen en een euroteken
 */
export function formatEuro(amount: number): string {
  return `€${amount.toFixed(2).replace('.', ',')}`;
}

/**
 * Formatteert een datum naar een Nederlandse datumstring
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatteert een getal naar een string met duizendtallen-scheiding
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Debounce functie die een functie aanroep vertraagt totdat een bepaalde tijd is verstreken
 * @param fn De functie die gedebounced moet worden
 * @param ms De vertraging in milliseconden
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  return _debounce(fn, ms);
}