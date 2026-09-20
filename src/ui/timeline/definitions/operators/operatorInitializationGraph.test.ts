import { describe, expect, it } from 'vitest';
import { conditionInspectorFields } from '../inspector/conditionInspectorSchema';
import {
  appendOperatorInitializer,
  buildOperatorInitializationGraph,
} from './operatorInitializationGraph';
import {
  resolveStructureValue,
  replaceStructureValueAtPath,
} from '../skillStructureEditorCommands';

describe('operator initialization graph', () => {
  it('uses shared localized attribute choices for build conditions', () => {
    const fields = conditionInspectorFields('deckAttributeCompare')!;
    expect(
      fields.filter(field => field.optionLabelPrefix === 'timeline.skillEditing.attributes.'),
    ).toHaveLength(2);
  });
  it('projects real containment paths and keeps required conditions as ports', () => {
    const { document } = appendOperatorInitializer({});
    const root = buildOperatorInitializationGraph(document);
    const entry = root.children[0]!;
    const condition = entry.children[0]!;
    expect(entry.relationToParent).toBe('member');
    expect(condition.relationToParent).toBe('port');
    expect(condition.canDelete).toBe(false);
    expect(resolveStructureValue(document, condition.sourcePath)).toEqual(
      document.entityBlackboardInitializers[0]!.condition,
    );
    const changed = replaceStructureValueAtPath(document, `${entry.sourcePath}.trueValue`, 42);
    expect(changed.entityBlackboardInitializers[0]!.trueValue).toBe(42);
    expect(changed.entityBlackboardInitializers[0]!.condition).toEqual(
      document.entityBlackboardInitializers[0]!.condition,
    );
  });
  it('does not invent existing rules and adds unique authoring keys', () => {
    expect(buildOperatorInitializationGraph({}).children).toEqual([]);
    const first = appendOperatorInitializer({});
    const second = appendOperatorInitializer(first.document);
    expect(second.document.entityBlackboardInitializers.map(x => x.key)).toEqual([
      'EntityBB_custom_1',
      'EntityBB_custom_2',
    ]);
    expect(first.document.entityBlackboardInitializers).toHaveLength(1);
  });
});
