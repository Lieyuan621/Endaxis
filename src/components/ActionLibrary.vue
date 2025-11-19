<script setup>
import draggable from 'vuedraggable'
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'

const store = useTimelineStore()

const activeCharacterName = computed(() => {
  const activeChar = store.characterRoster.find(c => c.id === store.activeTrackId)
  return activeChar ? activeChar.name : '技能库'
})

const localSkills = ref([])

watch(
    () => store.activeSkillLibrary,
    (newVal) => {
      if (newVal && newVal.length > 0) {
        localSkills.value = JSON.parse(JSON.stringify(newVal))
      } else {
        localSkills.value = []
      }
    },
    { immediate: true, deep: true }
)

// 记录你抓住了按钮的哪个位置
function onDragStart(evt) {
  const rect = evt.item.getBoundingClientRect();
  const offsetX = evt.originalEvent.clientX - rect.left;
  store.setDragOffset(offsetX);

  // 标记状态：正在从技能库拖拽
  document.body.classList.add('is-dragging-from-library');
}

// 拖拽结束（无论成功还是取消）都清除标记
function onDragEnd() {
  document.body.classList.remove('is-dragging-from-library');
}

</script>

<template>
  <div class="library-container">
    <h3>{{ activeCharacterName }} 的技能</h3>

    <draggable
        class="skill-list"
        v-model="localSkills"
        item-key="id"
        :group="{ name: 'skills', pull: 'clone', put: false }"
        :sort="false"
        :clone="store.cloneSkill"
        ghost-class="lib-ghost-item"
        drag-class="blue-drag-proxy"
        :forceFallback="true"
        :fallbackOnBody="true"
        @start="onDragStart"
        @end="onDragEnd"
    >
      <template #item="{ element }">
        <div
            class="skill-item"
            :style="{ '--duration': element.duration }"
        >
          {{ element.name }}
        </div>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
.library-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
/* 恢复为横向排列的按钮库 */
.skill-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}
</style>