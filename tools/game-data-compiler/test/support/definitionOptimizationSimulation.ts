/**
 * 新增生成优化的模拟对照夹具：两路使用同一场景，只替换候选定义。
 * 本文件只由测试或候选审计的 Vite 运行视图加载；生成器生产代码不依赖模拟器。
 */
import { createHash } from 'node:crypto';
import { gameDataRepository } from '../../../../src/data/gameDataRepository.ts';
import { skillSettings, skillSettingResources } from '../../../../src/data/combat/skillSettings.ts';
import {
  ScenarioSimulationService,
  type ScenarioSimulationRun,
} from '../../../../src/application/simulation/scenarioSimulationService.ts';
import { createEmptyScenario } from '../../../../src/core/project/createProject.ts';
import { listOperatorSkillDefinitionBindings } from '../../../../src/core/game-data/operatorSkillDefinitions.ts';
import type { OperatorDefinition } from '../../../../packages/game-data-contract/src/operators.ts';

import type { GameDataRepository } from '../../../../src/core/game-data/gameDataRepository.ts';
import type { ScenarioDocument } from '../../../../src/core/project/schema.ts';

/** 两条独立的可复现随机流；记录消耗次数，避免固定样本掩盖删掉一次抽样的错误。 */
export function createOptimizationRandomSamples() {
  const stream = (seed: number) => {
    let state = seed;
    let count = 0;
    return {
      next: () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        count++;
        return ((state >>> 0) + 0.5) / 0x1_0000_0000;
      },
      count: () => count,
    };
  };
  const critical = stream(0x13579bdf);
  const probability = stream(0x2468ace1);
  return {
    criticalSamples: { nextCriticalSample: critical.next },
    probabilitySamples: { nextProbabilitySample: probability.next },
    counts: () => ({ critical: critical.count(), probability: probability.count() }),
  };
}

/**
 * 稳定编码用于摘要比较。V8 对象序列化字节不是规范格式，普通 JSON 则会丢掉 undefined、
 * 非有限数、负零和集合内容。这里为每种值使用独立前缀，字符串与对象键按 JSON 转义。
 */
export function encodeOptimizationFacts(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'boolean':
      return value ? 'true' : 'false';
    case 'string':
      return `s${JSON.stringify(value)}`;
    case 'number':
      return `n${Object.is(value, -0) ? '-0' : String(value)}`;
    case 'bigint':
      return `b${value}`;
    case 'object': {
      if (Array.isArray(value))
        return `a${value.length}[${Array.from({ length: value.length }, (_, index) =>
          Object.hasOwn(value, index) ? encodeOptimizationFacts(value[index]) : 'hole',
        ).join(',')}]`;
      if (value instanceof Set)
        return `set[${[...value].map(encodeOptimizationFacts).sort().join(',')}]`;
      if (value instanceof Map)
        return `map[${[...value]
          .map(
            ([key, child]) => `${encodeOptimizationFacts(key)}:${encodeOptimizationFacts(child)}`,
          )
          .sort()
          .join(',')}]`;
      const prototype: unknown = Object.getPrototypeOf(value);
      if (prototype !== null && prototype !== Object.prototype)
        throw new Error('模拟事实编码遇到尚未支持的对象类型');
      return `o{${Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, child]) => `${JSON.stringify(key)}:${encodeOptimizationFacts(child)}`)
        .join(',')}}`;
    }
    default:
      throw new Error('模拟事实不能包含函数或 Symbol');
  }
}

export function optimizationSimulationService(
  index: GameDataRepository = gameDataRepository,
  random = createOptimizationRandomSamples(),
) {
  return new ScenarioSimulationService({
    index,
    criticalSamples: random.criticalSamples,
    probabilitySamples: random.probabilitySamples,
    repositoryRevision: 'optimization-differential',
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: skillSettingResources.atbGainEfficiency },
      spRecoveryPauseDuration: skillSettingResources.atbRecoverInterval,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: {
        selfGainPerSp: skillSettingResources.atbConsumedDefaultUspGainSelf,
        otherGainPerSp: skillSettingResources.atbConsumedDefaultUspGainOther,
      },
    },
  });
}

