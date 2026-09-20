import { describe, expect, it } from 'vitest';
import { freezeAttackReceiptDetail, type AttackReceiptSnapshot } from './attackReceiptDetail';

const detail: AttackReceiptSnapshot = {
  panelAttack: 150,
  operatorBaseAttack: 80,
  weaponBaseAttack: 20,
  attackPercent: 0.5,
  flatAttack: 0,
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
  coefficients: { strength: 0, agility: 0, intellect: 0.005, will: 0.002 },
};
describe('freezeAttackReceiptDetail', () => {
  it('freezes exact scalar components independently of later changes', () => {
    const receipt = freezeAttackReceiptDetail(150, detail);
    expect(receipt).toMatchObject({
      attackDetailOperatorBase: 80,
      attackDetailWeaponBase: 20,
      attackDetailAttackPercent: 0.5,
      attackDetailMainAttribute: 'intellect',
    });
  });
  it('does not claim stale static components for a dynamically changed attack', () => {
    expect(freezeAttackReceiptDetail(180, detail)).toEqual({});
    expect(freezeAttackReceiptDetail(150, undefined)).toEqual({});
  });
});
