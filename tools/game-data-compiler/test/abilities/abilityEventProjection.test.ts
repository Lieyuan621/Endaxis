import { describe, expect, it } from 'vitest';
import { projectAbilityEvent } from '../../src/compiler/abilities/abilityEventProjection.ts';

describe('公共 AbilityEvent 身份投影', () => {
  it.each([
    ['OnAddedBuff', 9, 'addedBuff'],
    ['OnPoiseZero', 21, 'poiseZero'],
    ['OnEnemyBeforeTakeSpellInfliction', 121, 'beforeTakeInfliction'],
    ['OnAfterAddedShield', 147, 'afterAddedShield'],
    ['OnSetWeakness', 151, 'weaknessSet'],
    ['OnBuffEndsEarly', 204, 'buffEndsEarly'],
    ['OnBuffEnhanceChanged', 209, 'buffEnhanceChanged'],
    ['OnAbsorbBuff', 211, 'buffAbsorbed'],
    ['OnPoiseKnotBreak', 241, 'poiseKnotBreak'],
  ] as const)('%s 与数字 %s 投影成同一事件 %s', (nativeName, nativeId, expected) => {
    expect(projectAbilityEvent(nativeName, 'named')).toBe(expected);
    expect(projectAbilityEvent(nativeId, 'numeric')).toBe(expected);
  });

  it.each(['OnFutureEvent', 0, 999] as const)('未知事件 %s 严格失败', event => {
    expect(() => projectAbilityEvent(event, 'source.event')).toThrow(
      `source.event: unsupported ability event ${JSON.stringify(event)}`,
    );
  });
});
