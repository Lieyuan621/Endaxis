<script setup lang="ts">
import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';
import { computed } from 'vue';
import {
  OPERATOR_WORKSPACE_FIELDS,
  operatorWorkspaceIssueTarget,
  operatorWorkspaceTargetArea,
  type OperatorWorkspaceArea,
} from './operatorWorkspaceStructure';
const emit = defineEmits<{ revealIssue: [issue: { path: string; message: string }] }>();
const props = defineProps<{
  definition: OperatorDefinition;
  issues: readonly { path: string; message: string }[];
}>();
const areaNames = {
  identity: '定义身份',
  profile: '基本信息',
  defaults: '默认构筑',
  growth: '属性与信赖成长',
  skills: '技能',
  actionRouting: '操作选择规则',
  buffs: 'Buff',
  entities: '能力实体',
  combo: '连携条件',
  blackboard: '角色黑板',
  initialization: '条件初始化',
  passives: '角色行为',
  listeners: '角色行为',
  presentation: '状态表现',
  talents: '天赋',
  potentials: '潜能',
  provenance: '来源记录',
} satisfies Record<OperatorWorkspaceArea, string>;
const issueGroups = computed(() => {
  const groups = new Map<
    string,
    { issue: { path: string; message: string }; editable: boolean }[]
  >();
  for (const issue of props.issues) {
    const target = operatorWorkspaceIssueTarget(issue.path);
    const label = target ? areaNames[operatorWorkspaceTargetArea(target)] : '其他问题';
    const editable =
      target?.kind === 'field' && OPERATOR_WORKSPACE_FIELDS[target.field].access === 'editable';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push({ issue, editable });
  }
  return [...groups].map(([label, entries]) => ({ label, entries }));
});
const capabilityNames = {
  skillBehavior: '技能行为',
  skillAvailability: '释放条件',
  talentEffects: '天赋效果',
  potentialEffects: '潜能效果',
  runtimeDependencies: '运行依赖',
} as const;
</script>
<template>
  <section class="provenance-page">
    <header>
      <h3>来源与诊断</h3>
      <p>只读记录。转换结论描述导入数据的覆盖情况，不代表自定义后的定义一定有效。</p>
    </header>
    <section>
      <h4>当前定义检查 · {{ issues.length }}</h4>
      <p v-if="!issues.length">当前结构检查未发现问题；不等于所有模拟场景均已验证。</p>
      <div v-else class="issue-groups">
        <section v-for="group in issueGroups" :key="group.label" class="issue-group">
          <h5>
            {{ group.label }} <span>{{ group.entries.length }} 项问题</span>
          </h5>
          <ul>
            <li v-for="({ issue, editable }, index) in group.entries" :key="index">
              <p>{{ issue.message }}</p>
              <code>{{ issue.path }}</code>
              <button v-if="editable" type="button" @click="emit('revealIssue', issue)">
                前往{{ group.label }} ›
              </button>
              <small v-else>{{
                group.label === '其他问题'
                  ? '尚无对应编辑入口；保留原始路径供排查。'
                  : '只读来源记录，不能在此编辑。'
              }}</small>
            </li>
          </ul>
        </section>
      </div>
    </section>
    <section>
      <h4>定义身份</h4>
      <dl>
        <dt>项目引用标识</dt>
        <dd>{{ definition.slug }}</dd>
        <dt>游戏原生 ID</dt>
        <dd>{{ definition.gameId }}</dd>
        <dt>资源来源</dt>
        <dd>{{ definition.assetSlug ?? definition.slug }}</dd>
      </dl>
    </section>
    <section>
      <h4>转换覆盖</h4>
      <p>
        {{
          !definition.conversionSupport
            ? '未提供转换结论'
            : definition.conversionSupport.completeness === 'complete'
              ? '已完整转换'
              : '部分转换'
        }}
      </p>
      <ul v-if="definition.conversionSupport?.missingCapabilities.length">
        <li
          v-for="(missing, index) in definition.conversionSupport.missingCapabilities"
          :key="index"
        >
          {{ capabilityNames[missing.capability]
          }}<span v-if="missing.skillGroupKeys?.length">
            · {{ missing.skillGroupKeys.join('、') }}</span
          >
        </li>
      </ul>
    </section>
    <section>
      <h4>技能兼容映射</h4>
      <p>仅用于识别旧技能身份，不会新增技能，也不参与技能库分组。</p>
      <table v-if="definition.skillAliases?.length">
        <thead>
          <tr>
            <th>旧身份（组 / 技能）</th>
            <th>当前身份（组 / 技能）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(alias, index) in definition.skillAliases" :key="index">
            <td>{{ alias.from.join(' / ') }}</td>
            <td>{{ alias.to.join(' / ') }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>无兼容映射。</p>
    </section>
  </section>
</template>
<style scoped>
.provenance-page {
  padding: 20px;
  max-width: 960px;
  color: var(--ea-fg);
}
h3 {
  font-size: 16px;
  margin: 0 0 8px;
}
h4 {
  font-size: 13px;
  margin: 0 0 12px;
}
p,
li,
td,
dt,
dd {
  font-size: 12px;
  line-height: 1.6;
}
header > p,
section > p,
dt {
  color: var(--ea-text-secondary);
}
.provenance-page > section {
  border-top: 1px solid var(--ea-border-soft);
  padding: 18px 0;
}
dl {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 8px;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
td,
th {
  padding: 8px;
  border-bottom: 1px solid var(--ea-border-soft);
  overflow-wrap: anywhere;
}
th {
  font-size: 12px;
}
code {
  overflow-wrap: anywhere;
  font-size: 11px;
}
ul {
  padding-left: 18px;
}
.issue-groups {
  display: grid;
  gap: 18px;
}
.issue-group h5 {
  margin: 0;
  font-size: 13px;
}
.issue-group h5 span {
  margin-left: 8px;
  color: var(--ea-text-secondary);
  font-weight: normal;
}
.issue-group ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}
.issue-group li {
  display: grid;
  gap: 6px;
  padding: 10px 0;
  border-bottom: 1px solid var(--ea-border-soft);
}
.issue-group li p {
  margin: 0;
}
.issue-group code,
.issue-group small {
  color: var(--ea-text-secondary);
}
.issue-group button {
  justify-self: start;
}
button {
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  color: var(--ea-fg);
  padding: 6px 10px;
  cursor: pointer;
}
</style>
