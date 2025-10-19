//@ts-nocheck
import { createMemo } from "solid-js";
export {
  createComponent,
  createRenderEffect as effect,
  createRoot as root,
  getOwner,
  mergeProps,
  sharedConfig,
  untrack,
} from "solid-js";

export const memo = (fn) => createMemo(() => fn());
