import type { InjectionKey } from 'vue';

export interface DefinitionMapViewState {
  zoom: number;
  collapsedIds: readonly string[];
  left: number;
  top: number;
  selectedId?: string;
}

/** 根编辑会话拥有视图缓存；既不写入项目，也不保留隐藏组件及其输入监听。 */
export function createDefinitionViewState() {
  const states = new Map<string, DefinitionMapViewState>();
  let generation = 0;
  return {
    get generation() {
      return generation;
    },
    read(key: string) {
      const state = states.get(key);
      return state && { ...state, collapsedIds: [...state.collapsedIds] };
    },
    write(key: string, state: DefinitionMapViewState) {
      states.set(key, { ...state, collapsedIds: [...state.collapsedIds] });
    },
    clear() {
      generation++;
      states.clear();
    },
  };
}
export const definitionViewStateKey: InjectionKey<ReturnType<typeof createDefinitionViewState>> =
  Symbol('definition-view-state');
