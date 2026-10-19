import type {
  ActionGraphNode,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import type {
  OperatorBuffDefinitions,
  SkillBuffDefinition,
} from '../../../packages/game-data-contract/src/buffs';
import type {
  ActionTargetQuery,
  CombatConditionExpression,
} from '../../../packages/game-data-contract/src/conditions';
import type { ContingencyContractTagDefinition } from '../../../packages/game-data-contract/src/mechanics';
import type { ContractVariableConstraints } from './initialVariables';

/** 前瞻手填值，非正式游戏数据。锁定由预览诊断解释，不修改强制执行或连携队列。 */
export const seasonTwoPreviewValues = {
  comboDamageBonus: 0.5,
  comboCount: 2,
  lockSeconds: 9,
  spRecoveryBonus: 1,
  spGainBonus: 0.5,
  healDelaySeconds: 5,
  healRatioPerSecond: 0.02,
} as const;

/** 仅预览期需要的输入边界；初始值仍从初始化图读取。 */
export const seasonTwoVariableMetadata: Readonly<
  Record<number, Readonly<Record<string, ContractVariableConstraints>>>
> = {
  200001: {
    comboDamageBonus: {
      min: 0,
    },
    comboCount: {
      min: 1,
      max: 999,
      integer: true,
    },
    lockSeconds: { min: 0 },
  },
  200002: {
    spRecoveryBonus: {
      min: -1,
    },
    spGainBonus: { min: -1 },
  },
  200004: {
    healDelaySeconds: {
      min: 0,
    },
    healRatioPerSecond: {
      min: 0,
    },
  },
};

export function seasonTwoDisplayValues(values: Readonly<Record<string, number>>) {
  const result = { ...values };
  for (const [key, percent] of [
    ['comboDamageBonus', 'comboDamagePercent'],
    ['spRecoveryBonus', 'spRecoveryPercent'],
    ['spGainBonus', 'spGainPercent'],
    ['healRatioPerSecond', 'healPercent'],
  ] as const)
    if (result[key] !== undefined) result[percent] = result[key]! * 100;
  return result;
}

const team: ActionTargetQuery = { kind: 'characterTeam', excludeOwner: false };
const owner: ActionTargetQuery = { kind: 'owner' };
const enemy: ActionTargetQuery = { kind: 'fixed', target: 'enemy' };
const number = (value: number) => ({ kind: 'constant' as const, value });
const ref = (id: string) => ({ $sequence: id });
export const seasonTwoPreviewBuffIds = {
  combo: 'buff_endaxis_cc2_combo',
  counter: 'buff_endaxis_cc2_combo_count',
  lock: 'buff_endaxis_cc2_combo_lock',
  battle: 'buff_endaxis_cc2_battle',
  battleLock: 'buff_endaxis_cc2_battle_lock',
  battleCount: 'buff_endaxis_cc2_battle_count',
  ultimate: 'buff_endaxis_cc2_ultimate',
  heal: 'buff_endaxis_cc2_heal',
};
const buffIds = seasonTwoPreviewBuffIds;

// 仅用于这份手填定义的构图简写，产物仍是普通可编辑动作图。
function graph(
  nodes: Record<string, ActionGraphNode>,
  conditions: Record<string, CombatConditionExpression> = {},
  variables: readonly string[] = [],
): ActionGraphResourceDefinition {
  return {
    main: {
      nodes,
      dataNodes: {
        ...Object.fromEntries(
          Object.entries(conditions).map(([id, expression]) => [
            id,
            { type: 'boolean' as const, expression },
          ]),
        ),
        ...Object.fromEntries(
          variables.map(key => [
            `${key}Value`,
            { type: 'number' as const, expression: { kind: 'blackboard' as const, key } },
          ]),
        ),
      },
    },
    macros: {},
  };
}
const node = (action: ActionGraphStep, next: string | null = null): ActionGraphNode => ({
  action,
  next,
});
const check = (id: string, next: string): ActionGraphNode =>
  node(
    { kind: 'checkCondition', parameters: { condition: { kind: 'conditionNode', nodeId: id } } },
    next,
  );
const apply = (buffId: string, targets: ActionTargetQuery, next: string | null = null) =>
  node({ kind: 'applyBuff', parameters: { buffs: [{ buffId }], targets } }, next);
const finish = (ids: string[], targets: ActionTargetQuery, next: string | null = null) =>
  node(
    {
      kind: 'finishBuffsById',
      parameters: { buffIds: ids, targets, finishSource: owner, reason: 'other' },
    },
    next,
  );
const stacks = (
  buffId: string,
  target: ActionTargetQuery,
  value: number,
): Extract<CombatConditionExpression, { kind: 'buffIdStackCompare' }> => ({
  kind: 'buffIdStackCompare',
  target,
  compareZeroWhenTargetMissing: false,
  buffIds: [buffId],
  operator: 'greaterOrEqual',
  value: number(value),
});
const icon = (name: string) => `endaxis:contingency_contract/2/${name}` as const;
const marker = (name: string, durationSeconds?: number): SkillBuffDefinition => ({
  stackingType: 'refresh',
  maxStackCount: 1,
  ...(durationSeconds === undefined ? {} : { durationSeconds }),
  presentation: {
    nameKey: `contingencyContract.preview.${name}`,
    icon: icon(name === 'comboLock' ? 'lockdown' : 'silence'),
    showInSquadIcon: true,
  },
});
const counter: SkillBuffDefinition = {
  stackingType: 'enhance',
  maxStackCount: 999,
  presentation: { visible: false },
};

export const seasonTwoPreviewBuffs: OperatorBuffDefinitions = {
  [buffIds.counter]: counter,
  [buffIds.battleCount]: counter,
  [buffIds.lock]: { ...marker('comboLock'), durationSeconds: { blackboardKey: 'lockSeconds' } },
  [buffIds.battleLock]: marker('battleLock'),
  [buffIds.combo]: {
    stackingType: 'unique',
    blackboard: { ...seasonTwoPreviewValues },
    presentation: {
      nameKey: 'contingencyContract.preview.comboDamage',
      icon: 'endaxis:icons/icon_battle_combo_skill_dmg_up',
      showInSquadIcon: true,
    },
    abilityEventResponses: [{ event: 'afterSkillApplyCost', priority: 0, sequence: ref('cast') }],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: ref('damage'),
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'normal',
            addition: { blackboardKey: 'comboDamageBonus' },
          },
        ],
      },
    ],
    actionGraph: graph(
      {
        cast: check('combo', 'count'),
        count: apply(buffIds.counter, enemy, 'threshold'),
        threshold: check('enough', 'lock'),
        lock: node(
          {
            kind: 'applyBuff',
            parameters: {
              buffs: [
                {
                  buffId: buffIds.lock,
                  copiedBlackboardAssignments: { lockSeconds: 'lockSeconds' },
                },
              ],
              targets: team,
            },
          },
          'reset',
        ),
        reset: finish([buffIds.counter], enemy),
        damage: check('comboDamage', 'success'),
        success: node({
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        }),
      },
      {
        combo: { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
        comboDamage: { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['comboSkill'] },
        enough: {
          ...stacks(buffIds.counter, enemy, 1),
          value: { kind: 'valueNode', nodeId: 'comboCountValue' },
        },
      },
      ['comboCount'],
    ),
  },
  [buffIds.battle]: {
    stackingType: 'unique',
    presentation: { visible: false },
    blackboard: { teamCount: 0 },
    abilityEventResponses: [{ event: 'afterSkillApplyCost', priority: 0, sequence: ref('cast') }],
    actionGraph: graph(
      {
        cast: check('battle', 'unused'),
        unused: check('unused', 'lock'),
        lock: apply(buffIds.battleLock, owner, 'count'),
        count: apply(buffIds.battleCount, enemy, 'team'),
        team: check('team', 'complete'),
        complete: check('complete', 'unlock'),
        unlock: finish([buffIds.battleLock], team, 'reset'),
        reset: finish([buffIds.battleCount], enemy),
      },
      {
        // 追猎本身是 comboSkill，不计入战技轮次；同一干员后续段不重复计数。
        battle: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
        used: stacks(buffIds.battleLock, owner, 1),
        unused: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'used' } },
        team: {
          kind: 'entityCountCompare',
          target: team,
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 0,
          outputKey: 'teamCount',
        },
        complete: {
          kind: 'buffIdStackCompare',
          target: enemy,
          compareZeroWhenTargetMissing: false,
          buffIds: [buffIds.battleCount],
          operator: 'greaterOrEqual',
          value: { kind: 'valueNode', nodeId: 'teamCountValue' },
        },
      },
      ['teamCount'],
    ),
  },
  [buffIds.ultimate]: {
    stackingType: 'unique',
    presentation: { visible: false },
    abilityEventResponses: [{ event: 'afterSkillApplyCost', priority: 0, sequence: ref('cast') }],
    actionGraph: graph(
      {
        cast: check('ultimate', 'squad'),
        squad: node({
          kind: 'forEachContextTarget',
          parameters: { targets: team },
          body: ref('clear'),
        }),
        clear: node({
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: -1,
            isPercentValue: true,
            ignoreUltimateEnergyGainMultiplier: true,
            source: owner,
            targets: { kind: 'inputTarget' },
          },
        }),
      },
      { ultimate: { kind: 'eventSkillTypeIn', skillTypes: ['ultimate'] } },
    ),
  },
  [buffIds.heal]: {
    stackingType: 'unique',
    blackboard: { elapsed: 0, ...seasonTwoPreviewValues },
    triggerIntervalSeconds: 1,
    waitFirstTriggerInterval: true,
    maxTriggerCount: -1,
    presentation: {
      nameKey: 'contingencyContract.preview.heal',
      icon: icon('engorgement'),
      showInHeadBarCommon: true,
    },
    lifecycleSequences: { trigger: [ref('tick')] },
    abilityEventResponses: [{ event: 'afterTakeInfliction', priority: 0, sequence: ref('reset') }],
    actionGraph: graph(
      {
        tick: node({
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'affected' },
          whenTrue: ref('reset'),
          whenFalse: ref('elapsed'),
        }),
        reset: node({
          kind: 'modifyActionValue',
          parameters: { key: 'elapsed', operation: 'assign', value: number(0) },
        }),
        elapsed: node(
          {
            kind: 'modifyActionValue',
            parameters: { key: 'elapsed', operation: 'add', value: number(1) },
          },
          'ready',
        ),
        ready: check('ready', 'heal'),
        heal: node({
          kind: 'heal',
          parameters: {
            target: 'enemy',
            source: 'buffOwner',
            attribute: 'maxHealth',
            attributeSource: 'target',
            multiplier: { kind: 'valueNode', nodeId: 'healRatioPerSecondValue' },
            addition: 0,
            tags: [],
          },
        }),
      },
      {
        affected: {
          kind: 'entityTagMatch',
          target: owner,
          tagQueryType: 'hasAny',
          tags: [
            'Skill/Character/Common/NoGuard',
            'Skill/Character/Common/SpellInflict/FireInflict',
            'Skill/Character/Common/SpellInflict/PulseInflict',
            'Skill/Character/Common/SpellInflict/CrystInflict',
            'Skill/Character/Common/SpellInflict/NaturalInflict',
          ],
        },
        ready: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'elapsedValue' },
          operator: 'greater',
          right: { kind: 'valueNode', nodeId: 'healDelaySecondsValue' },
        },
      },
      ['elapsed', 'healDelaySeconds', 'healRatioPerSecond'],
    ),
  },
};

