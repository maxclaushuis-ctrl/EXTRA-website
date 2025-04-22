// A/B Testing variant constants
export const VARIANT_A = 'a'; // USPs first, then testimonials
export const VARIANT_B = 'b'; // Social proof first, then USPs

// Get stored variant from localStorage
export function getStoredVariant(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('extra_variant');
  }
  return null;
}

// Store variant in localStorage
export function storeVariant(variant: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('extra_variant', variant);
  }
}