/** 仅排除编译树遍历记录；重映射所有可见产物的回执引用，战斗事件和诊断完整比较。 */
export function optimizationSimulationFacts(run: ScenarioSimulationRun): unknown {
  // 历史对象是存储视图；完整读取其事实后，按下面的规则重排可见回执引用。
  const { receiptHistory, ...facts } = run;
  const entries = receiptHistory
    .toArray()
    .filter(
      entry => entry.event !== 'CombatStepReached' && entry.event !== 'CombatConditionEvaluated',
    );
  const indexes = new Map(entries.map((entry, index) => [entry.sequence, index]));
  const reindex = (original: number): number => {
    const index = indexes.get(original);
    if (index === undefined) throw new Error(`可见产物仍引用被排除的内部遍历记录 ${original}`);
    return index;
  };
  // 优化会删除冗余节点，自编号节点身份随之平移；身份字符串本身不是可观察行为。
  // 按首次出现顺序重编号，保留"同身份/异身份"的相等结构，不抹掉归属合并错误。
  const identityAliases = new Map<string, string>();
  const alias = (original: string): string => {
    let renamed = identityAliases.get(original);
    if (renamed === undefined) {
      renamed = `#${identityAliases.size}`;
      identityAliases.set(original, renamed);
    }
    return renamed;
  };
  const visit = (value: unknown, key?: string): unknown => {
    if (key === 'sequence' && typeof value === 'number') return reindex(value);
    if (key === 'receiptSequences' && Array.isArray(value)) return value.map(reindex);
    if ((key === 'stepKey' || key === 'hitId') && typeof value === 'string') return alias(value);
    if (Array.isArray(value)) return value.map(item => visit(item));
    if (value === null || typeof value !== 'object') return value;
    // 资源快照中的许可标签是 Set。按普通对象遍历会抹成 {}，漏掉实际回能限制差异。
    if (value instanceof Set) return new Set([...value].map(item => visit(item)));
    if (value instanceof Map)
      return new Map([...value].map(([mapKey, item]) => [visit(mapKey), visit(item)] as const));
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== null && prototype !== Object.prototype)
      throw new Error('模拟事实摘要遇到尚未支持的对象类型，不能按空对象比较');
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, visit(child, key)]),
    );
  };
  return visit({ ...facts, receiptEntries: entries });
}

export function optimizationSimulationScenario(
  operator: OperatorDefinition,
  level: number,
  potential: number,
  includeVariants = false,
): ScenarioDocument {
  const scenario = createEmptyScenario(
    `optimization:${operator.slug}:${level}:${potential}`,
    '生成优化对照',
  );
  const bindings = listOperatorSkillDefinitionBindings(operator).filter(binding =>
    includeVariants
      ? binding.group.replacementSkillPlacements?.[binding.skill.key] !== 'internal'
      : binding.origin === 'base',
  );
  scenario.battle.durationFrames = bindings.length * 210 + 600;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
  scenario.tracks[0] = {
    id: operator.slug,
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential,
      trustLevel: 4,
      skillLevels: { basicAttack: level, battleSkill: level, comboSkill: level, ultimate: level },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    // 对照夹具显式放宽上限，保证终结技进入执行；不是修改正式游戏规则。
    initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
    skillCasts: bindings.map((binding, index) => ({
      id: `${operator.slug}:cast:${index}`,
      source: {
        kind: 'operatorSkill',
        skillGroupKey: binding.group.key,
        skillKey: binding.skill.key,
        ...(binding.variant === undefined ? {} : { variantKey: binding.variant.key }),
      },
      placement: { startFrame: 1 + index * 210 },
    })),
  };
  return scenario;
}

