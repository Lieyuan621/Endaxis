import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../combat/receipt/combatReceipt';
import { recordDodgeReceipt } from '../combat/skills/dodgeInputRuntime';
import { projectDodgeMarkerDiagnostics } from './dodgeMarkerDiagnostics';

describe('闪避标签结果投影', () => {
  it('执行、作者声明和原生技能启动分别显示，未知事实不冒充违规', () => {
    const receipt = new CombatReceiptCollector();
    const clock = { frame: 1, time: 1 / 30 };
    recordDodgeReceipt(receipt, clock, 'op', 'one', {
      event: 'DashInputExecuted',
      data: {
        direction: 'forward',
        timingKnown: true,
        interruptedSkillId: 'attack1',
        interruptedCastId: 'cast-a1',
      },
    });
    recordDodgeReceipt(receipt, clock, 'op', 'one', {
      event: 'DodgeInputPartiallySimulated',
      data: { missingDashTiming: true },
    });
    recordDodgeReceipt(receipt, clock, 'op', 'one', { event: 'PerfectDodgeDeclared', data: {} });
    recordDodgeReceipt(receipt, clock, 'op', 'one', {
      event: 'PerfectDodgeSkillStarted',
      data: {},
    });
    expect(projectDodgeMarkerDiagnostics(receipt.entries).get('one')).toEqual({
      status: 'unverified',
      messages: [
        { code: 'executed' },
        { code: 'interruptedSkill', castId: 'cast-a1' },
        { code: 'missingDashTiming' },
        { code: 'perfectDodgeDeclared' },
        { code: 'perfectDodgeSkillStarted' },
      ],
    });
  });
  it('没有产生原生成功时显示原因，不误显示为已启动', () => {
    const receipt = new CombatReceiptCollector();
    recordDodgeReceipt(receipt, { frame: 40, time: 40 / 30 }, 'op', 'expired', {
      event: 'PerfectDodgeDeclarationRejected',
      data: { reason: 'nativeSuccessNotTriggered' },
    });
    expect(projectDodgeMarkerDiagnostics(receipt.entries).get('expired')).toEqual({
      status: 'warning',
      messages: [{ code: 'nativeSuccessNotTriggered' }],
    });
  });
});
