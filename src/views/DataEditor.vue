<script setup>
import { onMounted, ref, computed } from 'vue' // 移除了 watch
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'

const store = useTimelineStore()
const { characterRoster, iconDatabase, isLoading } = storeToRefs(store)

const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "default": "默认图标"
}
const effectKeys = Object.keys(EFFECT_NAMES);

onMounted(async () => {
  if (characterRoster.value.length === 0) {
    await store.fetchGameData()
  }
  characterRoster.value.forEach(char => {
    if (!Array.isArray(char.exclusive_buffs)) char.exclusive_buffs = [];
    const skills = ['attack', 'skill', 'link', 'ultimate'];
    skills.forEach(s => {
      if (!Array.isArray(char[`${s}_allowed_types`])) char[`${s}_allowed_types`] = [];
      if (!Array.isArray(char[`${s}_anomalies`])) char[`${s}_anomalies`] = [];
    })
  })
})

function onCheckChange(char, skillType, key) {
  const fieldName = `${skillType}_allowed_types`;
  const list = char[fieldName];

  const isChecked = list.includes(key);

  const elementalGroups = [
    ['burning',    'blaze_attach',  'blaze_burst'],   // 灼热组
    ['conductive', 'emag_attach',   'emag_burst'],    // 电磁组
    ['frozen',     'cold_attach',   'cold_burst'],    // 寒冷组
    ['corrosion',  'nature_attach', 'nature_burst']   // 自然组
  ];

  const group = elementalGroups.find(g => g.includes(key));
  if (group) {
    if (isChecked) {
      group.forEach(item => {
        if (!list.includes(item)) list.push(item);
      });
    } else {
      char[fieldName] = list.filter(item => !group.includes(item));
      return;
    }
  }

  if (isChecked) {
    const physicalTriggers = ['knockup', 'knockdown', 'stagger','armor_break'];
    if (physicalTriggers.includes(key)) {
      if (!list.includes('break')) list.push('break');
      if (!list.includes('ice_shatter')) list.push('ice_shatter');
    }
  }
}

function saveData() {
  characterRoster.value.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
  const dataToSave = { ICON_DATABASE: iconDatabase.value, characterRoster: characterRoster.value }
  const jsonData = JSON.stringify(dataToSave, null, 2)
  const blob = new Blob([jsonData], {type: 'application/json'})
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'gamedata.json'
  link.click()
  URL.revokeObjectURL(link.href)
  alert('gamedata.json 已生成！')
}

function addNewCharacter() {
  const newId = `char_${Date.now()}`;
  const newChar = {
    id: newId, name: "新干员", rarity: 6, avatar: "/avatars/default.png", exclusive_buffs: [],
    attack_duration: 3, attack_cooldown: 5, attack_spCost: 0, attack_spGain: 10, attack_allowed_types: [], attack_anomalies: [],
    skill_duration: 2, skill_cooldown: 12, skill_spCost: 30, skill_spGain: 0, skill_allowed_types: [], skill_anomalies: [],
    link_duration: 1, link_cooldown: 1, link_spCost: 0, link_spGain: 0, link_allowed_types: [], link_anomalies: [],
    ultimate_duration: 4, ultimate_cooldown: 20, ultimate_spCost: 80, ultimate_spGain: 0, ultimate_allowed_types: [], ultimate_anomalies: []
  };
  characterRoster.value.push(newChar);
  setTimeout(() => { window.scrollTo(0, document.body.scrollHeight); }, 100);
}
</script>

