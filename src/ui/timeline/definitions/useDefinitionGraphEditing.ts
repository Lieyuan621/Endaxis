import { computed, watch, type Ref } from 'vue';
import { createDefinitionEditContext } from './definitionEditContext';
import type { DefinitionDraftHistory } from './useDefinitionDraftHistory';
import { locateStructureProperty, type SkillStructureNode } from './skillStructureMindMapModel';
import { structurePathSegments } from './skillStructureEditorCommands';
import { useInspectorPropertyReveal } from './inspector/useInspectorPropertyReveal';
import { useDefinitionStructureNavigation } from './definitionStructureNavigation';

/** 图宿主只提供保存范围与视图选择；不重复实现字段提交和历史定位。 */
export function useDefinitionGraphEditing<T extends object>(options: {
  read(): T;
  history: DefinitionDraftHistory<T>;
  root: Readonly<Ref<SkillStructureNode>>;
  selectedPath: Readonly<Ref<string>>;
  element: Ref<HTMLElement | null>;
  selectPath(path: string): Promise<void>;
}) {
  useDefinitionStructureNavigation(options.root, options.read, options.selectPath);
  const context = createDefinitionEditContext({
    read: options.read,
    commit: (next, focus) =>
      options.history.commit(next, locateStructureProperty(options.root.value, focus)),
  });
  const property = computed(() => context.at(structurePathSegments(options.selectedPath.value)));
  const revealProperty = useInspectorPropertyReveal(options.element);
  watch(
    () => options.history.restoredLocation?.value,
    async location => {
      void revealProperty();
      if (!location) return;
      await options.selectPath(location.path);
      if (
        options.history.restoredLocation?.value === location &&
        options.selectedPath.value === location.path &&
        location.propertyPath
      ) {
        await revealProperty([...structurePathSegments(location.path), ...location.propertyPath]);
      }
    },
    { immediate: true, flush: 'post' },
  );
  return {
    context,
    property,
    cancelReveal: () => {
      void revealProperty();
    },
  };
}
