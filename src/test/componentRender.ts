import { createRenderer, nextTick, toRaw } from 'vue';
import { expect } from 'vitest';

// Minimal host tree for production component templates, not a DOM/browser substitute.
export type Node = {
  type: string;
  props: Record<string, any>;
  text: string;
  children: Node[];
  parent: Node | null;
  readonly dataset: Record<string, string>;
  clientWidth: number;
  clientHeight: number;
  getBoundingClientRect(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
  contains(child: Node): boolean;
  focus(): void;
  setPointerCapture(): void;
  hasPointerCapture(): boolean;
  releasePointerCapture(): void;
  querySelector(): null;
  querySelectorAll(): never[];
  closest(selector: string): Node | null;
};
export const node = (type: string, text = ''): Node => ({
  type,
  text,
  props: {},
  children: [],
  parent: null,
  get dataset() {
    return { graphPin: this.props['data-graph-pin'] };
  },
  clientWidth: 10000,
  clientHeight: 10000,
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    right: 10000,
    bottom: 10000,
    width: 10000,
    height: 10000,
  }),
  contains(child) {
    return all(toRaw(this)).includes(toRaw(child));
  },
  focus() {},
  setPointerCapture() {},
  hasPointerCapture: () => false,
  releasePointerCapture() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  closest(selector) {
    return selector === '[data-graph-pin]' && this.props['data-graph-pin'] ? this : null;
  },
});
function detach(child: Node) {
  if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
  child.parent = null;
}
export const renderer = createRenderer<Node, Node>({
  insert(child, parent, anchor) {
    detach(child);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, child);
    child.parent = parent;
  },
  remove: detach,
  patchProp: (element, key, _old, value) => {
    element.props[key] = value;
  },
  setText: (element, text) => {
    element.text = text;
  },
  setElementText: (element, text) => {
    element.text = text;
    element.children = [];
  },
  createElement: type => node(type),
  createText: text => node('text', text),
  createComment: text => node('comment', text),
  parentNode: element => element.parent,
  nextSibling: element =>
    element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
});
export function all(root: Node): Node[] {
  return [root, ...root.children.flatMap(all)];
}
export function text(root: Node): string {
  return root.text + root.children.map(text).join('');
}
export function event(extra: Record<string, unknown> = {}) {
  return {
    preventDefault() {},
    stopPropagation() {},
    button: 0,
    detail: 0,
    pointerId: 1,
    clientX: 1,
    clientY: 1,
    altKey: false,
    ...extra,
  };
}
export async function click(root: Node, label: string) {
  const target = all(root).find(n => n.type === 'button' && text(n).trim() === label);
  expect(target, label).toBeDefined();
  target!.props.onClick(event());
  await nextTick();
}
