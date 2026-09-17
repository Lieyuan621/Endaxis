import { describe, expect, it } from 'vitest';
import catastrophe from './catastrophe';

describe('catastrophe gear set', () => {
  it('returns SP instead of recovering SP when its battle-skill trigger activates', () => {
    expect(catastrophe.triggers?.[0]?.effects[0]).toMatchObject({
      kind: 'spReturn',
      value: 50,
      icd: 999,
    });
  });
});
