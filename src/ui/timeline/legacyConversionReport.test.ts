import { describe, expect, it } from 'vitest';
import { formatLegacyConversionReport } from './legacyConversionReport';

describe('legacy conversion report', () => {
  it('summarizes recoverable omissions and their exact locations', () => {
    const text = formatLegacyConversionReport({
      issues: [{ path: 'axis/0/3', message: '缺少技能映射' }],
      fatalIssues: [],
      unresolvedSkills: [{}],
      identityChanges: [{}, {}],
      sequenceExpansions: [{}],
      resourceAdjustments: [],
      timingAdjustments: [{}],
      skillFormAdjustments: [],
      controlSwitchAdjustments: [],
      inferredControlSwitches: [],
    });
    expect(text).toContain('项目已转换并打开');
    expect(text).toContain('自动调整：4 项');
    expect(text).toContain('省略无法识别的技能块：1 个');
    expect(text).toContain('axis/0/3：缺少技能映射');
  });

  it('clearly distinguishes a fatal project-level failure', () => {
    const text = formatLegacyConversionReport({
      issues: [],
      fatalIssues: [{ path: '', message: '没有可转换的方案' }],
      unresolvedSkills: [],
      identityChanges: [],
      sequenceExpansions: [],
      resourceAdjustments: [],
      timingAdjustments: [],
      skillFormAdjustments: [],
      controlSwitchAdjustments: [],
      inferredControlSwitches: [],
    });
    expect(text).toContain('无法建立可打开的新版项目');
    expect(text).toContain('没有可转换的方案');
  });
});
