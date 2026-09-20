<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import OperatorAvatar from '../../../components/OperatorAvatar.vue';
import {
  DEFAULT_TRUST_ATTRIBUTE_BONUS,
  type OperatorDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  listOperatorSkillDefinitionBindings,
  type OperatorSkillDefinitionBinding,
} from '../../../../core/game-data/operatorSkillDefinitions';
import {
  getOperatorAvatarPath,
  getOperatorSkillIconPath,
  getOperatorTalentIconPath,
  getWeaponActionIconPath,
} from '../../../gameAssetPaths';
import {
  getOperatorGameName,
  getOperatorTalentName,
  getOperatorPotentialName,
  getGameElementName,
  getGameClassName,
  getGameWeaponTypeName,
} from '../../../gameText';
const props = defineProps<{ definition: OperatorDefinition }>();
const emit = defineEmits<{
  section: [section: 'panel' | 'trust' | 'skills' | 'runtime' | 'buffs' | 'entities'];
  runtime: [
    page:
      | 'blackboard'
      | 'initialization'
      | 'behavior'
      | 'combo'
      | 'presentation'
      | 'routing'
      | 'provenance',
  ];
  skill: [binding: OperatorSkillDefinitionBinding];
  upgrade: [kind: 'talents' | 'potentials', index: number];
  name: [event: Event];
  growth: [key: keyof OperatorDefinition['attributes'], index: number, event: Event];
}>();
const { locale } = useI18n();
const source = computed(() => props.definition.assetSlug ?? props.definition.slug);
const name = computed(
  () => props.definition.displayName ?? getOperatorGameName(source.value, locale.value),
);
const levels = [1, 20, 40, 60, 80, 90];
const attributes = {
  strength: '力量',
  agility: '敏捷',
  intellect: '智识',
  will: '意志',
  baseAttack: '攻击',
  baseHealth: '生命',
} as const;
const categories = [
  { key: 'basicAttack', label: '普攻' },
  { key: 'battleSkill', label: '战技' },
  { key: 'comboSkill', label: '连携' },
  { key: 'ultimate', label: '终结技' },
] as const;
const bindings = computed(() => listOperatorSkillDefinitionBindings(props.definition));
const unassigned = computed(() =>
  bindings.value.filter(b => !categories.some(c => c.key === b.skill.levelSource)),
);
const trust = computed(() => props.definition.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS);
function talentName(index: number) {
  return getOperatorTalentName(
    source.value,
    props.definition.talents.slice(0, index).reduce((n, t) => n + t.levels, 0),
    0,
    locale.value,
  );
}
function skillLabel(binding: OperatorSkillDefinitionBinding): string {
  const type = binding.skill.skillType;
  const label =
    type === 'finisher'
      ? '处决'
      : type === 'plungingAttack'
        ? '下落攻击'
        : categories.find(c => c.key === type)?.label;
  if (!label) return binding.skill.key;
  const peers = bindings.value.filter(
    b =>
      b.group === binding.group &&
      b.origin === binding.origin &&
      b.variant === binding.variant &&
      b.skill.skillType === type,
  );
  return peers.length > 1 ? `${label} ${peers.indexOf(binding) + 1}` : label;
}
</script>
<template>
  <div class="definition-home">
    <div class="profile">
      <section class="identity">
        <OperatorAvatar class="portrait" :src="getOperatorAvatarPath(source)" :alt="name" />
        <div class="bio" :data-property-path="JSON.stringify(['displayName'])">
          <div class="rarity">{{ '★'.repeat(definition.rarity) }}</div>
          <input
            aria-label="展示名称"
            class="operator-name"
            :value="name"
            @change="emit('name', $event)"
          />
          <p>
            {{ getGameElementName(definition.element, locale) }} ·
            {{ getGameClassName(definition.role, locale) }} ·
            {{ getGameWeaponTypeName(definition.weaponType, locale) }}
          </p>
          <p>
            主属性 {{ attributes[definition.mainAttribute] }}<br />副属性
            {{ attributes[definition.secondaryAttribute] }}
          </p>
          <button @click="emit('section', 'panel')">编辑基本信息 ›</button>
        </div>
      </section>
      <h3>属性成长 <small>六个固定等级节点</small></h3>
      <div class="growth-scroll">
        <table>
          <thead>
            <tr>
              <th></th>
              <th v-for="level in levels" :key="level">{{ level }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(label, key) in attributes" :key="key">
              <th>{{ label }}</th>
              <td
                v-for="(level, index) in levels"
                :key="level"
                :data-property-path="JSON.stringify(['attributes', key, index])"
              >
                <input
                  type="number"
                  :aria-label="`${label} · Lv.${level}`"
                  :value="definition.attributes[key][index]"
                  @change="emit('growth', key, index, $event)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="trust">
        <span>信赖成长</span><span>{{ trust.values.join(' / ') }}</span
        ><button @click="emit('section', 'trust')">编辑信赖规则 ›</button>
      </div>
    </div>
    <div class="abilities">
      <header>
        <h3>技能</h3>
        <button @click="emit('section', 'skills')">技能库组织 ›</button>
      </header>
      <div class="skills">
        <section v-for="category in categories" :key="category.key">
          <img
            :src="
              category.key === 'basicAttack'
                ? getWeaponActionIconPath(definition.weaponType)
                : (getOperatorSkillIconPath(source, category.key) ?? undefined)
            "
            alt=""
          />
          <h4>{{ category.label }}</h4>
          <div class="skill-links">
            <button
              v-for="(binding, index) in bindings.filter(b => b.skill.levelSource === category.key)"
              :key="`${binding.group.key}:${binding.origin}:${index}`"
              :title="binding.skill.key"
              @click="emit('skill', binding)"
            >
              {{ skillLabel(binding) }}</button
            ><small v-if="!bindings.some(b => b.skill.levelSource === category.key)">未定义</small>
          </div>
        </section>
      </div>
      <div v-if="unassigned.length" class="unassigned">
        <span>无等级来源 / 内部技能</span
        ><button
          v-for="(binding, index) in unassigned"
          :key="index"
          @click="emit('skill', binding)"
        >
          {{ skillLabel(binding) }}
        </button>
      </div>
      <section class="talents">
        <h3>天赋</h3>
        <button
          v-for="index in [0, 1]"
          :key="index"
          class="talent"
          @click="emit('upgrade', 'talents', index)"
        >
          <img :src="getOperatorTalentIconPath(source, index + 1)" alt="" /><span
            ><small>天赋 {{ index + 1 }}</small
            >{{ talentName(index) }}</span
          ><span class="level-count">{{ definition.talents[index]?.levels ?? '待填写' }} 级</span
          ><span>编辑 ›</span>
        </button>
      </section>
      <section class="potentials">
        <h3>潜能</h3>
        <div class="potential-row">
          <button
            v-for="index in [0, 1, 2, 3, 4]"
            :key="index"
            @click="emit('upgrade', 'potentials', index)"
          >
            <span class="diamond"
              ><b>{{ index + 1 }}</b></span
            ><span>{{ getOperatorPotentialName(source, index, locale) }}</span>
          </button>
        </div>
      </section>
    </div>
    <section class="advanced">
      <h3>角色逻辑与附属定义</h3>
      <nav>
        <button @click="emit('runtime', 'provenance')">
          来源与诊断 <small>身份 / 转换覆盖 / 兼容映射</small>
        </button>
        <button @click="emit('runtime', 'routing')">
          操作选择规则 <small>路由 / 槽位 / 模式</small>
        </button>
        <button @click="emit('runtime', 'presentation')">
          状态表现 <small>角色专属指示器</small>
        </button>
        <button @click="emit('runtime', 'blackboard')">
          角色黑板 <small>跨技能共享的初始值</small>
        </button>
        <button @click="emit('runtime', 'initialization')">
          条件初始化 <small>构筑条件与黑板写入</small>
        </button>
        <button @click="emit('runtime', 'behavior')">
          角色行为 <small>常驻被动与事件监听</small>
        </button>
        <button @click="emit('runtime', 'combo')">连携条件 <small>连携触发规则</small></button>
        <button @click="emit('section', 'buffs')">
          Buff {{ Object.keys(definition.buffDefinitions ?? {}).length }}</button
        ><button @click="emit('section', 'entities')">
          能力实体 {{ Object.keys(definition.abilityEntityDefinitions ?? {}).length }}
        </button>
      </nav>
    </section>
  </div>
</template>
<style scoped>
.definition-home {
  display: grid;
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
  gap: 28px;
  padding: 24px;
  color: var(--ea-text-primary, #ddd);
}
.profile {
  padding-right: 24px;
  border-right: 1px solid #424246;
  min-width: 0;
}
.identity {
  display: flex;
  gap: 18px;
  margin-bottom: 26px;
}
.portrait {
  width: 140px;
  height: 164px;
  border: 1px solid #555;
  border-bottom: 3px solid #c2ad56;
}
.bio {
  min-width: 0;
}
.rarity {
  color: #d9be58;
  letter-spacing: 2px;
}
.operator-name {
  width: 100%;
  font-size: 23px;
  font-weight: 600;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #555;
  color: inherit;
}
.bio p {
  font-size: 11px;
  color: #aaa;
  line-height: 1.8;
}
.definition-home button {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 1px solid #45454b;
  border-radius: 2px;
  padding: 5px 9px;
  cursor: pointer;
}
.definition-home button:hover {
  border-color: #dcca50;
  color: #edda65;
}
.definition-home button:focus-visible,
.definition-home input:focus-visible {
  outline: 1px solid #edda65;
  outline-offset: 2px;
}
h3 {
  font-size: 13px;
  margin: 0 0 14px;
}
h3 small {
  font-size: 10px;
  font-weight: 400;
  color: #999;
  margin-left: 8px;
}
.growth-scroll {
  overflow: auto;
}
table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
th {
  font-size: 11px;
  font-weight: 400;
  color: #aaa;
}
th:first-child {
  width: 34px;
}
td,
th {
  padding: 5px 2px;
}
td input {
  width: 100%;
  min-width: 0;
  text-align: center;
  background: #202023;
  border: 1px solid #454549;
  color: inherit;
  padding: 6px 0;
  font-size: 11px;
  appearance: textfield;
}
input::-webkit-inner-spin-button {
  appearance: none;
}
.trust {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  border-top: 1px solid #444;
  margin-top: 14px;
  padding-top: 14px;
}
.abilities {
  min-width: 0;
}
.abilities header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.abilities header button {
  font-size: 11px;
}
.skills {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}
.skills section {
  text-align: center;
}
.skills img {
  width: 52px;
  height: 52px;
  background: #333337;
  border: 1px solid #505057;
  padding: 7px;
  object-fit: contain;
}
.skills h4 {
  margin: 8px 0;
  font-size: 14px;
}
.skill-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.skill-links button {
  font-size: 11px;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.talents,
.potentials {
  border-top: 1px solid #444;
  margin-top: 20px;
  padding-top: 17px;
}
.talent {
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: center;
  border: 0 !important;
  text-align: left;
  margin-bottom: 6px;
}
.talent img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}
.talent small {
  display: block;
  color: #999;
  font-size: 10px;
}
.level-count {
  margin-left: auto;
  font-size: 11px;
  color: #bbb;
}
.potential-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}
.potential-row button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border: 0;
  padding: 10px 0;
  font-size: 11px;
}
.diamond {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  transform: rotate(45deg);
  border: 1px solid #978958;
  background: #343229;
}
.diamond b {
  transform: rotate(-45deg);
  color: #e2d584;
}
.advanced {
  grid-column: 1/-1;
  border-top: 1px solid #444;
  padding-top: 18px;
}
.advanced nav {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.advanced small {
  font-size: 10px;
  color: #999;
  margin-left: 8px;
}
.unassigned {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
}
@media (max-width: 1000px) {
  .definition-home {
    grid-template-columns: 1fr;
  }
  .profile {
    border-right: 0;
    padding: 0;
  }
  .advanced {
    grid-column: 1;
  }
}
</style>
