import { createHash } from 'node:crypto';

const LIFE_TYPES = ['Limited', 'Infinity'] as const;
const STACKING_TYPES = [
  'Unlimited',
  'HighPriority',
  'Stack',
  'Refresh',
  'Extend',
  'StackAndRefresh',
  'OverwriteDuration',
] as const;
const DIRECT_VALUE_TYPES = ['Numeric', 'String', 'Any'] as const;

export interface GlobalBuffDumpSource {
  readonly template: Record<string, unknown>;
  readonly sha256: string;
}

/** 严格读取当前产品闭包所需的简单 GlobalBuffData TypeTree。 */
export function parseGlobalBuffDumpSource(text: string, sourcePath: string): GlobalBuffDumpSource {
  const dataStart = text.indexOf('\tGlobalBuffData globalBuffData');
  const referencesStart = text.indexOf('\tManagedReferencesRegistry references');
  if (dataStart < 0 || referencesStart <= dataStart)
    throw new Error(`${sourcePath}: GlobalBuffData section not found`);
  const block = text.slice(dataStart, referencesStart);
  const id = stringField(block, 'id', sourcePath, 2, false);
  const lifeType = enumValue(
    LIFE_TYPES,
    integerField(block, 'UInt8', 'lifeType', sourcePath, 2),
    sourcePath,
    'lifeType',
  );
  const duration = scalar(
    blockBetween(
      block,
      '\t\tBlackboardDouble duration',
      '\t\tBlackboardDouble triggerInterval',
      sourcePath,
    ),
    'float',
    sourcePath,
  );
  const triggerInterval = scalar(
    blockBetween(
      block,
      '\t\tBlackboardDouble triggerInterval',
      '\t\tUInt8 waitFirstTriggerInterval',
      sourcePath,
    ),
    'float',
    sourcePath,
  );
  const maxTriggerCount = scalar(
    blockBetween(
      block,
      '\t\tBlackboardInt maxTriggerCnt',
      '\t\tGlobalBuffStackingSettings stackingSettings',
      sourcePath,
    ),
    'int',
    sourcePath,
  );
  const stacking = blockBetween(
    block,
    '\t\tGlobalBuffStackingSettings stackingSettings',
    '\t\tUInt8 applyIconDurationToBuffs',
    sourcePath,
  );
  const identifierTypeValue = integerField(stacking, 'UInt8', 'identifierType', sourcePath, 3);
  if (identifierTypeValue !== 0)
    throw new Error(`${sourcePath}: unsupported GlobalBuff identifierType ${identifierTypeValue}`);

  const buffs = blockBetween(
    block,
    '\t\tBuffInput buffInputs',
    '\t\tData globalModifier',
    sourcePath,
  );
  const buffCount = declaredSize(buffs, sourcePath, 'buff input', 3);
  const buffStarts = [...buffs.matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}BuffInput data\r?$/gm)];
  if (buffStarts.length !== buffCount)
    throw new Error(`${sourcePath}: GlobalBuff input count mismatch`);
  const buffInputs = buffStarts.map((entry, index) => {
    requireIndex(entry, index, sourcePath, 'buff input');
    const child = buffs.slice(
      entry.index! + entry[0].length,
      buffStarts[index + 1]?.index ?? buffs.length,
    );
    const assignmentsStart = child.indexOf('\t\t\t\t\tAssignPair assignItems');
    if (assignmentsStart < 0) throw new Error(`${sourcePath}: missing GlobalBuff assignments`);
    const assignments = child.slice(assignmentsStart);
    const assignmentCount = declaredSize(assignments, sourcePath, 'assignment', 6);
    const assignmentStarts = [
      ...assignments.matchAll(/^\t{7}\[(\d+)\]\r?\n\t{7}AssignPair data\r?$/gm),
    ];
    if (assignmentStarts.length !== assignmentCount)
      throw new Error(`${sourcePath}: GlobalBuff assignment count mismatch`);
    return {
      buffId: stringField(child, 'buffId', sourcePath, 5, false),
      assignBlackboard: booleanField(child, 'assignBlackboard', sourcePath, 5),
      assignItems: assignmentStarts.map((assignment, assignmentIndex) => {
        requireIndex(assignment, assignmentIndex, sourcePath, 'assignment');
        const item = assignments.slice(
          assignment.index! + assignment[0].length,
          assignmentStarts[assignmentIndex + 1]?.index ?? assignments.length,
        );
        return {
          targetKey: stringField(item, 'targetKey', sourcePath, 8, false),
          inputValueKey: stringField(item, 'inputValueKey', sourcePath, 8, true),
          useDirectValue: booleanField(item, 'useDirectValue', sourcePath, 8),
          directValueType: enumValue(
            DIRECT_VALUE_TYPES,
            integerField(item, 'int', 'directValueType', sourcePath, 8),
            sourcePath,
            'directValueType',
          ),
          numericValue: numberField(item, 'float', 'numericValue', sourcePath, 8),
          stringValue: stringField(item, 'stringValue', sourcePath, 8, true),
        };
      }),
    };
  });

  const modifier = blockBetween(
    block,
    '\t\tData globalModifier',
    '\t\tGlobalBuffActionMap globalBuffEventAction',
    sourcePath,
  );
  const events = blockBetween(
    block,
    '\t\tGlobalBuffActionMap globalBuffEventAction',
    '\t\tDataPair blackboard',
    sourcePath,
  );
  const globalModifierCount = declaredSize(modifier, sourcePath, 'global modifier', 3);
  const globalEventCount = declaredSize(events, sourcePath, 'global event', 3);
  if (globalEventCount !== 0)
    throw new Error(`${sourcePath}: non-empty GlobalBuff event behavior is unsupported`);
  const modifierStarts = [...modifier.matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}Data data\r?$/gm)];
  if (modifierStarts.length !== globalModifierCount)
    throw new Error(`${sourcePath}: GlobalBuff global modifier count mismatch`);
  const globalModifiers = modifierStarts.map((entry, index) => {
    requireIndex(entry, index, sourcePath, 'global modifier');
    const item = modifier.slice(
      entry.index! + entry[0].length,
      modifierStarts[index + 1]?.index ?? modifier.length,
    );
    const nativeType = integerField(item, 'int', 'type', sourcePath, 5);
    const attribute = [
      'spRecovery',
      'gainEfficiency',
      null,
      null,
      'normalAttackEfficiency',
      'powerAttackEfficiency',
    ][nativeType];
    if (attribute === undefined || attribute === null)
      throw new Error(`${sourcePath}: unsupported GlobalBuff global modifier type ${nativeType}`);
    const nativeOperation = integerField(item, 'int', 'formulaItem', sourcePath, 5);
    const operation =
      nativeOperation === 0 ? 'addition' : nativeOperation === 1 ? 'multiplier' : null;
    if (operation === null)
      throw new Error(
        `${sourcePath}: unsupported GlobalBuff modifier operation ${nativeOperation}`,
      );
    return {
      attribute,
      operation,
      value: scalar(item, 'float', sourcePath, 6),
      applyToReturnSpGain: booleanField(item, 'applyToReturnAtbGain', sourcePath, 5),
    };
  });

  const blackboardBlock = block.slice(block.indexOf('\t\tDataPair blackboard'));
  const blackboardCount = declaredSize(blackboardBlock, sourcePath, 'blackboard', 3);
  const blackboardStarts = [
    ...blackboardBlock.matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}DataPair data\r?$/gm),
  ];
  if (blackboardStarts.length !== blackboardCount)
    throw new Error(`${sourcePath}: GlobalBuff blackboard count mismatch`);
  const blackboard = blackboardStarts.map((entry, index) => {
    requireIndex(entry, index, sourcePath, 'blackboard');
    const pair = blackboardBlock.slice(
      entry.index! + entry[0].length,
      blackboardStarts[index + 1]?.index ?? blackboardBlock.length,
    );
    return {
      key: stringField(pair, 'key', sourcePath, 5, false),
      valueDouble: numberField(pair, 'double', 'valueDouble', sourcePath, 5),
      valueStr: stringField(pair, 'valueStr', sourcePath, 5, true),
      isDynamic: booleanField(pair, 'isDynamic', sourcePath, 5),
    };
  });

  return {
    template: {
      id,
      lifeType,
      duration,
      triggerInterval,
      waitFirstTriggerInterval: booleanField(block, 'waitFirstTriggerInterval', sourcePath, 2),
      maxTriggerCount,
      stackingIdentifierType: 'Id',
      stackingType: enumValue(
        STACKING_TYPES,
        integerField(stacking, 'SInt16', 'stackingType', sourcePath, 3),
        sourcePath,
        'stackingType',
      ),
      stackingKey: stringField(stacking, 'stackingKey', sourcePath, 3, true),
      usePriorityKey: booleanField(stacking, 'usePriorityKey', sourcePath, 3),
      priorityKey: stringField(stacking, 'priorityKey', sourcePath, 3, true),
      negatePriority: booleanField(stacking, 'negatePriority', sourcePath, 3),
      priority: numberField(stacking, 'float', 'priority', sourcePath, 3),
      maxStackCount: integerField(stacking, 'int', 'maxStackCnt', sourcePath, 3),
      applyIconDurationToBuffs: booleanField(block, 'applyIconDurationToBuffs', sourcePath, 2),
      buffInputs,
      globalModifierCount,
      globalModifiers,
      globalEventCount,
      blackboard,
    },
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

function scalar(block: string, valueType: 'float' | 'int', sourcePath: string, indentation = 3) {
  return {
    useBlackboardKey: booleanField(block, 'useBlackboardKey', sourcePath, indentation),
    value: numberField(block, valueType, 'value', sourcePath, indentation),
    blackboardKey: stringField(block, 'blackboardKey', sourcePath, indentation, true),
  };
}

function blockBetween(block: string, startMarker: string, endMarker: string, sourcePath: string) {
  const start = block.indexOf(startMarker);
  const end = block.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end <= start) throw new Error(`${sourcePath}: malformed GlobalBuff section`);
  return block.slice(start, end);
}

