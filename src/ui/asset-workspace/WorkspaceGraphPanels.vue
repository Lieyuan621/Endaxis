<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput } from '@/design-system';
import BlackboardPanel from '../action-graph/BlackboardPanel.vue';
import SkillGraphPanels from '../action-graph/SkillGraphPanels.vue';
import ResourceGraphPanels from '../action-graph/ResourceGraphPanels.vue';
import { nodeName } from '../action-graph/editorNodeText';
import { canvasView, type WorkspaceResourceView } from './workspaceViews';
import type { useWorkspaceGraphEditor } from './useWorkspaceGraphEditor';

const props = defineProps<{
  area: 'toolbar' | 'tools' | 'content' | 'inspector';
  editor: ReturnType<typeof useWorkspaceGraphEditor>;
  skill: boolean;
  readonly: boolean;
  resourceKey: string;
  label: string;
  identity?: string;
  view: WorkspaceResourceView;
  toolTab?: string;
}>();
const emit = defineEmits<{ page: [page: string] }>();
const { t } = useI18n();
const query = ref('');
const nodes = computed(() =>
  Object.entries(props.editor.resource.graph.nodes)
    .map(([id, node]) => ({ id, name: nodeName(node.action.kind) }))
    .filter(node =>
      `${node.id} ${node.name}`.toLowerCase().includes(query.value.trim().toLowerCase()),
    ),
);
</script>

<template>
  <template v-if="area === 'toolbar'">
    <EaButton
      v-if="skill && editor.skill.address.kind === 'main'"
      size="sm"
      :disabled="editor.skill.blocked"
      @click="
        editor.skill.timelineOpen ? editor.skill.closeTimeline() : editor.skill.openTimeline()
      "
    >
      {{
        editor.skill.timelineOpen ? t('editor.collapseTimeline') : t('assetWorkspace.castTimeline')
      }}
    </EaButton>
  </template>
  <template v-else-if="area === 'tools'">
    <template v-if="skill">
      <EaButton v-if="toolTab === 'content'" size="sm" @click="emit('page', 'settings')">
        {{ t('assetWorkspace.workspace.settings') }}
      </EaButton>
      <SkillGraphPanels
        v-if="['content', 'variables', 'find'].includes(toolTab ?? '')"
        area="tools"
        :tool-tab="toolTab"
        :editor="editor.skill"
      />
    </template>
    <BlackboardPanel
      v-else-if="toolTab === 'variables'"
      :analysis="editor.resource.blackboard"
      :readonly="readonly"
      @locate="editor.resource.locateVariable"
      @drop="
        (identity, event, readonly) =>
          editor.resource.canvas?.dropVariable(identity, event, readonly)
      "
    />
    <template v-else-if="toolTab === 'content'">
      <EaButton size="sm" @click="emit('page', 'overview')">{{ t('editor.backToAsset') }}</EaButton>
      <EaButton
        class="rw-nav"
        variant="ghost"
        :pressed="editor.resource.address.kind === 'main'"
        @click="editor.resource.changeGraph({ kind: 'main' })"
      >
        {{ t('definitionEditor.mainGraph') }}
      </EaButton>
      <EaButton
        v-for="(_, id) in editor.resource.draft.actionGraph.macros"
        :key="id"
        class="rw-nav"
        variant="ghost"
        :pressed="
          editor.resource.address.kind === 'macro' && editor.resource.address.macroId === id
        "
        @click="editor.resource.changeGraph({ kind: 'macro', macroId: id })"
      >
        {{ id }}
      </EaButton>
    </template>
    <template v-else-if="toolTab === 'find'">
      <EaInput
        class="rw-resource-search"
        v-model="query"
        :placeholder="t('assetWorkspace.workspace.findPlaceholder')"
      />
      <EaButton
        v-for="node in nodes"
        :key="node.id"
        class="rw-nav"
        variant="ghost"
        @click="editor.resource.focusNode(node.id)"
      >
        {{ node.name }}<small>{{ node.id }}</small>
      </EaButton>
    </template>
  </template>
  <template v-else-if="area === 'content'">
    <template v-if="skill">
      <SkillGraphPanels
        area="canvas"
        :editor="editor.skill"
        :resource-key="resourceKey"
        :canvas-view="canvasView(view, editor.skill.graphKey)"
      />
      <SkillGraphPanels area="timeline" :editor="editor.skill" />
      <pre v-if="editor.skill.error" role="alert">{{ editor.skill.error }}</pre>
    </template>
    <template v-else>
      <ResourceGraphPanels
        area="canvas"
        :resource-graph-editor="editor.resource"
        :readonly="readonly"
        :resource-key="resourceKey"
        :label="label"
        :canvas-view="canvasView(view, editor.resource.graphKey)"
      />
      <p v-if="editor.resource.error" role="alert">{{ editor.resource.error }}</p>
    </template>
  </template>
  <template v-else>
    <SkillGraphPanels v-if="skill" area="inspector" :editor="editor.skill" />
    <ResourceGraphPanels
      v-else
      area="inspector"
      :resource-graph-editor="editor.resource"
      :readonly="readonly"
      :resource-key="resourceKey"
      :label="label"
      :identity="identity"
    />
  </template>
</template>
