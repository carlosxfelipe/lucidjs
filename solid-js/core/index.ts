export {
  $DEVCOMP,
  $PROXY,
  $TRACK,
  batch,
  catchError,
  children,
  createComputed,
  createContext,
  createDeferred,
  createEffect,
  createMemo,
  createReaction,
  createRenderEffect,
  createResource,
  createRoot,
  createSelector,
  createSignal,
  enableExternalSource,
  enableScheduling,
  equalFn,
  getListener,
  getOwner,
  on,
  onCleanup,
  onError,
  onMount,
  runWithOwner,
  startTransition,
  untrack,
  useContext,
  useTransition,
} from "../reactive/signal.ts";
export type {
  Accessor,
  AccessorArray,
  ChildrenReturn,
  Context,
  ContextProviderComponent,
  EffectFunction,
  EffectOptions,
  InitializedResource,
  InitializedResourceOptions,
  InitializedResourceReturn,
  MemoOptions,
  NoInfer,
  OnEffectFunction,
  OnOptions,
  Owner,
  ResolvedChildren,
  ResolvedJSXElement,
  Resource,
  ResourceActions,
  ResourceFetcher,
  ResourceFetcherInfo,
  ResourceOptions,
  ResourceReturn,
  ResourceSource,
  ReturnTypes,
  Setter,
  Signal,
  SignalOptions,
  Transition,
} from "../reactive/signal.ts";

export * from "../reactive/observable.ts";
export * from "../reactive/scheduler.ts";
export * from "../reactive/array.ts";
export * from "../render/index.ts";

import type { JSX } from "../web/jsx.ts";
type JSXElement = JSX.Element;
export type { JSX, JSXElement };

// dev
import { DevHooks, registerGraph, writeSignal } from "../reactive/signal.ts";
import { IS_DEV } from "../constants.ts";

export const DEV = IS_DEV
  ? ({ hooks: DevHooks, writeSignal, registerGraph } as const)
  : undefined;

// handle multiple instance check
declare global {
  var Solid$$: boolean;
}

if (IS_DEV && globalThis) {
  if (!globalThis.Solid$$) globalThis.Solid$$ = true;
  else {
    console.warn(
      "You appear to have multiple instances of Solid. This can lead to unexpected behavior.",
    );
  }
}
