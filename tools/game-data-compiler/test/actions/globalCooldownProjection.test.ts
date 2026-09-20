import { describe, expect, it } from 'vitest';
import { projectGlobalCooldownTarget } from '../../src/compiler/actions/globalCooldownProjection.ts';
import { BUFF_ACTION_CONTEXT } from '../../src/compiler/combatProjectionCommon.ts';

describe('全局冷却公共目标投影', () => {
  it.each([
    ['Owner', 'buffOwner'],
    ['Source', 'caster'],
  ] as const)('%s 保留 %s 身份，不被事件 Target 或固定 Owner 覆盖', (source, expected) => {
    expect(
      projectGlobalCooldownTarget(
        { targetSource: source, targetGroupKey: '' },
        { ...BUFF_ACTION_CONTEXT, actionTargetTarget: 'enemy', fixedBuffOwnerTarget: 'caster' },
        'test',
      ),
    ).toBe(expected);
  });
  it('接收侧 Source 保持 buffSource；未知/非角色宿主及 Context 仍拒绝', () => {
    expect(
      projectGlobalCooldownTarget(
        { targetSource: 'Source', targetGroupKey: '' },
        { ...BUFF_ACTION_CONTEXT, actionSourceTarget: 'buffSource' },
        'test',
      ),
    ).toBe('buffSource');
    for (const owner of ['unavailable', 'currentAbilityEntity'] as const)
      expect(() =>
        projectGlobalCooldownTarget(
          { targetSource: 'Owner', targetGroupKey: '' },
          { ...BUFF_ACTION_CONTEXT, actionOwnerTarget: owner },
          'test',
        ),
      ).toThrow('character target');
    expect(() =>
      projectGlobalCooldownTarget(
        { targetSource: 'Owner', targetGroupKey: '' },
        { ...BUFF_ACTION_CONTEXT, fixedBuffOwnerTarget: 'enemy' },
        'test',
      ),
    ).toThrow('character target');
    expect(() =>
      projectGlobalCooldownTarget(
        { targetSource: 'Owner', targetGroupKey: 'group' },
        BUFF_ACTION_CONTEXT,
        'test',
      ),
    ).toThrow('character target');
    expect(() =>
      projectGlobalCooldownTarget(
        { targetSource: 'Target', targetGroupKey: '' },
        BUFF_ACTION_CONTEXT,
        'test',
      ),
    ).toThrow('character target');
  });
});
