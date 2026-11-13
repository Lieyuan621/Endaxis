import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  projectControlSwitchMarkers,
  projectControlSwitchWarnings,
  controlSwitchDiagnosticKey,
} from './controlSwitchMarkers';

const tracks = [null, { id: 'operator' }];
const entries: CombatReceiptEntry[] = [
  { sequence: 1, frame: 10, time: 1 / 3, event: 'SkillControlSwitched', sourceId: 'operator' },
  { sequence: 2, frame: 20, time: 2 / 3, event: 'AutomaticControlSwitched', sourceId: 'operator' },
];

describe('主控切换标记', () => {
  it('诊断按目标轨道、帧与切换入口隔离，合并两侧限制且忽略已移除轨道', () => {
    const warning = {
      sequence: 3,
      frame: 10,
      time: 1 / 3,
      event: 'ControlSwitchBlockedByTag',
      sourceId: 'operator',
      targetId: 'previous',
      data: { switchKind: 'manual', blocker: 'CantMainCharSwitched' },
    };
    const warnings = projectControlSwitchWarnings(
      [
        warning,
        {
          ...warning,
          sequence: 4,
          targetId: 'operator',
          data: { switchKind: 'manual', blocker: 'CantSwitchToCenter' },
        },
        { ...warning, sequence: 5 },
        { ...warning, sequence: 6, sourceId: 'removed' },
      ],
      tracks,
    );
    expect([...warnings]).toEqual([
      [
        controlSwitchDiagnosticKey(1, 10, 'manual'),
        ['controlSwitchOutUnavailable', 'controlSwitchInUnavailable'],
      ],
    ]);
    expect(warnings.get(controlSwitchDiagnosticKey(1, 10, 'skill'))).toBeUndefined();
    expect(warnings.get(controlSwitchDiagnosticKey(1, 11, 'manual'))).toBeUndefined();
  });
  it('关闭自动切人时仍显示技能机制切换标记', () => {
    expect(projectControlSwitchMarkers(entries, tracks, false)).toEqual([
      { id: 'control-switch:1', frame: 10, trackIndex: 1, kind: 'skill' },
    ]);
  });

  it('开启自动切人时分别保留两种来源', () => {
    expect(projectControlSwitchMarkers(entries, tracks, true)).toEqual([
      { id: 'control-switch:1', frame: 10, trackIndex: 1, kind: 'skill' },
      { id: 'control-switch:2', frame: 20, trackIndex: 1, kind: 'automatic' },
    ]);
  });

  it('忽略其他回执、缺少来源及已移除的轨道', () => {
    expect(
      projectControlSwitchMarkers(
        [
          { ...entries[0]!, event: 'OtherEvent' },
          { sequence: 3, frame: 30, time: 1, event: 'SkillControlSwitched' },
          { ...entries[0]!, sourceId: 'removed' },
        ],
        tracks,
        true,
      ),
    ).toEqual([]);
  });
});
