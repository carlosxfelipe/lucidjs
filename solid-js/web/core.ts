import { createMemo } from "../core/index.ts";
export {
  createComponent,
  createRenderEffect as effect,
  createRoot as root,
  getOwner,
  mergeProps,
  sharedConfig,
  untrack,
} from "../core/index.ts";

export const memo = <T>(fn: () => T) => createMemo(() => fn());
