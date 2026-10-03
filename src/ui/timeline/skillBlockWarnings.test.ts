import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import zh from '../../i18n/locales/zh-CN.json';
import en from '../../i18n/locales/en.json';
import { formatSkillBlockWarnings, indexSkillResourceWarnings } from './skillBlockWarnings';
import type { TimelineSkillDiagnosticReason } from './useScenarioSimulation';

const i18n = createI18n({ legacy: false, locale: 'zh', messages: { zh, en } });
function format(reasons: TimelineSkillDiagnosticReason[], definitionUnavailable = false) {
  return formatSkillBlockWarnings({
    reasons,
    definitionUnavailable,
    skillLabel: 'A4',
    castLabel: id => (id === 'previous-cast' ? 'A3' : undefined),
    t: (key, values) => i18n.global.t(key, values ?? {}),
  });
}

describe('技能块告警文案', () => {
  it('按技能块读取不足当时的资源，沿用旧版文案与三位小数格式', () => {
    const index = indexSkillResourceWarnings([
      {
        sequence: 0,
        frame: 1,
        time: 1 / 30,
        event: 'SkillCostUnavailableAtStart',
        data: { castId: 'battle', spNeed: 100, spCurrent: 99.12345 },
      },
      {
        sequence: 1,
        frame: 2,
        time: 2 / 30,
        event: 'SkillCostUnavailableAtStart',
        data: { castId: 'ultimate', ultimateEnergyNeed: 240, ultimateEnergyCurrent: 12.5 },
      },
      {
        sequence: 2,
        frame: 2,
        time: 2 / 30,
        event: 'SkillCostRejected',
        data: { castId: 'ultimate', ultimateEnergyNeed: 240, ultimateEnergyCurrent: 12.5 },
      },
    ]);
    const render = (id: string, reasons: TimelineSkillDiagnosticReason[]) =>
      formatSkillBlockWarnings({
        reasons,
        resourceWarnings: index.get(id),
        skillLabel: '技能',
        castLabel: () => undefined,
        t: (key, values) => i18n.global.t(key, values ?? {}),
      });
    expect(render('battle', ['resourceUnavailable'])).toBe(
      '技力不足，需要100，当前99.123\n模拟程序将强制执行技能。',
    );
    expect(render('ultimate', ['resourceUnavailable', 'costPaymentRejected'])).toBe(
      '终结技能量不足，需要240，当前12.5\n模拟程序将强制执行技能。',
    );
  });
  it('通过技能库反向索引显示实际操作段名称，无入口时使用通用提示', () => {
    const render = (actualSkillLabel: (id: string) => string | undefined) =>
      formatSkillBlockWarnings({
        reasons: ["skillInputMismatch: expected 'configured', actual 'native'"],
        skillLabel: '战技',
        castLabel: () => undefined,
        actualSkillLabel,
        t: (key, values) => i18n.global.t(key, values ?? {}),
      });
    expect(render(id => (id === 'native' ? '战技*' : undefined))).toBe(
      '此时进行该操作会触发战技*，而不是战技。\n模拟程序将强制执行战技。',
    );
    expect(render(() => undefined)).toBe('此时进行该操作不会触发战技。\n模拟程序将强制执行战技。');
  });

  it('使用所属技能块名称说明限制，不按实际技能 ID 反查名称', () => {
    const text = format([
      "skillInputMismatch: expected 'placed-skill', actual 'native-skill'",
      "skillInterruptUnavailable: cast 'previous-cast'",
      'cooldownUnavailable',
      'cooldownUnavailable',
    ]);
    expect(text).toBe(
      '此时进行该操作不会触发A4。\nA3尚不能被A4中断。\nA4尚未冷却完毕。\n模拟程序将强制执行A4。',
    );
  });

  it('无法判断时不把内部条件或 ID 暴露给玩家', () => {
    const text = format([
      "skillInputUnknown: command mapping target 'native-internal-id' is not unique",
      'skillInterruptUnknown: current skill has conditional next-skill actions',
    ]);
    expect(text).toContain('模拟暂时无法判断');
    expect(text).not.toMatch(/native|mapping|conditional|skillInputUnknown/);
  });

  it('未执行的连续组成员与无法读取定义的技能不声称仍执行', () => {
    for (const reason of ['skillGroupInputRejected', 'skillGroupInterrupted'] as const) {
      expect(format([reason])).toContain('未执行');
      expect(format([reason])).not.toContain('强制执行');
    }
    expect(format(['cooldownUnavailable'], true)).toContain('无法读取该技能的数据');
    expect(format(['cooldownUnavailable'], true)).not.toContain('强制执行');
    expect(format([])).toBe('');
  });

  it.each(['zh', 'en'] as const)('所有诊断在 %s 下均有文案', locale => {
    i18n.global.locale.value = locale;
    const reasons: TimelineSkillDiagnosticReason[] = [
      'resourceUnavailable',
      'cooldownUnavailable',
      'skillInputMismatch',
      'skillInputUnknown',
      'skillInterruptUnavailable',
      'skillInterruptUnknown',
      'ultimateInputDuringPresentation',
      'skillCommonTagUnavailable',
      'skillTypeTagUnavailable',
      'attackDuringDashWindow',
      'costPaymentRejected',
      'windowMissing',
      'releaseOrderMismatch',
      'skillStageMismatch',
      'skillGroupInputRejected',
      'skillGroupInterrupted',
    ];
    for (const reason of reasons) {
      const text = format([reason]);
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain(reason);
      expect(text).not.toContain('timeline.skillWarnings');
    }
    expect(Object.keys(en.timeline.skillWarnings).sort()).toEqual(
      Object.keys(zh.timeline.skillWarnings).sort(),
    );
    i18n.global.locale.value = 'zh';
  });
});