export const seasonTwoPreviewTags: readonly ContingencyContractTagDefinition[] = [
  200001, 200002, 200003, 200004,
].map((tagId, index) => ({
  tagId,
  columnId: `preview-${index}`,
  conflictId: '',
  score: 1,
  keyId: '',
  lockIds: [],
  romanNumSuffix: '',
  icon: icon(['lockdown', 'silence', 'dissipation', 'engorgement'][index]!),
  blackboard: {
    ...seasonTwoPreviewValues,
    comboDamagePercent: seasonTwoPreviewValues.comboDamageBonus * 100,
    spRecoveryPercent: seasonTwoPreviewValues.spRecoveryBonus * 100,
    spGainPercent: seasonTwoPreviewValues.spGainBonus * 100,
    healPercent: seasonTwoPreviewValues.healRatioPerSecond * 100,
  },
}));

const entryDefaults: readonly Readonly<Record<string, number>>[] = [
  {
    comboDamageBonus: seasonTwoPreviewValues.comboDamageBonus,
    comboCount: seasonTwoPreviewValues.comboCount,
    lockSeconds: seasonTwoPreviewValues.lockSeconds,
  },
  {
    spRecoveryBonus: seasonTwoPreviewValues.spRecoveryBonus,
    spGainBonus: seasonTwoPreviewValues.spGainBonus,
  },
  {},
  {
    healDelaySeconds: seasonTwoPreviewValues.healDelaySeconds,
    healRatioPerSecond: seasonTwoPreviewValues.healRatioPerSecond,
  },
];

