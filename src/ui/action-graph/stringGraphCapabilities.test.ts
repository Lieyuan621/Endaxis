import { expect, it } from 'vitest';
import { actionNodeSchemas, dataNodeSchemas } from './actionNodeSchemas.generated';
import { dataInputType } from '../../core/action-graph/actionGraphDataNodes';
import { createGraphDataResolver } from '../../core/action-graph/actionGraphData';
import { writeNodeField } from './nodeFieldValues';

it('keeps schema string pin eligibility aligned with the runtime consumption allowlist', () => {
  const resolver = createGraphDataResolver({
    nodes: {},
    dataNodes: { read: { type: 'string', expression: { blackboardKey: 'id' } } },
  });
  const slots: string[] = [];
  for (const [kind, schema] of Object.entries(actionNodeSchemas)) {
    for (const field of schema.fields.filter(
      field => dataInputType(field.valueSchema.semantics) === 'string',
    )) {
      slots.push(`action/${kind}/${field.path.join('.')}`);
      const value = writeNodeField({ kind }, field.path, { kind: 'stringNode', nodeId: 'read' });
      expect(resolver.bind(value)).toEqual(
        writeNodeField({ kind }, field.path, { blackboardKey: 'id' }),
      );
    }
  }
  for (const [name, schema] of Object.entries(dataNodeSchemas)) {
    if (!name.startsWith('boolean:')) continue;
    const kind = name.split(':')[1]!;
    for (const field of schema.fields.filter(
      field => dataInputType(field.valueSchema.semantics) === 'string',
    )) {
      slots.push(`data/${name}/${field.path.join('.')}`);
      const value = writeNodeField({ kind }, field.path, { kind: 'stringNode', nodeId: 'read' });
      expect(resolver.bind(value)).toEqual(
        writeNodeField({ kind }, field.path, { blackboardKey: 'id' }),
      );
    }
  }
  expect(slots.sort()).toEqual([
    'action/applyBuff/parameters.buffId',
    'action/castSkillDuringAction/parameters.skillId',
    'action/createAbilityEntityTimedMarker/parameters.markerId',
    'action/createTimedMarker/parameters.markerId',
    'data/boolean:abilityEntityTimedMarkerPresent/markerId',
    'data/boolean:timedMarkerPresent/markerId',
  ]);
});
