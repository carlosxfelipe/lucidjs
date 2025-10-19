/**
 * SolidJS TypeScript Source - Main Entry Point
 *
 * This file exports all SolidJS functionality from the organized subfolders.
 * Structure based on the original SolidJS source code.
 *
 * Priority: Core > Store > Web (Server and Reactive are already included in Core)
 */

// Core functionality (includes reactive and render systems)
export * from "./core/index.ts";

// Store management (additional functionality)
export { $RAW, createStore, unwrap } from "./store/index.ts";

// Additional store utilities
export { produce, reconcile } from "./store/modifiers.ts";

export type {
  ArrayFilterFn,
  DeepMutable,
  DeepReadonly,
  NotWrappable,
  Part,
  SetStoreFunction,
  SolidStore,
  Store,
  StoreNode,
  StorePathRange,
  StoreSetter,
} from "./store/index.ts";

// Re-export key server functions that don't conflict
export {
  createUniqueId,
  enableHydration,
  resetErrorBoundaries,
} from "./server/index.ts";

// Re-export web-specific functions that don't conflict
export {
  createDynamic,
  Dynamic,
  isDev,
  isServer,
  Portal,
} from "./web/index.ts";

// Export types that might be useful
export type { DynamicProps } from "./web/index.ts";
