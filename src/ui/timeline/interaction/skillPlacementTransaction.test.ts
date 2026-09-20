import { describe, expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { SkillPlacementTransaction } from './skillPlacementTransaction';
import type { ScenarioSimulationService } from '../../../application/simulation/scenarioSimulationService';

type Result = Awaited<ReturnType<ScenarioSimulationService['planSkillChain']>>;
function setup() {
  let revision = 0;
  const pending: ((result: Result) => void)[] = [];
  const failures: ((error: unknown) => void)[] = [];
  const service = {
    planSkillChain: vi.fn(
      () =>
        new Promise<Result>((resolve, reject) => {
          pending.push(resolve);
          failures.push(reject);
        }),
    ),
  };
  const transaction = new SkillPlacementTransaction(service, () => revision);
  const placed = { scenario: createEmptyScenario('scenario', 'test'), skillCastIds: ['a', 'b'] };
  return { transaction, service, pending, failures, placed, edit: () => revision++ };
}

describe('SkillPlacementTransaction', () => {
  it.each(['incomplete', 'error'] as const)(
    '递归%s时替换为完整默认连段，不追加到推测前缀',
    async status => {
      const { transaction, pending, failures, placed } = setup();
      const fallback = {
        scenario: { ...placed.scenario, id: 'fallback' },
        skillCastIds: ['a', 'b', 'c', 'd', 'e', 'heavy'],
      };
      const result = transaction.resolve({
        ...placed,
        skillCastIds: ['a'],
        fallback,
        extension: {
          allowedSkillKeys: ['first', 'heavy'],
          terminalSkillKey: 'heavy',
          reservedCastIds: ['b'],
        },
      });
      if (status === 'error') failures[0]!(new Error('simulation failed'));
      else
        pending[0]!({
          status: 'incomplete',
          scenario: placed.scenario,
          skillCastIds: ['a', 'b', 'loop'],
          unresolvedCastIds: [],
        });
      expect(await result).toMatchObject({ ...fallback, incomplete: true });
    },
  );
  it('递归种子也进入规划，并返回前缀身份供一次提交与选择', async () => {
    const { transaction, pending, placed } = setup();
    const prefix = structuredClone(placed.scenario);
    const result = transaction.resolve({
      ...placed,
      skillCastIds: ['a'],
      extension: {
        allowedSkillKeys: ['first', 'heavy'],
        terminalSkillKey: 'heavy',
        reservedCastIds: ['b'],
      },
    });
    expect(pending).toHaveLength(1);
    pending[0]!({
      status: 'incomplete',
      scenario: prefix,
      skillCastIds: ['a', 'b'],
      unresolvedCastIds: [],
    });
    expect(await result).toEqual({ scenario: prefix, skillCastIds: ['a', 'b'], incomplete: true });
  });
  it('passes partial compact timing through without committing partial document changes', async () => {
    const { transaction, pending, placed } = setup();
    const result = transaction.resolve(placed, 'compact');
    const plannedStartFrames = new Map([['a', 0]]);
    pending[0]!({ status: 'incomplete', unresolvedCastIds: ['b'], plannedStartFrames });
    expect(await result).toEqual({
      scenario: placed.scenario,
      incomplete: true,
      plannedStartFrames,
    });
  });
  it.each(['continuation', 'compact'] as const)(
    'preserves editing and the error when %s planning fails',
    async mode => {
      const { transaction, failures, placed } = setup();
      const error = new Error('missing simulation input');
      const result = transaction.resolve(placed, mode);
      failures[0]!(error);
      expect(await result).toEqual({ scenario: placed.scenario, incomplete: true, error });
    },
  );
  it.each(['edit', 'cancel', 'newer'] as const)(
    'does not fall back over newer state after %s',
    async reason => {
      const { transaction, pending, failures, placed, edit } = setup();
      const first = transaction.resolve(placed);
      let second: ReturnType<typeof transaction.resolve> | undefined;
      if (reason === 'edit') edit();
      if (reason === 'cancel') transaction.cancel();
      if (reason === 'newer') second = transaction.resolve(placed);
      failures[0]!(new Error('late simulation failure'));
      expect(await first).toBeNull();
      if (second) {
        pending[1]!({ status: 'incomplete', unresolvedCastIds: ['b'] });
        expect(await second).not.toBeNull();
      }
    },
  );
  it('preserves default author placement when planning is unresolved', async () => {
    const { transaction, pending, placed } = setup();
    const result = transaction.resolve(placed);
    pending[0]!({ status: 'incomplete', unresolvedCastIds: ['b'] });
    expect(await result).toEqual({ scenario: placed.scenario, incomplete: true });
  });
  it.each(['edit', 'cancel', 'newer'] as const)('discards results after %s', async reason => {
    const { transaction, pending, placed, edit } = setup();
    const first = transaction.resolve(placed);
    let second: ReturnType<typeof transaction.resolve> | undefined;
    if (reason === 'edit') edit();
    if (reason === 'cancel') transaction.cancel();
    if (reason === 'newer') second = transaction.resolve(placed);
    pending[0]!({ status: 'incomplete', unresolvedCastIds: ['b'] });
    expect(await first).toBeNull();
    if (second) {
      pending[1]!({ status: 'incomplete', unresolvedCastIds: ['b'] });
      expect(await second).not.toBeNull();
    }
  });
  it('does not simulate individual skill placement', async () => {
    const { transaction, service, placed } = setup();
    expect(await transaction.resolve({ ...placed, skillCastIds: ['a'] })).toEqual({
      scenario: placed.scenario,
      incomplete: false,
    });
    expect(service.planSkillChain).not.toHaveBeenCalled();
  });
});
