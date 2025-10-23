let CURRENT = null;
let BATCH = 0;
const PENDING = new Set();
const DISPOSE = Symbol("d");
function isRefObject(x) {
    return !!x && typeof x === "object" && "current" in x;
}
function isInnerHTML(x) {
    return !!x && typeof x === "object" && "__html" in x;
}
function runComputation(c) {
    for (const d of c.deps)d.subs.delete(c);
    c.deps.clear();
    const prev = CURRENT;
    CURRENT = c;
    try {
        c.fn();
    } finally{
        CURRENT = prev;
    }
}
function flush() {
    if (BATCH) return;
    const queue = [
        ...PENDING
    ];
    PENDING.clear();
    for (const c of queue)runComputation(c);
}
function batch(f) {
    BATCH++;
    try {
        return f();
    } finally{
        BATCH--;
        flush();
    }
}
function createSignal(initial, options) {
    const equals = options?.equals ?? Object.is;
    const s = {
        value: initial,
        subs: new Set(),
        get () {
            if (CURRENT) {
                s.subs.add(CURRENT);
                CURRENT.deps.add(s);
            }
            return s.value;
        },
        set (next) {
            const v = typeof next === "function" ? next(s.value) : next;
            if (equals(s.value, v)) return;
            s.value = v;
            for (const sub of s.subs)PENDING.add(sub);
            flush();
        }
    };
    return [
        ()=>s.get(),
        (v)=>s.set(v)
    ];
}
function createStorageSignal(key, initial, opts) {
    const serialize = opts?.serialize ?? JSON.stringify;
    const deserialize = opts?.deserialize ?? ((s)=>JSON.parse(s));
    let value = initial;
    try {
        const stored = localStorage.getItem(key);
        if (stored !== null) value = deserialize(stored);
    } catch  {}
    const [get, set] = createSignal(value);
    return [
        get,
        (v)=>{
            set(v);
            try {
                localStorage.setItem(key, serialize(get()));
            } catch  {}
        }
    ];
}
function createMemo(calc) {
    const [get, set] = createSignal(undefined);
    createEffect(()=>set(calc()));
    return get;
}
function createEffect(fn) {
    const c = {
        fn,
        deps: new Set(),
        cleanups: [],
        parent: CURRENT
    };
    runComputation(c);
}
function onCleanup(cb) {
    if (!CURRENT) throw new Error("onCleanup called outside of a computation");
    CURRENT.cleanups.push(cb);
}
function onMount(fn) {
    createEffect(()=>{
        const cleanup = fn();
        if (cleanup && typeof cleanup === "function") {
            onCleanup(cleanup);
        }
    });
}
function createRoot(fn) {
    const root = {
        fn: ()=>{},
        deps: new Set(),
        cleanups: [],
        parent: null
    };
    const prev = CURRENT;
    CURRENT = root;
    try {
        return fn(()=>{
            for (const cl of root.cleanups.splice(0)){
                try {
                    cl();
                } catch  {}
            }
            for (const d of root.deps)d.subs.clear();
            root.deps.clear();
        });
    } finally{
        CURRENT = prev;
    }
}
const CONTEXT_VALUES = new Map();
function createContext(defaultValue) {
    const id = Symbol("context");
    const Provider = (props)=>{
        const fragment = document.createDocumentFragment();
        const prevValue = CONTEXT_VALUES.get(id);
        CONTEXT_VALUES.set(id, props.value);
        for (const child of props.children){
            const nodes = normalizeToNodes(child);
            for (const node of nodes){
                fragment.appendChild(node);
            }
        }
        onCleanup(()=>{
            if (prevValue !== undefined) {
                CONTEXT_VALUES.set(id, prevValue);
            } else {
                CONTEXT_VALUES.delete(id);
            }
        });
        return fragment;
    };
    return {
        id,
        defaultValue,
        Provider
    };
}
function useContext(context) {
    const value = CONTEXT_VALUES.get(context.id);
    return value !== undefined ? value : context.defaultValue;
}
function isSignalGetter(x) {
    return typeof x === "function" && x.length === 0;
}
const CAMEL_TO_KEBAB = /[A-Z]/g;
function camelToKebab(k) {
    return k.startsWith("--") ? k : k.replace(CAMEL_TO_KEBAB, (m)=>"-" + m.toLowerCase());
}
function normalizeStyle(input) {
    if (!input) return {};
    if (typeof input === "string") {
        const out = {};
        for (const decl of input.split(";")){
            const i = decl.indexOf(":");
            if (i === -1) continue;
            const key = decl.slice(0, i).trim();
            const val = decl.slice(i + 1).trim();
            if (key) out[key] = val;
        }
        return out;
    }
    const out = {};
    for(const k in input){
        const v = input[k];
        out[camelToKebab(k)] = v == null ? "" : typeof v === "number" ? String(v) : String(v);
    }
    return out;
}
const PREV_STYLES = new WeakMap();
const DYN_STYLE_KEYS = new WeakMap();
function applyStyle(el, next) {
    const prev = PREV_STYLES.get(el) || {};
    const dyn = DYN_STYLE_KEYS.get(el) || new Set();
    for(const k in prev){
        if (!(k in next) && !dyn.has(k)) el.style.removeProperty(k);
    }
    for(const k in next){
        const nv = next[k] ?? "";
        if (prev[k] !== nv) el.style.setProperty(k, String(nv));
    }
    PREV_STYLES.set(el, next);
}
function setAttr(el, name, value) {
    if (name === "className") name = "class";
    if (name === "dangerouslySetInnerHTML" && isInnerHTML(value)) {
        const html = value.__html;
        el.innerHTML = html == null ? "" : String(html);
        return;
    }
    if (name === "ref") {
        const r = value;
        if (typeof r === "function") {
            r(el);
            onCleanup(()=>r(null));
        } else if (isRefObject(r)) {
            r.current = el;
            onCleanup(()=>{
                r.current = null;
            });
        }
        return;
    }
    if (name === "style") {
        const elh = el;
        if (isSignalGetter(value)) {
            createEffect(()=>{
                const v = value();
                applyStyle(elh, normalizeStyle(v));
            });
            return;
        }
        if (typeof value === "string") {
            applyStyle(elh, normalizeStyle(value));
            return;
        }
        if (typeof value === "object" && value !== null) {
            const obj = value;
            const dyn = DYN_STYLE_KEYS.get(elh) || new Set();
            DYN_STYLE_KEYS.set(elh, dyn);
            const staticObj = {};
            for(const k in obj){
                const v = obj[k];
                if (isSignalGetter(v)) {
                    const name = camelToKebab(k);
                    dyn.add(name);
                    createEffect(()=>{
                        const nv = v();
                        if (nv == null) elh.style.removeProperty(name);
                        else elh.style.setProperty(name, String(nv));
                    });
                } else {
                    staticObj[k] = v;
                }
            }
            applyStyle(elh, normalizeStyle(staticObj));
            return;
        }
    }
    if (/^on[A-Z]/.test(name) && typeof value === "function") {
        const ev = name.slice(2).toLowerCase();
        const handler = value;
        el.addEventListener(ev, handler);
        onCleanup(()=>el.removeEventListener(ev, handler));
        return;
    }
    if (name === "value") {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
            if (isSignalGetter(value)) {
                createEffect(()=>{
                    const v = value();
                    el.value = v == null ? "" : String(v);
                });
            } else {
                el.value = value == null ? "" : String(value);
            }
            return;
        }
    }
    if (name === "checked" && el instanceof HTMLInputElement) {
        if (isSignalGetter(value)) {
            createEffect(()=>{
                el.checked = Boolean(value());
            });
        } else {
            el.checked = Boolean(value);
        }
        return;
    }
    if (typeof value === "boolean") {
        if (value) el.setAttribute(name, "");
        else el.removeAttribute(name);
        return;
    }
    if (isSignalGetter(value)) {
        createEffect(()=>{
            const v = value();
            if (v == null || v === false) el.removeAttribute(name);
            else el.setAttribute(name, v === true ? "" : String(v));
        });
    } else {
        if (value == null || value === false) el.removeAttribute(name);
        else el.setAttribute(name, value === true ? "" : String(value));
    }
}
function normalizeToNodes(value) {
    if (value == null || value === false || value === true) return [];
    if (value instanceof Node) return [
        value
    ];
    if (Array.isArray(value)) {
        const out = [];
        for (const v of value.flat()){
            out.push(...normalizeToNodes(v));
        }
        return out;
    }
    return [
        document.createTextNode(String(value))
    ];
}
function disposeNode(n) {
    const d = n[DISPOSE];
    if (d) {
        try {
            d();
        } catch  {}
    }
}
function clearRange(start, end) {
    let n = start.nextSibling;
    while(n && n !== end){
        const next = n.nextSibling;
        disposeNode(n);
        n.parentNode?.removeChild(n);
        n = next;
    }
}
function insertNodesAfter(ref, nodes) {
    let cursor = ref;
    for (const n of nodes){
        if (cursor.nextSibling) ref.parentNode.insertBefore(n, cursor.nextSibling);
        else ref.parentNode.appendChild(n);
        cursor = n;
    }
}
function appendDynamic(parent, getter) {
    const start = document.createComment("");
    const end = document.createComment("");
    parent.appendChild(start);
    parent.appendChild(end);
    createEffect(()=>{
        const v = getter();
        const nodes = normalizeToNodes(v);
        clearRange(start, end);
        insertNodesAfter(start, nodes);
    });
}
function appendStatic(parent, child) {
    if (child == null || child === false || child === true) return;
    if (Array.isArray(child)) {
        for (const c of child){
            appendStatic(parent, c);
        }
        return;
    }
    if (child instanceof Node) {
        parent.appendChild(child);
    } else {
        parent.appendChild(document.createTextNode(String(child)));
    }
}
const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set([
    "svg",
    "path",
    "g",
    "defs",
    "clipPath",
    "mask",
    "pattern",
    "linearGradient",
    "radialGradient",
    "stop",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "rect",
    "use",
    "symbol",
    "marker",
    "text",
    "tspan",
    "textPath",
    "foreignObject",
    "filter",
    "feGaussianBlur",
    "feOffset",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "title",
    "desc"
]);
function h(tag, props, ...children) {
    if (typeof tag === "function") {
        let dispose = ()=>{};
        const node = createRoot((d)=>{
            dispose = d;
            return tag({
                ...props || {},
                children
            });
        });
        node[DISPOSE] = dispose;
        return node;
    }
    const isSvg = SVG_TAGS.has(tag);
    const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    if (props) {
        for (const [k, v] of Object.entries(props))setAttr(el, k, v);
    }
    for (const c of children.flat()){
        if (isSignalGetter(c)) appendDynamic(el, c);
        else appendStatic(el, c);
    }
    return el;
}
function Fragment(props = {}, ...kids) {
    const list = props.children ?? kids;
    const f = document.createDocumentFragment();
    for (const k of (list ?? []).flat()){
        if (isSignalGetter(k)) appendDynamic(f, k);
        else appendStatic(f, k);
    }
    return f;
}
function mount(node, container) {
    container.textContent = "";
    container.appendChild(node);
}
export { batch as batch };
export { createSignal as createSignal };
export { createStorageSignal as createStorageSignal };
export { createMemo as createMemo };
export { createEffect as createEffect };
export { onCleanup as onCleanup };
export { onMount as onMount };
export { createRoot as createRoot };
export { createContext as createContext };
export { useContext as useContext };
export { normalizeToNodes as normalizeToNodes };
export { clearRange as clearRange };
export { insertNodesAfter as insertNodesAfter };
export { h as h };
export { Fragment as Fragment };
export { mount as mount };
function Show(props) {
    const start = document.createComment("show-start");
    const end = document.createComment("show-end");
    const frag = document.createDocumentFragment();
    frag.appendChild(start);
    frag.appendChild(end);
    let prev = false;
    createEffect(()=>{
        const next = !!props.when();
        if (next === prev) return;
        prev = next;
        clearRange(start, end);
        if (next) {
            const nodes = normalizeToNodes(props.children);
            const f = document.createDocumentFragment();
            for (const n of nodes)f.appendChild(n);
            end.parentNode.insertBefore(f, end);
        }
    });
    return frag;
}
function isAfterCursor(cursor, start) {
    return start.previousSibling === cursor;
}
function moveRangeAfter(cursor, start, end) {
    if (isAfterCursor(cursor, start)) return;
    const parent = cursor.parentNode;
    const range = document.createRange();
    range.setStartBefore(start);
    range.setEndAfter(end);
    const frag = range.extractContents();
    const after = cursor.nextSibling;
    if (after) parent.insertBefore(frag, after);
    else parent.appendChild(frag);
}
function For(props) {
    const start = document.createComment("for-start");
    const end = document.createComment("for-end");
    const frag = document.createDocumentFragment();
    frag.appendChild(start);
    frag.appendChild(end);
    function getRenderer() {
        const c = props.children;
        if (typeof c === "function") return c;
        if (Array.isArray(c) && typeof c[0] === "function") {
            return c[0];
        }
        return undefined;
    }
    const blocks = new Map();
    let prevList;
    const idxMap = new Map();
    createEffect(()=>{
        const render = getRenderer();
        if (!render) return;
        const list = props.each();
        const kf = props.key;
        if (!kf) {
            const same = prevList && prevList.length === list.length && list.every((it, i)=>it === prevList[i]);
            if (same) return;
            clearRange(start, end);
            const f = document.createDocumentFragment();
            list.forEach((item, i)=>{
                const nodes = normalizeToNodes(render(item, ()=>i));
                for (const n of nodes)f.appendChild(n);
            });
            end.parentNode.insertBefore(f, end);
            prevList = list.slice();
            return;
        }
        const nextOrder = [];
        for(let i = 0; i < list.length; i++)nextOrder.push(kf(list[i]));
        idxMap.clear();
        nextOrder.forEach((k, i)=>idxMap.set(k, i));
        let cursor = start;
        for(let i = 0; i < list.length; i++){
            const item = list[i];
            const k = nextOrder[i];
            let blk = blocks.get(k);
            if (!blk) {
                const s = document.createComment(`for-item-start:${String(k)}`);
                const e = document.createComment(`for-item-end:${String(k)}`);
                const indexGetter = ()=>idxMap.get(k) ?? 0;
                const f = document.createDocumentFragment();
                f.appendChild(s);
                const nodes = normalizeToNodes(render(item, indexGetter));
                for (const n of nodes)f.appendChild(n);
                f.appendChild(e);
                const after = cursor.nextSibling;
                if (after) start.parentNode.insertBefore(f, after);
                else start.parentNode.appendChild(f);
                blk = {
                    start: s,
                    end: e,
                    index: indexGetter
                };
                blocks.set(k, blk);
            } else {
                moveRangeAfter(cursor, blk.start, blk.end);
            }
            cursor = blk.end;
        }
        const toRemove = new Set(blocks.keys());
        nextOrder.forEach((k)=>toRemove.delete(k));
        toRemove.forEach((k)=>{
            const blk = blocks.get(k);
            clearRange(blk.start, blk.end);
            blk.start.parentNode?.removeChild(blk.start);
            blk.end.parentNode?.removeChild(blk.end);
            blocks.delete(k);
        });
    });
    return frag;
}
export { Show as Show };
export { For as For };
function freezeDeep(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    Object.freeze(obj);
    for (const k of Object.keys(obj)){
        const v = obj[k];
        if (v && typeof v === "object" && !Object.isFrozen(v)) {
            freezeDeep(v);
        }
    }
    return obj;
}
const StyleSheet = {
    create (styles) {
        if (typeof Deno === "undefined" || Deno.env?.get("MODE") !== "production") {
            return freezeDeep({
                ...styles
            });
        }
        return styles;
    },
    compose (a, b) {
        if (!a && !b) return undefined;
        if (!a) return b || undefined;
        if (!b) return a || undefined;
        return {
            ...a,
            ...b
        };
    },
    merge (...parts) {
        const out = {};
        let has = false;
        for (const p of parts){
            if (!p) continue;
            Object.assign(out, p);
            has = true;
        }
        return has ? out : undefined;
    },
    cssVar (name, value) {
        return {
            [name]: value
        };
    }
};
export { StyleSheet as StyleSheet };
function createStore(initializer, opts = {}) {
    const key = opts.name ?? "__app_store__";
    const version = opts.version ?? 1;
    const load = ()=>{
        if (!opts.persist) return;
        try {
            const raw = globalThis.localStorage?.getItem(key);
            if (!raw) return;
            const snap = JSON.parse(raw);
            if (typeof snap?.v === "number" && snap?.s) {
                return opts.migrate && snap.v !== version ? opts.migrate(snap.v, snap.s) : snap.s;
            }
        } catch  {}
    };
    const [state, setStateSignal] = createSignal(undefined);
    const get = ()=>state();
    const set = (fn)=>{
        const partial = typeof fn === "function" ? fn(state()) : fn;
        if (!partial || typeof partial !== "object") return;
        const next = Object.assign({}, state(), partial);
        if (Object.is(next, state())) return;
        setStateSignal(next);
        persist(next);
        for (const l of listeners)l();
    };
    const base = initializer(set, get);
    const snap = load();
    setStateSignal(snap ? Object.assign({}, base, snap) : base);
    let t = null;
    function persist(s) {
        if (!opts.persist) return;
        if (t) globalThis.clearTimeout(t);
        t = globalThis.setTimeout(()=>{
            try {
                globalThis.localStorage?.setItem(key, JSON.stringify({
                    v: version,
                    s
                }));
            } catch  {}
            t = null;
        }, 10);
    }
    if (opts.persist && typeof globalThis.addEventListener === "function") {
        globalThis.addEventListener("storage", (e)=>{
            const ev = e;
            if (ev.key !== key || ev.newValue == null) return;
            try {
                const snap = JSON.parse(ev.newValue);
                if (!snap?.s) return;
                setStateSignal((prev)=>Object.assign({}, prev, snap.s));
            } catch  {}
        });
    }
    function select(selector, equality = Object.is) {
        const [sel, setSel] = createSignal(selector(state()));
        createEffect(()=>{
            const next = selector(state());
            setSel((prev)=>equality(prev, next) ? prev : next);
        });
        return sel;
    }
    const listeners = new Set();
    function subscribe(l) {
        listeners.add(l);
        return ()=>listeners.delete(l);
    }
    return {
        getState: get,
        setState: set,
        select,
        subscribe
    };
}
export { createStore as createStore };
function Switch(props) {
    const start = document.createComment("switch-start");
    const end = document.createComment("switch-end");
    const frag = document.createDocumentFragment();
    frag.appendChild(start);
    frag.appendChild(end);
    createEffect(()=>{
        clearRange(start, end);
        let matched = false;
        for (const child of props.children){
            if (isMatchComponent(child)) {
                const matchNode = child;
                if (matchNode.condition()) {
                    const nodes = normalizeToNodes(matchNode.children);
                    const f = document.createDocumentFragment();
                    for (const n of nodes)f.appendChild(n);
                    end.parentNode.insertBefore(f, end);
                    matched = true;
                    break;
                }
            }
        }
        if (!matched && props.fallback) {
            const nodes = normalizeToNodes(props.fallback);
            const f = document.createDocumentFragment();
            for (const n of nodes)f.appendChild(n);
            end.parentNode.insertBefore(f, end);
        }
    });
    return frag;
}
function isMatchComponent(child) {
    return !!child?.__isMatch;
}
function Match(props) {
    return {
        condition: ()=>!!props.when(),
        children: props.children,
        __isMatch: true
    };
}
function createMatcher(value) {
    return {
        Switch: (props)=>{
            const start = document.createComment("matcher-switch-start");
            const end = document.createComment("matcher-switch-end");
            const frag = document.createDocumentFragment();
            frag.appendChild(start);
            frag.appendChild(end);
            createEffect(()=>{
                const currentValue = value();
                clearRange(start, end);
                let matched = false;
                for (const child of props.children){
                    if (isMatcherCase(child)) {
                        const caseNode = child;
                        const shouldMatch = typeof caseNode.when === "function" ? caseNode.when(currentValue) : caseNode.when === currentValue;
                        if (shouldMatch) {
                            const nodes = normalizeToNodes(caseNode.children);
                            const f = document.createDocumentFragment();
                            for (const n of nodes)f.appendChild(n);
                            end.parentNode.insertBefore(f, end);
                            matched = true;
                            break;
                        }
                    }
                }
                if (!matched && props.fallback) {
                    const nodes = normalizeToNodes(props.fallback);
                    const f = document.createDocumentFragment();
                    for (const n of nodes)f.appendChild(n);
                    end.parentNode.insertBefore(f, end);
                }
            });
            return frag;
        },
        Match: (props)=>({
                when: props.when,
                children: props.children,
                __isMatcherCase: true
            })
    };
}
function isMatcherCase(child) {
    return !!child?.__isMatcherCase;
}
export { Switch as Switch };
export { Match as Match };
export { createMatcher as createMatcher };
