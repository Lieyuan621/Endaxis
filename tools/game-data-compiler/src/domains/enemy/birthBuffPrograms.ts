import type { OperatorBuffDefinitions } from '../../../../../packages/game-data-contract/src/index.ts';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { compileStandardStumpBuffClosure } from '../../compiler/buffs/standardStumpBuffClosure.ts';
import { finalizeDefinitionResources } from '../../compiler/finalizeDefinitions.ts';
import { readGeneratedTimeDilationPriorities } from '../../compiler/catalogs/generatedTimeDilationCatalog.ts';
import { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';

interface EnemyBirthBuffRuntime {
  readonly rootBuffId: string;
  readonly buffDefinitions: OperatorBuffDefinitions;
}

/** 已核准的出生入口；未核准的关卡专属联动变体保持未支持。 */
export const ENEMY_BIRTH_BUFF_NAMES: Readonly<Record<string, string>> = {
  // 出生携带五属性 50% 减伤；解除依赖敌人主动技能，不模拟该解除过程。
  buff_eny_0082_hsbear_hdg018_shield: 'resourceMonitor.enemy.birthDamageReduction',
  buff_common_maxpoiseadd: 'resourceMonitor.enemy.birthMaxPoise',
  buff_dung_maxpoisemulti: 'resourceMonitor.enemy.birthMaxPoise',
  buff_dung_healhp_loop: 'resourceMonitor.enemy.birthHealing',
  buff_common_BalanceResistance: 'resourceMonitor.enemy.birthResistanceOverride',
  buff_common_immunepoise: 'resourceMonitor.enemy.birthPoiseImmune',
  buff_dung_physicalstatus_enemy: 'resourceMonitor.enemy.birthPhysicalReduction',
  buff_dung_spellstatus_enemy: 'resourceMonitor.enemy.birthSpellReduction',
  buff_race_enemy_add_atb_on_death: 'resourceMonitor.enemy.birthDeathSp',
  buff_eny_0127_bigents_showhp: 'resourceMonitor.enemy.countShield',
  buff_eny_0127_bigents_showhp_tower019: 'resourceMonitor.enemy.countShield',
  buff_eny_0128_babyents_showhp: 'resourceMonitor.enemy.countShield',
  buff_eny_0128_babyents_showhp_hdg032: 'resourceMonitor.enemy.countShield',
  buff_eny_0128_babyents_cc_showhp: 'resourceMonitor.enemy.countShield',
  buff_eny_0129_slwood_showhp: 'resourceMonitor.enemy.countShield',
  buff_eny_0129_slwood_showhp_first: 'resourceMonitor.enemy.countShield',
};
const ENEMY_BIRTH_BUFF_ROOTS = Object.keys(ENEMY_BIRTH_BUFF_NAMES);

/** 出生 Buff 复用公共闭包编译器；不在敌人适配器中重写免伤、计数或破盾规则。 */
export function compileEnemyBirthBuffPrograms(
  directory: string,
  gameplayTagPaths: readonly string[],
): Readonly<Record<string, EnemyBirthBuffRuntime>> {
  const priorities = readGeneratedTimeDilationPriorities(
    'src/data/combat/timeDilationCatalog.generated.ts',
  );
  const result: Record<string, EnemyBirthBuffRuntime> = {};
  for (const rootBuffId of ENEMY_BIRTH_BUFF_ROOTS) {
    if (!existsSync(join(directory, `${rootBuffId}.json`))) continue;
    const closure = compileStandardStumpBuffClosure(
      [rootBuffId],
      (id: string) => JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8')),
      undefined,
      undefined,
      undefined,
      () => ({
        resolveTimeDilationPriority: (id, path) => {
          const value = priorities.get(id);
          if (value === undefined) throw new Error(`${path}: unknown time dilation priority ${id}`);
          return value;
        },
      }),
      new Map([[rootBuffId, 'enemy']]),
      new Set([rootBuffId]),
      new GameplayTagRegistry(gameplayTagPaths),
      new Map([[rootBuffId, 'enemy']]),
    );
    const blocked = closure.diagnostics.filter(item => item.status === 'blocked');
    if (blocked.length)
      throw new Error(`${rootBuffId}: ${blocked.map(item => item.reason).join('\n')}`);
    const { value } = finalizeDefinitionResources<{ buffDefinitions: OperatorBuffDefinitions }>(
      { buffDefinitions: closure.definitions },
      'apply',
    );
    result[rootBuffId] = { rootBuffId, buffDefinitions: value.buffDefinitions };
  }
  return result;
}
