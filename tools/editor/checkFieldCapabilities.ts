import { readFile } from 'node:fs/promises';
import { definitionSchemas } from '../../src/ui/definition-editor/definitionSchemas.generated.ts';
import {
  actionNodeSchemas,
  dataNodeSchemas,
} from '../../src/ui/action-graph/actionNodeSchemas.generated.ts';
import {
  checkFieldCapabilityCoverage,
  collectFieldCapabilities,
  summarizeFieldCapabilities,
  type FieldCapabilityException,
} from './fieldCapabilities.ts';

const rows = collectFieldCapabilities(definitionSchemas, actionNodeSchemas, dataNodeSchemas);
const baseline = JSON.parse(
  await readFile(new URL('./fieldCapabilityBaseline.json', import.meta.url), 'utf8'),
) as {
  readonly exceptions: readonly FieldCapabilityException[];
  readonly observedJsonPositionsAtAudit: number;
  readonly resolvedDefinitionDepthPositions?: readonly {
    readonly key: string;
    readonly previousReason: 'depth-limit' | 'recursive-type';
  }[];
  readonly resolvedDefinitionConditionPositions?: readonly string[];
  readonly resolvedOwnedContainerPositions?: readonly string[];
  readonly resolvedGraphSequencePositions?: readonly string[];
  readonly resolvedGraphOperandPositions?: readonly string[];
  readonly resolvedObservedJsonPositions?: readonly string[];
};
const failures = checkFieldCapabilityCoverage(rows, baseline.exceptions);
const depthPositions = baseline.resolvedDefinitionDepthPositions ?? [];
if (
  depthPositions.length !== 139 ||
  new Set(depthPositions.map(row => row.key)).size !== 139 ||
  depthPositions.filter(row => row.previousReason === 'depth-limit').length !== 131
)
  failures.push('the 131 depth and 8 recursive positions must remain accounted for individually');
for (const position of depthPositions) {
  const row = rows.find(row => row.key === position.key);
  if (!row || row.fallback) failures.push(`deep position lacks resolved schema: ${position.key}`);
}
const resolvedConditions = baseline.resolvedDefinitionConditionPositions ?? [];
const historicalConditions = [
  ...resolvedConditions,
  ...baseline.exceptions
    .filter(group => group.reason === 'condition-editor-pending')
    .flatMap(group => group.keys),
];
if (historicalConditions.length !== 11 || new Set(historicalConditions).size !== 11)
  failures.push(
    'the eleven historical definition condition positions must remain individually accounted for',
  );
for (const key of resolvedConditions) {
  const row = rows.find(row => row.key === key);
  if (!row || row.control !== 'inlineCondition' || row.fallback)
    failures.push(`condition position lacks its inline editor: ${key}`);
}
const graphOperandPositions = baseline.resolvedGraphOperandPositions ?? [];
const expectedGraphOperands = [
  'action/dealDamage/parameters/instantAttributeModifiers',
  'action/dealDamage/parameters/instantDamageScaleModifiers',
  'action/applyBuff/parameters/keywordEnhancements',
  'action/applyBuff/parameters/onActionEndBuffs',
  'action/readSkillSettingData/parameters/items',
  'action/createGlobalBuff/parameters/definition',
];
if (
  graphOperandPositions.length !== expectedGraphOperands.length ||
  expectedGraphOperands.some(key => !graphOperandPositions.includes(key))
)
  failures.push(
    'the six delivered graph operand containers must remain individually accounted for',
  );
for (const key of graphOperandPositions) {
  const row = rows.find(row => row.key === key);
  if (!row || row.control !== 'structuredValue' || row.fallback)
    failures.push(`graph operand position lacks its structured editor: ${key}`);
}
const graphSequencePositions = baseline.resolvedGraphSequencePositions ?? [];
const expectedGraphSequences = [
  'action/switch/options',
  'action/listenForCombatEvents/parameters/responses',
];
if (
  graphSequencePositions.length !== 2 ||
  expectedGraphSequences.some(key => !graphSequencePositions.includes(key))
)
  failures.push(
    'the two delivered graph sequence containers must remain individually accounted for',
  );
for (const key of graphSequencePositions) {
  const row = rows.find(row => row.key === key);
  if (!row || row.control !== 'structuredValue' || row.fallback)
    failures.push(`graph sequence position lacks its structured editor: ${key}`);
}
const ownedContainers = baseline.resolvedOwnedContainerPositions ?? [];
if (
  ownedContainers.length !== 1 ||
  ownedContainers[0] !== 'action/spawnAbilityEntity/parameters/definition'
)
  failures.push(
    'the delivered mixed owned-resource container must remain individually accounted for',
  );
for (const key of ownedContainers) {
  const row = rows.find(row => row.key === key);
  if (!row || row.control !== 'structuredValue' || row.fallback)
    failures.push(`owned-resource container lacks its mixed editor: ${key}`);
}
const pendingObserved = baseline.exceptions
  .filter(group => group.observedJsonAtAudit)
  .flatMap(group => group.keys);
const resolvedObserved = baseline.resolvedObservedJsonPositions ?? [];
const observedKeys = [...pendingObserved, ...resolvedObserved];
if (
  observedKeys.length !== baseline.observedJsonPositionsAtAudit ||
  new Set(observedKeys).size !== observedKeys.length
)
  failures.push('historical observed JSON positions must remain accounted for exactly once');
for (const key of resolvedObserved) {
  const row = rows.find(row => row.key === key);
  if (!row || row.fallback)
    failures.push(`historical position marked resolved without an available editor: ${key}`);
}
if (failures.length) throw new Error(`Field capability coverage failed:\n${failures.join('\n')}`);
if (process.argv.includes('--report')) {
  const exceptions = new Map(
    baseline.exceptions.flatMap(group => group.keys.map(key => [key, group] as const)),
  );
  const report = rows.map(row => {
    const exception = exceptions.get(row.key);
    return {
      ...row,
      ...(exception
        ? {
            category: exception.category,
            phase: exception.phase,
            observedJsonAtAudit: exception.observedJsonAtAudit ?? false,
          }
        : {}),
    };
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else
  process.stdout.write(
    `${JSON.stringify(summarizeFieldCapabilities(rows), null, 2)}\nField capability coverage is up to date.\n`,
  );
