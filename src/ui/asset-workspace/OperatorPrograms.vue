<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
import type { WorkspaceResource } from './workspaceResources';
import WorkspaceIcon from './WorkspaceIcon.vue';
import { skillTypeLabelKey } from './skillTypeLabelKey';
import type { OperatorResourceCommand } from '../../application/editor/operatorResourceCommands';

const props = defineProps<{
  definition: OperatorDefinition;
  resources: readonly WorkspaceResource[];
  page: string;
  editable: boolean;
}>();
const emit = defineEmits<{
  open: [id: string];
  field: [name: string];
  command: [command: OperatorResourceCommand];
}>();
const { t } = useI18n();
const tr = (key: string) => t(`assetWorkspace.programs.${key}`);
const groups = computed(() =>
  props.definition.skillGroups.map((group, index) => {
    const members = props.resources.filter(resource => {
      const path = resource.definitionResource.path;
      return resource.kind === 'skill' && path[0] === 'skillGroups' && path[1] === index;
    });
    const sections = [
      { key: 'base', items: members.filter(item => item.definitionResource.path[2] === 'skills') },
      ...(group.variants ?? []).map((_, variant) => ({
        key: 'variant',
        number: variant + 1,
        items: members.filter(
          item =>
            item.definitionResource.path[2] === 'variants' &&
            item.definitionResource.path[3] === variant,
        ),
      })),
      {
        key: 'replacement',
        items: members.filter(item =>
          ['replacementSkills', 'routedReplacementSkills'].includes(
            String(item.definitionResource.path[2]),
          ),
        ),
      },
    ].filter(section => section.items.length);
    return { group, index, sections };
  }),
);
const extraSkills = computed(() =>
  props.resources.filter(
    resource => resource.kind === 'skill' && resource.definitionResource.path[0] === 'dodgeSkill',
  ),
);
const upgrades = computed(() =>
  ['talent', 'potential'].map(kind => ({
    kind,
    items: props.resources.filter(resource => resource.kind === kind),
  })),
);
function levelCount(resource: WorkspaceResource) {
  const path = resource.definitionResource.path;
  const collection = path[0] === 'talents' ? props.definition.talents : props.definition.potentials;
  return collection?.[Number(path[1])]?.levels ?? 1;
}
</script>

