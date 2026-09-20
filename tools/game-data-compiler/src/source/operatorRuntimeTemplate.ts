import type {
  ComboSkillPriority,
  NativeSkillType,
  PlayerSkillInput,
} from '../../../../packages/game-data-contract/src/index.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseActiveSkillTypesSource } from './activeSkillTypes.ts';
import { parseAbilitySystemBlackboardsSource } from './abilitySystemBlackboards.ts';
import { parseUnityComboSkillConditionsSource } from './unityComboSkillConditions.ts';
import { parseBlackboardAssignmentsSource } from './assignments.ts';

const COMBO_SKILL_PRIORITIES: Readonly<Record<number, ComboSkillPriority>> = {
  // GetBestCastInfo 0x06D8FE23：0→默认，1→首黑板值，2→敌人品阶分支。
  0: 'default',
  1: 'firstBlackboard',
  2: 'enemyRank',
};

/** 只读取已解码的角色/AbilitySystem 前缀与完整条件叶子；未消费后缀保持 partial。 */
export function parseOperatorRuntimeTemplateSource(
  value: unknown,
  path: string,
  options: { readonly parseComboConditions?: boolean } = {},
) {
  const root = requireRecord(value, path);
  if (root.format !== 'character-template-prefix-v1')
    throw new Error(`${path}.format: unsupported template export`);
  if (root.decodeStatus !== 'partial' && root.decodeStatus !== 'complete')
    throw new Error(`${path}.decodeStatus: expected decoded prefix`);
  const descriptor = requireRecord(root.root, `${path}.root`);
  if (
    descriptor.class !== 'CharacterTemplateData' ||
    descriptor.namespace !== 'Beyond.Gameplay' ||
    descriptor.assembly !== 'Gameplay.Beyond'
  )
    throw new Error(`${path}.root: unexpected native type`);
  const entry = requireRecord(root.abilitySystemEntry, `${path}.abilitySystemEntry`);
  if (
    entry.class !== 'AbilitySystemData' ||
    entry.namespace !== 'Beyond.Gameplay.Core' ||
    entry.assembly !== 'Gameplay.Beyond'
  )
    throw new Error(`${path}.abilitySystemEntry: unexpected native type`);
  const data = requireRecord(root.data, `${path}.data`);
  const ability = requireRecord(root.abilitySystem, `${path}.abilitySystem`);
  const bundle = requireRecord(ability.skillDataBundle, `${path}.abilitySystem.skillDataBundle`);
  const sourceSha256 = requireNonEmptyString(root.sourceSha256, `${path}.sourceSha256`);
  if (!/^[0-9a-f]{64}$/i.test(sourceSha256))
    throw new Error(`${path}.sourceSha256: expected SHA256`);
  return {
    sourcePath: path,
    sourceSha256,
    decodeStatus: root.decodeStatus,
    characterId: requireNonEmptyString(data.id, `${path}.data.id`),
    comboSkillId: requireNonEmptyString(
      bundle.comboSkillId,
      `${path}.abilitySystem.skillDataBundle.comboSkillId`,
    ),
    comboSkillPriority: parseComboSkillPriority(
      bundle.comboSkillPriorityType,
      `${path}.abilitySystem.skillDataBundle.comboSkillPriorityType`,
    ),
    playerActionSource: parsePlayerActionSource(ability, bundle, path),
    dashBuffs: parseDashBuffs(data.dashBuff, `${path}.data.dashBuff`),
    blackboards: parseAbilitySystemBlackboardsSource(ability, `${path}.abilitySystem`),
    ...(options.parseComboConditions === false
      ? {}
      : {
          conditions: parseUnityComboSkillConditionsSource(
            bundle.comboSkillConditions,
            root.conditionReferences,
            `${path}.abilitySystem.skillDataBundle.comboSkillConditions`,
          ),
        }),
  };
}

function parseDashBuffs(value: unknown, path: string) {
  if (value === undefined) return undefined;
  return requireArray(value, path).map((raw, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(raw, itemPath);
    requireExactFields(item, new Set(['buffId', 'assignBlackboard', 'assignItems']), itemPath);
    const assignBlackboard = requireBoolean(item.assignBlackboard, `${itemPath}.assignBlackboard`);
    const assignments = parseBlackboardAssignmentsSource(
      item.assignItems,
      `${itemPath}.assignItems`,
      { enabled: assignBlackboard },
    );
    if (!assignBlackboard && assignments.length > 0)
      throw new Error(`${itemPath}.assignItems: expected empty array when assignment is disabled`);
    const blackboard: Record<string, number | string> = {};
    for (const assignment of assignments) {
      if (!assignment.useDirectValue)
        throw new Error(`${itemPath}.assignItems: indirect Dash Buff assignment is unsupported`);
      blackboard[assignment.targetKey] =
        assignment.valueType === 'Numeric' ? assignment.numericValue : assignment.stringValue;
    }
    return {
      buffId: requireNonEmptyString(item.buffId, `${itemPath}.buffId`),
      blackboard,
    };
  });
}

function parseComboSkillPriority(value: unknown, path: string): ComboSkillPriority {
  const numeric = requireInteger(value, path);
  const priority = COMBO_SKILL_PRIORITIES[numeric];
  if (priority === undefined) throw new Error(`${path}: unsupported native priority ${numeric}`);
  return priority;
}

const playerInputByBattleCommand = new Map<number, PlayerSkillInput>([
  [0, 'basicAttack'],
  [3, 'battleSkill'],
  [4, 'comboSkill'],
  [5, 'ultimate'],
]);

function parseStringArray(value: unknown, path: string): string[] {
  return requireArray(value, path).map((item, index) =>
    requireNonEmptyString(item, `${path}[${index}]`),
  );
}