export const seasonTwoPreviewPlans = [
  buffIds.combo,
  buffIds.battle,
  buffIds.ultimate,
  buffIds.heal,
].map((buffId, index) => ({
  tagId: seasonTwoPreviewTags[index]!.tagId,
  sequence: ref('initialize'),
  actionGraph:
    index === 3
      ? graph({
          initialize: node({
            kind: 'applyBuff',
            parameters: {
              targets: enemy,
              buffs: [
                {
                  buffId,
                  blackboardAssignments: Object.fromEntries(
                    Object.entries(entryDefaults[index]!).map(([key, value]) => [
                      key,
                      number(value),
                    ]),
                  ),
                },
              ],
            },
          }),
        })
      : graph(
          {
            initialize: node({
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: `global_${buffId}`,
                source: 'battle',
                blackboardAssignments: Object.fromEntries(
                  Object.entries(entryDefaults[index]!).map(([key, value]) => [key, number(value)]),
                ),
                definition: {
                  stackingType: 'unlimited',
                  blackboard: entryDefaults[index]!,
                  children: [
                    {
                      buffId,
                      blackboardAssignments: Object.fromEntries(
                        Object.keys(entryDefaults[index]!).map(key => [
                          key,
                          { kind: 'valueNode' as const, nodeId: `${key}Value` },
                        ]),
                      ),
                    },
                  ],
                  ...(index === 1
                    ? {
                        sharedSpModifiers: [
                          {
                            attribute: 'spRecovery' as const,
                            operation: 'multiplier' as const,
                            value: { kind: 'valueNode' as const, nodeId: 'spRecoveryBonusValue' },
                            applyToReturnSpGain: true,
                          },
                          {
                            attribute: 'gainEfficiency' as const,
                            operation: 'multiplier' as const,
                            value: { kind: 'valueNode' as const, nodeId: 'spGainBonusValue' },
                            applyToReturnSpGain: true,
                          },
                        ],
                      }
                    : {}),
                },
              },
            }),
          },
          {},
          Object.keys(entryDefaults[index]!),
        ),
}));
