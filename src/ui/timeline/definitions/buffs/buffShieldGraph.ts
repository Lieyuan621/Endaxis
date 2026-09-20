import type {
  BuffShieldDefinition,
  BuffShieldDamageAbsorptionDefinition,
} from '../../../../../packages/game-data-contract/src/buffs';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import { insertStructureArrayItem } from '../skillStructureEditorCommands';

export function createBuffShield(): BuffShieldDefinition {
  return {
    infinityValue: false,
    value: 0,
    damageAbsorptions: [],
    absorbCount: -1,
    absorbAllDamageWhenConsumed: false,
    removeBuffWhenConsumed: true,
    priority: 'normal',
    replaceHitEffect: false,
  };
}
export function createBuffShieldAbsorption(): BuffShieldDamageAbsorptionDefinition {
  return { damageType: 'physical', ratio: 1, scale: 1 };
}
export function appendBuffShieldChild<T>(document: T, path: string) {
  if (/(?:^|\.)shields$/.test(path))
    return insertStructureArrayItem(document, path, createBuffShield());
}
export function buildBuffShieldGraph(shields: readonly BuffShieldDefinition[]): SkillStructureNode {
  const base = (path: string, label: string): SkillStructureNode => ({
    id: `buff:${path}`,
    sourcePath: path,
    label,
    kind: 'Buff 成员集合',
    summary: '',
    details: {},
    editorSection: 'overview',
    relationToParent: 'port',
    canCopy: false,
    canMove: false,
    canDelete: false,
    children: [],
  });
  return {
    ...base('shields', '护盾'),
    canAddChild: 'buffMember',
    acceptsChildKind: 'buffShield',
    children: shields.map((_shield, i) => ({
      ...base(`shields[${i}]`, `护盾 ${i + 1}`),
      kind: '护盾',
      payloadKind: 'buffShield',
      relationToParent: 'member',
      canCopy: true,
      canMove: true,
      canDelete: true,
    })),
  };
}
