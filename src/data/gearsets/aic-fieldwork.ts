import type { GearSetSheet } from '../types';

// AIC Fieldwork: DMG Dealt +20% (all types), 10% DMG Reduction (all types), Ultimate Gain
// Efficiency +10%. The DMG Reduction is a defensive stat and is not modeled.
const sheet: GearSetSheet = {
  effects: [
    {
      kind: 'status',
      stat: { modifier: 'dmgBonus' },
      target: 'self',
      value: 20,
    },
    {
      kind: 'status',
      stat: { modifier: 'ultimateGainEfficiency' },
      target: 'self',
      value: 10,
    },
  ],
};

export default sheet;
