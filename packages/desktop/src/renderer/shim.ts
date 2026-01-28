/**
 * Polyfills for browser environment
 * Must be imported before any other modules
 */

import { Buffer } from 'buffer';

// Set Buffer globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

// Export for explicit usage
export { Buffer };
