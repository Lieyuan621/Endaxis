import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';
import type { SkillStructureNode } from '../skillStructureMindMapModel';

export type OperatorInitializationDocument = Pick<
  OperatorDefinition,
  'entityBlackboardInitializers'
>;

export function buildOperatorInitializationGraph(
  value: OperatorInitializationDocument,
): SkillStructureNode {
  return {
    id: 'initialization',
    sourcePath: '',
    label: '条件初始化',
    kind: '初始化集合',
    summary: '构筑完成后 · 技能实例创建前',
    details: {},
    editorSection: 'overview',
    canDelete: false,
    canAddChild: 'lifecycle',
    children: (value.entityBlackboardInitializers ?? []).map((entry, index) => {
      const path = `entityBlackboardInitializers[${index}]`;
      return {
        id: path,
        sourcePath: path,
        label: entry.key || '未填写写入键',
        kind: '黑板写入',
        summary: `成立 ${entry.trueValue} / 不成立 ${entry.falseValue}`,
        details: {},
        editorSection: 'overview',
        relationToParent: 'member',
        canDelete: true,
        children: [
          {
            id: `${path}.condition`,
            sourcePath: `${path}.condition`,
            label: '构筑条件',
            kind: '构筑条件',
            summary: '',
            details: {},
            children: [],
            editorSection: 'overview',
            relationToParent: 'port',
            canDelete: false,
          },
        ],
      };
    }),
  };
}

/** Authoring seed only; never used as a game-data or simulation fallback. */
export function appendOperatorInitializer(value: OperatorInitializationDocument) {
  const entries = [...(value.entityBlackboardInitializers ?? [])];
  const keys = new Set(entries.map(entry => entry.key));
  let index = 1;
  while (keys.has(`EntityBB_custom_${index}`)) index++;
  entries.push({
    key: `EntityBB_custom_${index}`,
    condition: {
      kind: 'deckAttributeCompare',
      left: 'strength',
      operator: 'equal',
      right: 'strength',
    },
    trueValue: 1,
    falseValue: 0,
  });
  return {
    document: { entityBlackboardInitializers: entries },
    path: `entityBlackboardInitializers[${entries.length - 1}]`,
  };
}
