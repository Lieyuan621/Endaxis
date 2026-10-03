<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue';
import { arclight } from '../../../src/data/operators/arclight.generated';
import ActionNodeInspector from '../../../src/ui/action-graph/ActionNodeInspector.vue';
import { WorkspaceAssetSession } from '../../../src/ui/asset-workspace/workspaceSession';
import { WorkspaceNavigation } from '../../../src/ui/asset-workspace/workspaceNavigation';
import {
  createWorkspaceDocumentViews,
  resourceView,
} from '../../../src/ui/asset-workspace/workspaceViews';
import { useWorkspaceGraphEditor } from '../../../src/ui/asset-workspace/useWorkspaceGraphEditor';
import { ownedActionResourceNavigationKey } from '../../../src/ui/field-editor/ownedResourceNavigation';
import { ownedActionResourceLink } from '../../../src/ui/asset-workspace/ownedActionResourceNavigation';
import { listDefinitionResources } from '../../../src/ui/definition-editor/definitionResources';
import { fieldValueAt } from '../../../src/ui/definition-editor/definitionFieldRuntime';
import {
  replaceResourceNodeAction,
  type ActionGraphResourceOwner,
} from '../../../src/application/editor/actionGraphResourceEditing';
const definition = Object.values(arclight.abilityEntityDefinitions!)[0]!;
const session = new WorkspaceAssetSession(
  {
    id: 'operator:arclight',
    kind: 'operator',
    kindName: 'operator',
    name: 'Arclight',
    custom: false,
    edit: {
      kind: 'operator',
      definition: {
        ...arclight,
        dodgeSkill: {
          ...arclight.dodgeSkill!,
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn' } }],
          actionGraph: {
            main: {
              nodes: {
                spawn: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: { abilityEntityId: 'inline', dieWhenSourceDies: false, definition },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
      },
    },
  },
  'project:operator:spawn-harness',
);
const revision = ref(0),
  readonly = ref(false),
  path = shallowRef<readonly (string | number)[]>(['dodgeSkill']);
const navigation = new WorkspaceNavigation(),
  views = createWorkspaceDocumentViews();
function record() {
  navigation.record({
    document: 'asset',
    resource: JSON.stringify(path.value),
    page: 'graph',
    graphOpen: true,
  });
}
record();
const editor = useWorkspaceGraphEditor({
  session: () => {
    void revision.value;
    return session;
  },
  view: () => resourceView(views, JSON.stringify(path.value)),
  identity: () => JSON.stringify(path.value),
  label: () => 'Spawn resource',
  path: () => path.value,
  owner: () => {
    void revision.value;
    return fieldValueAt(session.current.edit.definition, path.value) as ActionGraphResourceOwner;
  },
  skill: () => undefined,
  busy: () => readonly.value,
  changed: () => {
    revision.value++;
  },
  undo: () => travel('undo'),
  redo: () => travel('redo'),
});
provide(ownedActionResourceNavigationKey, request =>
  ownedActionResourceLink(
    {
      identity: () => JSON.stringify(path.value),
      scope: () => editor.resource.interactionScope,
      ownerPath: () => path.value,
      address: () => editor.resource.address,
      graph: () => editor.resource.graph,
      definition: () => session.current.edit.definition,
      hasResource: p =>
        listDefinitionResources(
          'operator',
          session.current.edit.definition as typeof arclight,
        ).some(r => JSON.stringify(r.path) === JSON.stringify(p)),
      flush: () => editor.canLeaveFields(),
      open: p => {
        path.value = p;
        record();
      },
    },
    request,
  ),
);
const id = computed(() =>
  path.value.length === 1 ? 'spawn' : Object.keys(editor.resource.graph.nodes)[0]!,
);
function applyAction(action: unknown) {
  return (
    !readonly.value &&
    editor.resource.edit(owner =>
      replaceResourceNodeAction(owner, { kind: 'main' }, id.value, action),
    )
  );
}
function back() {
  if (!editor.canLeaveFields()) return;
  const prior = navigation.travel(-1);
  if (prior) path.value = JSON.parse(prior.resource);
}
function travel(direction: 'undo' | 'redo') {
  if (!editor.canLeaveFields()) return;
  session.history[direction]();
  revision.value++;
}
function editChild() {
  if (path.value.length === 1 || readonly.value) return;
  const action = editor.resource.graph.nodes[id.value]!.action;
  applyAction({ ...action, key: 'edited-child' });
}
const current = computed(() => {
  void revision.value;
  return fieldValueAt(session.current.edit.definition, ['dodgeSkill']);
});
</script>
<template>
  <section data-testid="spawn-resource">
    <h2>Inline spawn resource</h2>
    <label><input v-model="readonly" type="checkbox" />Readonly spawn</label>
    <button @click="back">Back to spawn</button>
    <button :disabled="readonly || path.length === 1" @click="editChild">
      Edit child metadata
    </button>
    <button @click="travel('undo')">Undo spawn</button
    ><button @click="travel('redo')">Redo spawn</button>
    <ActionNodeInspector
      :ref="
        value => (editor.resource.inspector = value as InstanceType<typeof ActionNodeInspector>)
      "
      :node-id="id"
      :node="editor.resource.graph.nodes[id]!"
      :graph="editor.resource.graph"
      :graph-scope="editor.resource.interactionScope"
      :readonly="readonly"
      :apply-action="applyAction"
      @pending="editor.resource.pending = $event"
    />
    <output data-testid="spawn-resource-path">{{ JSON.stringify(path) }}</output>
    <output data-testid="spawn-resource-state">{{ JSON.stringify(current) }}</output>
  </section>
</template>