function declaredSize(block: string, sourcePath: string, name: string, indentation: number) {
  const raw = new RegExp(`^\\t{${indentation}}int size = (\\d+)\\r?$`, 'm').exec(block)?.[1];
  const value = raw === undefined ? Number.NaN : Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${sourcePath}: invalid ${name} count`);
  return value;
}

function stringField(
  block: string,
  name: string,
  sourcePath: string,
  indentation: number,
  allowEmpty: boolean,
) {
  const value = new RegExp(`^\\t{${indentation}}string ${name} = "([^"]*)"\\r?$`, 'm').exec(
    block,
  )?.[1];
  if (value === undefined || (!allowEmpty && value.length === 0))
    throw new Error(`${sourcePath}: invalid ${name}`);
  return value;
}

function numberField(
  block: string,
  type: string,
  name: string,
  sourcePath: string,
  indentation: number,
) {
  const raw = new RegExp(`^\\t{${indentation}}${type} ${name} = ([^\\r\\n]+)\\r?$`, 'm').exec(
    block,
  )?.[1];
  const value = raw === undefined ? Number.NaN : Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${sourcePath}: invalid ${name}`);
  return value;
}

function integerField(
  block: string,
  type: string,
  name: string,
  sourcePath: string,
  indentation: number,
) {
  const value = numberField(block, type, name, sourcePath, indentation);
  if (!Number.isInteger(value)) throw new Error(`${sourcePath}: invalid integer ${name}`);
  return value;
}

function booleanField(block: string, name: string, sourcePath: string, indentation: number) {
  const value = integerField(block, 'UInt8', name, sourcePath, indentation);
  if (value !== 0 && value !== 1) throw new Error(`${sourcePath}: invalid boolean ${name}`);
  return value === 1;
}

function enumValue<const T extends readonly string[]>(
  values: T,
  index: number,
  sourcePath: string,
  name: string,
): T[number] {
  const value = values[index];
  if (value === undefined) throw new Error(`${sourcePath}: unsupported ${name} ${index}`);
  return value;
}

function requireIndex(match: RegExpMatchArray, expected: number, sourcePath: string, name: string) {
  if (Number(match[1]) !== expected) throw new Error(`${sourcePath}: non-contiguous ${name} index`);
}
