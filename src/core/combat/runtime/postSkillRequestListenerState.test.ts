import { describe, expect, it } from 'vitest';
import { createPostSkillRequestListenerState } from '../state/environmentState';
import {
  registerPostSkillRequestListener,
  requirePostSkillRequestListener,
  unregisterPostSkillRequestListener,
} from '../skills/postSkillRequestListenerExecution';

describe('postSkillRequestListenerState', () => {
  it('复制后保留编号和顺序，兄弟分支独立注销', () => {
    const state = createPostSkillRequestListenerState();
    const first = registerPostSkillRequestListener(state, 'operator');
    const second = registerPostSkillRequestListener(state, 'operator');
    const saved = structuredClone(state);

    unregisterPostSkillRequestListener(state, 'operator', first);
    expect(state.registrationsByOwner.get('operator')).toEqual([second]);
    expect(saved.registrationsByOwner.get('operator')).toEqual([first, second]);
    expect(saved.nextRegistrationId).toBe(2);
    expect(() => requirePostSkillRequestListener(saved, 'operator', first)).not.toThrow();
    expect(() => requirePostSkillRequestListener(saved, 'operator', 99)).toThrow('is missing');
  });
});