<template>
  <section class="operator-programs">
    <header class="programs-heading">
      <h2>{{ t(`assetWorkspace.workspace.${page}`) }}</h2>
      <span>{{ tr(page === 'skills' ? 'skillsHint' : 'upgradesHint') }}</span>
    </header>
    <template v-if="page === 'skills'">
      <article
        v-for="{ group, index: groupIndex, sections } in groups"
        :key="group.key"
        class="program-group"
      >
        <header>
          <strong>{{ t(skillTypeLabelKey(group.skillType)) }}</strong>
          <code>{{ group.key }}</code>
          <span>{{ tr('levelSource') }} · {{ t(skillTypeLabelKey(group.levelSource)) }}</span>
          <button
            class="rw-native-button list-action"
            :disabled="!editable"
            @click="emit('command', { kind: 'addSkill', group: groupIndex })"
          >
            {{ tr('addSkill') }}
          </button>
        </header>
        <div
          v-for="section in sections"
          :key="`${section.key}:${'number' in section ? section.number : ''}`"
          class="program-sequence"
        >
          <span class="sequence-label"
            >{{ tr(section.key)
            }}<template v-if="'number' in section"> {{ section.number }}</template></span
          >
          <ol>
            <li v-for="(skill, index) in section.items" :key="skill.id">
              <button class="rw-native-button resource-link" @click="emit('open', skill.id)">
                <span class="sequence-number">{{ index + 1 }}</span>
                <span
                  ><strong>{{ skill.name }}</strong
                  ><code>{{ skill.definitionResource.identity }}</code></span
                >
                <WorkspaceIcon name="arrow" :size="14" />
              </button>
              <div v-if="section.key === 'base'" class="list-actions">
                <button
                  class="rw-native-button list-action"
                  :disabled="!editable || index === 0"
                  :aria-label="tr('moveUp')"
                  @click="emit('command', { kind: 'moveSkillUp', group: groupIndex, index })"
                >
                  ↑
                </button>
                <button
                  class="rw-native-button list-action"
                  :disabled="!editable || index === section.items.length - 1"
                  :aria-label="tr('moveDown')"
                  @click="emit('command', { kind: 'moveSkillDown', group: groupIndex, index })"
                >
                  ↓
                </button>
                <button
                  class="rw-native-button list-action"
                  :disabled="!editable || section.items.length === 1"
                  @click="emit('command', { kind: 'removeSkill', group: groupIndex, index })"
                >
                  {{ t('common.delete') }}
                </button>
              </div>
            </li>
          </ol>
        </div>
      </article>
      <article v-if="extraSkills.length" class="program-group">
        <header>
          <strong>{{ tr('otherSkills') }}</strong>
        </header>
        <button
          v-for="skill in extraSkills"
          :key="skill.id"
          class="rw-native-button resource-link"
          @click="emit('open', skill.id)"
        >
          <span
            ><strong>{{ skill.name }}</strong
            ><code>{{ skill.definitionResource.identity }}</code></span
          >
          <WorkspaceIcon name="arrow" :size="14" />
        </button>
      </article>
      <div class="program-settings">
        <button
          v-for="key in ['skillSlots', 'playerActionRoutes', 'comboSkillConditions']"
          :key="key"
          class="rw-native-button"
          @click="emit('field', key)"
        >
          {{ t(`definitionEditor.fields.${key}`) }} <WorkspaceIcon name="arrow" :size="14" />
        </button>
      </div>
    </template>
    <template v-else>
      <section v-for="section in upgrades" :key="section.kind" class="upgrade-section">
        <h3>
          {{ t(`definitionEditor.fields.${section.kind === 'talent' ? 'talents' : 'potentials'}`) }}
        </h3>
        <button
          class="rw-native-button list-action"
          :disabled="!editable"
          @click="
            emit('command', {
              kind: 'addUpgrade',
              collection: section.kind === 'talent' ? 'talents' : 'potentials',
            })
          "
        >
          {{ tr('add') }}
        </button>
        <div v-for="(item, index) in section.items" :key="item.id" class="upgrade-row">
          <button
            class="rw-native-button resource-link upgrade-link"
            @click="emit('open', item.id)"
          >
            <span class="sequence-number">{{ index + 1 }}</span>
            <strong>{{ item.name }}</strong>
            <span class="upgrade-levels">{{
              t('assetWorkspace.programs.levels', { count: levelCount(item) })
            }}</span>
            <WorkspaceIcon name="arrow" :size="14" />
          </button>
          <button
            class="rw-native-button list-action"
            :disabled="!editable"
            @click="
              emit('command', {
                kind: 'removeUpgrade',
                collection: section.kind === 'talent' ? 'talents' : 'potentials',
                index,
              })
            "
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.operator-programs {
  max-width: 1100px;
}
li,
.upgrade-row {
  display: flex;
  align-items: center;
  min-width: 0;
}
.list-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}
.list-action {
  padding: 4px 8px;
  border: 1px solid var(--ea-border);
  background: transparent;
  white-space: nowrap;
  font-size: 11px;
}
.list-action:hover:not(:disabled) {
  background: #303a40;
}
.programs-heading {
  margin-bottom: 22px;
}
.programs-heading h2 {
  margin: 0 0 6px;
}
.programs-heading > span,
.sequence-label,
.upgrade-levels {
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.program-group {
  border: 1px solid var(--ea-border);
  border-radius: 4px;
  margin-bottom: 14px;
  overflow: hidden;
}
.program-group > header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  background: #292f33;
}
.program-group > header > span {
  margin-left: auto;
  font-size: 11px;
  color: var(--ea-fg-muted);
}
code {
  font-size: 10px;
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}
.program-sequence {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  padding: 8px 14px;
  gap: 12px;
}
.sequence-label {
  padding-top: 12px;
}
ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
.resource-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid var(--ea-border);
  padding: 10px 12px;
  background: transparent;
  text-align: left;
}
.resource-link:hover,
.program-settings button:hover {
  background: #303a40;
}
.resource-link > span:not(.sequence-number) {
  min-width: 0;
}
.resource-link strong {
  font-size: 13px;
  font-weight: 500;
}
.resource-link code {
  display: block;
  margin-top: 3px;
}
.resource-link > svg:last-child {
  margin-left: auto;
  flex-shrink: 0;
}
.sequence-number {
  color: #b9aa71;
  font-size: 11px;
  flex: 0 0 18px;
}
.upgrade-section {
  margin-bottom: 26px;
}
.upgrade-section h3 {
  font-size: 13px;
  border-bottom: 1px solid var(--ea-border);
  padding-bottom: 10px;
}
.upgrade-levels {
  margin-left: auto;
}
.upgrade-link > svg:last-child {
  margin-left: 0;
}
.program-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.program-settings button {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid var(--ea-border);
  background: transparent;
}
</style>
