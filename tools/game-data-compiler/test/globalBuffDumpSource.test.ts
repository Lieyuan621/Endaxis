import { describe, expect, it } from 'vitest';
import { parseGlobalBuffDumpSource } from '../src/source/globalBuffDumpSource.ts';

const dump = `MonoBehaviour Base
\tGlobalBuffData globalBuffData
\t\tstring id = "global_test"
\t\tUInt8 lifeType = 0
\t\tBlackboardDouble duration
\t\t\tUInt8 useBlackboardKey = 1
\t\t\tfloat value = 0
\t\t\tstring blackboardKey = "duration"
\t\tBlackboardDouble triggerInterval
\t\t\tUInt8 useBlackboardKey = 0
\t\t\tfloat value = 0
\t\t\tstring blackboardKey = ""
\t\tUInt8 waitFirstTriggerInterval = 1
\t\tBlackboardInt maxTriggerCnt
\t\t\tUInt8 useBlackboardKey = 0
\t\t\tint value = 1
\t\t\tstring blackboardKey = ""
\t\tGlobalBuffStackingSettings stackingSettings
\t\t\tUInt8 identifierType = 0
\t\t\tSInt16 stackingType = 2
\t\t\tstring stackingKey = ""
\t\t\tUInt8 usePriorityKey = 0
\t\t\tstring priorityKey = ""
\t\t\tUInt8 negatePriority = 0
\t\t\tfloat priority = 0
\t\t\tint maxStackCnt = 4
\t\tUInt8 applyIconDurationToBuffs = 0
\t\tBuffInput buffInputs
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tBuffInput data
\t\t\t\t\tstring buffId = "buff_child"
\t\t\t\t\tUInt8 assignBlackboard = 1
\t\t\t\t\tAssignPair assignItems
\t\t\t\t\t\tArray Array
\t\t\t\t\t\tint size = 1
\t\t\t\t\t\t\t[0]
\t\t\t\t\t\t\tAssignPair data
\t\t\t\t\t\t\t\tstring targetKey = "scale"
\t\t\t\t\t\t\t\tstring inputValueKey = "scale"
\t\t\t\t\t\t\t\tUInt8 useDirectValue = 0
\t\t\t\t\t\t\t\tint directValueType = 0
\t\t\t\t\t\t\t\tfloat numericValue = 0
\t\t\t\t\t\t\t\tstring stringValue = ""
\t\tData globalModifier
\t\t\tArray Array
\t\t\tint size = 0
\t\tGlobalBuffActionMap globalBuffEventAction
\t\t\tArray Array
\t\t\tint size = 0
\t\tDataPair blackboard
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tDataPair data
\t\t\t\t\tstring key = "duration"
\t\t\t\t\tdouble valueDouble = 0
\t\t\t\t\tstring valueStr = ""
\t\t\t\t\tUInt8 isDynamic = 0
\tManagedReferencesRegistry references
`;

describe('GlobalBuff TypeTree source', () => {
  it('preserves parent lifetime, stacking, children, assignments and blackboard', () => {
    expect(parseGlobalBuffDumpSource(dump, 'global.fixture').template).toMatchObject({
      id: 'global_test',
      lifeType: 'Limited',
      duration: { useBlackboardKey: true, blackboardKey: 'duration' },
      stackingIdentifierType: 'Id',
      stackingType: 'Stack',
      maxStackCount: 4,
      buffInputs: [
        {
          buffId: 'buff_child',
          assignBlackboard: true,
          assignItems: [{ targetKey: 'scale', directValueType: 'Numeric' }],
        },
      ],
      blackboard: [{ key: 'duration', valueDouble: 0, isDynamic: false }],
    });
  });

  it('preserves native shared-SP recovery modifiers and their blackboard operand', () => {
    const withModifier = dump
      .replace(
        `\t\tData globalModifier
\t\t\tArray Array
\t\t\tint size = 0`,
        `\t\tData globalModifier
\t\t\tArray Array
\t\t\tint size = 1
\t\t\t\t[0]
\t\t\t\tData data
\t\t\t\t\tint type = 0
\t\t\t\t\tint formulaItem = 1
\t\t\t\t\tBlackboardDouble param
\t\t\t\t\t\tUInt8 useBlackboardKey = 1
\t\t\t\t\t\tfloat value = 0
\t\t\t\t\t\tstring blackboardKey = "ratio"
\t\t\t\t\tUInt8 applyToReturnAtbGain = 1`,
      )
      .replace('\t\t\t\t\tstring key = "duration"', '\t\t\t\t\tstring key = "ratio"')
      .replace('\t\t\t\t\tdouble valueDouble = 0', '\t\t\t\t\tdouble valueDouble = -0.1');

    expect(parseGlobalBuffDumpSource(withModifier, 'modifier.fixture').template).toMatchObject({
      globalModifierCount: 1,
      globalModifiers: [
        {
          attribute: 'spRecovery',
          operation: 'multiplier',
          value: { useBlackboardKey: true, blackboardKey: 'ratio' },
          applyToReturnSpGain: true,
        },
      ],
      blackboard: [{ key: 'ratio', valueDouble: -0.1 }],
    });
  });

  it('fails closed for unsupported behavior and malformed collection counts', () => {
    expect(() =>
      parseGlobalBuffDumpSource(
        dump.replace(
          '\t\tGlobalBuffActionMap globalBuffEventAction\n\t\t\tArray Array\n\t\t\tint size = 0',
          '\t\tGlobalBuffActionMap globalBuffEventAction\n\t\t\tArray Array\n\t\t\tint size = 1',
        ),
        'event',
      ),
    ).toThrow('non-empty GlobalBuff event behavior');
    expect(() =>
      parseGlobalBuffDumpSource(
        dump.replace('\t\t\tint size = 1\n\t\t\t\t[0]', '\t\t\tint size = 2\n\t\t\t\t[0]'),
        'count',
      ),
    ).toThrow('GlobalBuff input count mismatch');
    expect(() =>
      parseGlobalBuffDumpSource(
        dump.replace('UInt8 identifierType = 0', 'UInt8 identifierType = 1'),
        'identity',
      ),
    ).toThrow('unsupported GlobalBuff identifierType');
  });
});