function parseParallelDictionary(
  value: unknown,
  path: string,
): readonly { readonly key: unknown; readonly value: unknown }[] {
  const dictionary = requireRecord(value, path);
  const keys = requireArray(dictionary.keys, `${path}.keys`);
  const values = requireArray(dictionary.values, `${path}.values`);
  if (keys.length !== values.length) throw new Error(`${path}: keys and values length differ`);
  return keys.map((key, index) => ({ key, value: values[index] }));
}

function parseCommandMapping(value: unknown, path: string) {
  const result: Partial<Record<PlayerSkillInput, string>> = {};
  for (const [index, item] of parseParallelDictionary(value, path).entries()) {
    const command = requireInteger(item.key, `${path}.keys[${index}]`);
    // Dash/Jump 属于原生输入系统，但不属于 Endaxis 可排轴的四类语义操作。
    if (command === 1 || command === 2) continue;
    const input = playerInputByBattleCommand.get(command);
    if (input === undefined)
      throw new Error(`${path}.keys[${index}]: unsupported command ${command}`);
    if (result[input] !== undefined) throw new Error(`${path}: duplicate command ${command}`);
    result[input] = requireNonEmptyString(item.value, `${path}.values[${index}]`);
  }
  return result;
}

function parsePlayerActionSource(
  ability: Record<string, unknown>,
  bundle: Record<string, unknown>,
  rootPath: string,
) {
  const path = `${rootPath}.abilitySystem.skillDataBundle`;
  const allNormalAttackIds = parseStringArray(
    bundle.allNormalAttackId,
    `${path}.allNormalAttackId`,
  );
  const { skillIds: allActiveSkillIds, initialNativeSkillTypeById: activeTypes } =
    parseActiveSkillTypesSource(bundle, path);
  const allPassiveSkillIds = parseStringArray(
    bundle.allPassiveSkillId,
    `${path}.allPassiveSkillId`,
  );
  const enabledBreakingNormalAttacks = new Set(
    parseStringArray(bundle.enabledBreakingNormalAttacks, `${path}.enabledBreakingNormalAttacks`),
  );
  const normalSkillId = requireNonEmptyString(bundle.normalSkillId, `${path}.normalSkillId`);
  const comboSkillId = requireNonEmptyString(bundle.comboSkillId, `${path}.comboSkillId`);
  const ultimateSkillId = requireNonEmptyString(bundle.ultimateSkillId, `${path}.ultimateSkillId`);
  const dodgeSkillId = requireNonEmptyString(bundle.dodgeSkillId, `${path}.dodgeSkillId`);
  const initialNativeSkillTypeById: Record<string, NativeSkillType> = {};
  const register = (skillId: string, type: NativeSkillType) => {
    const previous = initialNativeSkillTypeById[skillId];
    if (previous !== undefined && previous !== type) {
      throw new Error(`${path}: skill ${JSON.stringify(skillId)} has conflicting initial types`);
    }
    initialNativeSkillTypeById[skillId] = type;
  };
  for (const skillId of allNormalAttackIds) {
    register(skillId, enabledBreakingNormalAttacks.has(skillId) ? 'breakingAttack' : 'attack');
  }
  for (const [skillId, type] of Object.entries(activeTypes)) register(skillId, type);
  for (const skillId of allPassiveSkillIds) register(skillId, 'passiveSkill');
  register(dodgeSkillId, 'dodge');

  const modeConfig = requireRecord(ability.modeConfig, `${rootPath}.abilitySystem.modeConfig`);
  const modes = requireArray(modeConfig.modes, `${rootPath}.abilitySystem.modeConfig.modes`).map(
    (value, index) => {
      const modePath = `${rootPath}.abilitySystem.modeConfig.modes[${index}]`;
      const mode = requireRecord(value, modePath);
      const overrideNormalAttackList = requireBoolean(
        mode.overrideNormalAttackList,
        `${modePath}.overrideNormalAttackList`,
      );
      const overrideCmdMapping = requireBoolean(
        mode.overrideCmdMapping,
        `${modePath}.overrideCmdMapping`,
      );
      return {
        modeId: requireNonEmptyString(mode.modeId, `${modePath}.modeId`),
        modeLayer: requireNonEmptyString(mode.modeLayer, `${modePath}.modeLayer`),
        defaultEnabled: requireBoolean(mode.defaultEnable, `${modePath}.defaultEnable`),
        ...(overrideNormalAttackList
          ? {
              normalAttackSkillIds: parseStringArray(
                mode.normalAttackList,
                `${modePath}.normalAttackList`,
              ),
            }
          : {}),
        ...(overrideCmdMapping
          ? { commandSkillIds: parseCommandMapping(mode.cmdMapping, `${modePath}.cmdMapping`) }
          : {}),
      };
    },
  );

  return {
    allNormalAttackIds,
    allActiveSkillIds,
    allPassiveSkillIds,
    dodgeSkillId,
    normalAttackSkillIds: parseStringArray(bundle.normalAttackList, `${path}.normalAttackList`),
    breakingAttackSkillIds: [...enabledBreakingNormalAttacks],
    plungingAttackStartId: requireString(
      bundle.plungingAttackStartId,
      `${path}.plungingAttackStartId`,
    ),
    plungingAttackEndId: requireString(bundle.plungingAttackEndId, `${path}.plungingAttackEndId`),
    slotSkillIds: {
      battleSkill: normalSkillId,
      comboSkill: comboSkillId,
      ultimate: ultimateSkillId,
    },
    defaultCommandSkillIds: parseCommandMapping(
      bundle.defaultCmdMapping,
      `${path}.defaultCmdMapping`,
    ),
    initialNativeSkillTypeById,
    modes,
  };
}
