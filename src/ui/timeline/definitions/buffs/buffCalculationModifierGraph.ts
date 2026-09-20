import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';
import type {
  HealModifierCondition,
  HealModifierDefinition,
  PoiseModifierCondition,
  PoiseModifierDefinition,
} from '../../../../../packages/game-data-contract/src/modifiers';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import {
  insertStructureArrayItem,
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';

export function createHealCondition(kind: HealModifierCondition['kind']): HealModifierCondition {
  if (kind === 'targetHealthCompare')
    return { kind, valueType: 'ratio', operator: 'less', value: 0.5 };
  if (kind === 'buffBlackboardCompare') return { kind, left: 0, operator: 'equal', right: 0 };
  return { kind, match: 'hasAny', tags: [] };
}
export function createHealProcessor(
  kind: HealModifierDefinition['processors'][number]['kind'],
): HealModifierDefinition['processors'][number] {
  return kind === 'modifyCalculationResult'
    ? { kind, timing: 'afterCalculation', baseMultiplier: 0, multiplierCount: 1 }
    : { kind, timing: 'beforeCalculation', side: 'healer', addition: 0 };
}
export function createPoiseCondition(kind: PoiseModifierCondition['kind']): PoiseModifierCondition {
  if (kind === 'casterControlled') return { kind };
  if (kind === 'eventDamageTagsMatch') return { kind, match: 'hasAny', tags: [] };
  return { kind, conditions: [{ kind: 'casterControlled' }] };
}
export function createPoiseProcessor(): PoiseModifierDefinition['processors'][number] {
  return { kind: 'modifyPoiseScalar', timing: 'beforeCalculation', side: 'attacker', addition: 0 };
}
export function appendBuffCalculationChild<T>(document: T, path: string) {
  const family = /(?:^|\.)(healModifiers|poiseModifiers)(?:\[\d+\].*)?$/.exec(path)?.[1];
  if (!family) return;
  const heal = family === 'healModifiers';
  if (path.endsWith(family))
    return insertStructureArrayItem(document, path, {
      enabledSide: heal ? 'healer' : 'attacker',
      processors: [heal ? createHealProcessor('modifyCalculationResult') : createPoiseProcessor()],
    });
  if (path.endsWith('.processors'))
    return insertStructureArrayItem(
      document,
      path,
      heal ? createHealProcessor('modifyCalculationResult') : createPoiseProcessor(),
    );
  const value = resolveStructureValue(document, path);
  if (path.endsWith('.condition') && value === undefined)
    return {
      root: replaceStructureValueAtPath(
        document,
        path,
        heal
          ? createHealCondition('targetHealthCompare')
          : createPoiseCondition('casterControlled'),
      ),
      itemPath: path,
    };
  if (!heal && value && typeof value === 'object' && 'kind' in value && value.kind === 'all')
    return insertStructureArrayItem(
      document,
      `${path}.conditions`,
      createPoiseCondition('casterControlled'),
    );
}

export function buildBuffCalculationModifierGraph(
  definition: SkillBuffDefinition,
): SkillStructureNode[] {
  return (['healModifiers', 'poiseModifiers'] as const).map(key => {
    const heal = key === 'healModifiers';
    const title = heal ? '治疗修正' : '失衡修正';
    const modifierKind = heal ? 'buffHealModifier' : 'buffPoiseModifier';
    const processorKind = heal ? 'buffHealProcessor' : 'buffPoiseProcessor';
    const conditionKind = heal ? 'buffHealCondition' : 'buffPoiseCondition';
    const base = (path: string, label: string): SkillStructureNode => ({
      id: `buff:${path}`,
      sourcePath: path,
      label,
      kind: title,
      summary: '',
      details: {},
      editorSection: 'overview',
      children: [],
      relationToParent: 'port',
      canDelete: false,
      canCopy: false,
      canMove: false,
    });
    const conditionNode = (
      condition: HealModifierCondition | PoiseModifierCondition,
      path: string,
      member = false,
    ): SkillStructureNode => ({
      ...base(
        path,
        (
          {
            all: '全部满足',
            casterControlled: '来源为主控',
            eventDamageTagsMatch: '伤害标签匹配',
            targetHealthCompare: '生命比较',
            buffBlackboardCompare: 'Buff 黑板比较',
            healTagsMatch: '治疗标签匹配',
          } as const
        )[condition.kind],
      ),
      payloadKind: conditionKind,
      canCopy: true,
      canDelete: true,
      canMove: member,
      relationToParent: member ? 'member' : 'port',
      ...(condition.kind === 'all'
        ? { canAddChild: 'buffMember' as const, acceptsChildKind: conditionKind }
        : {}),
      children:
        condition.kind === 'all'
          ? condition.conditions.map((child, i) =>
              conditionNode(child, `${path}.conditions[${i}]`, true),
            )
          : [],
    });
    return {
      ...base(key, title),
      kind: 'Buff 成员集合',
      canAddChild: 'buffMember',
      acceptsChildKind: modifierKind,
      children: (definition[key] ?? []).map((modifier, i) => {
        const path = `${key}[${i}]`;
        return {
          ...base(path, `${title} ${i + 1}`),
          payloadKind: modifierKind,
          relationToParent: 'member',
          canCopy: true,
          canMove: true,
          canDelete: true,
          children: [
            modifier.condition
              ? conditionNode(modifier.condition, `${path}.condition`)
              : {
                  ...base(`${path}.condition`, '条件（未设置）'),
                  kind: 'Buff 成员集合',
                  canAddChild: 'buffMember',
                  acceptsChildKind: conditionKind,
                },
            {
              ...base(`${path}.processors`, '处理器'),
              kind: 'Buff 成员集合',
              canAddChild: 'buffMember',
              acceptsChildKind: processorKind,
              children: modifier.processors.map((processor, j) => ({
                ...base(
                  `${path}.processors[${j}]`,
                  processor.kind === 'modifyCalculationResult'
                    ? '修改治疗计算结果'
                    : processor.kind === 'modifyHealingIncrease'
                      ? '修改治疗提升'
                      : '修改失衡倍率',
                ),
                payloadKind: processorKind,
                relationToParent: 'member',
                canCopy: true,
                canMove: true,
                canDelete: true,
              })),
            },
          ],
        };
      }),
    };
  });
}
