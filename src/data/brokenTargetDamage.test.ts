import { describe, expect, it } from 'vitest';
import aburreyAuditoryChip from './gearpieces/aburreys-legacy/aburrey-auditory-chip';
import aburreyGauntlets from './gearpieces/aburreys-legacy/aburrey-gauntlets';
import bonekrushaMask from './gearpieces/bonekrusha/bonekrusha-mask';
import thertechPlating from './gearpieces/thertech/thertech-plating';

describe('damage bonus against staggered targets', () => {
  it.each([
    ['Bonekrusha Mask', bonekrushaMask],
    ['Æthertech Plating', thertechPlating],
    ['Aburrey Gauntlets', aburreyGauntlets],
    ['Aburrey Auditory Chip', aburreyAuditoryChip],
  ])('%s uses a conditional self damage bonus', (_name, sheet) => {
    expect(sheet.skill3?.effects?.[0]).toMatchObject({
      kind: 'status',
      stat: {
        modifier: 'dmgBonus',
        elements: ['physical', 'heat', 'cryo', 'electric', 'nature'],
      },
      target: 'self',
      condition: { kind: 'enemyStaggered' },
    });
  });
});
