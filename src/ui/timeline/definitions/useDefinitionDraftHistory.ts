import { computed, markRaw, shallowRef, watch, type ComputedRef, type ShallowRef } from 'vue';
import { editorDefinitionsEqual } from '../../editorDefinitionsEqual';
import { cloneStructureValue } from './skillStructureEditorCommands';

/** 记录产生修改的视图位置；仅浏览节点不会新增历史。 */
export interface DefinitionHistoryLocation {
  readonly path: string;
  /** 所属节点内的精确属性位置；不拼进旧的字符串节点路径。 */
  readonly propertyPath?: readonly (string | number)[];
  readonly section?: string;
  readonly objectId?: string;
  readonly skillGroupKey?: string;
  readonly skillDefinitionPath?: string;
  readonly upgradeKind?: 'talents' | 'potentials';
  readonly upgradeIndex?: number;
  readonly upgradeCategory?: string;
  readonly runtimeCategory?: 'passiveSkills' | 'eventHandlers';
  /** Child page within a root section; independent of document ownership. */
  readonly page?: string;
  readonly operation?: 'add' | 'duplicate' | 'remove' | 'reset' | 'edit';
}

export interface DefinitionDraftHistory<T> {
  commit(value: T, location?: DefinitionHistoryLocation): void;
  restore(action: 'undo' | 'redo'): void;
  reset?(value: T): void;
  atLocation?(location: DefinitionHistoryLocation | undefined, edit: () => void): void;
  readonly canUndo: ComputedRef<boolean>;
  readonly canRedo: ComputedRef<boolean>;
  readonly restoredLocation?: ShallowRef<DefinitionHistoryLocation | undefined>;
  readonly undoLocation?: ComputedRef<DefinitionHistoryLocation | undefined>;
  readonly redoLocation?: ComputedRef<DefinitionHistoryLocation | undefined>;
}

/** History belongs to one mounted editing context. Hosts key instances by object identity.
 * An unrelated parent replacement also resets history instead of replaying old snapshots into it. */
export function useDefinitionDraftHistory<T>(
  read: () => T,
  publish: (value: T) => void,
): DefinitionDraftHistory<T> {
  type Entry = { value: T; location?: DefinitionHistoryLocation };
  const past = shallowRef<Entry[]>([]);
  const future = shallowRef<Entry[]>([]);
  const restoredLocation = shallowRef<DefinitionHistoryLocation>();
  let pendingLocation: DefinitionHistoryLocation | undefined;
  let expected = cloneStructureValue(read());
  watch(
    read,
    value => {
      if (!editorDefinitionsEqual(value, expected)) {
        past.value = [];
        future.value = [];
        restoredLocation.value = undefined;
      }
      expected = cloneStructureValue(value);
    },
    { flush: 'sync' },
  );

  function send(value: T): void {
    expected = cloneStructureValue(value);
    publish(cloneStructureValue(value));
  }
  function commit(value: T, location = pendingLocation): void {
    if (editorDefinitionsEqual(value, read())) return;
    past.value = [
      ...past.value,
      {
        value: cloneStructureValue(read()),
        location: location && {
          ...location,
          propertyPath: location.propertyPath && [...location.propertyPath],
        },
      },
    ];
    future.value = [];
    send(value);
  }
  function restore(action: 'undo' | 'redo'): void {
    const source = action === 'undo' ? past : future;
    const target = action === 'undo' ? future : past;
    const value = source.value.at(-1);
    if (value === undefined) return;
    source.value = source.value.slice(0, -1);
    target.value = [
      ...target.value,
      { value: cloneStructureValue(read()), location: value.location },
    ];
    send(value.value);
    // 重做也定位到这次修改的位置，不能捕获用户后来浏览的节点。
    restoredLocation.value = value.location && { ...value.location };
  }
  return {
    commit,
    restore,
    restoredLocation,
    undoLocation: computed(() => past.value.at(-1)?.location),
    redoLocation: computed(() => future.value.at(-1)?.location),
    atLocation(location, edit) {
      const previous = pendingLocation;
      pendingLocation = location;
      try {
        edit();
      } finally {
        pendingLocation = previous;
      }
    },
    reset(value) {
      past.value = [];
      future.value = [];
      restoredLocation.value = undefined;
      send(value);
    },
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
  };
}

/** 一个保存范围只有一个草稿；字段替换统一提交历史，打开另一份定义时显式重置。 */
export function useDefinitionDraft<T>(initial: T) {
  const current = shallowRef<T>(cloneStructureValue(initial));
  const history = markRaw(
    useDefinitionDraftHistory<T>(
      () => current.value,
      value => {
        current.value = value;
      },
    ),
  );
  const draft = computed<T>({
    get: () => current.value,
    set: value => history.commit(value),
  });
  return { draft, history, reset: (value: T) => history.reset!(value) };
}

/** Embedded pages read the root value, never a second writable snapshot. The save
 * scope is fixed for a mounted page; independent pages retain their own draft. */
export function useDefinitionPageDraft<T>(
  read: () => T,
  shared: DefinitionDraftHistory<T> | undefined,
  locate: () => DefinitionHistoryLocation,
) {
  if (!shared) return useDefinitionDraft(read());
  let pending: DefinitionHistoryLocation | undefined;
  const history = markRaw<DefinitionDraftHistory<T>>({
    ...shared,
    commit(value, location) {
      shared.commit(value, location ?? pending ?? locate());
    },
    atLocation(location, edit) {
      const previous = pending;
      pending = location;
      try {
        edit();
      } finally {
        pending = previous;
      }
    },
  });
  return {
    draft: computed<T>({ get: read, set: value => history.commit(value) }),
    history,
    // Opening an embedded page must not reset its parent's undo stack.
    reset: (_value: T) => {},
  };
}

/** 子视图借用所属草稿的撤销游标，只负责把局部值交给父级更新入口。 */
export function projectDefinitionHistory<T>(
  parent: Pick<
    DefinitionDraftHistory<unknown>,
    | 'restore'
    | 'canUndo'
    | 'canRedo'
    | 'restoredLocation'
    | 'atLocation'
    | 'undoLocation'
    | 'redoLocation'
  >,
  commit: (value: T, location?: DefinitionHistoryLocation) => void,
  locate?: () => Omit<DefinitionHistoryLocation, 'path'>,
): DefinitionDraftHistory<T> {
  return markRaw({
    commit(value, location) {
      const target = { ...location, ...locate?.(), path: location?.path ?? '' };
      if (parent.atLocation) parent.atLocation(target, () => commit(value, target));
      else commit(value, target);
    },
    restore: parent.restore,
    canUndo: parent.canUndo,
    canRedo: parent.canRedo,
    restoredLocation: parent.restoredLocation,
    undoLocation: parent.undoLocation,
    redoLocation: parent.redoLocation,
  });
}
