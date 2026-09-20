import type {
  ActionSequenceDefinition,
  SkillBuffDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { DamageModifierCondition } from '../../../../../packages/game-data-contract/src/modifiers';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import {
  insertStructureArrayItem,
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';
import { createBuffDamageProcessor } from './buffDamageProcessorEditing';
import { BUFF_FLAT_COLLECTIONS, type BuffFlatCollectionKey } from './buffFlatCollectionGraph';
import { appendBuffCalculationChild } from './buffCalculationModifierGraph';
import { isBuffGraphPayload } from './buffGraphOperations';
import { appendBuffShieldChild } from './buffShieldGraph';

export function appendBuffGraphChild<T>(document: T, path: string): { root: T; itemPath: string } {
  const shield = appendBuffShieldChild(document, path);
  if (shield) return shield;
  const calculation = appendBuffCalculationChild(document, path);
  if (calculation) return calculation;
  const key = path.split('.').at(-1) as BuffFlatCollectionKey;
  if (Object.hasOwn(BUFF_FLAT_COLLECTIONS, key))
    return insertStructureArrayItem(document, path, BUFF_FLAT_COLLECTIONS[key].create());
  const current = resolveStructureValue(document, path);
  if (/(^|\.)damageModifiers$/.test(path))
    return insertStructureArrayItem(document, path, {
      enabledSide: 'attacker',
      processors: [createBuffDamageProcessor('damageScale')],
    });
  if (/\.processors$/.test(path))
    return insertStructureArrayItem(document, path, createBuffDamageProcessor('damageScale'));
  if (current === undefined && /\.condition$/.test(path))
    return {
      root: replaceStructureValueAtPath(document, path, { kind: 'casterControlled' }),
      itemPath: path,
    };
  if (current === undefined && /\.conditionProgram$/.test(path))
    return { root: replaceStructureValueAtPath(document, path, { steps: [] }), itemPath: path };
  if (
    current &&
    typeof current === 'object' &&
    'kind' in current &&
    (current.kind === 'all' || current.kind === 'any')
  )
    return insertStructureArrayItem(document, `${path}.conditions`, { kind: 'casterControlled' });
  return { root: document, itemPath: path };
}

export function isBuffDetailNode(node: Pick<SkillStructureNode, 'kind' | 'payloadKind'>): boolean {
  return (
    isBuffGraphPayload(node.payloadKind) ||
    [
      'Buff 成员集合',
      '伤害修正器',
      '伤害修正条件',
      '伤害条件程序',
      '伤害处理器',
      '伤害修正集合',
      '伤害修正条件槽',
    ].includes(node.kind)
  );
}

/** Projection only: preserves the exact Buff document paths, including invalid drafts. */
export function buildBuffDamageModifierGraph(
  modifiers: NonNullable<SkillBuffDefinition['damageModifiers']>,
  sequenceNode: (sequence: ActionSequenceDefinition, path: string) => SkillStructureNode,
): SkillStructureNode {
  const node = (
    path: string,
    label: string,
    kind: string,
    children: readonly SkillStructureNode[] = [],
    relationToParent: 'port' | 'member' = 'port',
  ): SkillStructureNode => ({
    id: `buff:${path}`,
    sourcePath: path,
    label,
    kind,
    summary: '',
    details: {},
    editorSection: 'overview',
    children,
    relationToParent,
    canDelete: false,
    canMove: false,
    canCopy: false,
  });
  function conditionTree(
    condition: DamageModifierCondition,
    path: string,
    member = false,
  ): SkillStructureNode {
    const children =
      condition.kind === 'not'
        ? [conditionTree(condition.condition, `${path}.condition`)]
        : condition.kind === 'all' || condition.kind === 'any'
          ? condition.conditions.map((child, index) =>
              conditionTree(child, `${path}.conditions[${index}]`, true),
            )
          : [];
    const labels: Partial<Record<DamageModifierCondition['kind'], string>> = {
      not: '取反',
      all: '全部满足',
      any: '任一满足',
      casterControlled: '来源为主控',
      sourceSkillCastMatch: '来源技能匹配',
      buffBlackboardCompare: 'Buff 黑板比较',
      entityTagMatch: '实体标签匹配',
      buffIdCountCompare: 'Buff 数量比较',
      eventDamageTagsMatch: '伤害标签匹配',
      eventDamageFeaturesMatch: '伤害特征匹配',
      eventDamageTypesMatch: '伤害类型匹配',
      targetHealthCompare: '目标生命比较',
      targetPoiseCompare: '目标失衡比较',
    };
    return {
      ...node(
        path,
        labels[condition.kind] ?? condition.kind,
        '伤害修正条件',
        children,
        member ? 'member' : 'port',
      ),
      payloadKind: 'buffDamageCondition',
      canCopy: true,
      canMove: member,
      canDelete: member || /damageModifiers\[\d+\]\.condition$/.test(path),
      ...(condition.kind === 'all' || condition.kind === 'any'
        ? { canAddChild: 'buffMember' as const, acceptsChildKind: 'buffDamageCondition' as const }
        : {}),
    };
  }
  return {
    ...node(
      'damageModifiers',
      '伤害修正',
      '伤害修正集合',
      modifiers.map((modifier, index) => {
        const path = `damageModifiers[${index}]`;
        const conditions: SkillStructureNode[] = [];
        if (modifier.condition !== undefined)
          conditions.push(conditionTree(modifier.condition, `${path}.condition`));
        else
          conditions.push({
            ...node(`${path}.condition`, '条件树（未设置）', '伤害修正条件槽'),
            canAddChild: 'buffMember',
            acceptsChildKind: 'buffDamageCondition',
          });
        // Keep both branches visible when an invalid draft contains both; validation owns rejection.
        if (modifier.conditionProgram !== undefined)
          conditions.push({
            ...sequenceNode(modifier.conditionProgram, `${path}.conditionProgram`),
            kind: '伤害条件程序',
            relationToParent: 'port',
            canDelete: true,
            canCopy: false,
            canMove: false,
          });
        else
          conditions.push({
            ...node(`${path}.conditionProgram`, '条件程序（未设置）', '伤害修正条件槽'),
            canAddChild: 'buffMember',
          });
        const processors = {
          ...node(
            `${path}.processors`,
            '处理器',
            '伤害修正集合',
            modifier.processors.map((processor, processorIndex) => ({
              ...node(
                `${path}.processors[${processorIndex}]`,
                processor.kind === 'damageScale' ? '伤害倍率' : '即时属性',
                '伤害处理器',
                [],
                'member',
              ),
              canDelete: true,
              canCopy: true,
              canMove: true,
              payloadKind: 'buffDamageProcessor' as const,
              summary:
                processor.kind === 'damageScale'
                  ? `${processor.side} · ${processor.zone}`
                  : `${processor.targetSide} · ${processor.attribute}`,
            })),
          ),
          canAddChild: 'buffMember' as const,
          acceptsChildKind: 'buffDamageProcessor' as const,
        };
        return {
          ...node(
            path,
            `伤害修正 ${index + 1}`,
            '伤害修正器',
            [...conditions, processors],
            'member',
          ),
          summary: modifier.enabledSide,
          canDelete: true,
          canCopy: true,
          canMove: true,
          payloadKind: 'buffDamageModifier' as const,
        };
      }),
    ),
    canAddChild: 'buffMember',
    acceptsChildKind: 'buffDamageModifier',
  };
}
