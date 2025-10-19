/**
 * Global constants for SolidJS
 * These replace development-time variables with production values
 */

// Development mode - always false in production
export const IS_DEV = false;

// Debug hooks for devtools - disabled in production
export const DevHooks: {
  onStoreNodeUpdate: ((...args: unknown[]) => void) | null;
} = {
  onStoreNodeUpdate: null,
};

// DEV object with methods that do nothing in production
export const DEV = IS_DEV ? null : {
  registerGraph: (..._args: unknown[]) => {},
};
