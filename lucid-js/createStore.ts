import { createEffect, createSignal } from "./core.ts";

type Listener = () => void;
type SetFn<T> = Partial<T> | ((prev: T) => Partial<T>);

type CreateStoreOptions<T> = {
  name?: string;
  persist?: boolean;
  version?: number;
  migrate?: (from: number, state: T) => T;
};

export function createStore<T extends object>(
  initializer: (set: (fn: SetFn<T>) => void, get: () => T) => T,
  opts: CreateStoreOptions<T> = {},
) {
  const key = opts.name ?? "__app_store__";
  const version = opts.version ?? 1;

  const load = (): T | undefined => {
    if (!opts.persist) return;
    try {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) return;
      const snap = JSON.parse(raw) as { v: number; s: T };
      if (typeof snap?.v === "number" && snap?.s) {
        return opts.migrate && snap.v !== version
          ? opts.migrate(snap.v, snap.s)
          : snap.s;
      }
      // deno-lint-ignore no-empty
    } catch {}
  };

  const [state, setStateSignal] = createSignal<T>(undefined as unknown as T);

  const get = () => state();
  const set = (fn: SetFn<T>) => {
    const partial = typeof fn === "function"
      ? (fn as (p: T) => Partial<T>)(state())
      : fn;
    if (!partial || typeof partial !== "object") return;
    const next = Object.assign({}, state(), partial);
    if (Object.is(next, state())) return;
    setStateSignal(next);
    persist(next);
    for (const l of listeners) l();
  };

  const base = initializer(set, get);
  const snap = load();
  setStateSignal(snap ? Object.assign({}, base, snap) : base);

  let t: ReturnType<typeof globalThis.setTimeout> | null = null;
  function persist(s: T) {
    if (!opts.persist) return;
    if (t) globalThis.clearTimeout(t);
    t = globalThis.setTimeout(() => {
      try {
        globalThis.localStorage?.setItem(
          key,
          JSON.stringify({ v: version, s }),
        );
        // deno-lint-ignore no-empty
      } catch {}
      t = null;
    }, 10);
  }

  if (opts.persist && typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("storage", (e) => {
      const ev = e as StorageEvent;
      if (ev.key !== key || ev.newValue == null) return;
      try {
        const snap = JSON.parse(ev.newValue) as { v: number; s: T };
        if (!snap?.s) return;
        setStateSignal((prev) => Object.assign({}, prev, snap.s));
        // deno-lint-ignore no-empty
      } catch {}
    });
  }

  function select<S>(
    selector: (s: T) => S,
    equality: (a: S, b: S) => boolean = Object.is,
  ) {
    const [sel, setSel] = createSignal<S>(selector(state()));
    createEffect(() => {
      const next = selector(state());
      setSel((prev) => (equality(prev, next) ? prev : next));
    });
    return sel;
  }

  const listeners = new Set<Listener>();
  function subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  }

  return {
    getState: get,
    setState: set,
    select,
    subscribe,
  };
}
