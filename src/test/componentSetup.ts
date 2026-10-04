import {
  createRenderer,
  h,
  nextTick,
  shallowRef,
  ssrContextKey,
  type App,
  type ComponentOptions,
} from 'vue';
import { i18n } from '../i18n';

// Execute production setup/watchers and events. DOM interaction is covered separately by Playwright.
export async function mountSetup(
  component: unknown,
  initial: Record<string, unknown>,
  configure?: (app: App) => void,
) {
  const props = shallowRef(initial);
  let state: any;
  const renderer = createRenderer<object, object>({
    insert() {},
    remove() {},
    patchProp() {},
    setText() {},
    setElementText() {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    parentNode: () => null,
    nextSibling: () => null,
  });
  const implementation = component as ComponentOptions;
  const stub = {
    ...implementation,
    setup(p: any, context: any) {
      state = implementation.setup!(p, context);
      return state;
    },
    render: () => null,
  };
  const app = renderer.createApp({ render: () => h(stub, props.value) });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  configure?.(app);
  app.mount({});
  await nextTick();
  return {
    state,
    async update(next: Record<string, unknown>) {
      props.value = { ...props.value, ...next };
      await nextTick();
    },
    stop: () => app.unmount(),
  };
}
