import { createEffect } from "./core.ts";
import { clearRange, normalizeToNodes } from "./core.ts";
import type { Child } from "./core.ts";

export function Switch<T>(props: { children: Child[]; fallback?: Child }) {
  const start = document.createComment("switch-start");
  const end = document.createComment("switch-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  createEffect(() => {
    clearRange(start, end);

    // Find first matching case
    let matched = false;
    for (const child of props.children) {
      // Assume child is a Match component result
      if (isMatchComponent(child)) {
        const matchNode = child as MatchNode;
        if (matchNode.condition()) {
          const nodes = normalizeToNodes(matchNode.children);
          const f = document.createDocumentFragment();
          for (const n of nodes) f.appendChild(n);
          end.parentNode!.insertBefore(f, end);
          matched = true;
          break;
        }
      }
    }

    // Render fallback if no match
    if (!matched && props.fallback) {
      const nodes = normalizeToNodes(props.fallback);
      const f = document.createDocumentFragment();
      for (const n of nodes) f.appendChild(n);
      end.parentNode!.insertBefore(f, end);
    }
  });

  return frag;
}

type MatchNode = {
  condition: () => boolean;
  children: Child;
  __isMatch: true;
};

function isMatchComponent(child: unknown): child is MatchNode {
  return !!(child as MatchNode)?.__isMatch;
}

export function Match<T>(
  props: { when: () => T | boolean; children: Child },
): MatchNode {
  return {
    condition: () => !!props.when(),
    children: props.children,
    __isMatch: true,
  };
}

// Alternative API more similar to SolidJS
export function createMatcher<T>(value: () => T) {
  return {
    Switch: (props: { children: Child[]; fallback?: Child }) => {
      const start = document.createComment("matcher-switch-start");
      const end = document.createComment("matcher-switch-end");
      const frag = document.createDocumentFragment();
      frag.appendChild(start);
      frag.appendChild(end);

      createEffect(() => {
        const currentValue = value();
        clearRange(start, end);

        // Find matching case
        let matched = false;
        for (const child of props.children) {
          if (isMatcherCase(child)) {
            const caseNode = child as MatcherCase<T>;
            const shouldMatch = typeof caseNode.when === "function"
              ? (caseNode.when as (val: T) => boolean)(currentValue)
              : caseNode.when === currentValue;

            if (shouldMatch) {
              const nodes = normalizeToNodes(caseNode.children);
              const f = document.createDocumentFragment();
              for (const n of nodes) f.appendChild(n);
              end.parentNode!.insertBefore(f, end);
              matched = true;
              break;
            }
          }
        }

        // Render fallback if no match
        if (!matched && props.fallback) {
          const nodes = normalizeToNodes(props.fallback);
          const f = document.createDocumentFragment();
          for (const n of nodes) f.appendChild(n);
          end.parentNode!.insertBefore(f, end);
        }
      });

      return frag;
    },

    Match: (
      props: { when: T | ((val: T) => boolean); children: Child },
    ): MatcherCase<T> => ({
      when: props.when,
      children: props.children,
      __isMatcherCase: true,
    }),
  };
}

type MatcherCase<T> = {
  when: T | ((val: T) => boolean);
  children: Child;
  __isMatcherCase: true;
};

function isMatcherCase<T>(child: unknown): child is MatcherCase<T> {
  return !!(child as MatcherCase<T>)?.__isMatcherCase;
}
