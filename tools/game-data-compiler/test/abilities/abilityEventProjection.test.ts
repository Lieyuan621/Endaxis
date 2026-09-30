import { describe, expect, it } from 'vitest';
import { projectAbilityEvent } from '../../src/compiler/abilities/abilityEventProjection.ts';

describe('公共 AbilityEvent 身份投影', () => {
  it('同一原生事件的名称和非连续数字 ID 投影为同一身份', () => {
    expect(projectAbilityEvent('OnEnemyBeforeTakeSpellInfliction', 'named')).toBe(
      'beforeTakeInfliction',
    );
    expect(projectAbilityEvent(121, 'numeric')).toBe('beforeTakeInfliction');
  });

  it.each(['OnFutureEvent', 999] as const)('未知事件 %s 严格失败', event => {
    expect(() => projectAbilityEvent(event, 'source.event')).toThrow(
      `source.event: unsupported ability event ${JSON.stringify(event)}`,
    );
  });
});
