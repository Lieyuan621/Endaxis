import { provide, toRaw, type InjectionKey, type Ref } from 'vue';
import { indexSkillStructureNodes, type SkillStructureNode } from './skillStructureMindMapModel';
import { resolveStructureValue } from './skillStructureEditorCommands';

interface StructureNavigation {
  (target: object): boolean;
  canNavigate(target: object): boolean;
}
export const definitionStructureNavigationKey: InjectionKey<StructureNavigation> = Symbol(
  'definition-structure-navigation',
);

/** 导航只查找当前草稿对象身份，不比较内容、不提交历史；过期或多重引用不猜目标。 */
export function useDefinitionStructureNavigation(
  root: Readonly<Ref<SkillStructureNode>>,
  read: () => object,
  select: (path: string) => unknown,
) {
  const findPath = (target: object) => {
    const paths = new Set(
      [...indexSkillStructureNodes(root.value).values()]
        .filter(node => toRaw(resolveStructureValue(read(), node.sourcePath)) === toRaw(target))
        .map(node => node.sourcePath),
    );
    return paths.size === 1 ? [...paths][0] : undefined;
  };
  const navigate = Object.assign(
    (target: object) => {
      const path = findPath(target);
      if (path === undefined) return false;
      select(path);
      return true;
    },
    { canNavigate: (target: object) => findPath(target) !== undefined },
  );
  provide(definitionStructureNavigationKey, navigate);
  return navigate;
}
