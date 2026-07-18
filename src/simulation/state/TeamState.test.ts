import { describe, expect, it } from 'vitest';
import { TeamState } from './TeamState';

describe('TeamState', () => {
  it('consumes refund SP before recover SP', () => {
    const team = new TeamState(
      {
        maxSp: 200,
        initialSp: 0,
        spRegenRate: 0,
        skillSpCostDefault: 100,
        linkCdReduction: 0,
        prepDuration: 0,
      },
      {} as never,
    );

    team.addSp(40, 'recover');
    team.addSp(60, 'refund');

    const result = team.consumeSp(100);

    expect(result.refundConsumed).toBe(60);
    expect(result.recoverConsumed).toBe(40);
    expect(team.getRefundSp()).toBe(0);
    expect(team.getRecoverSp()).toBe(0);
  });

  it('displaces refund SP into recover while regenerating at cap', () => {
    const team = new TeamState(
      {
        maxSp: 100,
        initialSp: 0,
        spRegenRate: 10,
        skillSpCostDefault: 100,
        linkCdReduction: 0,
        prepDuration: 0,
      },
      {} as never,
    );

    team.addSp(40, 'recover');
    team.addSp(60, 'refund');

    team.advanceTime(10, 5);

    expect(team.getSp()).toBe(100);
    expect(team.getRefundSp()).toBe(0);
    expect(team.getRecoverSp()).toBe(100);
  });
});
