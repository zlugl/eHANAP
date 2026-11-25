import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  readonly length: number;
  key: (index: number) => string | null;
}

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
  };
}

function ensureHeadlessDom() {
  const noop = () => {};
  class HTMLElementMock {}

  const makeNode = (tag = 'div'): any => ({
    nodeType: 1,
    nodeName: tag.toUpperCase(),
    tagName: tag.toUpperCase(),
    ownerDocument: null as any,
    parentNode: null as any,
    childNodes: [] as any[],
    style: {},
    addEventListener: noop,
    removeEventListener: noop,
    setAttribute: noop,
    removeAttribute: noop,
    getAttribute: () => null,
    appendChild(child: any) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    },
    removeChild(child: any) {
      this.childNodes = this.childNodes.filter((c: any) => c !== child);
      return child;
    },
    insertBefore(child: any) {
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    },
    contains: () => false,
  });

  const doc: any = {
    nodeType: 9,
    createElement: (tag: string) => {
      const node = makeNode(tag);
      node.ownerDocument = doc;
      return node;
    },
    createElementNS: (_ns: string, tag: string) => {
      const node = makeNode(tag);
      node.ownerDocument = doc;
      return node;
    },
    createTextNode: (text: string) => ({ nodeType: 3, nodeValue: text, ownerDocument: doc }),
    createComment: (text: string) => ({ nodeType: 8, nodeValue: text, ownerDocument: doc }),
    addEventListener: noop,
    removeEventListener: noop,
    activeElement: null,
    body: makeNode('body'),
    defaultView: null as any,
  };
  doc.body.ownerDocument = doc;

  const localStorage = createMemoryStorage();
  const sessionStorage = createMemoryStorage();

  const win: any = {
    document: doc,
    navigator: { userAgent: 'node-test-harness' },
    location: { origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    localStorage,
    sessionStorage,
    HTMLElement: HTMLElementMock,
    HTMLIFrameElement: HTMLElementMock,
    Element: HTMLElementMock,
    Node: HTMLElementMock,
    addEventListener: noop,
    removeEventListener: noop,
    event: undefined,
  };
  doc.defaultView = win;

  const container = makeNode('div');
  container.ownerDocument = doc;

  (globalThis as any).window = win;
  (globalThis as any).document = doc;
  (globalThis as any).HTMLElement = HTMLElementMock;
  (globalThis as any).localStorage = localStorage;
  (globalThis as any).sessionStorage = sessionStorage;

  return { container, localStorage, sessionStorage };
}

export interface MountedContext<T> {
  getApi: () => T;
  act: typeof React.act;
  resetStorage: () => void;
  unmount: () => Promise<void>;
}

/**
 * Mounts a real React Provider in Node via react-dom/client so integration tests
 * execute real hooks, effects, and state transitions without browser dependencies.
 */
export async function mountWithProvider<T>(
  Provider: React.ComponentType<{ children: React.ReactNode }>,
  useHook: () => T
): Promise<MountedContext<T>> {
  const { container, localStorage, sessionStorage } = ensureHeadlessDom();
  let latestApi: T | undefined;

  function Probe() {
    latestApi = useHook();
    return null;
  }

  const root: Root = createRoot(container);
  await React.act(async () => {
    root.render(React.createElement(Provider, null, React.createElement(Probe)));
  });

  return {
    getApi: () => {
      if (!latestApi) {
        throw new Error('Mounted context hook value is not initialized.');
      }
      return latestApi;
    },
    act: React.act,
    resetStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
    },
    unmount: async () => {
      await React.act(async () => {
        root.unmount();
      });
    },
  };
}
