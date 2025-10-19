export { $RAW, createStore, unwrap } from "./store.ts";
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
} from "./store.ts";
export * from "./mutable.ts";
export * from "./modifiers.ts";

// dev
import { $NODE, DevHooks, IS_DEV, isWrappable } from "./store.ts";
export const DEV = IS_DEV
  ? ({ $NODE, isWrappable, hooks: DevHooks } as const)
  : undefined;
