import { createEffect } from "./core.ts";
import { clearRange, normalizeToNodes } from "./core.ts";
import type { Child } from "./core.ts";

export function Show(props: { when: () => unknown; children: Child }) {
  const start = document.createComment("show-start");
  const end = document.createComment("show-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);
  let prev = false;
  createEffect(() => {
    const next = !!props.when();
    if (next === prev) return;
    prev = next;
    clearRange(start, end);
    if (next) {
      const nodes = normalizeToNodes(props.children);
      const f = document.createDocumentFragment();
      for (const n of nodes) f.appendChild(n);
      end.parentNode!.insertBefore(f, end);
    }
  });
  return frag;
}

type Key = string | number;
type Renderer<T> = (item: T, index: () => number) => Child;

function isAfterCursor(cursor: Node, start: Comment): boolean {
  return start.previousSibling === cursor;
}

function moveRangeAfter(cursor: Node, start: Comment, end: Comment): void {
  if (isAfterCursor(cursor, start)) return;
  const parent = cursor.parentNode!;
  const range = document.createRange();
  range.setStartBefore(start);
  range.setEndAfter(end);
  const frag = range.extractContents();
  const after = cursor.nextSibling;
  if (after) parent.insertBefore(frag, after);
  else parent.appendChild(frag);
}

export function For<T>(props: {
  each: () => T[];
  key?: (item: T) => Key;
  children?: Renderer<T> | unknown[];
}) {
  const start = document.createComment("for-start");
  const end = document.createComment("for-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  function getRenderer(): Renderer<T> | undefined {
    const c = props.children as unknown;
    if (typeof c === "function") return c as Renderer<T>;
    if (Array.isArray(c) && typeof c[0] === "function") {
      return c[0] as Renderer<T>;
    }
    return undefined;
  }

  const blocks = new Map<
    Key,
    { start: Comment; end: Comment; index: () => number }
  >();
  let prevList: T[] | undefined;
  const idxMap = new Map<Key, number>();

  createEffect(() => {
    const render = getRenderer();
    if (!render) return;

    const list = props.each();
    const kf = props.key;

    if (!kf) {
      const same = prevList &&
        prevList.length === list.length &&
        list.every((it, i) => it === (prevList as T[])[i]);
      if (same) return;
      clearRange(start, end);
      const f = document.createDocumentFragment();
      list.forEach((item, i) => {
        const nodes = normalizeToNodes(render(item, () => i));
        for (const n of nodes) f.appendChild(n);
      });
      end.parentNode!.insertBefore(f, end);
      prevList = list.slice();
      return;
    }

    const nextOrder: Key[] = [];
    for (let i = 0; i < list.length; i++) nextOrder.push(kf(list[i]));
    idxMap.clear();
    nextOrder.forEach((k, i) => idxMap.set(k, i));

    let cursor: Node = start;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const k = nextOrder[i];
      let blk = blocks.get(k);

      if (!blk) {
        const s = document.createComment(`for-item-start:${String(k)}`);
        const e = document.createComment(`for-item-end:${String(k)}`);
        const indexGetter = (): number => idxMap.get(k) ?? 0;

        const f = document.createDocumentFragment();
        f.appendChild(s);
        const nodes = normalizeToNodes(render(item, indexGetter));
        for (const n of nodes) f.appendChild(n);
        f.appendChild(e);

        const after = cursor.nextSibling;
        if (after) start.parentNode!.insertBefore(f, after);
        else start.parentNode!.appendChild(f);

        blk = { start: s, end: e, index: indexGetter };
        blocks.set(k, blk);
      } else {
        moveRangeAfter(cursor, blk.start, blk.end);
      }

      cursor = blk.end;
    }

    const toRemove = new Set(blocks.keys());
    nextOrder.forEach((k) => toRemove.delete(k));
    toRemove.forEach((k) => {
      const blk = blocks.get(k)!;
      clearRange(blk.start, blk.end);
      blk.start.parentNode?.removeChild(blk.start);
      blk.end.parentNode?.removeChild(blk.end);
      blocks.delete(k);
    });
  });

  return frag;
}