/** 每场结束即只保留摘要，避免把整批回执同时留在内存。 */
export async function auditOptimizationSimulationCases(includeEquipment: boolean) {
  const results: { id: string; digest: string; damageCount: number }[] = [];
  const execute = async (id: string, scenario: ScenarioDocument) => {
    const random = createOptimizationRandomSamples();
    let run: ScenarioSimulationRun;
    try {
      run = await optimizationSimulationService(gameDataRepository, random).simulate(
        scenario,
        scenario.battle.durationFrames,
      );
    } catch (cause) {
      throw new Error(`${id}: 候选模拟失败`, { cause });
    }
    const damageCount = run.receiptEntries.filter(entry => entry.event === 'DamageApplied').length;
    if (damageCount === 0) throw new Error(`${id}: 对照场景没有实际伤害，不能计作有效验证`);
    results.push({
      id,
      damageCount,
      digest: createHash('sha256')
        .update(
          encodeOptimizationFacts({
            facts: optimizationSimulationFacts(run),
            randomSamples: random.counts(),
          }),
        )
        .digest('hex'),
    });
  };
  const operators = gameDataRepository.getOperators();
  for (const operator of operators) {
    for (const [level, potential] of [
      [1, 0],
      [12, 5],
    ] as const) {
      const scenario = optimizationSimulationScenario(operator, level, potential, true);
      await execute(scenario.id, scenario);
    }
  }
  // 混合队伍让队友事件和跨技能状态有机会实际发生，不只比较单人面板。
  for (let index = 0; index < operators.length; index += 4) {
    const members = operators.slice(index, index + 4);
    const scenarios = members.map(operator =>
      optimizationSimulationScenario(operator, 12, 5, true),
    );
    const scenario = scenarios[0]!;
    scenario.id = `team:${index / 4}`;
    scenarios.forEach((member, slot) => {
      scenario.tracks[slot] = member.tracks[0]!;
    });
    scenario.battle.durationFrames = Math.max(...scenarios.map(item => item.battle.durationFrames));
    await execute(scenario.id, scenario);
  }
  if (includeEquipment) {
    for (const weapon of gameDataRepository.getWeapons()) {
      const operator = operators.find(value => value.weaponType === weapon.weaponType);
      if (operator === undefined) throw new Error(`${weapon.slug}: 没有可装备的测试干员`);
      // 静态词条裁剪必须覆盖整条等级数组，不能只用最高级伤害替代其余等级的检查。
      const maxTraitLevel = Math.max(...weapon.traits.map(trait => trait.levelCount));
      for (let rank = 1; rank <= maxTraitLevel; rank++) {
        const scenario = optimizationSimulationScenario(operator, 12, 5, true);
        scenario.tracks[0]!.weapon = {
          weaponSlug: weapon.slug,
          level: 90,
          tuned: true,
          potential: 5,
          traitLevels: weapon.traits.map(trait => Math.min(rank, trait.levelCount)),
        };
        await execute(`weapon:${weapon.slug}:rank:${rank}`, scenario);
      }
    }
    for (const gearSet of gameDataRepository.getGearSets()) {
      const scenario = optimizationSimulationScenario(operators[0]!, 12, 5, true);
      const gears = gameDataRepository.getGears().filter(gear => gear.gearSetSlug === gearSet.slug);
      for (const slot of ['armor', 'gloves', 'accessory1', 'accessory2'] as const) {
        const gear = gears.find(
          value => value.slotType === (slot.startsWith('accessory') ? 'accessory' : slot),
        );
        if (gear !== undefined)
          scenario.tracks[0]!.gears[slot] = {
            gearSlug: gear.slug,
            artificingLevels: gear.traits.map(trait => trait.levelCount - 1),
          };
      }
      if (Object.values(scenario.tracks[0]!.gears).filter(Boolean).length < 3)
        throw new Error(`${gearSet.slug}: 测试夹具无法凑齐三件套`);
      await execute(`gearSet:${gearSet.slug}`, scenario);
    }
  }
  return results;
}
