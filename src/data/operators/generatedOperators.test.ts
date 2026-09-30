import { describe, expect, it } from 'vitest';
import type { OperatorDefinition } from '../../core/game-data/operatorDefinition';
import { operatorDefinitions } from './index';

function hasUpgradeBehavior(
  upgrade: OperatorDefinition['talents'][number] | OperatorDefinition['potentials'][number],
): boolean {
  return (
    (upgrade.modifiers?.length ?? 0) > 0 ||
    (upgrade.eventHandlers?.length ?? 0) > 0 ||
    (upgrade.passiveSkills?.length ?? 0) > 0 ||
    (upgrade.attachedBuffs?.length ?? 0) > 0 ||
    upgrade.initializationSequence !== undefined ||
    upgrade.simulationNoEffect !== undefined
  );
}

describe('正式干员转换支持信息', () => {
  it('所有正式干员对尚无可执行行为的养成保留明确缺口', () => {
    const issues = operatorDefinitions.flatMap(operator => {
      const capabilities = new Set(
        operator.conversionSupport?.missingCapabilities.map(item => item.capability),
      );
      const operatorIssues: string[] = [];
      if (
        operator.conversionSupport?.completeness !==
        (capabilities.size === 0 ? 'complete' : 'partial')
      ) {
        operatorIssues.push(`${operator.slug}: conversion completeness differs from capabilities`);
      }
      if (
        operator.talents.some(talent => !hasUpgradeBehavior(talent)) &&
        !capabilities.has('talentEffects')
      ) {
        operatorIssues.push(`${operator.slug}: missing talentEffects gap`);
      }
      if (
        operator.potentials.some(potential => !hasUpgradeBehavior(potential)) &&
        !capabilities.has('potentialEffects')
      ) {
        operatorIssues.push(`${operator.slug}: missing potentialEffects gap`);
      }
      return operatorIssues;
    });
    expect(issues).toEqual([]);
  });
});