<template>
  <div class="editor-container">
    <header class="editor-header">
      <h1>数据编辑器</h1>
      <p><router-link to="/">返回主排轴器</router-link></p>
      <div class="button-group">
        <button @click="saveData" class="save-button">生成并下载 gamedata.json</button>
        <button @click="addNewCharacter" class="add-button">添加新干员</button>
      </div>
    </header>
    <div v-if="isLoading">正在加载数据...</div>
    <section v-if="!isLoading" class="data-section">
      <div v-for="character in characterRoster" :key="character.id" class="item-card">
        <div class="card-header"><h3>{{ character.name }}</h3><span class="rarity-badge">{{ character.rarity }} ★</span></div>
        <div class="form-grid">
          <div class="form-field"><label>ID</label><input type="text" v-model="character.id"></div>
          <div class="form-field"><label>Name</label><input type="text" v-model="character.name"></div>
          <div class="form-field"><label>Rarity</label><input type="number" v-model.number="character.rarity" min="1" max="6"></div>
          <div class="form-field"><label>Avatar</label><input type="text" v-model="character.avatar"></div>
          <div class="form-field full-width">
            <label>专属 Buff (Key | Name | Path)</label>
            <div class="anomalies-list-editor">
              <div v-for="(buff, idx) in character.exclusive_buffs" :key="idx" class="anomaly-row-edit">
                <input type="text" v-model="buff.key" placeholder="Key" class="input-small">
                <input type="text" v-model="buff.name" placeholder="名称" class="input-small">
                <input type="text" v-model="buff.path" placeholder="/icons/..." class="input-wide">
                <button @click="character.exclusive_buffs.splice(idx, 1)" class="btn-del">×</button>
              </div>
              <button @click="character.exclusive_buffs.push({ key: '', name: '', path: '' })" class="btn-add-row">+ 专属 Buff</button>
            </div>
          </div>
        </div>
        <hr>

        <h4>重击 (Attack)</h4>
        <div class="form-grid">
          <div class="form-field"><label>Duration</label><input type="number" v-model.number="character.attack_duration"></div>
          <div class="form-field"><label>Cooldown</label><input type="number" v-model.number="character.attack_cooldown"></div>
          <div class="form-field"><label>SP Cost</label><input type="number" v-model.number="character.attack_spCost"></div>
          <div class="form-field"><label>SP Gain</label><input type="number" v-model.number="character.attack_spGain"></div>
          <div class="form-field full-width"><label>允许的 Buff</label>
            <div class="checkbox-group-container">
              <label v-for="key in effectKeys" :key="key" class="checkbox-label">
                <input type="checkbox" :value="key" v-model="character.attack_allowed_types" @change="onCheckChange(character, 'attack', key)">
                {{ EFFECT_NAMES[key] }}
              </label>
              <label v-for="buff in character.exclusive_buffs" :key="buff.key" class="checkbox-label" style="color: #ffd700;">
                <input type="checkbox" :value="buff.key" v-model="character.attack_allowed_types" @change="onCheckChange(character, 'attack', buff.key)">
                ★ {{ buff.name }}
              </label>
            </div>
          </div>
          <div class="form-field full-width"><label>默认效果</label>
            <div class="anomalies-list-editor">
              <div v-for="(anomaly, idx) in character.attack_anomalies" :key="idx" class="anomaly-row-edit">
                <select v-model="anomaly.type"><option v-for="key in character.attack_allowed_types" :key="key" :value="key">{{ EFFECT_NAMES[key] || character.exclusive_buffs.find(b=>b.key===key)?.name || key }}</option></select>
                <span class="label-tiny">层:</span><input type="number" v-model.number="anomaly.stacks" class="input-tiny">
                <span class="label-tiny">秒:</span><input type="number" v-model.number="anomaly.duration" step="0.5" class="input-tiny">
                <button @click="character.attack_anomalies.splice(idx, 1)" class="btn-del">×</button>
              </div>
              <button @click="character.attack_anomalies.push({ type: 'default', stacks: 1, duration: 0 })" class="btn-add-row">+ 默认效果</button>
            </div>
          </div>
        </div>

        <hr>
        <h4>战技 (Skill)</h4>
        <div class="form-grid">
          <div class="form-field"><label>Duration</label><input type="number" v-model.number="character.skill_duration"></div>
          <div class="form-field"><label>Cooldown</label><input type="number" v-model.number="character.skill_cooldown"></div>
          <div class="form-field"><label>SP Cost</label><input type="number" v-model.number="character.skill_spCost"></div>
          <div class="form-field"><label>SP Gain</label><input type="number" v-model.number="character.skill_spGain"></div>
          <div class="form-field full-width"><label>允许的 Buff</label>
            <div class="checkbox-group-container">
              <label v-for="key in effectKeys" :key="key" class="checkbox-label">
                <input type="checkbox" :value="key" v-model="character.skill_allowed_types" @change="onCheckChange(character, 'skill', key)">
                {{ EFFECT_NAMES[key] }}
              </label>
              <label v-for="buff in character.exclusive_buffs" :key="buff.key" class="checkbox-label" style="color: #ffd700;">
                <input type="checkbox" :value="buff.key" v-model="character.skill_allowed_types" @change="onCheckChange(character, 'skill', buff.key)">
                ★ {{ buff.name }}
              </label>
            </div>
          </div>
          <div class="form-field full-width"><label>默认效果</label>
            <div class="anomalies-list-editor">
              <div v-for="(anomaly, idx) in character.skill_anomalies" :key="idx" class="anomaly-row-edit">
                <select v-model="anomaly.type"><option v-for="key in character.skill_allowed_types" :key="key" :value="key">{{ EFFECT_NAMES[key] || character.exclusive_buffs.find(b=>b.key===key)?.name || key }}</option></select>
                <span class="label-tiny">层:</span><input type="number" v-model.number="anomaly.stacks" class="input-tiny">
                <span class="label-tiny">秒:</span><input type="number" v-model.number="anomaly.duration" step="0.5" class="input-tiny">
                <button @click="character.skill_anomalies.splice(idx, 1)" class="btn-del">×</button>
              </div>
              <button @click="character.skill_anomalies.push({ type: 'default', stacks: 1, duration: 0 })" class="btn-add-row">+ 默认效果</button>
            </div>
          </div>
        </div>

        <hr>
        <h4>连携 (Link)</h4>
        <div class="form-grid">
          <div class="form-field"><label>Duration</label><input type="number" v-model.number="character.link_duration"></div>
          <div class="form-field"><label>Cooldown</label><input type="number" v-model.number="character.link_cooldown"></div>
          <div class="form-field"><label>SP Cost</label><input type="number" v-model.number="character.link_spCost"></div>
          <div class="form-field"><label>SP Gain</label><input type="number" v-model.number="character.link_spGain"></div>
          <div class="form-field full-width"><label>允许的 Buff</label>
            <div class="checkbox-group-container">
              <label v-for="key in effectKeys" :key="key" class="checkbox-label">
                <input type="checkbox" :value="key" v-model="character.link_allowed_types" @change="onCheckChange(character, 'link', key)">
                {{ EFFECT_NAMES[key] }}
              </label>
              <label v-for="buff in character.exclusive_buffs" :key="buff.key" class="checkbox-label" style="color: #ffd700;">
                <input type="checkbox" :value="buff.key" v-model="character.link_allowed_types" @change="onCheckChange(character, 'link', buff.key)">
                ★ {{ buff.name }}
              </label>
            </div>
          </div>
          <div class="form-field full-width"><label>默认效果</label>
            <div class="anomalies-list-editor">
              <div v-for="(anomaly, idx) in character.link_anomalies" :key="idx" class="anomaly-row-edit">
                <select v-model="anomaly.type"><option v-for="key in character.link_allowed_types" :key="key" :value="key">{{ EFFECT_NAMES[key] || character.exclusive_buffs.find(b=>b.key===key)?.name || key }}</option></select>
                <span class="label-tiny">层:</span><input type="number" v-model.number="anomaly.stacks" class="input-tiny">
                <span class="label-tiny">秒:</span><input type="number" v-model.number="anomaly.duration" step="0.5" class="input-tiny">
                <button @click="character.link_anomalies.splice(idx, 1)" class="btn-del">×</button>
              </div>
              <button @click="character.link_anomalies.push({ type: 'default', stacks: 1, duration: 0 })" class="btn-add-row">+ 默认效果</button>
            </div>
          </div>
        </div>

        <hr>
        <h4>终结技 (Ultimate)</h4>
        <div class="form-grid">
          <div class="form-field"><label>Duration</label><input type="number" v-model.number="character.ultimate_duration"></div>
          <div class="form-field"><label>Cooldown</label><input type="number" v-model.number="character.ultimate_cooldown"></div>
          <div class="form-field"><label>SP Cost</label><input type="number" v-model.number="character.ultimate_spCost"></div>
          <div class="form-field"><label>SP Gain</label><input type="number" v-model.number="character.ultimate_spGain"></div>
          <div class="form-field full-width"><label>允许的 Buff</label>
            <div class="checkbox-group-container">
              <label v-for="key in effectKeys" :key="key" class="checkbox-label">
                <input type="checkbox" :value="key" v-model="character.ultimate_allowed_types" @change="onCheckChange(character, 'ultimate', key)">
                {{ EFFECT_NAMES[key] }}
              </label>
              <label v-for="buff in character.exclusive_buffs" :key="buff.key" class="checkbox-label" style="color: #ffd700;">
                <input type="checkbox" :value="buff.key" v-model="character.ultimate_allowed_types" @change="onCheckChange(character, 'ultimate', buff.key)">
                ★ {{ buff.name }}
              </label>
            </div>
          </div>
          <div class="form-field full-width"><label>默认效果</label>
            <div class="anomalies-list-editor">
              <div v-for="(anomaly, idx) in character.ultimate_anomalies" :key="idx" class="anomaly-row-edit">
                <select v-model="anomaly.type"><option v-for="key in character.ultimate_allowed_types" :key="key" :value="key">{{ EFFECT_NAMES[key] || character.exclusive_buffs.find(b=>b.key===key)?.name || key }}</option></select>
                <span class="label-tiny">层:</span><input type="number" v-model.number="anomaly.stacks" class="input-tiny">
                <span class="label-tiny">秒:</span><input type="number" v-model.number="anomaly.duration" step="0.5" class="input-tiny">
                <button @click="character.ultimate_anomalies.splice(idx, 1)" class="btn-del">×</button>
              </div>
              <button @click="character.ultimate_anomalies.push({ type: 'default', stacks: 1, duration: 0 })" class="btn-add-row">+ 默认效果</button>
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>

