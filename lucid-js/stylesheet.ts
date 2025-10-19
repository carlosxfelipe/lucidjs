export type Style = JSX.StyleObject;
export type Styles = Record<string, Style>;

function freezeDeep<T extends object>(obj: T): T {
  if (typeof obj !== "object" || obj === null) return obj;
  Object.freeze(obj);
  for (const k of Object.keys(obj)) {
    const v = (obj as Record<string, unknown>)[k];
    if (v && typeof v === "object" && !Object.isFrozen(v)) {
      freezeDeep(v);
    }
  }
  return obj;
}

export const StyleSheet = {
  create<T extends Styles>(styles: T): T {
    if (typeof Deno === "undefined" || Deno.env?.get("MODE") !== "production") {
      return freezeDeep({ ...styles });
    }
    return styles;
  },

  compose(a?: Style | null, b?: Style | null): Style | undefined {
    if (!a && !b) return undefined;
    if (!a) return b || undefined;
    if (!b) return a || undefined;
    return { ...a, ...b };
  },

  merge(...parts: Array<Style | null | undefined | false>): Style | undefined {
    const out: Style = {};
    let has = false;
    for (const p of parts) {
      if (!p) continue;
      Object.assign(out, p);
      has = true;
    }
    return has ? out : undefined;
  },

  cssVar(name: `--${string}`, value: string | number): Style {
    return { [name]: value } as Style;
  },
};
