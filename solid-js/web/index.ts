import { ssrElement } from "./server.ts";
import {
  type ComponentProps,
  type JSX,
  splitProps,
  type ValidComponent,
} from "solid-js";

export * from "./server";

export {
  ErrorBoundary,
  For,
  Index,
  Match,
  // This overrides mergeProps from dom-expressions/src/server.js
  mergeProps,
  Show,
  Suspense,
  SuspenseList,
  Switch,
} from "solid-js";

export const isServer: boolean = true;
export const isDev: boolean = false;

export function createDynamic<T extends ValidComponent>(
  component: () => T | undefined,
  props: ComponentProps<T>,
): JSX.Element {
  const comp = component(),
    t = typeof comp;

  if (comp) {
    if (t === "function") return (comp as Function)(props);
    else if (t === "string") {
      return ssrElement(comp as string, props, undefined, true);
    }
  }
}

export type DynamicProps<T extends ValidComponent, P = ComponentProps<T>> =
  & {
    [K in keyof P]: P[K];
  }
  & {
    component: T | undefined;
  };

export function Dynamic<T extends ValidComponent>(
  props: DynamicProps<T>,
): JSX.Element {
  const [, others] = splitProps(props, ["component"]);
  return createDynamic(() => props.component, others as ComponentProps<T>);
}

export function Portal(
  props: { mount?: Node; useShadow?: boolean; children: JSX.Element },
) {
  return "";
}