<style scoped>
.editor-container { padding: 20px; color: #f0f0f0; background-color: #2c2c2c; min-height: 100vh; }
.editor-header { border-bottom: 1px solid #555; padding-bottom: 20px; }
.editor-header a { color: #4a90e2; }
.button-group { display: flex; gap: 15px; margin: 20px 0; }
.save-button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
.save-button:hover { background-color: #45a049; }
.add-button { background-color: #008CBA; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
.add-button:hover { background-color: #007BA5; }
.warning { background-color: #4a3c20; border: 1px solid #ffd700; color: #ffd700; padding: 10px; border-radius: 4px; }
.data-section { margin-top: 30px; }
.item-card { background-color: #3a3a3a; border: 1px solid #555; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.rarity-badge { background-color: #ffd700; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 14px; }
hr { border: 0; border-top: 1px solid #555; margin: 20px 0; }
h4 { color: #f0f0f0; border-bottom: 1px solid #777; padding-bottom: 5px; margin-top: 10px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
.form-field { display: flex; flex-direction: column; }
.form-field.full-width { grid-column: 1 / -1; }
.form-field label { margin-bottom: 5px; color: #aaa; font-size: 14px; }
.form-field input, .form-field textarea { background-color: #2c2c2c; color: #f0f0f0; border: 1px solid #555; border-radius: 4px; padding: 8px; font-size: 16px; }
.checkbox-group-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; background: #222; padding: 10px; border: 1px solid #555; border-radius: 4px; }
.checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; user-select: none; }
.checkbox-label:hover { color: #ffd700; }
.anomalies-list-editor { background: #222; padding: 10px; border: 1px solid #555; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; }
.anomaly-row-edit { display: flex; align-items: center; gap: 8px; background: #333; padding: 5px; border-radius: 4px; }
.anomaly-row-edit select { flex-grow: 1; padding: 4px; background: #444; color: white; border: 1px solid #666; border-radius: 4px; }
.label-tiny { font-size: 12px; color: #aaa; }
.input-tiny { width: 50px !important; padding: 4px !important; text-align: center; }
.input-small { width: 120px !important; }
.input-wide { flex-grow: 1; }
.btn-del { background: #d32f2f; color: white; border: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-add-row { background: #444; color: #ffd700; border: 1px dashed #ffd700; padding: 8px; cursor: pointer; border-radius: 4px; }
.btn-add-row:hover { background: #555; }
</style>