import {
  type ComponentProps,
  type JSX,
  splitProps,
  type ValidComponent,
} from "../core/index.ts";

export * from "./server.ts";

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
} from "../render/index.ts";

export const isServer: boolean = true;

export function createDynamic<T extends ValidComponent>(
  component: () => T | undefined,
  props: ComponentProps<T>,
): JSX.Element {
  const comp = component(),
    t = typeof comp;

  if (comp) {
    if (t === "function") {
      return (comp as (props: ComponentProps<T>) => JSX.Element)(props);
    } else if (t === "string") {
      // For server-side rendering of string components
      return comp as JSX.Element;
    }
  }
  return null as unknown as JSX.Element;
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
  _props: { mount?: Node; useShadow?: boolean; children: JSX.Element },
) {
  return "";
}
